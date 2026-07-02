"""Set test environment variables FIRST, before any app imports."""
import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["JWT_SECRET"] = "test-secret-key-for-testing-purposes-only"
os.environ["ENCRYPTION_KEY"] = "test-encryption-key-for-testing-32bytes!"
os.environ["REDIS_URL"] = ""
os.environ["RATE_LIMIT_PER_MINUTE"] = "10000"

import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.consent import Consent, ConsentPurpose, ConsentStatus, ConsentVersion
from app.models.audit import AuditEvent
from app.models.medical import VitalSigns, Appointment, MedicalRecord, IcdCode, AppointmentStatus
from app.utils.security import hash_password
from app.services.auth import AuthService

from app.middleware.rate_limit import RateLimitMiddleware

# Remove rate limiting middleware for tests
app.user_middleware = [m for m in app.user_middleware if m.cls != RateLimitMiddleware]
app.middleware_stack = app.build_middleware_stack()

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)()
    try:
        yield session
    finally:
        await session.rollback()
        await session.close()


@pytest_asyncio.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="patient@test.com",
        password_hash=hash_password("TestPass123!"),
        full_name="Test Patient",
        role=UserRole.PATIENT,
        locale="en",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def test_provider(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="provider@test.com",
        password_hash=hash_password("TestPass123!"),
        full_name="Test Provider",
        role=UserRole.PROVIDER,
        locale="en",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def test_admin(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        password_hash=hash_password("TestPass123!"),
        full_name="Test Admin",
        role=UserRole.ADMIN,
        locale="en",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def test_other_user(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="other@test.com",
        password_hash=hash_password("TestPass123!"),
        full_name="Other User",
        role=UserRole.PATIENT,
        locale="en",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def test_patient(db_session, test_user) -> Patient:
    patient = Patient(
        id=uuid.uuid4(),
        fhir_id=str(uuid.uuid4()),
        user_id=test_user.id,
        fhir_resource={
            "resourceType": "Patient",
            "id": str(uuid.uuid4()),
            "name": [{"family": "Test", "given": ["Patient"]}],
        },
    )
    db_session.add(patient)
    await db_session.flush()
    return patient


@pytest_asyncio.fixture
async def auth_headers(test_user, db_session) -> dict:
    auth = AuthService(db_session)
    token = auth.create_access_token(test_user)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_headers(test_admin, db_session) -> dict:
    auth = AuthService(db_session)
    token = auth.create_access_token(test_admin)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def provider_headers(test_provider, db_session) -> dict:
    auth = AuthService(db_session)
    token = auth.create_access_token(test_provider)
    return {"Authorization": f"Bearer {token}"}
