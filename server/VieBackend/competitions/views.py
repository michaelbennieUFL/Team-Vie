from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Competition, CompetitionTask
from .serializers import CompetitionSerializer, CompetitionTaskSerializer


def check_winner(competition):
    """Check if either player has reached the points goal and complete the competition."""
    if not competition.points_goal or competition.status != 'ACTIVE':
        return

    winner = None
    if competition.challenger_score >= competition.points_goal:
        winner = competition.challenger
    elif competition.opponent_score >= competition.points_goal:
        winner = competition.opponent

    if winner:
        competition.status = 'COMPLETED'
        competition.winner = winner
        competition.completed_at = timezone.now()
        competition.save()


class CompetitionViewSet(viewsets.ModelViewSet):
    serializer_class = CompetitionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Competition.objects.filter(
            challenger=self.request.user
        ) | Competition.objects.filter(
            opponent=self.request.user
        )
        server_id = self.request.query_params.get('server', None)
        if server_id is not None:
            queryset = queryset.filter(server_id=server_id)
        return queryset

    def perform_create(self, serializer):
        points_goal = self.request.data.get('points_goal', None)
        serializer.save(
            challenger=self.request.user,
            points_goal=int(points_goal) if points_goal else None
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        competition = self.get_object()
        if competition.opponent != request.user:
            return Response({
                'error': 'Only the opponent can accept'
            }, status=status.HTTP_403_FORBIDDEN)

        if competition.status != 'PENDING':
            return Response({
                'error': 'Competition is not in pending state'
            }, status=status.HTTP_400_BAD_REQUEST)

        competition.status = 'ACTIVE'
        competition.started_at = timezone.now()
        competition.save()

        return Response({
            'message': 'Competition accepted',
            'competition': CompetitionSerializer(competition).data
        })

    @action(detail=True, methods=['post'])
    def add_task(self, request, pk=None):
        competition = self.get_object()

        if competition.status != 'ACTIVE':
            return Response({
                'error': 'Competition is not active'
            }, status=status.HTTP_400_BAD_REQUEST)

        if request.user not in [competition.challenger, competition.opponent]:
            return Response({
                'error': 'Not a participant in this competition'
            }, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()
        points_value = request.data.get('points_value', 10)

        if not title:
            return Response({
                'error': 'Title is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        CompetitionTask.objects.create(
            competition=competition,
            title=title,
            description=description,
            points_value=int(points_value),
        )

        return Response({
            'message': 'Task added to competition',
            'competition': CompetitionSerializer(competition).data
        })

    @action(detail=True, methods=['post'])
    def complete_task(self, request, pk=None):
        competition = self.get_object()
        task_id = request.data.get('task_id')

        if competition.status != 'ACTIVE':
            return Response({
                'error': 'Competition is not active'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            task = CompetitionTask.objects.get(id=task_id, competition=competition)
        except CompetitionTask.DoesNotExist:
            return Response({
                'error': 'Task not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if request.user == competition.challenger:
            if task.challenger_completed:
                return Response({'error': 'Task already completed'}, status=status.HTTP_400_BAD_REQUEST)
            task.challenger_completed = True
            competition.challenger_score += task.points_value
        elif request.user == competition.opponent:
            if task.opponent_completed:
                return Response({'error': 'Task already completed'}, status=status.HTTP_400_BAD_REQUEST)
            task.opponent_completed = True
            competition.opponent_score += task.points_value
        else:
            return Response({'error': 'Not a participant'}, status=status.HTTP_403_FORBIDDEN)

        task.save()
        competition.save()

        check_winner(competition)
        competition.refresh_from_db()

        return Response({
            'message': 'Task completed',
            'competition': CompetitionSerializer(competition).data
        })

    @action(detail=True, methods=['delete'])
    def delete_competition(self, request, pk=None):
        competition = self.get_object()

        if request.user not in [competition.challenger, competition.opponent]:
            return Response({
                'error': 'Not a participant in this competition'
            }, status=status.HTTP_403_FORBIDDEN)

        competition.delete()
        return Response({'message': 'Competition deleted'}, status=status.HTTP_204_NO_CONTENT)
