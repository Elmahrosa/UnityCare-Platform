import uuid
from datetime import datetime, timezone, timedelta
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.consent import Consent, ConsentVersion, ConsentPurpose, ConsentStatus
from app.models.user import User
from app.services.consent import ConsentService


class TestConsentAPI:
    async def test_create_consent(self, client: AsyncClient, db_session: AsyncSession,
                                   test_patient, test_user: User, provider_headers: dict):
        payload = {
            "patient_id": str(test_user.id),
            "purpose": "treatment",
            "jurisdiction": "US",
        }
        resp = await client.post("/api/v1/consent", json=payload, headers=provider_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["purpose"] == "treatment"
        assert data["status"] == "active"
        assert data["patient_id"] == str(test_user.id)
        assert data["version"] == 1
        assert data["signature_hash"] is not None

    async def test_get_consent(self, client: AsyncClient, db_session: AsyncSession,
                                test_user: User, provider_headers: dict):
        service = ConsentService(db_session)
        consent = await service.create_consent(
            patient_id=test_user.id,
            purpose=ConsentPurpose.TREATMENT,
        )
        resp = await client.get(f"/api/v1/consent/{consent.id}", headers=provider_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(consent.id)

    async def test_get_patient_consents(self, client: AsyncClient, db_session: AsyncSession,
                                         test_user: User, provider_headers: dict):
        service = ConsentService(db_session)
        await service.create_consent(patient_id=test_user.id, purpose=ConsentPurpose.TREATMENT)
        await service.create_consent(patient_id=test_user.id, purpose=ConsentPurpose.RESEARCH)
        resp = await client.get(f"/api/v1/consent/patient/{test_user.id}", headers=provider_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    async def test_revoke_consent(self, client: AsyncClient, db_session: AsyncSession,
                                   test_user: User, provider_headers: dict):
        service = ConsentService(db_session)
        consent = await service.create_consent(
            patient_id=test_user.id,
            purpose=ConsentPurpose.TREATMENT,
        )
        resp = await client.post(f"/api/v1/consent/{consent.id}/revoke", headers=provider_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "revoked"
        assert data["version"] == 2

    async def test_revoke_already_revoked(self, client: AsyncClient, db_session: AsyncSession,
                                           test_user: User, provider_headers: dict):
        service = ConsentService(db_session)
        consent = await service.create_consent(
            patient_id=test_user.id,
            purpose=ConsentPurpose.TREATMENT,
        )
        await service.revoke_consent(consent.id)
        resp = await client.post(f"/api/v1/consent/{consent.id}/revoke", headers=provider_headers)
        assert resp.status_code == 404

    async def test_consent_versions_tracked(self, client: AsyncClient, db_session: AsyncSession,
                                             test_user: User, admin_headers: dict):
        service = ConsentService(db_session)
        consent = await service.create_consent(
            patient_id=test_user.id,
            purpose=ConsentPurpose.TREATMENT,
        )
        await service.revoke_consent(consent.id)
        resp = await client.get(f"/api/v1/consent/{consent.id}/versions", headers=admin_headers)
        assert resp.status_code == 200
        versions = resp.json()
        assert len(versions) == 2
        assert versions[0]["version"] == 2
        assert versions[1]["version"] == 1

    async def test_create_consent_requires_auth(self, client: AsyncClient, db_session: AsyncSession,
                                                 test_user: User):
        payload = {
            "patient_id": str(test_user.id),
            "purpose": "treatment",
        }
        resp = await client.post("/api/v1/consent", json=payload)
        assert resp.status_code == 403

    async def test_patient_cannot_create_consent_for_another_patient(
        self, client: AsyncClient, db_session: AsyncSession,
        test_user: User, test_other_user: User, test_patient, auth_headers: dict,
    ):
        payload = {
            "patient_id": str(test_other_user.id),
            "purpose": "treatment",
        }
        resp = await client.post("/api/v1/consent", json=payload, headers=auth_headers)
        assert resp.status_code == 403
        assert "Cannot create consent for another patient" in resp.json()["detail"]
