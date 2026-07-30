from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import (
    auth, users, alarms, challenges, analytics, habits,
    recommendations, notifications, reports, admin,
)
from sqlalchemy import inspect, text

Base.metadata.create_all(bind=engine)


def _ensure_alarm_difficulty_column():
    inspector = inspect(engine)
    if 'alarms' not in inspector.get_table_names():
        return
    columns = [col['name'] for col in inspector.get_columns('alarms')]
    if 'difficulty' not in columns:
        with engine.begin() as conn:
            conn.execute(text('ALTER TABLE alarms ADD COLUMN difficulty TEXT DEFAULT "easy"'))


_ensure_alarm_difficulty_column()

app = FastAPI(
    title="Intelligent Cognitive Alarm Platform API",
    description="AI-powered alarm platform requiring cognitive challenges to dismiss alarms.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(alarms.router)
app.include_router(challenges.router)
app.include_router(analytics.router)
app.include_router(habits.router)
app.include_router(recommendations.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "service": "Intelligent Cognitive Alarm Platform",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
