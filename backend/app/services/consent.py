import uuid
from datetime import datetime, timezone
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.consent import Consent, ConsentVersion, ConsentPurpose, ConsentStatus
from app.utils.hashing import compute_consent_hash
from app.services.audit import AuditService


class ConsentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)

    async def create_consent(
        self,
        patient_id: uuid.UUID,
        purpose: ConsentPurpose,
        jurisdiction: str = "US",
        expires_at: datetime | None = None,
        consent_data: dict | None = None,
        granted_by: uuid.UUID | None = None,
    ) -> Consent:
        consent = Consent(
            patient_id=patient_id,
            purpose=purpose,
            jurisdiction=jurisdiction,
            expires_at=expires_at,
            consent_data=consent_data or {},
            granted_by=granted_by,
        )
        consent.signature_hash = compute_consent_hash(consent_data or {})
        self.db.add(consent)
        await self.db.flush()

        version = ConsentVersion(
            consent_id=consent.id,
            version=1,
            status=ConsentStatus.ACTIVE,
            snapshot={
                "purpose": purpose.value,
                "jurisdiction": jurisdiction,
                "data": consent_data,
                "expires_at": expires_at.isoformat() if expires_at else None,
            },
            changed_by=granted_by,
        )
        self.db.add(version)
        await self.db.flush()

        await self.audit.log_event(
            action="consent.created",
            resource_type="consent",
            resource_id=str(consent.id),
            actor_id=granted_by or patient_id,
        )
        return consent

    async def get_consent(self, consent_id: uuid.UUID) -> Consent | None:
        result = await self.db.execute(select(Consent).where(Consent.id == consent_id))
        return result.scalar_one_or_none()

    async def get_patient_consents(self, patient_id: uuid.UUID) -> list[Consent]:
        result = await self.db.execute(
            select(Consent).where(Consent.patient_id == patient_id).order_by(desc(Consent.created_at))
        )
        return list(result.scalars().all())

    async def revoke_consent(self, consent_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> Consent | None:
        consent = await self.get_consent(consent_id)
        if not consent or consent.status == ConsentStatus.REVOKED:
            return None
        old_status = consent.status
        consent.status = ConsentStatus.REVOKED
        consent.version += 1
        await self.db.flush()

        version = ConsentVersion(
            consent_id=consent.id,
            version=consent.version,
            status=ConsentStatus.REVOKED,
            snapshot={
                "purpose": consent.purpose.value,
                "jurisdiction": consent.jurisdiction,
                "previous_status": old_status.value,
                "revoked_at": datetime.now(timezone.utc).isoformat(),
            },
            changed_by=actor_id,
        )
        self.db.add(version)
        await self.db.flush()

        await self.audit.log_event(
            action="consent.revoked",
            resource_type="consent",
            resource_id=str(consent_id),
            actor_id=actor_id,
        )
        return consent

    async def get_consent_versions(self, consent_id: uuid.UUID) -> list[ConsentVersion]:
        result = await self.db.execute(
            select(ConsentVersion).where(ConsentVersion.consent_id == consent_id).order_by(desc(ConsentVersion.version))
        )
        return list(result.scalars().all())
