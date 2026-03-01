from rest_framework import serializers
from .models import Server, ServerMembership


class ServerSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = Server
        fields = ['id', 'name', 'description', 'created_by', 'created_at', 'member_count', 'role', 'active_competition']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user).first()
            return membership.role if membership else None
        return None


class ServerMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    server_name = serializers.CharField(source='server.name', read_only=True)

    class Meta:
        model = ServerMembership
        fields = ['id', 'user', 'username', 'server', 'server_name', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']
