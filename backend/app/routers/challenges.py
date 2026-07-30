from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/challenges", tags=["Challenges"])


@router.get("/history")
def challenge_history(limit: int = Query(30, le=200), db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    attempts = (
        db.query(models.ChallengeAttempt)
        .filter(models.ChallengeAttempt.user_id == current_user.id)
        .order_by(models.ChallengeAttempt.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": a.id,
            "challenge_type": a.challenge_type,
            "difficulty": a.difficulty,
            "is_correct": a.is_correct,
            "is_snoozed": a.is_snoozed,
            "time_to_solve_seconds": a.time_to_solve_seconds,
            "created_at": a.created_at,
        }
        for a in attempts
    ]
