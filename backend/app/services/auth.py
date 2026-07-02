import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.models.user import User, UserRole
from app.utils.security import hash_password, verify_password
import pyotp


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, email: str, password: str, full_name: str, role: UserRole = UserRole.PATIENT, locale: str = "en") -> User:
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=role,
            locale=locale,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def authenticate(self, email: str, password: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            await self.db.flush()
            return None
        user.failed_login_attempts = 0
        user.locked_until = None
        await self.db.flush()
        return user

    def create_access_token(self, user: User) -> str:
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes),
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    def create_refresh_token(self, user: User) -> str:
        payload = {
            "sub": str(user.id),
            "type": "refresh",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    async def verify_token(self, token: str) -> User | None:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            user_id = payload.get("sub")
            if not user_id:
                return None
            result = await self.db.execute(select(User).where(User.id == user_id))
            return result.scalar_one_or_none()
        except JWTError:
            return None

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        result = await self.db.execute(select(User).offset(skip).limit(limit))
        return list(result.scalars().all())

    def generate_mfa_secret(self, user: User) -> str:
        secret = pyotp.random_base32()
        user.mfa_secret = secret
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name=settings.app_name)
        return provisioning_uri

    async def enable_mfa(self, user: User, code: str) -> bool:
        if not user.mfa_secret:
            return False
        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(code):
            user.mfa_enabled = True
            await self.db.flush()
            return True
        return False

    async def disable_mfa(self, user: User) -> None:
        user.mfa_secret = None
        user.mfa_enabled = False
        await self.db.flush()

    @staticmethod
    def verify_mfa(user: User, code: str) -> bool:
        if not user.mfa_secret:
            return False
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(code)
