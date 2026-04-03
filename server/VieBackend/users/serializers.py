from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile
from .progress import build_weekly_progress_snapshot


class WeeklyProgressSnapshotSerializer(serializers.Serializer):
    week_start = serializers.DateField()
    competitive_points = serializers.IntegerField()
    personal_points = serializers.IntegerField()
    weekly_goal_points = serializers.IntegerField()
    goal_reached = serializers.BooleanField()
    competitive_points_remaining = serializers.IntegerField()
    reached_goal_at = serializers.DateTimeField(allow_null=True)

class UserProfileSerializer(serializers.ModelSerializer):
    weekly_progress = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'points',
            'current_streak',
            'longest_streak',
            'last_task_completed_date',
            'region',
            'default_weekly_goal_points',
            'best_weekly_personal_points',
            'weekly_progress',
        ]

    def get_weekly_progress(self, obj):
        return WeeklyProgressSnapshotSerializer(build_weekly_progress_snapshot(obj.user)).data

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class LeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    rank = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['username', 'points', 'current_streak', 'region', 'rank']


class ActivityEntrySerializer(serializers.Serializer):
    id = serializers.CharField()
    source = serializers.ChoiceField(choices=['personal', 'competition'])
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    difficulty = serializers.CharField()
    awarded_points = serializers.IntegerField()
    score_reason = serializers.CharField(allow_blank=True)
    completed_at = serializers.DateTimeField()
    server_id = serializers.IntegerField(allow_null=True)
    server_name = serializers.CharField(allow_blank=True)
    competition_id = serializers.IntegerField(allow_null=True)
    competition_label = serializers.CharField(allow_blank=True)


class ActivitySummarySerializer(serializers.Serializer):
    total_points = serializers.IntegerField()
    personal_points = serializers.IntegerField()
    competition_points = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    personal_completed_count = serializers.IntegerField()
    competition_completed_count = serializers.IntegerField()
    low_count = serializers.IntegerField()
    medium_count = serializers.IntegerField()
    high_count = serializers.IntegerField()
    weekly_goal_points = serializers.IntegerField()
    weekly_competitive_points = serializers.IntegerField()
    weekly_personal_points = serializers.IntegerField()
    weekly_goal_remaining = serializers.IntegerField()
    weekly_goal_reached = serializers.BooleanField()
    reached_goal_at = serializers.DateTimeField(allow_null=True)
    best_weekly_personal_points = serializers.IntegerField()
