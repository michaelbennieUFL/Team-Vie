from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date

from .scoring import base_points_for_difficulty

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
    LIFECYCLE_CHOICES = [
        ('NOT_STARTED', 'Not started'),
        ('IN_PROGRESS', 'In progress'),
        ('COMPLETED', 'Completed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    server = models.ForeignKey('servers.Server', on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    points_value = models.IntegerField(default=10)
    awarded_points = models.IntegerField(null=True, blank=True)
    score_reason = models.CharField(max_length=64, blank=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    due_date = models.DateField(null=True, blank=True)
    recurrence = models.CharField(max_length=10, choices=RECURRENCE_CHOICES, default='NONE')
    lifecycle_state = models.CharField(max_length=12, choices=LIFECYCLE_CHOICES, default='NOT_STARTED')
    started_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)
    active_seconds = models.PositiveIntegerField(default=0)
    timer_invalidated = models.BooleanField(default=False)
    outlier_flagged = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"

    def assigned_points_value(self):
        return base_points_for_difficulty(self.priority)

    def sync_points_value(self):
        self.points_value = self.assigned_points_value()

    def start_work(self, *, now=None):
        if self.is_completed:
            return False
        current_time = now or timezone.now()
        if not self.started_at:
            self.started_at = current_time
        self.last_activity_at = current_time
        self.lifecycle_state = 'IN_PROGRESS'
        self.save(update_fields=['started_at', 'last_activity_at', 'lifecycle_state', 'updated_at'])
        return True

    def record_activity(self, *, now=None, idle_timeout_seconds=300):
        if self.lifecycle_state != 'IN_PROGRESS' or self.is_completed:
            return 0, False
        current_time = now or timezone.now()
        if not self.last_activity_at:
            self.last_activity_at = current_time
            self.save(update_fields=['last_activity_at', 'updated_at'])
            return 0, False
        elapsed_seconds = max(int((current_time - self.last_activity_at).total_seconds()), 0)
        counted_seconds = min(elapsed_seconds, idle_timeout_seconds)
        went_idle = elapsed_seconds > idle_timeout_seconds
        if counted_seconds:
            self.active_seconds += counted_seconds
        if went_idle:
            self.outlier_flagged = True
        self.last_activity_at = current_time
        self.save(update_fields=['active_seconds', 'outlier_flagged', 'last_activity_at', 'updated_at'])
        return counted_seconds, went_idle
    
    def complete_task(self, awarded_points=None, score_reason=''):
        if not self.is_completed:
            self.sync_points_value()
            self.is_completed = True
            self.completed_at = timezone.now()
            self.awarded_points = awarded_points if awarded_points is not None else self.points_value
            self.score_reason = score_reason
            self.lifecycle_state = 'COMPLETED'
            self.save()
            
            # Award points to user
            profile = self.user.profile
            profile.points += self.awarded_points
            
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

            from users.progress import record_personal_task_completion
            from users.progress import record_daily_task_completion
            record_personal_task_completion(
                user=self.user,
                difficulty=self.priority,
                awarded_points=self.awarded_points,
                score_reason=self.score_reason,
                completed_at=self.completed_at,
            )
            record_daily_task_completion(
                user=self.user,
                difficulty=self.priority,
                score_reason=self.score_reason,
                completed_at=self.completed_at,
            )

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
                        points_value=self.assigned_points_value(),
                        due_date=next_due,
                        recurrence=self.recurrence,
                    )
    
    class Meta:
        ordering = ['-created_at']
