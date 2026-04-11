from __future__ import annotations

import os
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
TASK_TIMER_SCORING_ENABLED = os.getenv('TASK_TIMER_SCORING_ENABLED', 'true').lower() == 'true'
MIN_ACTIVE_SECONDS_FOR_BONUS = 60
MAX_COUNTABLE_SECONDS_PER_TASK = 2 * 60 * 60
MAX_COUNTABLE_SECONDS_PER_DAY = 4 * 60 * 60
AFK_IDLE_TIMEOUT_SECONDS = 5 * 60
TIME_BONUS_POINTS_PER_MINUTE = {
    'LOW': 0.5,
    'MEDIUM': 1.0,
    'HIGH': 1.5,
}
MAX_TIME_BONUS_POINTS_PER_TASK = {
    'LOW': 8,
    'MEDIUM': 12,
    'HIGH': 18,
}


def normalize_difficulty(value: str | None) -> str:
    normalized = (value or 'MEDIUM').upper()
    return normalized if normalized in DIFFICULTY_POINTS else 'MEDIUM'


def base_points_for_difficulty(value: str | None) -> int:
    return DIFFICULTY_POINTS[normalize_difficulty(value)]


def is_completion_cooldown_satisfied(created_at, *, now=None) -> bool:
    current_time = now or timezone.now()
    return current_time - created_at >= TASK_COMPLETION_COOLDOWN


def points_to_award_for_task(*, user, difficulty: str, now=None) -> tuple[int, str]:
    summary = scoring_summary_for_task(user=user, difficulty=difficulty, now=now)
    return summary['awarded_points'], summary['score_reason']


def projected_points_for_task(*, user, difficulty: str, active_seconds: int, now=None) -> dict:
    return scoring_summary_for_task(
        user=user,
        difficulty=difficulty,
        active_seconds=active_seconds,
        now=now,
        projected=True,
    )


def scoring_summary_for_task(*, user, difficulty: str, active_seconds: int = 0, now=None, projected: bool = False) -> dict:
    from users.progress import get_daily_completion_counts

    current_time = now or timezone.now()
    normalized = normalize_difficulty(difficulty)
    completed_today = get_daily_completion_counts(user, now=current_time)[normalized]

    full_limit = DAILY_FULL_SCORE_LIMITS[normalized]
    base_points = DIFFICULTY_POINTS[normalized]
    base_reason = 'full'
    if completed_today < full_limit:
        effective_base_points = base_points
    else:
        effective_base_points = DAILY_REDUCED_POINTS[normalized]
        base_reason = 'daily_cap'

    bounded_active_seconds = max(int(active_seconds), 0)
    bounded_active_seconds = min(bounded_active_seconds, MAX_COUNTABLE_SECONDS_PER_TASK)
    min_seconds_met = bounded_active_seconds >= MIN_ACTIVE_SECONDS_FOR_BONUS
    if not TASK_TIMER_SCORING_ENABLED or not min_seconds_met:
        time_bonus_points = 0
    else:
        points_rate = TIME_BONUS_POINTS_PER_MINUTE[normalized]
        raw_bonus = (bounded_active_seconds / 60.0) * points_rate
        time_bonus_points = min(int(raw_bonus), MAX_TIME_BONUS_POINTS_PER_TASK[normalized])
    awarded_points = effective_base_points + time_bonus_points
    score_reason = (
        f'v2:{normalized.lower()}_{base_reason}'
        f'|time_bonus:{time_bonus_points}'
        f'|seconds:{bounded_active_seconds}'
    )
    return {
        'awarded_points': awarded_points,
        'score_reason': score_reason if not projected else score_reason.replace('v2:', 'v2:projected_'),
        'base_points': effective_base_points,
        'time_bonus_points': time_bonus_points,
        'counted_active_seconds': bounded_active_seconds,
        'daily_cap_applied': base_reason == 'daily_cap',
        'minimum_time_met': min_seconds_met,
        'timer_scoring_enabled': TASK_TIMER_SCORING_ENABLED,
    }
