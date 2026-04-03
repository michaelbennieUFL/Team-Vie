from __future__ import annotations

from datetime import timedelta

from django.utils import timezone


DIFFICULTY_POINTS = {
    'LOW': 5,
    'MEDIUM': 10,
    'HIGH': 15,
}

DAILY_FULL_SCORE_LIMITS = {
    'LOW': 8,
    'MEDIUM': 6,
    'HIGH': 3,
}

DAILY_REDUCED_POINTS = {
    'LOW': 2,
    'MEDIUM': 5,
    'HIGH': 8,
}

TASK_COMPLETION_COOLDOWN = timedelta(minutes=3)


def normalize_difficulty(value: str | None) -> str:
    normalized = (value or 'MEDIUM').upper()
    return normalized if normalized in DIFFICULTY_POINTS else 'MEDIUM'


def base_points_for_difficulty(value: str | None) -> int:
    return DIFFICULTY_POINTS[normalize_difficulty(value)]


def is_completion_cooldown_satisfied(created_at, *, now=None) -> bool:
    current_time = now or timezone.now()
    return current_time - created_at >= TASK_COMPLETION_COOLDOWN


def points_to_award_for_task(*, user, difficulty: str, now=None) -> tuple[int, str]:
    from .models import Task

    current_time = now or timezone.now()
    normalized = normalize_difficulty(difficulty)
    completed_today = Task.objects.filter(
        user=user,
        is_completed=True,
        priority=normalized,
        completed_at__date=current_time.date(),
    ).count()

    full_limit = DAILY_FULL_SCORE_LIMITS[normalized]
    base_points = DIFFICULTY_POINTS[normalized]
    if completed_today < full_limit:
        return base_points, f'v1:{normalized.lower()}_full'

    reduced_points = DAILY_REDUCED_POINTS[normalized]
    return reduced_points, f'v1:{normalized.lower()}_daily_cap'
