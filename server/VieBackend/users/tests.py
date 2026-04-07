from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from tasks.models import Task
from .models import WeeklyProgress


class UserUtilityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='secret123')
        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_fetch_motivational_quote(self):
        response = self.client.get('/api/users/motivation/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('quote', response.data)
        self.assertIn('author', response.data)
        self.assertIn('tone', response.data)

    def test_authenticated_user_can_fetch_activity_feed(self):
        Task.objects.create(
            user=self.user,
            title='Deep work block',
            description='Focus session',
            priority='HIGH',
            points_value=15,
            awarded_points=15,
            score_reason='v1:high_full',
            is_completed=True,
            completed_at=timezone.now() - timedelta(minutes=5),
        )

        response = self.client.get('/api/users/activity/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'tester')
        self.assertEqual(response.data['summary']['completed_count'], 1)
        self.assertEqual(response.data['entries'][0]['title'], 'Deep work block')
        self.assertEqual(response.data['entries'][0]['awarded_points'], 15)
        self.assertEqual(response.data['summary']['weekly_goal_points'], 120)
        self.assertEqual(response.data['summary']['weekly_personal_points'], 0)

    def test_leaderboard_uses_current_week_competitive_points(self):
        other_user = User.objects.create_user(username='sprinter', password='secret123')
        WeeklyProgress.objects.create(
            user=self.user,
            week_start=timezone.now().date() - timedelta(days=timezone.now().date().weekday()),
            competitive_points=30,
            personal_points=30,
            weekly_goal_points=120,
        )
        WeeklyProgress.objects.create(
            user=other_user,
            week_start=timezone.now().date() - timedelta(days=timezone.now().date().weekday()),
            competitive_points=45,
            personal_points=55,
            weekly_goal_points=120,
        )

        response = self.client.get('/api/users/leaderboard/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['username'], 'sprinter')
        self.assertEqual(response.data[0]['points'], 45)
