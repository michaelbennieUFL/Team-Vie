from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    points = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_task_completed_date = models.DateField(null=True, blank=True)
    region = models.CharField(max_length=100, blank=True)
    default_weekly_goal_points = models.IntegerField(default=120)
    best_weekly_personal_points = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"


class WeeklyProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weekly_progress_entries')
    week_start = models.DateField()
    competitive_points = models.IntegerField(default=0)
    personal_points = models.IntegerField(default=0)
    weekly_goal_points = models.IntegerField(default=120)
    reached_goal_at = models.DateTimeField(null=True, blank=True)
    low_full_count = models.IntegerField(default=0)
    medium_full_count = models.IntegerField(default=0)
    high_full_count = models.IntegerField(default=0)
    low_reduced_count = models.IntegerField(default=0)
    medium_reduced_count = models.IntegerField(default=0)
    high_reduced_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-week_start']
        unique_together = ('user', 'week_start')

    def __str__(self):
        return f"{self.user.username} - {self.week_start}"


class DailyTaskProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_task_progress_entries')
    day = models.DateField()
    low_full_count = models.IntegerField(default=0)
    medium_full_count = models.IntegerField(default=0)
    high_full_count = models.IntegerField(default=0)
    low_reduced_count = models.IntegerField(default=0)
    medium_reduced_count = models.IntegerField(default=0)
    high_reduced_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-day']
        unique_together = ('user', 'day')

    def __str__(self):
        return f"{self.user.username} - {self.day}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
