from django.db import models
from django.contrib.auth.models import User


class Server(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_servers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class ServerMembership(models.Model):
    ROLE_CHOICES = [
        ('OWNER', 'Owner'),
        ('ADMIN', 'Admin'),
        ('MEMBER', 'Member'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='server_memberships')
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MEMBER')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'server']
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} in {self.server.name}"
