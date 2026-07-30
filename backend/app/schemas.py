from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from .models import RoleEnum, AlarmTypeEnum, ChallengeTypeEnum, DifficultyEnum


# ---------- Auth / User ----------
class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Optional[RoleEnum] = RoleEnum.user
    preferred_wake_time: Optional[str] = "07:00"
    timezone: Optional[str] = "UTC"


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserUpdate(BaseModel):
    preferred_wake_time: Optional[str] = None
    sleep_duration_minutes: Optional[int] = None
    timezone: Optional[str] = None
    productivity_goal: Optional[str] = None
    difficulty_preference: Optional[DifficultyEnum] = None
    habit_preferences: Optional[str] = None
    email: Optional[EmailStr] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: RoleEnum
    preferred_wake_time: str
    sleep_duration_minutes: int
    timezone: str
    productivity_goal: str
    difficulty_preference: DifficultyEnum
    habit_preferences: str
    current_difficulty: DifficultyEnum
    created_at: datetime

    class Config:
        from_attributes = True


Token.model_rebuild()


# ---------- Alarms ----------
class AlarmCreate(BaseModel):
    label: str = "Alarm"
    time: str
    days_of_week: str = "Mon,Tue,Wed,Thu,Fri,Sat,Sun"
    alarm_type: AlarmTypeEnum = AlarmTypeEnum.daily
    sound: str = "classic_beep"
    challenge_type: Optional[ChallengeTypeEnum] = None
    difficulty: DifficultyEnum = DifficultyEnum.easy
    max_snoozes: int = 0


class AlarmUpdate(BaseModel):
    label: Optional[str] = None
    time: Optional[str] = None
    days_of_week: Optional[str] = None
    alarm_type: Optional[AlarmTypeEnum] = None
    sound: Optional[str] = None
    challenge_type: Optional[ChallengeTypeEnum] = None
    difficulty: Optional[DifficultyEnum] = None
    is_active: Optional[bool] = None
    max_snoozes: Optional[int] = None


class AlarmOut(BaseModel):
    id: int
    label: str
    time: str
    days_of_week: str
    alarm_type: AlarmTypeEnum
    sound: str
    challenge_type: Optional[ChallengeTypeEnum]
    difficulty: DifficultyEnum
    is_active: bool
    snooze_count_today: int
    max_snoozes: int
    last_triggered_at: Optional[datetime]
    last_dismissed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---------- Challenges ----------
class ChallengeQuestion(BaseModel):
    attempt_id: int
    challenge_type: ChallengeTypeEnum
    difficulty: DifficultyEnum
    prompt: str
    options: Optional[List[str]] = None
    meta: Optional[Dict[str, Any]] = None


class ChallengeAnswerSubmit(BaseModel):
    attempt_id: int
    answer: str
    time_to_solve_seconds: Optional[float] = None


class ChallengeResult(BaseModel):
    correct: bool
    correct_answer: Optional[str] = None
    new_difficulty: DifficultyEnum
    message: str


# ---------- Analytics / Habits ----------
class HabitScoreOut(BaseModel):
    date: datetime
    wake_up_consistency: float
    challenge_completion: float
    snooze_reduction: float
    sleep_schedule_adherence: float
    total_score: float

    class Config:
        from_attributes = True


class AnalyticsSummary(BaseModel):
    habit_score: float
    wake_up_consistency: float
    challenge_completion_rate: float
    snooze_reduction: float
    sleep_schedule_adherence: float
    total_alarms: int
    total_attempts: int
    total_snoozes: int
    avg_time_to_solve: Optional[float]
    score_history: List[HabitScoreOut]
    recommendations: List[str]


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
