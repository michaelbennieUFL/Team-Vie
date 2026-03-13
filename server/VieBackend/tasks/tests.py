from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Task


class TaskCompletionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='secret123')
        self.client.force_authenticate(user=self.user)
        self.task = Task.objects.create(
            user=self.user,
            title='Submit assignment',
            points_value=25,
        )

    def test_complete_task_returns_celebration_payload(self):
        response = self.client.post(f'/api/tasks/{self.task.id}/complete/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['points_earned'], 25)
        self.assertIn('celebration', response.data)
        self.assertEqual(response.data['celebration']['current_streak'], 1)
        self.assertIn('headline', response.data['celebration'])
        self.assertIn('phrase', response.data['celebration'])
