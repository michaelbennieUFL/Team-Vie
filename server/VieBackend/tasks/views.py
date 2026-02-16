from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer

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
        return Response({
            'message': 'Task completed successfully',
            'points_earned': task.points_value,
            'task': TaskSerializer(task).data
        })
