from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]

    RECURRENCE_CHOICES = [
        ('NONE', 'None'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    server = models.ForeignKey('servers.Server', on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    points_value = models.IntegerField(default=10)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    due_date = models.DateField(null=True, blank=True)
    recurrence = models.CharField(max_length=10, choices=RECURRENCE_CHOICES, default='NONE')
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def complete_task(self):
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()
            
            # Award points to user
            profile = self.user.profile
            profile.points += self.points_value
            
            # Update streak
            today = date.today()
            if profile.last_task_completed_date:
                days_since_last = (today - profile.last_task_completed_date).days
                if days_since_last == 0:
                    # Same day, maintain streak
                    pass
                elif days_since_last == 1:
                    profile.current_streak += 1
                elif days_since_last > 1:
                    profile.current_streak = 1
            else:
                profile.current_streak = 1
            
            if profile.current_streak > profile.longest_streak:
                profile.longest_streak = profile.current_streak
            
            profile.last_task_completed_date = today
            profile.save()

            # Handle recurring tasks - create next occurrence
            if self.recurrence != 'NONE' and self.due_date:
                from datetime import timedelta
                if self.recurrence == 'DAILY':
                    next_due = self.due_date + timedelta(days=1)
                elif self.recurrence == 'WEEKLY':
                    next_due = self.due_date + timedelta(weeks=1)
                else:
                    next_due = None

                if next_due:
                    Task.objects.create(
                        user=self.user,
                        server=self.server,
                        title=self.title,
                        description=self.description,
                        priority=self.priority,
                        points_value=self.points_value,
                        due_date=next_due,
                        recurrence=self.recurrence,
                    )
    
    class Meta:
        ordering = ['-created_at']
