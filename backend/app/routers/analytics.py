from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from ..services import habit_scoring, recommendation_engine

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary", response_model=schemas.AnalyticsSummary)
def analytics_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    latest = (
        db.query(models.HabitScoreEntry)
        .filter(models.HabitScoreEntry.user_id == current_user.id)
        .order_by(models.HabitScoreEntry.date.desc())
        .first()
    )

    if not latest:
        latest = habit_scoring.compute_and_store_habit_score(db, current_user.id)
    else:
        newer_attempts = (
            db.query(models.ChallengeAttempt)
            .filter(models.ChallengeAttempt.user_id == current_user.id,
                    models.ChallengeAttempt.created_at > latest.date)
            .count()
        )
        if newer_attempts:
            latest = habit_scoring.compute_and_store_habit_score(db, current_user.id)

    history = (
        db.query(models.HabitScoreEntry)
        .filter(models.HabitScoreEntry.user_id == current_user.id)
        .order_by(models.HabitScoreEntry.date.asc())
        .limit(30)
        .all()
    )

    total_alarms = db.query(models.Alarm).filter(models.Alarm.user_id == current_user.id).count()
    attempts = db.query(models.ChallengeAttempt).filter(models.ChallengeAttempt.user_id == current_user.id).all()
    total_attempts = len(attempts)
    total_snoozes = sum(1 for a in attempts if a.is_snoozed)
    solve_times = [a.time_to_solve_seconds for a in attempts if a.time_to_solve_seconds]
    avg_time = round(sum(solve_times) / len(solve_times), 1) if solve_times else None

    recs = recommendation_engine.build_recommendations(
        latest.wake_up_consistency, latest.challenge_completion,
        latest.snooze_reduction, latest.sleep_schedule_adherence, latest.total_score,
    )

    return schemas.AnalyticsSummary(
        habit_score=latest.total_score,
        wake_up_consistency=latest.wake_up_consistency,
        challenge_completion_rate=latest.challenge_completion,
        snooze_reduction=latest.snooze_reduction,
        sleep_schedule_adherence=latest.sleep_schedule_adherence,
        total_alarms=total_alarms,
        total_attempts=total_attempts,
        total_snoozes=total_snoozes,
        avg_time_to_solve=avg_time,
        score_history=history,
        recommendations=recs,
    )
