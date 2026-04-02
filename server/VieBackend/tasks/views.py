from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Task
from .serializers import TaskSerializer
from users.motivation import build_celebration_payload
from competitions.models import Competition


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        server_id = self.request.query_params.get('server', None)
        if server_id is not None:
            queryset = queryset.filter(server_id=server_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.is_completed:
            return Response({
                'error': 'Task is already completed'
            }, status=status.HTTP_400_BAD_REQUEST)

        task.complete_task()

        active_competitions = Competition.objects.filter(
            Q(challenger=request.user) | Q(opponent=request.user),
            status='ACTIVE'
        )

        for competition in active_competitions:
            if request.user == competition.challenger:
                competition.challenger_score += task.points_value
            elif request.user == competition.opponent:
                competition.opponent_score += task.points_value
            competition.save()

            # Check if points goal has been reached
            if competition.points_goal:
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

        return Response({
            'message': 'Task completed successfully',
            'points_earned': task.points_value,
            'task': TaskSerializer(task).data,
            'celebration': build_celebration_payload(
                task_title=task.title,
                points_earned=task.points_value,
                current_streak=task.user.profile.current_streak,
            ),
        })