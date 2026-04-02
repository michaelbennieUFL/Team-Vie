from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate
from unittest.mock import MagicMock, patch
from .views import leaderboard_view, _generate_leaderboard_cache_key


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


class LeaderboardCacheTests(APITestCase):
    @override_settings(CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'test-cache',
        }
    })
    def test_leaderboard_endpoint_uses_cache(self):
        cache.clear()
        factory = APIRequestFactory()
        user = User(username='cached-user')
        user.id = 123

        with patch('users.views.UserProfile.objects.select_related', autospec=True) as mock_select_related, \
             patch('users.views.LeaderboardSerializer', autospec=True) as mock_serializer:
            mock_profiles = MagicMock()
            mock_profiles.annotate.return_value = mock_profiles
            mock_profiles.order_by.return_value = mock_profiles
            mock_profiles.__getitem__.return_value = mock_profiles
            mock_select_related.return_value = mock_profiles
            mock_serializer.return_value.data = [
                {'username': 'cached-user', 'points': 10, 'current_streak': 1, 'region': 'NA', 'rank': 1}
            ]

            request_one = factory.get('/api/users/leaderboard/')
            force_authenticate(request_one, user=user)
            response_one = leaderboard_view(request_one)

            request_two = factory.get('/api/users/leaderboard/')
            force_authenticate(request_two, user=user)
            response_two = leaderboard_view(request_two)

        self.assertEqual(response_one.status_code, status.HTTP_200_OK)
        self.assertEqual(response_two.status_code, status.HTTP_200_OK)
        self.assertEqual(response_one.data, response_two.data)
        self.assertEqual(mock_select_related.call_count, 1)

    def test_cache_key_changes_with_filters(self):
        key_without_filters = _generate_leaderboard_cache_key(None, None)
        key_with_region = _generate_leaderboard_cache_key('NA', None)
        key_with_server = _generate_leaderboard_cache_key(None, '1')
        key_with_both = _generate_leaderboard_cache_key('NA', '1')

        self.assertNotEqual(key_without_filters, key_with_region)
        self.assertNotEqual(key_without_filters, key_with_server)
        self.assertNotEqual(key_with_region, key_with_both)
