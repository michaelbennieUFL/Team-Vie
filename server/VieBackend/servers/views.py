from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    SOFT_DELETE_RECOVERY_DAYS,
    Server,
    ServerAuditLog,
    ServerInvite,
    ServerJoinRequest,
    ServerMembership,
)
from .serializers import ServerAuditLogSerializer, ServerSerializer


class ServerViewSet(viewsets.ModelViewSet):
    serializer_class = ServerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        include_deleted = self.action in {'restore', 'audit_logs'}
        base_queryset = Server.all_objects if include_deleted else Server.objects
        return base_queryset.filter(memberships__user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def _membership(self, server, *, user=None):
        return ServerMembership.objects.filter(
            user=user or self.request.user,
            server=server,
        ).first()

    def _audit(self, *, server, action_name, target_user=None, metadata=None):
        ServerAuditLog.objects.create(
            server=server,
            action=action_name,
            actor=self.request.user,
            target_user=target_user,
            metadata=metadata or {},
        )

    def _require_owner(self, server):
        membership = self._membership(server)
        if not membership or membership.role != 'OWNER':
            return Response({'error': 'Only the owner can perform this action'}, status=status.HTTP_403_FORBIDDEN)
        return None

    def _require_owner_or_admin(self, server):
        membership = self._membership(server)
        if not membership or membership.role not in ('OWNER', 'ADMIN'):
            return None, Response(
                {'error': 'Only owners and admins can perform this action'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return membership, None

    def perform_create(self, serializer):
        server = serializer.save(created_by=self.request.user)
        ServerMembership.objects.create(
            user=self.request.user,
            server=server,
            role='OWNER'
        )
        self._audit(server=server, action_name='JOINED', target_user=self.request.user, metadata={'role': 'OWNER'})

    def destroy(self, request, *args, **kwargs):
        server = self.get_object()
        denied = self._require_owner(server)
        if denied:
            return denied
        server.deleted_at = timezone.now()
        server.deleted_by = request.user
        server.save(update_fields=['deleted_at', 'deleted_by'])
        self._audit(server=server, action_name='DELETED', metadata={'recovery_days': SOFT_DELETE_RECOVERY_DAYS})
        return Response({'message': 'Server deleted', 'recoverable_for_days': SOFT_DELETE_RECOVERY_DAYS})

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
    def restore(self, request, pk=None):
        server = self.get_object()
        denied = self._require_owner(server)
        if denied:
            return denied
        if not server.is_deleted:
            return Response({'error': 'Server is not deleted'}, status=status.HTTP_400_BAD_REQUEST)
        if not server.can_restore():
            return Response({'error': 'Recovery window has expired'}, status=status.HTTP_400_BAD_REQUEST)
        server.deleted_at = None
        server.deleted_by = None
        server.save(update_fields=['deleted_at', 'deleted_by'])
        self._audit(server=server, action_name='RESTORED')
        return Response({'message': 'Server restored'})

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        try:
            server = Server.objects.get(pk=pk)
        except Server.DoesNotExist:
            return Response({'error': 'Server not found'}, status=status.HTTP_404_NOT_FOUND)

        if ServerMembership.objects.filter(user=request.user, server=server).exists():
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)

        if server.join_policy == 'OPEN':
            ServerMembership.objects.create(user=request.user, server=server, role='MEMBER')
            self._audit(server=server, action_name='JOINED', target_user=request.user, metadata={'policy': 'OPEN'})
            return Response({'message': f'Joined {server.name}'})

        if server.join_policy == 'INVITE_ONLY':
            invite = ServerInvite.objects.filter(
                server=server,
                invited_user=request.user,
                status='PENDING',
            ).first()
            if not invite:
                return Response({'error': 'Invite required to join this server'}, status=status.HTTP_403_FORBIDDEN)
            invite.status = 'ACCEPTED'
            invite.accepted_at = timezone.now()
            invite.save(update_fields=['status', 'accepted_at'])
            ServerMembership.objects.create(user=request.user, server=server, role='MEMBER')
            self._audit(server=server, action_name='JOINED', target_user=request.user, metadata={'policy': 'INVITE_ONLY'})
            return Response({'message': f'Joined {server.name}'})

        join_request, _ = ServerJoinRequest.objects.get_or_create(server=server, user=request.user)
        if join_request.status == 'APPROVED':
            ServerMembership.objects.create(user=request.user, server=server, role='MEMBER')
            self._audit(server=server, action_name='JOINED', target_user=request.user, metadata={'policy': 'APPROVAL_REQUIRED'})
            return Response({'message': f'Joined {server.name}'})
        join_request.status = 'PENDING'
        join_request.reviewed_at = None
        join_request.reviewed_by = None
        join_request.save(update_fields=['status', 'reviewed_at', 'reviewed_by'])
        self._audit(server=server, action_name='JOIN_REQUESTED', target_user=request.user)
        return Response({'message': 'Join request submitted for approval'}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'])
    def set_active_competition(self, request, pk=None):
        server = self.get_object()
        membership = self._membership(server)
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
        membership = self._membership(server)
        if not membership:
            return Response({'error': 'Not a member'}, status=status.HTTP_400_BAD_REQUEST)
        if membership.role == 'OWNER':
            return Response({'error': 'Owner cannot leave until ownership is transferred'}, status=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        self._audit(server=server, action_name='LEFT', target_user=request.user)
        return Response({'message': f'Left {server.name}'})

    @action(detail=True, methods=['post'])
    def transfer_ownership(self, request, pk=None):
        server = self.get_object()
        denied = self._require_owner(server)
        if denied:
            return denied
        new_owner_id = request.data.get('user_id')
        if not new_owner_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        new_owner_membership = ServerMembership.objects.filter(server=server, user_id=new_owner_id).first()
        if not new_owner_membership:
            return Response({'error': 'Target user is not a server member'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            old_owner_membership = self._membership(server)
            old_owner_membership.role = 'ADMIN'
            old_owner_membership.save(update_fields=['role'])
            new_owner_membership.role = 'OWNER'
            new_owner_membership.save(update_fields=['role'])
            server.created_by = new_owner_membership.user
            server.save(update_fields=['created_by'])

        self._audit(
            server=server,
            action_name='OWNERSHIP_TRANSFERRED',
            target_user=new_owner_membership.user,
            metadata={'from': request.user.id, 'to': new_owner_membership.user_id},
        )
        return Response({'message': 'Ownership transferred'})

    @action(detail=True, methods=['post'])
    def set_member_role(self, request, pk=None):
        server = self.get_object()
        requester_membership, error_response = self._require_owner_or_admin(server)
        if error_response:
            return error_response

        target_user_id = request.data.get('user_id')
        role = (request.data.get('role') or '').upper()
        if role not in ('ADMIN', 'MEMBER'):
            return Response({'error': 'role must be ADMIN or MEMBER'}, status=status.HTTP_400_BAD_REQUEST)
        membership = ServerMembership.objects.filter(server=server, user_id=target_user_id).first()
        if not membership:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        if membership.role == 'OWNER':
            return Response({'error': 'Owner role cannot be changed here'}, status=status.HTTP_400_BAD_REQUEST)
        if requester_membership.role == 'ADMIN' and membership.role == 'ADMIN':
            return Response({'error': 'Admins cannot change another admin role'}, status=status.HTTP_403_FORBIDDEN)
        membership.role = role
        membership.save(update_fields=['role'])
        self._audit(
            server=server,
            action_name='ROLE_CHANGED',
            target_user=membership.user,
            metadata={'new_role': role},
        )
        return Response({'message': 'Member role updated'})

    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        server = self.get_object()
        _, error_response = self._require_owner_or_admin(server)
        if error_response:
            return error_response
        username = (request.data.get('username') or '').strip()
        if not username:
            return Response({'error': 'username is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        if ServerMembership.objects.filter(server=server, user=target_user).exists():
            return Response({'error': 'User is already a member'}, status=status.HTTP_400_BAD_REQUEST)

        invite, _ = ServerInvite.objects.get_or_create(
            server=server,
            invited_user=target_user,
            defaults={'invited_by': request.user},
        )
        invite.invited_by = request.user
        invite.status = 'PENDING'
        invite.accepted_at = None
        invite.save(update_fields=['invited_by', 'status', 'accepted_at'])
        self._audit(server=server, action_name='INVITED', target_user=target_user)
        return Response({'message': f'Invited {target_user.username}'})

    @action(detail=True, methods=['post'])
    def review_join_request(self, request, pk=None):
        server = self.get_object()
        _, error_response = self._require_owner_or_admin(server)
        if error_response:
            return error_response
        user_id = request.data.get('user_id')
        decision = (request.data.get('decision') or '').upper()
        if decision not in {'APPROVE', 'REJECT'}:
            return Response({'error': 'decision must be APPROVE or REJECT'}, status=status.HTTP_400_BAD_REQUEST)
        join_request = ServerJoinRequest.objects.filter(server=server, user_id=user_id).first()
        if not join_request or join_request.status != 'PENDING':
            return Response({'error': 'Pending join request not found'}, status=status.HTTP_404_NOT_FOUND)
        join_request.status = 'APPROVED' if decision == 'APPROVE' else 'REJECTED'
        join_request.reviewed_at = timezone.now()
        join_request.reviewed_by = request.user
        join_request.save(update_fields=['status', 'reviewed_at', 'reviewed_by'])
        if decision == 'APPROVE':
            action_name = 'JOIN_APPROVED'
            message = 'Join request approved'
        else:
            action_name = 'JOIN_REJECTED'
            message = 'Join request rejected'
        self._audit(server=server, action_name=action_name, target_user=join_request.user)
        return Response({'message': message})

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        server = self.get_object()
        requester_membership, error_response = self._require_owner_or_admin(server)
        if error_response:
            return error_response
        target_user_id = request.data.get('user_id')
        membership = ServerMembership.objects.filter(server=server, user_id=target_user_id).first()
        if not membership:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        if membership.role == 'OWNER':
            return Response({'error': 'Owner cannot be removed'}, status=status.HTTP_400_BAD_REQUEST)
        if requester_membership.role == 'ADMIN' and membership.role == 'ADMIN':
            return Response({'error': 'Admins cannot remove other admins'}, status=status.HTTP_403_FORBIDDEN)
        target_user = membership.user
        membership.delete()
        self._audit(server=server, action_name='KICKED', target_user=target_user)
        return Response({'message': f'Removed {target_user.username}'})

    @action(detail=True, methods=['get'])
    def audit_logs(self, request, pk=None):
        server = self.get_object()
        _, error_response = self._require_owner_or_admin(server)
        if error_response:
            return error_response
        logs = server.audit_logs.all()[:100]
        return Response(ServerAuditLogSerializer(logs, many=True).data)
