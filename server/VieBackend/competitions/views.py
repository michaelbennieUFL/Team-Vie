from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Competition, CompetitionTask
from .serializers import CompetitionSerializer, CompetitionTaskSerializer

class CompetitionViewSet(viewsets.ModelViewSet):
    serializer_class = CompetitionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Competition.objects.filter(
            challenger=self.request.user
        ) | Competition.objects.filter(
            opponent=self.request.user
        )
    
    def perform_create(self, serializer):
        serializer.save(challenger=self.request.user)
    
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
                return Response({
                    'error': 'Task already completed'
                }, status=status.HTTP_400_BAD_REQUEST)
            task.challenger_completed = True
            competition.challenger_score += task.points_value
        elif request.user == competition.opponent:
            if task.opponent_completed:
                return Response({
                    'error': 'Task already completed'
                }, status=status.HTTP_400_BAD_REQUEST)
            task.opponent_completed = True
            competition.opponent_score += task.points_value
        else:
            return Response({
                'error': 'Not a participant in this competition'
            }, status=status.HTTP_403_FORBIDDEN)
        
        task.save()
        competition.save()
        
        return Response({
            'message': 'Task completed',
            'competition': CompetitionSerializer(competition).data
        })
