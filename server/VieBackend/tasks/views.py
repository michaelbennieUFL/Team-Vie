from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Task
from .serializers import TaskSerializer
from .scoring import (
    base_points_for_difficulty,
    is_completion_cooldown_satisfied,
    points_to_award_for_task,
)
from users.motivation import build_celebration_payload


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
        priority = serializer.validated_data.get('priority', 'MEDIUM')
        serializer.save(
            user=self.request.user,
            points_value=base_points_for_difficulty(priority),
        )

    def perform_update(self, serializer):
        priority = serializer.validated_data.get('priority', serializer.instance.priority)
        serializer.save(points_value=base_points_for_difficulty(priority))

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.is_completed:
            return Response({
                'error': 'Task is already completed'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not is_completion_cooldown_satisfied(task.created_at):
            return Response({
                'error': 'Task must be at least 3 minutes old before completion'
            }, status=status.HTTP_400_BAD_REQUEST)

        points_earned, score_reason = points_to_award_for_task(
            user=request.user,
            difficulty=task.priority,
        )

        task.complete_task(awarded_points=points_earned, score_reason=score_reason)

        return Response({
            'message': 'Task completed successfully',
            'points_earned': points_earned,
            'task': TaskSerializer(task).data,
            'celebration': build_celebration_payload(
                task_title=task.title,
                points_earned=points_earned,
                current_streak=task.user.profile.current_streak,
                score_reason=score_reason,
            ),
        })
