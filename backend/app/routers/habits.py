from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from ..services import habit_scoring

router = APIRouter(prefix="/api/habits", tags=["Habits"])


@router.get("/score", response_model=schemas.HabitScoreOut)
def get_latest_score(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    latest = (
        db.query(models.HabitScoreEntry)
        .filter(models.HabitScoreEntry.user_id == current_user.id)
        .order_by(models.HabitScoreEntry.date.desc())
        .first()
    )
    if not latest:
        latest = habit_scoring.compute_and_store_habit_score(db, current_user.id)
    return latest


@router.get("/history", response_model=list[schemas.HabitScoreOut])
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.HabitScoreEntry)
        .filter(models.HabitScoreEntry.user_id == current_user.id)
        .order_by(models.HabitScoreEntry.date.asc())
        .all()
    )


@router.post("/recalculate", response_model=schemas.HabitScoreOut)
def recalculate(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return habit_scoring.compute_and_store_habit_score(db, current_user.id)
