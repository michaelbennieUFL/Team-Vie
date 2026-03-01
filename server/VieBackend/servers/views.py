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

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])
        servers = Server.objects.filter(name__icontains=query).exclude(
            memberships__user=request.user
        )[:20]
        serializer = self.get_serializer(servers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        try:
            server = Server.objects.get(pk=pk)
        except Server.DoesNotExist:
            return Response({'error': 'Server not found'}, status=status.HTTP_404_NOT_FOUND)
        if ServerMembership.objects.filter(user=request.user, server=server).exists():
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
        ServerMembership.objects.create(user=request.user, server=server, role='MEMBER')
        return Response({'message': f'Joined {server.name}'})

    @action(detail=True, methods=['post'])
    def set_active_competition(self, request, pk=None):
        server = self.get_object()
        membership = ServerMembership.objects.filter(user=request.user, server=server).first()
        if not membership or membership.role not in ('OWNER', 'ADMIN'):
            return Response({'error': 'Only owners and admins can set active competition'},
                            status=status.HTTP_403_FORBIDDEN)
        competition_id = request.data.get('competition_id')
        if competition_id:
            from competitions.models import Competition
            try:
                competition = Competition.objects.get(id=competition_id, server=server)
            except Competition.DoesNotExist:
                return Response({'error': 'Competition not found in this server'},
                                status=status.HTTP_404_NOT_FOUND)
            server.active_competition = competition
        else:
            server.active_competition = None
        server.save()
        return Response({'message': 'Active competition updated'})

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
