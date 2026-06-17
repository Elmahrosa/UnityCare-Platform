from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.auth import AuthService
from app.services.audit import AuditService
from app.schemas.user import UserCreate, UserResponse, LoginRequest, TokenResponse
from app.models.user import User, UserRole
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    auth = AuthService(db)
    try:
        user = await auth.register(
            email=data.email,
            password=data.password,
            full_name=data.full_name,
            role=data.role,
            locale=data.locale,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    audit = AuditService(db)
    await audit.log_event("user.registered", "user", actor_id=user.id, actor_email=user.email)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth = AuthService(db)
    user = await auth.authenticate(data.email, data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = auth.create_access_token(user)
    refresh_token = auth.create_refresh_token(user)
    audit = AuditService(db)
    await audit.log_event("user.login", "user", actor_id=user.id, actor_email=user.email)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, expires_in=900)
