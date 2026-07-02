import uuid
from datetime import datetime, timezone
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.access_control import get_patient_scope
from app.middleware.auth import get_current_user, require_role
from app.models.user import User, UserRole


class TestSecurityHeaders:
    async def test_security_headers_present(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-XSS-Protection") == "0"
        assert resp.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"
        assert resp.headers.get("Cache-Control") == "no-store"
        assert resp.headers.get("Content-Security-Policy") == "default-src 'self'"
        assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert resp.headers.get("Permissions-Policy") is not None


class TestRateLimit:
    async def test_rate_limit_exceeded(self):
        test_app = FastAPI()

        @test_app.get("/ratelimit-test")
        async def endpoint():
            return {"ok": True}

        test_app.add_middleware(
            RateLimitMiddleware,
            max_requests=5,
            window_seconds=60,
            redis_url=None,
        )

        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            for _ in range(5):
                resp = await ac.get("/ratelimit-test")
                assert resp.status_code == 200

            resp = await ac.get("/ratelimit-test")
            assert resp.status_code == 429
            assert "Rate limit exceeded" in resp.json()["detail"]

    async def test_health_skip_rate_limit(self):
        test_app = FastAPI()

        @test_app.get("/health")
        async def health():
            return {"status": "healthy"}

        test_app.add_middleware(
            RateLimitMiddleware,
            max_requests=0,
            window_seconds=60,
            redis_url=None,
        )

        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/health")
            assert resp.status_code == 200


class TestAccessControl:
    async def test_patient_scope_restricts_access(self, client: AsyncClient, db_session,
                                                   test_user: User, test_patient,
                                                   test_provider: User, auth_headers: dict):
        resp = await client.get(f"/api/v1/iot/{test_provider.id}/vitals", headers=auth_headers)
        assert resp.status_code == 403
        assert "Access denied" in resp.json()["detail"]

    async def test_admin_unrestricted_access(self, client: AsyncClient, db_session,
                                             test_provider: User, admin_headers: dict):
        resp = await client.get(f"/api/v1/iot/{test_provider.id}/vitals", headers=admin_headers)
        assert resp.status_code == 200

    async def test_patient_cannot_access_other_appointment(self, client: AsyncClient,
                                                            db_session, test_user: User,
                                                            test_provider: User, test_patient,
                                                            test_other_user: User, auth_headers: dict):
        from app.services.medical import MedicalService
        service = MedicalService(db_session)
        apt = await service.create_appointment(
            patient_id=test_other_user.id,
            doctor_id=test_provider.id,
            scheduled_at=datetime.now(timezone.utc),
        )
        resp = await client.get(f"/api/v1/appointments/{apt.id}", headers=auth_headers)
        assert resp.status_code == 403
        assert "Access denied" in resp.json()["detail"]

    async def test_admin_can_access_any_appointment(self, client: AsyncClient, db_session,
                                                    test_user: User, test_provider: User,
                                                    admin_headers: dict):
        from app.services.medical import MedicalService
        service = MedicalService(db_session)
        apt = await service.create_appointment(
            patient_id=test_user.id,
            doctor_id=test_provider.id,
            scheduled_at=datetime.now(timezone.utc),
        )
        resp = await client.get(f"/api/v1/appointments/{apt.id}", headers=admin_headers)
        assert resp.status_code == 200
