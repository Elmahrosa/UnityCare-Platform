from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.auth import AuthService
from app.services.audit import AuditService
from app.schemas.user import UserCreate, UserResponse, LoginRequest, TokenResponse, MFAEnableRequest, MFAVerifyRequest, MFADisableRequest, MFASetupResponse
from app.models.user import User
from app.middleware.auth import get_current_user
from app.utils.security import verify_password

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


@router.post("/mfa/setup", response_model=MFASetupResponse)
async def mfa_setup(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    auth = AuthService(db)
    provisioning_uri = auth.generate_mfa_secret(current_user)
    await db.flush()
    return MFASetupResponse(secret=current_user.mfa_secret, provisioning_uri=provisioning_uri)


@router.post("/mfa/enable")
async def mfa_enable(data: MFAEnableRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    auth = AuthService(db)
    ok = await auth.enable_mfa(current_user, data.code)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid MFA code")
    return {"detail": "MFA enabled successfully"}


@router.post("/mfa/disable")
async def mfa_disable(data: MFADisableRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(data.password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password")
    auth = AuthService(db)
    await auth.disable_mfa(current_user)
    return {"detail": "MFA disabled successfully"}


@router.post("/mfa/verify")
async def mfa_verify(data: MFAVerifyRequest, current_user: User = Depends(get_current_user)):
    ok = AuthService.verify_mfa(current_user, data.code)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid MFA code")
    return {"detail": "MFA code is valid"}
