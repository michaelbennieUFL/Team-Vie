from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'priority', 'is_completed', 'points_value', 'created_at']
    list_filter = ['is_completed', 'priority', 'created_at']
    search_fields = ['title', 'user__username']
