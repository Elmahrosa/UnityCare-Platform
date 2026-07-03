import uuid
from datetime import datetime, timezone, timedelta
from jose import jwt
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.user import User, UserRole
from app.services.auth import AuthService


class TestAuthRegister:
    async def test_register_user(self, client: AsyncClient):
        payload = {
            "email": "newuser@test.com",
            "password": "StrongPass1!",
            "full_name": "New User",
            "role": "patient",
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newuser@test.com"
        assert data["full_name"] == "New User"
        assert data["role"] == "patient"
        assert "id" in data

    async def test_register_duplicate_email(self, client: AsyncClient, db_session: AsyncSession):
        auth = AuthService(db_session)
        await auth.register("dup@test.com", "StrongPass1!", "Dup User")
        payload = {
            "email": "dup@test.com",
            "password": "StrongPass1!",
            "full_name": "Duplicate",
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 409
        assert "already registered" in resp.json()["detail"].lower()


class TestAuthLogin:
    async def test_login_success(self, client: AsyncClient, db_session: AsyncSession):
        auth = AuthService(db_session)
        user = await auth.register("login@test.com", "TestPass123!", "Login User")
        payload = {"email": "login@test.com", "password": "TestPass123!"}
        resp = await client.post("/api/v1/auth/login", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] == 900

    async def test_login_invalid_password(self, client: AsyncClient, db_session: AsyncSession):
        auth = AuthService(db_session)
        await auth.register("badpwd@test.com", "TestPass123!", "Bad Pwd")
        payload = {"email": "badpwd@test.com", "password": "WrongPassword1!"}
        resp = await client.post("/api/v1/auth/login", json=payload)
        assert resp.status_code == 401

    async def test_account_lockout_after_5_failures(self, db_session: AsyncSession, test_user: User):
        auth = AuthService(db_session)
        for i in range(5):
            user = await auth.authenticate(test_user.email, "WrongPassword1!")
            assert user is None
        await db_session.refresh(test_user)
        assert test_user.failed_login_attempts == 5
        assert test_user.locked_until is not None


class TestAuthTokens:
    async def test_create_access_token_valid(self, db_session: AsyncSession, test_user: User):
        auth = AuthService(db_session)
        token = auth.create_access_token(test_user)
        assert isinstance(token, str)
        assert len(token) > 20

    async def test_verify_token_valid(self, db_session: AsyncSession, test_user: User):
        auth = AuthService(db_session)
        token = auth.create_access_token(test_user)
        verified = await auth.verify_token(token)
        assert verified is not None
        assert verified.id == test_user.id

    async def test_verify_token_expired(self, db_session: AsyncSession, test_user: User):
        auth = AuthService(db_session)
        expired_payload = {
            "sub": str(test_user.id),
            "email": test_user.email,
            "role": test_user.role.value,
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired_token = jwt.encode(expired_payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        verified = await auth.verify_token(expired_token)
        assert verified is None

    async def test_get_current_user_valid(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/admin/users/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "patient@test.com"

    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        headers = {"Authorization": "Bearer invalid-token"}
        resp = await client.get("/api/v1/admin/users/me", headers=headers)
        assert resp.status_code == 401

    async def test_login_while_locked(self, db_session: AsyncSession, test_user: User):
        auth = AuthService(db_session)
        test_user.locked_until = datetime.now(timezone.utc) + timedelta(hours=1)
        await db_session.flush()
        user = await auth.authenticate(test_user.email, "TestPass123!")
        assert user is None
        await db_session.refresh(test_user)
        assert test_user.failed_login_attempts == 0

    async def test_refresh_token_rejected_as_access(self, db_session: AsyncSession, test_user: User):
        auth = AuthService(db_session)
        refresh_token = auth.create_refresh_token(test_user)
        user = await auth.verify_token(refresh_token)
        assert user is None

    async def test_invalid_uuid_in_jwt_subject(self, db_session: AsyncSession, test_user: User):
        auth = AuthService(db_session)
        token = auth.create_access_token(test_user)
        from jose import jwt
        from app.config import settings
        bad_payload = {
            "sub": "not-a-uuid-at-all",
            "type": "access",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        }
        bad_token = jwt.encode(bad_payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        user = await auth.verify_token(bad_token)
        assert user is None

    async def test_valid_uuid_uuid_conversion(self, db_session: AsyncSession, test_user: User):
        auth = AuthService(db_session)
        user = await auth.verify_token(auth.create_access_token(test_user))
        assert user is not None
        assert user.id == test_user.id
