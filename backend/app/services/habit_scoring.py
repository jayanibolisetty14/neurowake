"""
Habit Scoring Engine implementing the weighted model:

Habit Score =
    Wake-Up Consistency        (35%)
  + Challenge Completion Success (25%)
  + Snooze Reduction           (20%)
  + Sleep Schedule Adherence   (20%)
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .. import models

WEIGHTS = {
    "wake_up_consistency": 0.35,
    "challenge_completion": 0.25,
    "snooze_reduction": 0.20,
    "sleep_schedule_adherence": 0.20,
}


def compute_wake_up_consistency(db: Session, user_id: int, days: int = 14) -> float:
    since = datetime.utcnow() - timedelta(days=days)
    attempts = (
        db.query(models.ChallengeAttempt)
        .filter(models.ChallengeAttempt.user_id == user_id,
                models.ChallengeAttempt.resulted_in_dismiss == True,  # noqa: E712
                models.ChallengeAttempt.created_at >= since)
        .all()
    )
    if not attempts:
        return 50.0
    days_with_dismiss = {a.created_at.date() for a in attempts}
    ratio = len(days_with_dismiss) / days
    return round(min(1.0, ratio) * 100, 1)


def compute_challenge_completion(db: Session, user_id: int, days: int = 14) -> float:
    since = datetime.utcnow() - timedelta(days=days)
    attempts = (
        db.query(models.ChallengeAttempt)
        .filter(models.ChallengeAttempt.user_id == user_id,
                models.ChallengeAttempt.created_at >= since)
        .all()
    )
    if not attempts:
        return 50.0
    correct = sum(1 for a in attempts if a.is_correct)
    return round((correct / len(attempts)) * 100, 1)


def compute_snooze_reduction(db: Session, user_id: int, days: int = 14) -> float:
    since = datetime.utcnow() - timedelta(days=days)
    total = (
        db.query(models.ChallengeAttempt)
        .filter(models.ChallengeAttempt.user_id == user_id,
                models.ChallengeAttempt.created_at >= since)
        .count()
    )
    snoozed = (
        db.query(models.ChallengeAttempt)
        .filter(models.ChallengeAttempt.user_id == user_id,
                models.ChallengeAttempt.created_at >= since,
                models.ChallengeAttempt.is_snoozed == True)  # noqa: E712
        .count()
    )
    if total == 0:
        return 50.0
    snooze_rate = snoozed / total
    return round((1 - snooze_rate) * 100, 1)


def compute_sleep_schedule_adherence(db: Session, user_id: int) -> float:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return 50.0
    dismissals = (
        db.query(models.ChallengeAttempt)
        .filter(models.ChallengeAttempt.user_id == user_id,
                models.ChallengeAttempt.resulted_in_dismiss == True)  # noqa: E712
        .order_by(models.ChallengeAttempt.created_at.desc())
        .limit(14)
        .all()
    )
    if not dismissals:
        return 50.0
    try:
        target_h, target_m = map(int, user.preferred_wake_time.split(":"))
    except Exception:
        target_h, target_m = 7, 0
    target_minutes = target_h * 60 + target_m

    diffs = []
    for d in dismissals:
        actual_minutes = d.created_at.hour * 60 + d.created_at.minute
        diffs.append(abs(actual_minutes - target_minutes))
    avg_diff = sum(diffs) / len(diffs)
    score = max(0.0, 100 - (avg_diff / 90 * 100))
    return round(score, 1)


def compute_and_store_habit_score(db: Session, user_id: int) -> models.HabitScoreEntry:
    wake = compute_wake_up_consistency(db, user_id)
    challenge = compute_challenge_completion(db, user_id)
    snooze = compute_snooze_reduction(db, user_id)
    sleep = compute_sleep_schedule_adherence(db, user_id)

    total = (
        wake * WEIGHTS["wake_up_consistency"]
        + challenge * WEIGHTS["challenge_completion"]
        + snooze * WEIGHTS["snooze_reduction"]
        + sleep * WEIGHTS["sleep_schedule_adherence"]
    )

    entry = models.HabitScoreEntry(
        user_id=user_id,
        wake_up_consistency=wake,
        challenge_completion=challenge,
        snooze_reduction=snooze,
        sleep_schedule_adherence=sleep,
        total_score=round(total, 1),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
