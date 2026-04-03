from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from .models import WeeklyProgress


DEFAULT_WEEKLY_GOAL_POINTS = 120


def current_week_start(*, now=None):
    current_time = now or timezone.now()
    today = current_time.date()
    return today - timedelta(days=today.weekday())


def get_current_weekly_progress(user, *, now=None):
    return WeeklyProgress.objects.filter(
        user=user,
        week_start=current_week_start(now=now),
    ).first()


def get_or_create_current_weekly_progress(user, *, now=None):
    week_start = current_week_start(now=now)
    progress, _ = WeeklyProgress.objects.get_or_create(
        user=user,
        week_start=week_start,
        defaults={
            'weekly_goal_points': user.profile.default_weekly_goal_points or DEFAULT_WEEKLY_GOAL_POINTS,
        },
    )
    return progress


def build_weekly_progress_snapshot(user, *, now=None):
    progress = get_current_weekly_progress(user, now=now)
    weekly_goal_points = (
        progress.weekly_goal_points
        if progress is not None
        else (user.profile.default_weekly_goal_points or DEFAULT_WEEKLY_GOAL_POINTS)
    )
    competitive_points = progress.competitive_points if progress is not None else 0
    personal_points = progress.personal_points if progress is not None else 0
    reached_goal_at = progress.reached_goal_at if progress is not None else None
    return {
        'week_start': current_week_start(now=now),
        'competitive_points': competitive_points,
        'personal_points': personal_points,
        'weekly_goal_points': weekly_goal_points,
        'goal_reached': reached_goal_at is not None or competitive_points >= weekly_goal_points,
        'competitive_points_remaining': max(weekly_goal_points - competitive_points, 0),
        'reached_goal_at': reached_goal_at,
    }


def record_personal_task_completion(*, user, difficulty, awarded_points, score_reason, completed_at=None):
    progress = get_or_create_current_weekly_progress(user, now=completed_at)
    normalized = (difficulty or 'MEDIUM').lower()
    normalized = normalized if normalized in {'low', 'medium', 'high'} else 'medium'
    count_suffix = 'full' if score_reason.endswith('_full') else 'reduced'

    progress.personal_points += awarded_points
    if count_suffix == 'full':
        progress.competitive_points += awarded_points
    setattr(progress, f'{normalized}_{count_suffix}_count', getattr(progress, f'{normalized}_{count_suffix}_count') + 1)

    if (
        progress.reached_goal_at is None
        and progress.competitive_points >= progress.weekly_goal_points
    ):
        progress.reached_goal_at = completed_at or timezone.now()

    progress.save()

    profile = user.profile
    if progress.personal_points > profile.best_weekly_personal_points:
        profile.best_weekly_personal_points = progress.personal_points
        profile.save(update_fields=['best_weekly_personal_points'])

    return progress
