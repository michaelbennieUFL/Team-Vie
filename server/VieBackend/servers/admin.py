from django.contrib import admin
from .models import Server, ServerMembership, ServerInvite, ServerJoinRequest, ServerAuditLog

@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'join_policy', 'deleted_at', 'created_at')
    list_filter = ('join_policy', 'deleted_at')

@admin.register(ServerMembership)
class ServerMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'server', 'role', 'joined_at')


@admin.register(ServerInvite)
class ServerInviteAdmin(admin.ModelAdmin):
    list_display = ('server', 'invited_user', 'invited_by', 'status', 'created_at')
    list_filter = ('status',)


@admin.register(ServerJoinRequest)
class ServerJoinRequestAdmin(admin.ModelAdmin):
    list_display = ('server', 'user', 'status', 'created_at', 'reviewed_at', 'reviewed_by')
    list_filter = ('status',)


@admin.register(ServerAuditLog)
class ServerAuditLogAdmin(admin.ModelAdmin):
    list_display = ('server', 'action', 'actor', 'target_user', 'created_at')
    list_filter = ('action',)
