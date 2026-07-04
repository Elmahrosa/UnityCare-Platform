import uuid
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.research import (
    ResearchStudy, ResearchCohort, ResearchAccessLog,
    IRBStatus, DataClassification, CohortType, AccessPurpose, ComplianceVerdict,
)
from app.services.auth import AuthService
from app.services.research import ResearchService


def make_study_data(**overrides) -> dict:
    data = {
        "name": "Test Study",
        "description": "A test research study",
        "irb_status": "approved",
        "data_classification": "confidential",
        "geographic_scope": "US",
        "principal_investigator": "Dr. Smith",
        "institution": "Test University",
    }
    data.update(overrides)
    return data


def make_cohort_data(study_id: uuid.UUID, **overrides) -> dict:
    data = {
        "study_id": str(study_id),
        "name": "Test Cohort",
        "cohort_type": "open",
        "description": "A test cohort",
        "member_count": 100,
        "allowed_purposes": ["research", "quality_assurance"],
    }
    data.update(overrides)
    return data


class TestResearchStudies:
    async def test_create_study(self, client: AsyncClient, db_session: AsyncSession,
                                test_admin: User, admin_headers: dict):
        resp = await client.post(
            "/api/v1/research/studies",
            json=make_study_data(),
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Test Study"
        assert data["irb_status"] == "approved"
        assert "id" in data

    async def test_create_study_requires_admin_or_provider(self, client: AsyncClient,
                                                          auth_headers: dict):
        resp = await client.post(
            "/api/v1/research/studies",
            json=make_study_data(),
            headers=auth_headers,
        )
        assert resp.status_code == 403

    async def test_list_studies(self, client: AsyncClient, db_session: AsyncSession,
                                test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        await service.create_study(**make_study_data(name="Study 1"))
        await service.create_study(**make_study_data(name="Study 2"))
        resp = await client.get("/api/v1/research/studies", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 2

    async def test_patient_can_list_studies(self, client: AsyncClient, db_session: AsyncSession,
                                            test_user: User, auth_headers: dict):
        service = ResearchService(db_session)
        await service.create_study(**make_study_data(name="Public Study"))
        resp = await client.get("/api/v1/research/studies", headers=auth_headers)
        assert resp.status_code == 200

    async def test_get_study_by_id(self, client: AsyncClient, db_session: AsyncSession,
                                   test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data())
        resp = await client.get(f"/api/v1/research/studies/{study.id}", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == str(study.id)

    async def test_get_nonexistent_study_returns_404(self, client: AsyncClient, admin_headers: dict):
        fake_id = uuid.uuid4()
        resp = await client.get(f"/api/v1/research/studies/{fake_id}", headers=admin_headers)
        assert resp.status_code == 404


class TestResearchCohorts:
    async def test_create_cohort(self, client: AsyncClient, db_session: AsyncSession,
                                 test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data())
        resp = await client.post(
            "/api/v1/research/cohorts",
            json=make_cohort_data(study.id),
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Test Cohort"
        assert data["cohort_type"] == "open"

    async def test_create_cohort_requires_admin_or_provider(self, client: AsyncClient,
                                                            auth_headers: dict):
        resp = await client.post(
            "/api/v1/research/cohorts",
            json=make_cohort_data(uuid.uuid4()),
            headers=auth_headers,
        )
        assert resp.status_code == 403

    async def test_study_includes_cohorts(self, client: AsyncClient, db_session: AsyncSession,
                                         test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data())
        cohort = await service.create_cohort(**make_cohort_data(study.id))
        resp = await client.get(f"/api/v1/research/studies/{study.id}", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["cohorts"]) >= 1
        assert data["cohorts"][0]["name"] == cohort.name


class TestResearchIRB:
    async def test_update_irb_status(self, client: AsyncClient, db_session: AsyncSession,
                                     test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data(irb_status="pending"))
        resp = await client.patch(
            f"/api/v1/research/studies/{study.id}/irb?status=approved",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["irb_status"] == "approved"

    async def test_update_irb_requires_admin(self, client: AsyncClient, db_session: AsyncSession,
                                             test_provider: User, provider_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data())
        resp = await client.patch(
            f"/api/v1/research/studies/{study.id}/irb?status=expired",
            headers=provider_headers,
        )
        assert resp.status_code == 403

    async def test_update_nonexistent_study_irb_returns_404(self, client: AsyncClient,
                                                            admin_headers: dict):
        fake_id = uuid.uuid4()
        resp = await client.patch(
            f"/api/v1/research/studies/{fake_id}/irb?status=approved",
            headers=admin_headers,
        )
        assert resp.status_code == 404


class TestResearchAccess:
    async def test_access_granted_for_valid_request(self, client: AsyncClient,
                                                    db_session: AsyncSession,
                                                    test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data(irb_status="approved"))
        cohort = await service.create_cohort(**make_cohort_data(study.id))
        resp = await client.post(
            "/api/v1/research/access",
            json={
                "study_id": str(study.id),
                "cohort_id": str(cohort.id),
                "purpose": "research",
            },
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "granted"

    async def test_access_denied_for_expired_irb(self, client: AsyncClient,
                                                 db_session: AsyncSession,
                                                 test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data(
            irb_status="approved",
            irb_expiry_date=(datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        ))
        cohort = await service.create_cohort(**make_cohort_data(study.id))
        resp = await client.post(
            "/api/v1/research/access",
            json={
                "study_id": str(study.id),
                "cohort_id": str(cohort.id),
                "purpose": "research",
            },
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "denied"

    async def test_access_denied_for_inactive_study(self, client: AsyncClient,
                                                    db_session: AsyncSession,
                                                    test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data(irb_status="approved"))
        study.is_active = False
        await db_session.flush()
        resp = await client.post(
            "/api/v1/research/access",
            json={
                "study_id": str(study.id),
                "purpose": "research",
            },
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "denied"

    async def test_nonexistent_study_returns_404(self, client: AsyncClient,
                                                 admin_headers: dict):
        fake_id = uuid.uuid4()
        resp = await client.post(
            "/api/v1/research/access",
            json={
                "study_id": str(fake_id),
                "purpose": "research",
            },
            headers=admin_headers,
        )
        assert resp.status_code == 404


class TestResearchAccessLogs:
    async def test_access_logs_listed(self, client: AsyncClient, db_session: AsyncSession,
                                      test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study = await service.create_study(**make_study_data(irb_status="approved"))
        await service.request_access(
            study_id=study.id, cohort_id=None,
            purpose=AccessPurpose.RESEARCH, requester=test_admin,
        )
        resp = await client.get("/api/v1/research/access-logs", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1

    async def test_access_logs_filtered_by_study(self, client: AsyncClient,
                                                 db_session: AsyncSession,
                                                 test_admin: User, admin_headers: dict):
        service = ResearchService(db_session)
        study_a = await service.create_study(**make_study_data(name="Study A", irb_status="approved"))
        study_b = await service.create_study(**make_study_data(name="Study B", irb_status="approved"))
        await service.request_access(study_a.id, None, AccessPurpose.RESEARCH, test_admin)
        await service.request_access(study_b.id, None, AccessPurpose.RESEARCH, test_admin)
        resp = await client.get(f"/api/v1/research/access-logs?study_id={study_a.id}",
                                headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert all(log["study_id"] == str(study_a.id) for log in data)

    async def test_access_logs_requires_admin_or_auditor(self, client: AsyncClient,
                                                        auth_headers: dict):
        resp = await client.get("/api/v1/research/access-logs", headers=auth_headers)
        assert resp.status_code == 403


class TestResearchComplianceEvaluation:
    async def test_evaluate_compliance_all_pass(self, db_session: AsyncSession,
                                                test_admin: User):
        service = ResearchService(db_session)
        study = ResearchStudy(
            name="Compliant Study", irb_status=IRBStatus.APPROVED,
            data_classification=DataClassification.CONFIDENTIAL,
            principal_investigator="Dr. X", institution="U",
        )
        db_session.add(study)
        await db_session.flush()
        cohort = ResearchCohort(
            study_id=study.id, name="Open Cohort",
            cohort_type=CohortType.OPEN, is_active=True,
            allowed_purposes=["research"],
        )
        db_session.add(cohort)
        await db_session.flush()
        verdict, explanation, dims = service.evaluate_compliance(
            study, cohort, test_admin, AccessPurpose.RESEARCH,
        )
        assert verdict == ComplianceVerdict.GRANTED
        assert all(v["passed"] for v in dims.values())

    async def test_evaluate_compliance_irb_fail(self, db_session: AsyncSession,
                                                test_provider: User):
        service = ResearchService(db_session)
        study = ResearchStudy(
            name="Expired IRB Study", irb_status=IRBStatus.EXPIRED,
            data_classification=DataClassification.CONFIDENTIAL,
            principal_investigator="Dr. X", institution="U",
        )
        db_session.add(study)
        await db_session.flush()
        cohort = ResearchCohort(
            study_id=study.id, name="Cohort",
            cohort_type=CohortType.OPEN, is_active=True,
        )
        db_session.add(cohort)
        await db_session.flush()
        verdict, explanation, dims = service.evaluate_compliance(
            study, cohort, test_provider, AccessPurpose.RESEARCH,
        )
        assert verdict == ComplianceVerdict.DENIED
        assert not dims["irb_status"]["passed"]
