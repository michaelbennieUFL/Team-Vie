from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'points', 'current_streak', 'longest_streak', 'region']
    search_fields = ['user__username', 'user__email']
    list_filter = ['region']
