"""
Adaptive Difficulty Engine.
Adjusts a user's cognitive-challenge difficulty based on rolling performance:
consecutive correct answers, consecutive wrong answers, snooze behavior and
solve-time trends.
"""
from ..models import DifficultyEnum

LADDER = [
    DifficultyEnum.beginner,
    DifficultyEnum.easy,
    DifficultyEnum.medium,
    DifficultyEnum.hard,
    DifficultyEnum.expert,
]


def _index(level: DifficultyEnum) -> int:
    return LADDER.index(level)


def next_difficulty(current: DifficultyEnum, consecutive_correct: int, consecutive_wrong: int,
                     was_snoozed: bool = False) -> DifficultyEnum:
    idx = _index(current)

    # Anti-snooze workflow: snoozing bumps difficulty up so the next
    # challenge requires more cognitive engagement to dismiss.
    if was_snoozed:
        idx = min(idx + 1, len(LADDER) - 1)
        return LADDER[idx]

    # Level up after 3 correct in a row
    if consecutive_correct >= 3:
        idx = min(idx + 1, len(LADDER) - 1)
    # Level down after 2 wrong in a row
    elif consecutive_wrong >= 2:
        idx = max(idx - 1, 0)

    return LADDER[idx]


def engagement_score(avg_time_to_solve: float, difficulty: DifficultyEnum) -> float:
    """A 0-100 score estimating cognitive engagement based on solve speed
    relative to expected time for the difficulty level."""
    expected = {
        DifficultyEnum.beginner: 25,
        DifficultyEnum.easy: 20,
        DifficultyEnum.medium: 15,
        DifficultyEnum.hard: 12,
        DifficultyEnum.expert: 10,
    }[difficulty]
    if avg_time_to_solve is None or avg_time_to_solve <= 0:
        return 50.0
    ratio = expected / avg_time_to_solve
    score = max(0.0, min(100.0, ratio * 60))
    return round(score, 1)
