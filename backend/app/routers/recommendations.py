from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..security import get_current_user
from ..services import habit_scoring, recommendation_engine

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("")
def get_recommendations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    latest = (
        db.query(models.HabitScoreEntry)
        .filter(models.HabitScoreEntry.user_id == current_user.id)
        .order_by(models.HabitScoreEntry.date.desc())
        .first()
    )
    if not latest:
        latest = habit_scoring.compute_and_store_habit_score(db, current_user.id)

    recs = recommendation_engine.build_recommendations(
        latest.wake_up_consistency, latest.challenge_completion,
        latest.snooze_reduction, latest.sleep_schedule_adherence, latest.total_score,
    )
    return {"recommendations": recs}
