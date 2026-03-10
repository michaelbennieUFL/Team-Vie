from django.test import TestCase
from django.contrib.auth.models import User


class UserSearchTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='searcher', password='testpass123',
            first_name='Search', last_name='User'
        )
        User.objects.create_user(
            username='alice', password='testpass123',
            first_name='Alice', last_name='Smith'
        )
        User.objects.create_user(
            username='bob', password='testpass123',
            first_name='Bob', last_name='Jones'
        )

    def test_search_by_username(self):
        self.client.login(username='searcher', password='testpass123')
        response = self.client.get('/api/users/search/?q=alice')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['username'], 'alice')

    def test_search_by_first_name(self):
        self.client.login(username='searcher', password='testpass123')
        response = self.client.get('/api/users/search/?q=Bob')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['username'], 'bob')

    def test_search_by_last_name(self):
        self.client.login(username='searcher', password='testpass123')
        response = self.client.get('/api/users/search/?q=Smith')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['username'], 'alice')

    def test_search_returns_name_fields(self):
        self.client.login(username='searcher', password='testpass123')
        response = self.client.get('/api/users/search/?q=alice')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('first_name', data[0])
        self.assertIn('last_name', data[0])
        self.assertEqual(data[0]['first_name'], 'Alice')
        self.assertEqual(data[0]['last_name'], 'Smith')

    def test_search_excludes_current_user(self):
        self.client.login(username='searcher', password='testpass123')
        response = self.client.get('/api/users/search/?q=searcher')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 0)
