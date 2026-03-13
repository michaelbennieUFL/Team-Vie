from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import F, Window
from django.db.models.functions import Rank
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import UserProfile
from .serializers import UserSerializer, RegisterSerializer, LeaderboardSerializer
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
    
    profiles = profiles.annotate(
        rank=Window(expression=Rank(), order_by=F('points').desc())
    ).order_by('-points')[:50]
    
    serializer = LeaderboardSerializer(profiles, many=True)
    return Response(serializer.data)
