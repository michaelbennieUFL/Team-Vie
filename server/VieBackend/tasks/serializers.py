from rest_framework import serializers
from .models import Task
from .scoring import projected_points_for_task, AFK_IDLE_TIMEOUT_SECONDS

class TaskSerializer(serializers.ModelSerializer):
    projected_points = serializers.SerializerMethodField()
    timer_hint = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'priority', 'points_value', 'awarded_points',
                  'score_reason', 'is_completed', 'completed_at', 'created_at', 'updated_at',
                  'due_date', 'server', 'recurrence', 'lifecycle_state', 'started_at',
                  'last_activity_at', 'active_seconds', 'timer_invalidated', 'outlier_flagged',
                  'projected_points', 'timer_hint']
        read_only_fields = ['id', 'points_value', 'awarded_points', 'score_reason',
                            'is_completed', 'completed_at', 'created_at', 'updated_at',
                            'lifecycle_state', 'started_at', 'last_activity_at', 'active_seconds',
                            'timer_invalidated', 'outlier_flagged', 'projected_points', 'timer_hint']

    def get_projected_points(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or obj.is_completed:
            return None
        summary = projected_points_for_task(
            user=request.user,
            difficulty=obj.priority,
            active_seconds=obj.active_seconds,
        )
        return summary['awarded_points']

    def get_timer_hint(self, obj):
        if obj.is_completed:
            return None
        return {
            'idle_timeout_seconds': AFK_IDLE_TIMEOUT_SECONDS,
        }
