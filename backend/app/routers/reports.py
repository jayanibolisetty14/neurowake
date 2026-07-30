import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    attempts = (
        db.query(models.ChallengeAttempt)
        .filter(models.ChallengeAttempt.user_id == current_user.id)
        .order_by(models.ChallengeAttempt.created_at.desc())
        .all()
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Date", "Challenge Type", "Difficulty", "Correct", "Snoozed", "Time to Solve (s)"])
    for a in attempts:
        writer.writerow([
            a.created_at.isoformat(), a.challenge_type.value, a.difficulty.value,
            a.is_correct, a.is_snoozed, a.time_to_solve_seconds,
        ])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=habit_report.csv"},
    )
