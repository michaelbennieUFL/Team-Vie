from rest_framework import serializers
from .models import Server, ServerMembership, ServerAuditLog


class ServerSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    is_deleted = serializers.SerializerMethodField()
    deleted_until = serializers.SerializerMethodField()

    class Meta:
        model = Server
        fields = [
            'id', 'name', 'description', 'created_by', 'created_at', 'member_count', 'role',
            'active_competition', 'join_policy', 'is_deleted', 'deleted_until',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'is_deleted', 'deleted_until']

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user).first()
            return membership.role if membership else None
        return None

    def get_is_deleted(self, obj):
        return obj.is_deleted

    def get_deleted_until(self, obj):
        return obj.deleted_until


class ServerMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    server_name = serializers.CharField(source='server.name', read_only=True)

    class Meta:
        model = ServerMembership
        fields = ['id', 'user', 'username', 'server', 'server_name', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class ServerAuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True, default=None)
    target_username = serializers.CharField(source='target_user.username', read_only=True, default=None)

    class Meta:
        model = ServerAuditLog
        fields = [
            'id', 'action', 'actor', 'actor_username', 'target_user', 'target_username',
            'metadata', 'created_at',
        ]
        read_only_fields = fields
