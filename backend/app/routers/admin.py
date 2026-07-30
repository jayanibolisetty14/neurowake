from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..security import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
def list_users(db: Session = Depends(get_db),
                _: models.User = Depends(require_role(models.RoleEnum.admin, models.RoleEnum.wellness_coach))):
    users = db.query(models.User).all()
    return [
        {
            "id": u.id, "username": u.username, "email": u.email, "role": u.role,
            "current_difficulty": u.current_difficulty, "created_at": u.created_at,
        }
        for u in users
    ]


@router.get("/stats")
def platform_stats(db: Session = Depends(get_db),
                    _: models.User = Depends(require_role(models.RoleEnum.admin, models.RoleEnum.wellness_coach))):
    total_users = db.query(models.User).count()
    total_alarms = db.query(models.Alarm).count()
    total_attempts = db.query(models.ChallengeAttempt).count()
    correct_attempts = db.query(models.ChallengeAttempt).filter(models.ChallengeAttempt.is_correct == True).count()  # noqa: E712
    avg_habit_scores = db.query(models.HabitScoreEntry).all()
    avg_score = (
        round(sum(h.total_score for h in avg_habit_scores) / len(avg_habit_scores), 1)
        if avg_habit_scores else 0
    )
    return {
        "total_users": total_users,
        "total_alarms": total_alarms,
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "average_habit_score": avg_score,
    }
