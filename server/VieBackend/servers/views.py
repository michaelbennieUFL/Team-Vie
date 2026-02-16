from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Server, ServerMembership
from .serializers import ServerSerializer


class ServerViewSet(viewsets.ModelViewSet):
    serializer_class = ServerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Server.objects.filter(memberships__user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        server = serializer.save(created_by=self.request.user)
        ServerMembership.objects.create(
            user=self.request.user,
            server=server,
            role='OWNER'
        )

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        server = self.get_object()
        if ServerMembership.objects.filter(user=request.user, server=server).exists():
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
        ServerMembership.objects.create(user=request.user, server=server, role='MEMBER')
        return Response({'message': f'Joined {server.name}'})

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        server = self.get_object()
        membership = ServerMembership.objects.filter(user=request.user, server=server).first()
        if not membership:
            return Response({'error': 'Not a member'}, status=status.HTTP_400_BAD_REQUEST)
        if membership.role == 'OWNER':
            return Response({'error': 'Owner cannot leave the server'}, status=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        return Response({'message': f'Left {server.name}'})
