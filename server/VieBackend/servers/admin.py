from django.contrib import admin
from .models import Server, ServerMembership

@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')

@admin.register(ServerMembership)
class ServerMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'server', 'role', 'joined_at')
