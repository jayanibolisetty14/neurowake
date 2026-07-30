import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from .database import Base


class RoleEnum(str, enum.Enum):
    user = "user"
    wellness_coach = "wellness_coach"
    admin = "admin"


class AlarmTypeEnum(str, enum.Enum):
    daily = "daily"
    weekday = "weekday"
    weekend = "weekend"
    one_time = "one_time"
    smart_adaptive = "smart_adaptive"


class ChallengeTypeEnum(str, enum.Enum):
    math = "math"
    logic = "logic"
    memory = "memory"
    pattern = "pattern"
    riddle = "riddle"
    quiz = "quiz"
    word = "word"


class DifficultyEnum(str, enum.Enum):
    beginner = "beginner"
    easy = "easy"
    medium = "medium"
    hard = "hard"
    expert = "expert"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.user, nullable=False)

    preferred_wake_time = Column(String(5), default="07:00")  # HH:MM
    sleep_duration_minutes = Column(Integer, default=480)
    timezone = Column(String(64), default="UTC")
    productivity_goal = Column(String(255), default="")
    difficulty_preference = Column(Enum(DifficultyEnum), default=DifficultyEnum.easy)
    habit_preferences = Column(Text, default="")  # csv of challenge types preferred

    current_difficulty = Column(Enum(DifficultyEnum), default=DifficultyEnum.easy)
    consecutive_correct = Column(Integer, default=0)
    consecutive_wrong = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    alarms = relationship("Alarm", back_populates="owner", cascade="all, delete-orphan")
    attempts = relationship("ChallengeAttempt", back_populates="user", cascade="all, delete-orphan")
    habit_scores = relationship("HabitScoreEntry", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String(120), default="Alarm")
    time = Column(String(5), nullable=False)  # HH:MM 24h
    days_of_week = Column(String(40), default="Mon,Tue,Wed,Thu,Fri,Sat,Sun")
    alarm_type = Column(Enum(AlarmTypeEnum), default=AlarmTypeEnum.daily)
    sound = Column(String(40), default="classic_beep")
    challenge_type = Column(Enum(ChallengeTypeEnum), nullable=True)  # null = auto-pick
    difficulty = Column(Enum(DifficultyEnum), default=DifficultyEnum.easy)
    is_active = Column(Boolean, default=True)
    snooze_count_today = Column(Integer, default=0)
    max_snoozes = Column(Integer, default=3)
    last_triggered_at = Column(DateTime, nullable=True)
    last_dismissed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="alarms")
    attempts = relationship("ChallengeAttempt", back_populates="alarm", cascade="all, delete-orphan")


class ChallengeAttempt(Base):
    __tablename__ = "challenge_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alarm_id = Column(Integer, ForeignKey("alarms.id"), nullable=True)
    challenge_type = Column(Enum(ChallengeTypeEnum), nullable=False)
    difficulty = Column(Enum(DifficultyEnum), nullable=False)
    question_payload = Column(Text, nullable=False)  # JSON string
    correct_answer = Column(String(255), nullable=False)
    user_answer = Column(String(255), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    is_snoozed = Column(Boolean, default=False)
    time_to_solve_seconds = Column(Float, nullable=True)
    resulted_in_dismiss = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="attempts")
    alarm = relationship("Alarm", back_populates="attempts")


class HabitScoreEntry(Base):
    __tablename__ = "habit_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    wake_up_consistency = Column(Float, default=0)
    challenge_completion = Column(Float, default=0)
    snooze_reduction = Column(Float, default=0)
    sleep_schedule_adherence = Column(Float, default=0)
    total_score = Column(Float, default=0)

    user = relationship("User", back_populates="habit_scores")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(40), default="info")
    message = Column(String(255), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
