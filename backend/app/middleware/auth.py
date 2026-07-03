from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.auth import AuthService
from app.models.user import User, UserRole

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    auth_service = AuthService(db)
    user = await auth_service.verify_token(credentials.credentials)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Account is locked")
    return user


def require_role(*roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    async def role_with_mfa(current_user: User = Depends(role_checker)):
        if current_user.role in (UserRole.ADMIN, UserRole.PROVIDER) and not current_user.mfa_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="MFA must be enabled for this role. Call POST /auth/mfa/setup to configure.",
            )
        return current_user
    if UserRole.ADMIN in roles or UserRole.PROVIDER in roles:
        return role_with_mfa
    return role_checker


async def require_mfa_enabled(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role in (UserRole.ADMIN, UserRole.PROVIDER) and not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MFA must be enabled for this role. Call POST /auth/mfa/setup to configure.",
        )
    return current_user
