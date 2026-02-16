from django.db import models
from django.contrib.auth.models import User

class Competition(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
    ]
    
    challenger = models.ForeignKey(User, on_delete=models.CASCADE, related_name='competitions_initiated')
    opponent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='competitions_received')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    challenger_score = models.IntegerField(default=0)
    opponent_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.challenger.username} vs {self.opponent.username}"
    
    class Meta:
        ordering = ['-created_at']

class CompetitionTask(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    points_value = models.IntegerField(default=10)
    challenger_completed = models.BooleanField(default=False)
    opponent_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.competition}"
