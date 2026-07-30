from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.Token, status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.username == payload.username) | (models.User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    user = models.User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role or models.RoleEnum.user,
        preferred_wake_time=payload.preferred_wake_time or "07:00",
        timezone=payload.timezone or "UTC",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/demo", response_model=schemas.Token)
def demo_login(db: Session = Depends(get_db)):
    demo_username = "demo"
    demo_email = "demo@neuro.wake"
    demo = db.query(models.User).filter(models.User.username == demo_username).first()
    if not demo:
        demo = models.User(
            username=demo_username,
            email=demo_email,
            hashed_password=hash_password("demo1234"),
            role=models.RoleEnum.user,
            preferred_wake_time="07:00",
            timezone="UTC",
        )
        db.add(demo)
        db.commit()
        db.refresh(demo)

    token = create_access_token({"sub": str(demo.id)})
    return {"access_token": token, "token_type": "bearer", "user": demo}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
