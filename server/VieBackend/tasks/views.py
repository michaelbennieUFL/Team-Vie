from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from django.db.models import Q
from .models import Task
from .serializers import TaskSerializer
from .scoring import (
    AFK_IDLE_TIMEOUT_SECONDS,
    MAX_COUNTABLE_SECONDS_PER_DAY,
    MAX_COUNTABLE_SECONDS_PER_TASK,
    MIN_ACTIVE_SECONDS_FOR_BONUS,
    base_points_for_difficulty,
    is_completion_cooldown_satisfied,
    scoring_summary_for_task,
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
    def start(self, request, pk=None):
        task = self.get_object()
        if task.is_completed:
            return Response({'error': 'Completed tasks cannot be started'}, status=status.HTTP_400_BAD_REQUEST)
        task.start_work()
        return Response({
            'message': 'Task started',
            'task': TaskSerializer(task, context=self.get_serializer_context()).data,
        })

    @action(detail=True, methods=['post'])
    def heartbeat(self, request, pk=None):
        task = self.get_object()
        if task.lifecycle_state != 'IN_PROGRESS':
            return Response({'error': 'Task is not in progress'}, status=status.HTTP_400_BAD_REQUEST)
        counted_seconds, went_idle = task.record_activity(idle_timeout_seconds=AFK_IDLE_TIMEOUT_SECONDS)
        return Response({
            'message': 'Heartbeat recorded',
            'counted_seconds': counted_seconds,
            'went_idle': went_idle,
            'task': TaskSerializer(task, context=self.get_serializer_context()).data,
        })

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

        if task.lifecycle_state != 'IN_PROGRESS':
            return Response({
                'error': 'Task must be started before completion'
            }, status=status.HTTP_400_BAD_REQUEST)

        task.record_activity(idle_timeout_seconds=AFK_IDLE_TIMEOUT_SECONDS)

        if task.active_seconds < MIN_ACTIVE_SECONDS_FOR_BONUS:
            return Response({
                'error': f'Task requires at least {MIN_ACTIVE_SECONDS_FOR_BONUS // 60} minutes of active work before completion'
            }, status=status.HTTP_400_BAD_REQUEST)

        today = task.completed_at.date() if task.completed_at else None
        if not today:
            today = timezone.now().date()
        prior_today_seconds = Task.objects.filter(
            user=request.user,
            is_completed=True,
            completed_at__date=today,
        ).aggregate(total=Sum('active_seconds'))['total'] or 0

        remaining_today_seconds = max(MAX_COUNTABLE_SECONDS_PER_DAY - prior_today_seconds, 0)
        counted_active_seconds = min(task.active_seconds, MAX_COUNTABLE_SECONDS_PER_TASK, remaining_today_seconds)
        if counted_active_seconds < task.active_seconds:
            task.timer_invalidated = True
            task.save(update_fields=['timer_invalidated', 'updated_at'])

        score_summary = scoring_summary_for_task(
            user=request.user,
            difficulty=task.priority,
            active_seconds=counted_active_seconds,
        )
        points_earned = score_summary['awarded_points']
        score_reason = score_summary['score_reason']

        task.complete_task(awarded_points=points_earned, score_reason=score_reason)

        return Response({
            'message': 'Task completed successfully',
            'points_earned': points_earned,
            'task': TaskSerializer(task, context=self.get_serializer_context()).data,
            'timer': {
                'active_seconds': task.active_seconds,
                'counted_active_seconds': counted_active_seconds,
                'base_points': score_summary['base_points'],
                'time_bonus_points': score_summary['time_bonus_points'],
                'minimum_time_met': score_summary['minimum_time_met'],
                'daily_cap_applied': score_summary['daily_cap_applied'],
                'timer_invalidated': task.timer_invalidated,
                'outlier_flagged': task.outlier_flagged,
            },
            'celebration': build_celebration_payload(
                task_title=task.title,
                points_earned=points_earned,
                current_streak=task.user.profile.current_streak,
                score_reason=score_reason,
            ),
        })
