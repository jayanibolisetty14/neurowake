from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from ..services import challenge_generator, difficulty_engine, habit_scoring

router = APIRouter(prefix="/api/alarms", tags=["Alarms"])


@router.get("", response_model=list[schemas.AlarmOut])
def list_alarms(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Alarm).filter(models.Alarm.user_id == current_user.id).order_by(models.Alarm.time).all()


@router.post("", response_model=schemas.AlarmOut, status_code=201)
def create_alarm(payload: schemas.AlarmCreate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    alarm = models.Alarm(user_id=current_user.id, **payload.dict())
    db.add(alarm)
    db.commit()
    db.refresh(alarm)
    return alarm


@router.put("/{alarm_id}", response_model=schemas.AlarmOut)
def update_alarm(alarm_id: int, payload: schemas.AlarmUpdate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    alarm = db.query(models.Alarm).filter(models.Alarm.id == alarm_id, models.Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(alarm, field, value)
    db.commit()
    db.refresh(alarm)
    return alarm


@router.delete("/{alarm_id}", status_code=204)
def delete_alarm(alarm_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    alarm = db.query(models.Alarm).filter(models.Alarm.id == alarm_id, models.Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    db.delete(alarm)
    db.commit()
    return None


def _build_question(db, current_user, alarm):
    challenge_type = (alarm.challenge_type if alarm and alarm.challenge_type
                       else challenge_generator.pick_random_challenge_type())
    difficulty = alarm.difficulty if alarm and alarm.difficulty else current_user.current_difficulty
    prompt, answer, meta = challenge_generator.generate_challenge(challenge_type, difficulty)

    import json
    attempt = models.ChallengeAttempt(
        user_id=current_user.id,
        alarm_id=alarm.id if alarm else None,
        challenge_type=challenge_type,
        difficulty=difficulty,
        question_payload=json.dumps({"prompt": prompt, "meta": meta}),
        correct_answer=answer,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return schemas.ChallengeQuestion(
        attempt_id=attempt.id,
        challenge_type=challenge_type,
        difficulty=difficulty,
        prompt=prompt,
        meta=meta,
    )


@router.post("/{alarm_id}/trigger", response_model=schemas.ChallengeQuestion)
def trigger_alarm(alarm_id: int, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    """Simulates the alarm ringing and returns the cognitive challenge
    the user must solve to dismiss it."""
    alarm = db.query(models.Alarm).filter(models.Alarm.id == alarm_id, models.Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    alarm.last_triggered_at = datetime.utcnow()
    db.commit()
    return _build_question(db, current_user, alarm)


@router.post("/demo/trigger", response_model=schemas.ChallengeQuestion)
def trigger_demo_alarm(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Lets a user test the wake-up verification flow without waiting for a real alarm."""
    return _build_question(db, current_user, None)


@router.post("/{alarm_id}/snooze", response_model=schemas.ChallengeQuestion)
def snooze_alarm(alarm_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    alarm = db.query(models.Alarm).filter(models.Alarm.id == alarm_id, models.Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    if alarm.snooze_count_today >= alarm.max_snoozes:
        raise HTTPException(status_code=400, detail="Maximum snoozes reached for this alarm. Solve the challenge to dismiss it.")

    alarm.snooze_count_today += 1
    current_user.current_difficulty = difficulty_engine.next_difficulty(
        current_user.current_difficulty, current_user.consecutive_correct,
        current_user.consecutive_wrong, was_snoozed=True,
    )
    current_user.consecutive_correct = 0
    db.commit()

    return _build_question(db, current_user, alarm)


@router.post("/answer", response_model=schemas.ChallengeResult)
def submit_answer(payload: schemas.ChallengeAnswerSubmit, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    attempt = db.query(models.ChallengeAttempt).filter(
        models.ChallengeAttempt.id == payload.attempt_id,
        models.ChallengeAttempt.user_id == current_user.id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Challenge attempt not found")

    is_correct = challenge_generator.check_answer(attempt.challenge_type, attempt.correct_answer, payload.answer)
    attempt.user_answer = payload.answer
    attempt.is_correct = is_correct
    attempt.time_to_solve_seconds = payload.time_to_solve_seconds
    attempt.resulted_in_dismiss = is_correct

    if is_correct:
        current_user.consecutive_correct += 1
        current_user.consecutive_wrong = 0
        message = "Correct! Alarm dismissed. Great start to your day."
        if attempt.alarm_id:
            alarm = db.query(models.Alarm).filter(models.Alarm.id == attempt.alarm_id).first()
            if alarm:
                alarm.last_dismissed_at = datetime.utcnow()
                alarm.snooze_count_today = 0
    else:
        current_user.consecutive_wrong += 1
        current_user.consecutive_correct = 0
        message = "Not quite right — try again to dismiss the alarm."

    current_user.current_difficulty = difficulty_engine.next_difficulty(
        current_user.current_difficulty, current_user.consecutive_correct, current_user.consecutive_wrong,
    )

    db.commit()

    if is_correct:
        habit_scoring.compute_and_store_habit_score(db, current_user.id)

    return schemas.ChallengeResult(
        correct=is_correct,
        correct_answer=attempt.correct_answer if not is_correct else None,
        new_difficulty=current_user.current_difficulty,
        message=message,
    )
