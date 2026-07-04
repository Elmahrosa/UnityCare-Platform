import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.services.auth import AuthService
from app.utils.security import hash_password


class TestAdminUsersMe:
    async def test_get_current_user(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/admin/users/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "patient@test.com"
        assert data["role"] == "patient"
        assert "mfa_enabled" in data

    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        resp = await client.get("/api/v1/admin/users/me", headers={"Authorization": "Bearer bad-token"})
        assert resp.status_code == 401


class TestAdminListUsers:
    async def test_admin_can_list_users(self, client: AsyncClient, db_session: AsyncSession,
                                        test_admin: User, admin_headers: dict):
        resp = await client.get("/api/v1/admin/users", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert any(u["email"] == "admin@test.com" for u in data)

    async def test_non_admin_cannot_list_users(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/admin/users", headers=auth_headers)
        assert resp.status_code == 403

    async def test_provider_cannot_list_users(self, client: AsyncClient, provider_headers: dict):
        resp = await client.get("/api/v1/admin/users", headers=provider_headers)
        assert resp.status_code == 403


class TestAdminGetUser:
    async def test_admin_can_get_user_by_id(self, client: AsyncClient, db_session: AsyncSession,
                                            test_user: User, test_admin: User, admin_headers: dict):
        resp = await client.get(f"/api/v1/admin/users/{test_user.id}", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "patient@test.com"

    async def test_auditor_can_get_user_by_id(self, client: AsyncClient, db_session: AsyncSession,
                                              test_user: User):
        auditor = User(
            id=uuid.uuid4(), email="auditor@test.com",
            password_hash=hash_password("TestPass123!"),
            full_name="Test Auditor", role=UserRole.AUDITOR, locale="en",
        )
        db_session.add(auditor)
        await db_session.flush()
        auth = AuthService(db_session)
        token = auth.create_access_token(auditor)
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.get(f"/api/v1/admin/users/{test_user.id}", headers=headers)
        assert resp.status_code == 200

    async def test_patient_cannot_get_user_by_id(self, client: AsyncClient, db_session: AsyncSession,
                                                 test_user: User, test_admin: User, auth_headers: dict):
        resp = await client.get(f"/api/v1/admin/users/{test_admin.id}", headers=auth_headers)
        assert resp.status_code == 403


class TestAdminUpdateUser:
    async def test_admin_can_update_user(self, client: AsyncClient, db_session: AsyncSession,
                                         test_user: User, admin_headers: dict):
        resp = await client.patch(
            f"/api/v1/admin/users/{test_user.id}",
            json={"full_name": "Updated Name"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "Updated Name"

    async def test_non_admin_cannot_update_user(self, client: AsyncClient, db_session: AsyncSession,
                                                test_user: User, auth_headers: dict):
        resp = await client.patch(
            f"/api/v1/admin/users/{test_user.id}",
            json={"full_name": "Hacked Name"},
            headers=auth_headers,
        )
        assert resp.status_code == 403

    async def test_update_nonexistent_user_returns_404(self, client: AsyncClient, admin_headers: dict):
        fake_id = uuid.uuid4()
        resp = await client.patch(
            f"/api/v1/admin/users/{fake_id}",
            json={"full_name": "Ghost"},
            headers=admin_headers,
        )
        assert resp.status_code == 404
