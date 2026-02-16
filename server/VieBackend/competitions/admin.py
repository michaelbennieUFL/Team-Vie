from django.contrib import admin
from .models import Competition, CompetitionTask

@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ['challenger', 'opponent', 'status', 'challenger_score', 'opponent_score', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['challenger__username', 'opponent__username']

@admin.register(CompetitionTask)
class CompetitionTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'competition', 'points_value', 'challenger_completed', 'opponent_completed']
    list_filter = ['challenger_completed', 'opponent_completed']
