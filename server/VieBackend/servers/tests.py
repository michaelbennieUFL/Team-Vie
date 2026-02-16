from django.test import TestCase
from django.contrib.auth.models import User
from .models import Server, ServerMembership


class ServerModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_create_server(self):
        server = Server.objects.create(name='Test Server', created_by=self.user)
        self.assertEqual(str(server), 'Test Server')
        self.assertEqual(server.created_by, self.user)

    def test_create_membership(self):
        server = Server.objects.create(name='Test Server', created_by=self.user)
        membership = ServerMembership.objects.create(
            user=self.user, server=server, role='OWNER'
        )
        self.assertEqual(str(membership), 'testuser in Test Server')
        self.assertEqual(membership.role, 'OWNER')

    def test_unique_membership(self):
        server = Server.objects.create(name='Test Server', created_by=self.user)
        ServerMembership.objects.create(user=self.user, server=server)
        with self.assertRaises(Exception):
            ServerMembership.objects.create(user=self.user, server=server)
