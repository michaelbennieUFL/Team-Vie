from rest_framework import serializers
from .models import Competition, CompetitionTask
from django.contrib.auth.models import User

class CompetitionTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetitionTask
        fields = ['id', 'title', 'description', 'points_value', 'challenger_completed', 
                  'opponent_completed', 'created_at']
        read_only_fields = ['id', 'created_at']

class CompetitionSerializer(serializers.ModelSerializer):
    challenger_username = serializers.CharField(source='challenger.username', read_only=True)
    opponent_username = serializers.CharField(source='opponent.username', read_only=True)
    tasks = CompetitionTaskSerializer(many=True, read_only=True)
    
    class Meta:
        model = Competition
        fields = ['id', 'challenger', 'challenger_username', 'opponent', 'opponent_username', 
                  'status', 'challenger_score', 'opponent_score', 'created_at', 
                  'started_at', 'completed_at', 'tasks']
        read_only_fields = ['id', 'challenger', 'status', 'challenger_score', 'opponent_score', 
                           'created_at', 'started_at', 'completed_at']
