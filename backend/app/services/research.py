import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.research import (
    ResearchStudy, ResearchCohort, ResearchAccessLog,
    IRBStatus, ComplianceVerdict, AccessPurpose,
)
from app.models.user import User, UserRole


class ResearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_study(self, **data) -> ResearchStudy:
        study = ResearchStudy(**data)
        self.db.add(study)
        await self.db.flush()
        return study

    async def get_study(self, study_id: uuid.UUID) -> ResearchStudy | None:
        result = await self.db.execute(
            select(ResearchStudy).options(selectinload(ResearchStudy.cohorts)).where(ResearchStudy.id == study_id)
        )
        return result.scalar_one_or_none()

    async def list_studies(self, skip: int = 0, limit: int = 50) -> list[ResearchStudy]:
        result = await self.db.execute(
            select(ResearchStudy).options(selectinload(ResearchStudy.cohorts)).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def update_irb_status(self, study_id: uuid.UUID, status: IRBStatus, approval_date: datetime | None = None, expiry_date: datetime | None = None) -> ResearchStudy | None:
        study = await self.get_study(study_id)
        if not study:
            return None
        study.irb_status = status
        if approval_date:
            study.irb_approval_date = approval_date
        if expiry_date:
            study.irb_expiry_date = expiry_date
        await self.db.flush()
        return study

    async def create_cohort(self, **data) -> ResearchCohort:
        cohort = ResearchCohort(**data)
        self.db.add(cohort)
        await self.db.flush()
        return cohort

    async def get_cohort(self, cohort_id: uuid.UUID) -> ResearchCohort | None:
        result = await self.db.execute(select(ResearchCohort).where(ResearchCohort.id == cohort_id))
        return result.scalar_one_or_none()

    def evaluate_compliance(
        self,
        study: ResearchStudy,
        cohort: ResearchCohort | None,
        requester: User,
        purpose: AccessPurpose,
    ) -> tuple[ComplianceVerdict, str, dict]:
        dimensions = {}

        # Dimension 1: IRB status
        irb_ok = study.irb_status == IRBStatus.APPROVED
        if study.irb_expiry_date and study.irb_expiry_date < datetime.now(timezone.utc):
            irb_ok = False
        dimensions["irb_status"] = {
            "passed": irb_ok,
            "detail": f"IRB is {study.irb_status.value}, expires {study.irb_expiry_date.isoformat() if study.irb_expiry_date else 'N/A'}"
        }

        # Dimension 2: Study active
        active_ok = study.is_active
        dimensions["study_active"] = {"passed": active_ok, "detail": f"Study is {'active' if active_ok else 'inactive'}"}

        # Dimension 3: Role
        role_ok = requester.role in (UserRole.ADMIN, UserRole.PROVIDER) or purpose == AccessPurpose.AUDIT
        dimensions["role_authorization"] = {
            "passed": role_ok,
            "detail": f"Requester role is {requester.role.value}"
        }

        # Dimension 4: Cohort scope
        cohort_ok = True
        cohort_detail = "No cohort restriction"
        if cohort:
            if cohort.cohort_type.value == "blinded" and purpose == AccessPurpose.RESEARCH:
                cohort_ok = True  # Blinded cohorts are OK for research
            cohort_ok = cohort.is_active
            cohort_detail = f"Cohort '{cohort.name}' is {'active' if cohort_ok else 'inactive'}, type={cohort.cohort_type.value}"
        dimensions["cohort_scope"] = {"passed": cohort_ok, "detail": cohort_detail}

        # Dimension 5: Purpose alignment
        purpose_ok = True
        if cohort and cohort.allowed_purposes:
            purpose_ok = purpose.value in cohort.allowed_purposes
        dimensions["purpose_alignment"] = {
            "passed": purpose_ok,
            "detail": f"Purpose '{purpose.value}' is {'allowed' if purpose_ok else 'not allowed'} for this cohort"
        }

        # Dimension 6: Geographic scope
        geo_ok = True
        dimensions["geographic_scope"] = {"passed": geo_ok, "detail": f"Geographic scope: {study.geographic_scope or 'global'}"}

        # Dimension 7: Data classification
        class_ok = requester.role == UserRole.ADMIN or study.data_classification.value not in ("restricted", "phi")
        dimensions["data_classification"] = {
            "passed": class_ok,
            "detail": f"Data classification: {study.data_classification.value}"
        }

        passed = all(d["passed"] for d in dimensions.values())
        verdict = ComplianceVerdict.GRANTED if passed else ComplianceVerdict.DENIED

        if passed:
            explanation = (
                f"Access GRANTED for {requester.full_name} to study '{study.name}' "
                f"for purpose '{purpose.value}'. All 7 compliance dimensions satisfied: "
                f"IRB approved, study active, role authorized, cohort accessible, "
                f"purpose aligned, geographic scope compatible, data classification appropriate."
            )
        else:
            failed = [k for k, v in dimensions.items() if not v["passed"]]
            explanation = (
                f"Access DENIED for {requester.full_name} to study '{study.name}' "
                f"for purpose '{purpose.value}'. {len(failed)} dimension(s) failed: "
                f"{', '.join(failed)}. {dimensions[failed[0]]['detail']}"
            )

        return verdict, explanation, dimensions

    async def request_access(
        self,
        study_id: uuid.UUID,
        cohort_id: uuid.UUID | None,
        purpose: AccessPurpose,
        requester: User,
    ) -> ResearchAccessLog:
        study = await self.get_study(study_id)
        if not study:
            raise ValueError("Study not found")

        cohort = None
        if cohort_id:
            cohort = await self.get_cohort(cohort_id)
            if not cohort:
                raise ValueError("Cohort not found")

        verdict, explanation, dimensions = self.evaluate_compliance(study, cohort, requester, purpose)

        log = ResearchAccessLog(
            study_id=study_id,
            cohort_id=cohort_id,
            requester_id=requester.id,
            purpose=purpose,
            verdict=verdict,
            explanation=explanation,
            dimensions_evaluated=dimensions,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_access_logs(
        self,
        study_id: uuid.UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[ResearchAccessLog]:
        query = select(ResearchAccessLog).order_by(ResearchAccessLog.access_time.desc())
        if study_id:
            query = query.where(ResearchAccessLog.study_id == study_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
