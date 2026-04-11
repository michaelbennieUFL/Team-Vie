from datetime import timedelta

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


SOFT_DELETE_RECOVERY_DAYS = 7


class ActiveServerManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class Server(models.Model):
    JOIN_POLICY_CHOICES = [
        ('OPEN', 'Open'),
        ('INVITE_ONLY', 'Invite only'),
        ('APPROVAL_REQUIRED', 'Approval required'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_servers')
    created_at = models.DateTimeField(auto_now_add=True)
    join_policy = models.CharField(max_length=20, choices=JOIN_POLICY_CHOICES, default='OPEN')
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_servers'
    )
    active_competition = models.ForeignKey(
        'competitions.Competition', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='featured_in_server'
    )

    objects = ActiveServerManager()
    all_objects = models.Manager()

    def __str__(self):
        return self.name

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def deleted_until(self):
        if not self.deleted_at:
            return None
        return self.deleted_at + timedelta(days=SOFT_DELETE_RECOVERY_DAYS)

    def can_restore(self):
        return self.deleted_until and timezone.now() <= self.deleted_until

    class Meta:
        ordering = ['name']


class ServerMembership(models.Model):
    ROLE_CHOICES = [
        ('OWNER', 'Owner'),
        ('ADMIN', 'Admin'),
        ('MEMBER', 'Member'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='server_memberships')
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MEMBER')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'server']
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} in {self.server.name}"


class ServerInvite(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REVOKED', 'Revoked'),
    ]

    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='invites')
    invited_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='server_invites')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_server_invites')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['server', 'invited_user']
        ordering = ['-created_at']


class ServerJoinRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='join_requests')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='server_join_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_server_join_requests'
    )

    class Meta:
        unique_together = ['server', 'user']
        ordering = ['-created_at']


class ServerAuditLog(models.Model):
    ACTION_CHOICES = [
        ('JOINED', 'Joined'),
        ('LEFT', 'Left'),
        ('INVITED', 'Invited'),
        ('KICKED', 'Kicked'),
        ('ROLE_CHANGED', 'Role changed'),
        ('OWNERSHIP_TRANSFERRED', 'Ownership transferred'),
        ('DELETED', 'Deleted'),
        ('RESTORED', 'Restored'),
        ('JOIN_REQUESTED', 'Join requested'),
        ('JOIN_APPROVED', 'Join approved'),
        ('JOIN_REJECTED', 'Join rejected'),
    ]

    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='server_audit_actions')
    target_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='server_audit_targets'
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
