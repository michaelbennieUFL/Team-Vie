from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from competitions.models import Competition
from .models import Task
from users.models import DailyTaskProgress, WeeklyProgress


class TaskScoringTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='secret123')
        self.opponent = User.objects.create_user(username='opponent', password='secret123')
        self.client.force_authenticate(user=self.user)

    def _age_task(self, task, *, minutes=5):
        Task.objects.filter(id=task.id).update(created_at=timezone.now() - timedelta(minutes=minutes))
        task.refresh_from_db()
        return task

    def _prepare_task_for_completion(self, task, *, minutes_old=5, active_seconds=120):
        Task.objects.filter(id=task.id).update(
            created_at=timezone.now() - timedelta(minutes=minutes_old),
            lifecycle_state='IN_PROGRESS',
            started_at=timezone.now() - timedelta(seconds=active_seconds),
            last_activity_at=timezone.now(),
            active_seconds=active_seconds,
        )
        task.refresh_from_db()
        return task

    def test_complete_task_returns_backend_owned_points_and_celebration(self):
        task = Task.objects.create(
            user=self.user,
            title='Submit assignment',
            priority='HIGH',
            points_value=999,
        )
        self._prepare_task_for_completion(task)

        response = self.client.post(f'/api/tasks/{task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['points_earned'], 18)
        self.assertIn('celebration', response.data)
        self.assertEqual(response.data['celebration']['current_streak'], 1)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.points, 18)
        weekly_progress = WeeklyProgress.objects.get(user=self.user)
        self.assertEqual(weekly_progress.competitive_points, 18)
        self.assertEqual(weekly_progress.personal_points, 18)
        self.assertEqual(self.user.profile.best_weekly_personal_points, 18)

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
        DailyTaskProgress.objects.create(user=self.user, day=timezone.now().date(), low_full_count=8)

        task = Task.objects.create(
            user=self.user,
            title='One more low task',
            priority='LOW',
        )
        self._prepare_task_for_completion(task)

        response = self.client.post(f'/api/tasks/{task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['points_earned'], 3)
        weekly_progress = WeeklyProgress.objects.get(user=self.user)
        self.assertEqual(weekly_progress.competitive_points, 0)
        self.assertEqual(weekly_progress.personal_points, 3)
        daily_progress = DailyTaskProgress.objects.get(user=self.user, day=timezone.now().date())
        self.assertEqual(daily_progress.low_reduced_count, 1)

    def test_daily_cap_reduces_points_for_fourth_high_priority_task(self):
        DailyTaskProgress.objects.create(user=self.user, day=timezone.now().date(), high_full_count=3)

        task = Task.objects.create(
            user=self.user,
            title='Fourth hard task',
            priority='HIGH',
        )
        self._prepare_task_for_completion(task)

        response = self.client.post(f'/api/tasks/{task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['points_earned'], 11)
        self.assertTrue(response.data['celebration']['daily_limit_reached'])
        self.assertIn('full-point limit', response.data['celebration']['limit_note'])

    def test_deleting_completed_task_does_not_reset_daily_cap(self):
        for idx in range(3):
            task = Task.objects.create(
                user=self.user,
                title=f'Hard task {idx}',
                priority='HIGH',
            )
            self._prepare_task_for_completion(task)
            response = self.client.post(f'/api/tasks/{task.id}/complete/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['points_earned'], 18)

        completed_task = Task.objects.filter(user=self.user, priority='HIGH', is_completed=True).first()
        self.assertIsNotNone(completed_task)
        completed_task.delete()

        next_task = Task.objects.create(
            user=self.user,
            title='Another hard task',
            priority='HIGH',
        )
        self._prepare_task_for_completion(next_task)

        response = self.client.post(f'/api/tasks/{next_task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['points_earned'], 11)
        daily_progress = DailyTaskProgress.objects.get(user=self.user, day=timezone.now().date())
        self.assertEqual(daily_progress.high_full_count, 3)
        self.assertEqual(daily_progress.high_reduced_count, 1)

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
        self._prepare_task_for_completion(task)

        response = self.client.post(f'/api/tasks/{task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        competition.refresh_from_db()
        self.assertEqual(competition.challenger_score, 0)
        self.assertEqual(competition.opponent_score, 0)
