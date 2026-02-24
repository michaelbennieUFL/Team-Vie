from django.test import TestCase
from django.contrib.auth.models import User
from .models import Competition


class CompetitionModelTest(TestCase):
    def setUp(self):
        self.challenger = User.objects.create_user(username='challenger', password='testpass123')
        self.opponent = User.objects.create_user(username='opponent', password='testpass123')

    def test_create_competition(self):
        competition = Competition.objects.create(
            challenger=self.challenger,
            opponent=self.opponent
        )
        self.assertEqual(str(competition), 'challenger vs opponent')
        self.assertEqual(competition.status, 'PENDING')
        self.assertEqual(competition.duration_seconds, 30)

    def test_default_duration(self):
        competition = Competition.objects.create(
            challenger=self.challenger,
            opponent=self.opponent
        )
        self.assertEqual(competition.duration_seconds, 30)

    def test_custom_duration(self):
        competition = Competition.objects.create(
            challenger=self.challenger,
            opponent=self.opponent,
            duration_seconds=60
        )
        self.assertEqual(competition.duration_seconds, 60)

    def test_scores_start_at_zero(self):
        competition = Competition.objects.create(
            challenger=self.challenger,
            opponent=self.opponent
        )
        self.assertEqual(competition.challenger_score, 0)
        self.assertEqual(competition.opponent_score, 0)
