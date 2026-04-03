from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from competitions.models import Competition
from .models import Task
from users.models import WeeklyProgress


class TaskScoringTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='secret123')
        self.opponent = User.objects.create_user(username='opponent', password='secret123')
        self.client.force_authenticate(user=self.user)

    def _age_task(self, task, *, minutes=5):
        Task.objects.filter(id=task.id).update(created_at=timezone.now() - timedelta(minutes=minutes))
        task.refresh_from_db()
        return task

    def test_complete_task_returns_backend_owned_points_and_celebration(self):
        task = Task.objects.create(
            user=self.user,
            title='Submit assignment',
            priority='HIGH',
            points_value=999,
        )
        self._age_task(task)

        response = self.client.post(f'/api/tasks/{task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['points_earned'], 15)
        self.assertIn('celebration', response.data)
        self.assertEqual(response.data['celebration']['current_streak'], 1)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.points, 15)
        weekly_progress = WeeklyProgress.objects.get(user=self.user)
        self.assertEqual(weekly_progress.competitive_points, 15)
        self.assertEqual(weekly_progress.personal_points, 15)
        self.assertEqual(self.user.profile.best_weekly_personal_points, 15)

    def test_task_creation_ignores_client_points_value(self):
        response = self.client.post('/api/tasks/', {
            'title': 'Read chapter',
            'description': '',
            'priority': 'LOW',
            'points_value': 500,
            'recurrence': 'NONE',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['points_value'], 5)

    def test_cannot_complete_task_before_cooldown(self):
        task = Task.objects.create(
            user=self.user,
            title='Quick task',
            priority='MEDIUM',
        )

        response = self.client.post(f'/api/tasks/{task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('3 minutes', response.data['error'])

    def test_daily_cap_reduces_points_for_repeated_low_priority_tasks(self):
        for idx in range(8):
            Task.objects.create(
                user=self.user,
                title=f'Low task {idx}',
                priority='LOW',
                points_value=5,
                is_completed=True,
                completed_at=timezone.now() - timedelta(minutes=10),
            )

        task = Task.objects.create(
            user=self.user,
            title='One more low task',
            priority='LOW',
        )
        self._age_task(task)

        response = self.client.post(f'/api/tasks/{task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['points_earned'], 2)
        weekly_progress = WeeklyProgress.objects.get(user=self.user)
        self.assertEqual(weekly_progress.competitive_points, 0)
        self.assertEqual(weekly_progress.personal_points, 2)

    def test_normal_task_completion_no_longer_updates_active_competitions(self):
        competition = Competition.objects.create(
            challenger=self.user,
            opponent=self.opponent,
            status='ACTIVE',
        )
        task = Task.objects.create(
            user=self.user,
            title='Personal task',
            priority='HIGH',
        )
        self._age_task(task)

        response = self.client.post(f'/api/tasks/{task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        competition.refresh_from_db()
        self.assertEqual(competition.challenger_score, 0)
        self.assertEqual(competition.opponent_score, 0)
