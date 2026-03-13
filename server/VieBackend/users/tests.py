from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class MotivationQuoteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='secret123')
        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_fetch_motivational_quote(self):
        response = self.client.get('/api/users/motivation/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('quote', response.data)
        self.assertIn('author', response.data)
        self.assertIn('tone', response.data)
