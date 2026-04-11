from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

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


class ServerGovernanceApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', password='secret123')
        self.admin = User.objects.create_user(username='admin', password='secret123')
        self.member = User.objects.create_user(username='member', password='secret123')
        self.guest = User.objects.create_user(username='guest', password='secret123')
        self.server = Server.objects.create(name='Governance Server', created_by=self.owner, join_policy='OPEN')
        ServerMembership.objects.create(user=self.owner, server=self.server, role='OWNER')
        ServerMembership.objects.create(user=self.admin, server=self.server, role='ADMIN')
        ServerMembership.objects.create(user=self.member, server=self.server, role='MEMBER')

    def test_only_owner_can_soft_delete_server(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/servers/{self.server.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'/api/servers/{self.server.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.server.refresh_from_db()
        self.assertIsNotNone(self.server.deleted_at)

    def test_owner_must_transfer_before_leave(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/servers/{self.server.id}/leave/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ownership', response.data['error'].lower())

    def test_admin_can_remove_member_but_not_owner(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/servers/{self.server.id}/remove_member/', {'user_id': self.member.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ServerMembership.objects.filter(server=self.server, user=self.member).exists())

        response = self.client.post(f'/api/servers/{self.server.id}/remove_member/', {'user_id': self.owner.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invite_only_server_requires_invite(self):
        self.server.join_policy = 'INVITE_ONLY'
        self.server.save(update_fields=['join_policy'])

        self.client.force_authenticate(user=self.guest)
        denied = self.client.post(f'/api/servers/{self.server.id}/join/')
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        invite = self.client.post(f'/api/servers/{self.server.id}/invite_member/', {'username': 'guest'}, format='json')
        self.assertEqual(invite.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.guest)
        joined = self.client.post(f'/api/servers/{self.server.id}/join/')
        self.assertEqual(joined.status_code, status.HTTP_200_OK)
        self.assertTrue(ServerMembership.objects.filter(server=self.server, user=self.guest).exists())
