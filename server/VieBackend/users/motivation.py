from __future__ import annotations

from random import choice


MOTIVATIONAL_QUOTES = [
    {
        "quote": "Small steps still count. Stack enough of them and the day changes shape.",
        "author": "Vie",
        "tone": "Momentum",
    },
    {
        "quote": "Discipline gets easier once the first task is no longer negotiable.",
        "author": "Vie",
        "tone": "Discipline",
    },
    {
        "quote": "You do not need a perfect plan to finish one meaningful thing today.",
        "author": "Vie",
        "tone": "Focus",
    },
    {
        "quote": "A streak is just proof that future you can trust present you.",
        "author": "Vie",
        "tone": "Streaks",
    },
    {
        "quote": "Progress feels quiet while it is happening and obvious once you refuse to stop.",
        "author": "Vie",
        "tone": "Consistency",
    },
    {
        "quote": "Make the next task so clear that motivation becomes optional.",
        "author": "Vie",
        "tone": "Clarity",
    },
    {
        "quote": "Winning the day usually looks like finishing the thing you kept postponing.",
        "author": "Vie",
        "tone": "Courage",
    },
    {
        "quote": "The habit is the achievement. The points are the receipt.",
        "author": "Vie",
        "tone": "Habits",
    },
]


def get_random_quote() -> dict[str, str]:
    return choice(MOTIVATIONAL_QUOTES)


def build_celebration_payload(
    *,
    task_title: str,
    points_earned: int,
    current_streak: int,
    score_reason: str = '',
) -> dict[str, str | int | bool]:
    if current_streak >= 7:
        headline = "Streak on fire"
        phrase = f"{task_title} is done. {current_streak} straight days is serious momentum."
    elif points_earned >= 50:
        headline = "Big points landed"
        phrase = f"{task_title} just dropped {points_earned} points onto your board."
    else:
        headline = "Task checked off"
        phrase = f"{task_title} is complete. Keep stacking wins."

    daily_limit_reached = score_reason.endswith('_daily_cap')
    limit_note = (
        "You reached today's full-point limit for this difficulty. Extra completions still count, but at reduced value."
        if daily_limit_reached
        else ''
    )

    return {
        "headline": headline,
        "phrase": phrase,
        "points_earned": points_earned,
        "current_streak": current_streak,
        "daily_limit_reached": daily_limit_reached,
        "limit_note": limit_note,
    }
