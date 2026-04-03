from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from competitions.models import CompetitionTask
from tasks.models import Task
from .models import UserProfile, WeeklyProgress
from .progress import build_weekly_progress_snapshot, current_week_start
from .serializers import (
    ActivityEntrySerializer,
    ActivitySummarySerializer,
    RegisterSerializer,
    UserSerializer,
)
from .motivation import get_random_quote

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_view(request):
    return Response({'detail': 'CSRF cookie set'})

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data
        })
    return Response({
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out successfully'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def motivational_quote_view(request):
    return Response(get_random_quote())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users_view(request):
    query = request.query_params.get('q', '').strip()
    if not query:
        return Response([])
    users = User.objects.filter(
        username__icontains=query
    ).exclude(id=request.user.id)[:20]
    results = [{'id': u.id, 'username': u.username} for u in users]
    return Response(results)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_view(request):
    region = request.query_params.get('region', None)
    server_id = request.query_params.get('server', None)
    
    profiles = UserProfile.objects.select_related('user')
    if region:
        profiles = profiles.filter(region=region)
    
    if server_id:
        from servers.models import ServerMembership
        member_user_ids = ServerMembership.objects.filter(
            server_id=server_id
        ).values_list('user_id', flat=True)
        profiles = profiles.filter(user_id__in=member_user_ids)

    week_start = current_week_start()
    profile_list = list(profiles)
    weekly_progress = {
        progress.user_id: progress
        for progress in WeeklyProgress.objects.filter(
            user_id__in=[profile.user_id for profile in profile_list],
            week_start=week_start,
        )
    }

    leaderboard_entries = []
    for profile in profile_list:
        progress = weekly_progress.get(profile.user_id)
        competitive_points = progress.competitive_points if progress else 0
        weekly_goal_points = (
            progress.weekly_goal_points if progress else profile.default_weekly_goal_points
        )
        reached_goal_at = progress.reached_goal_at if progress else None
        leaderboard_entries.append({
            'username': profile.user.username,
            'points': competitive_points,
            'current_streak': profile.current_streak,
            'region': profile.region,
            'rank': 0,
            'goal_reached': reached_goal_at is not None or competitive_points >= weekly_goal_points,
            'reached_goal_at': reached_goal_at,
            'weekly_goal_points': weekly_goal_points,
        })

    unfinished = [entry for entry in leaderboard_entries if not entry['goal_reached']]
    unfinished.sort(key=lambda entry: (-entry['points'], -entry['current_streak'], entry['username'].lower()))
    finished = [entry for entry in leaderboard_entries if entry['goal_reached']]
    finished.sort(
        key=lambda entry: (
            entry['reached_goal_at'] is None,
            entry['reached_goal_at'].isoformat() if entry['reached_goal_at'] else '9999-12-31T23:59:59',
            -entry['points'],
            entry['username'].lower(),
        )
    )
    ordered_entries = finished + unfinished

    for index, entry in enumerate(ordered_entries[:50], start=1):
        entry['rank'] = index

    return Response(ordered_entries[:50])


def _build_activity_payload(*, target_user, server_id=None):
    weekly_progress = build_weekly_progress_snapshot(target_user)
    personal_tasks = Task.objects.filter(
        user=target_user,
        is_completed=True,
    ).select_related('server')
    if server_id:
        personal_tasks = personal_tasks.filter(server_id=server_id)

    competition_tasks = CompetitionTask.objects.filter(
        competition__status__in=['ACTIVE', 'COMPLETED'],
    ).select_related(
        'competition',
        'competition__server',
        'competition__challenger',
        'competition__opponent',
    )
    if server_id:
        competition_tasks = competition_tasks.filter(competition__server_id=server_id)

    entries = []
    summary = {
        'total_points': target_user.profile.points,
        'personal_points': 0,
        'competition_points': 0,
        'completed_count': 0,
        'personal_completed_count': 0,
        'competition_completed_count': 0,
        'low_count': 0,
        'medium_count': 0,
        'high_count': 0,
        'weekly_goal_points': weekly_progress['weekly_goal_points'],
        'weekly_competitive_points': weekly_progress['competitive_points'],
        'weekly_personal_points': weekly_progress['personal_points'],
        'weekly_goal_remaining': weekly_progress['competitive_points_remaining'],
        'weekly_goal_reached': weekly_progress['goal_reached'],
        'reached_goal_at': weekly_progress['reached_goal_at'],
        'best_weekly_personal_points': target_user.profile.best_weekly_personal_points,
    }

    for task in personal_tasks:
        awarded_points = task.awarded_points if task.awarded_points is not None else task.points_value
        difficulty = task.priority
        entries.append({
            'id': f'personal-{task.id}',
            'source': 'personal',
            'title': task.title,
            'description': task.description,
            'difficulty': difficulty,
            'awarded_points': awarded_points,
            'score_reason': task.score_reason,
            'completed_at': task.completed_at,
            'server_id': task.server_id,
            'server_name': task.server.name if task.server else '',
            'competition_id': None,
            'competition_label': '',
        })
        summary['personal_points'] += awarded_points
        summary['personal_completed_count'] += 1
        summary['completed_count'] += 1
        summary[f'{difficulty.lower()}_count'] += 1

    for task in competition_tasks:
        completed_at = None
        if task.competition.challenger_id == target_user.id and task.challenger_completed:
            completed_at = task.challenger_completed_at
        elif task.competition.opponent_id == target_user.id and task.opponent_completed:
            completed_at = task.opponent_completed_at

        if not completed_at:
            continue

        entries.append({
            'id': f'competition-{task.id}-{target_user.id}',
            'source': 'competition',
            'title': task.title,
            'description': task.description,
            'difficulty': task.difficulty,
            'awarded_points': task.points_value,
            'score_reason': task.score_reason,
            'completed_at': completed_at,
            'server_id': task.competition.server_id,
            'server_name': task.competition.server.name if task.competition.server else '',
            'competition_id': task.competition_id,
            'competition_label': f'{task.competition.challenger.username} vs {task.competition.opponent.username}',
        })
        summary['competition_points'] += task.points_value
        summary['competition_completed_count'] += 1
        summary['completed_count'] += 1
        summary[f'{task.difficulty.lower()}_count'] += 1

    entries.sort(key=lambda item: item['completed_at'], reverse=True)
    return {
        'user': UserSerializer(target_user).data,
        'summary': ActivitySummarySerializer(summary).data,
        'entries': ActivityEntrySerializer(entries, many=True).data,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_view(request, user_id=None):
    target_user = request.user if user_id is None else User.objects.filter(id=user_id).first()
    if target_user is None:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    server_id = request.query_params.get('server')
    parsed_server_id = int(server_id) if server_id and server_id.isdigit() else None
    return Response(_build_activity_payload(target_user=target_user, server_id=parsed_server_id))
