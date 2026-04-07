from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Competition, CompetitionTask


class CompetitionScoringTests(APITestCase):
    def setUp(self):
        self.challenger = User.objects.create_user(username='challenger', password='secret123')
        self.opponent = User.objects.create_user(username='opponent', password='secret123')
        self.client.force_authenticate(user=self.challenger)
        self.competition = Competition.objects.create(
            challenger=self.challenger,
            opponent=self.opponent,
            status='ACTIVE',
            points_goal=20,
        )

    def _age_task(self, task, *, minutes=5):
        CompetitionTask.objects.filter(id=task.id).update(created_at=timezone.now() - timedelta(minutes=minutes))
        task.refresh_from_db()
        return task

    def test_add_competition_task_ignores_client_points_value(self):
        response = self.client.post(
            f'/api/competitions/{self.competition.id}/add_task/',
            {
                'title': 'Sprint review',
                'description': 'Review notes',
                'points_value': 999,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.competition.refresh_from_db()
        task = self.competition.tasks.first()
        self.assertIsNotNone(task)
        self.assertEqual(task.points_value, 10)

    def test_add_competition_task_uses_requested_difficulty(self):
        response = self.client.post(
            f'/api/competitions/{self.competition.id}/add_task/',
            {
                'title': 'Capstone presentation',
                'difficulty': 'HIGH',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task = self.competition.tasks.first()
        self.assertEqual(task.points_value, 15)

    def test_cannot_complete_competition_task_before_cooldown(self):
        task = CompetitionTask.objects.create(
            competition=self.competition,
            title='Quick matchup task',
            points_value=10,
        )

        response = self.client.post(
            f'/api/competitions/{self.competition.id}/complete_task/',
            {'task_id': task.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('3 minutes', response.data['error'])

    def test_competition_task_completion_updates_only_competition_score(self):
        task = CompetitionTask.objects.create(
            competition=self.competition,
            title='Real matchup task',
            points_value=10,
        )
        self._age_task(task)

        response = self.client.post(
            f'/api/competitions/{self.competition.id}/complete_task/',
            {'task_id': task.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.competition.refresh_from_db()
        self.assertEqual(self.competition.challenger_score, 10)
        self.assertEqual(self.competition.opponent_score, 0)
