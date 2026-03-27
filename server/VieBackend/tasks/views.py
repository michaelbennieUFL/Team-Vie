from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer
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
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.is_completed:
            return Response({
                'error': 'Task is already completed'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Complete the task and award profile points
        task.complete_task()

        # ── Update any active competition scores ──────────────────────────────
        # Find all active competitions this user is part of that are on the
        # same server as the completed task (or any server if task has no server)
        from competitions.models import Competition
        from django.db.models import Q

        active_competitions = Competition.objects.filter(
            Q(challenger=request.user) | Q(opponent=request.user),
            status='ACTIVE'
        )

        # If the task belongs to a server, only update competitions on that server
        if task.server:
            active_competitions = active_competitions.filter(
                Q(server=task.server) | Q(server__isnull=True)
            )

        for competition in active_competitions:
            if request.user == competition.challenger:
                competition.challenger_score += task.points_value
            elif request.user == competition.opponent:
                competition.opponent_score += task.points_value
            competition.save()

            # Notify the opponent via WebSocket so their page updates live
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f'competition_{competition.id}',
                        {
                            'type': 'competition_update',
                            'message': {
                                'type': 'task_update',
                                'competition_id': competition.id,
                            }
                        }
                    )
            except Exception:
                # WebSocket is optional — don't break task completion if Redis
                # is not running
                pass

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
