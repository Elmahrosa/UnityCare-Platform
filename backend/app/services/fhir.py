import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.patient import Patient


class FHIRService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_patient(self, fhir_resource: dict) -> Patient:
        fhir_id = fhir_resource.get("id", str(uuid.uuid4()))
        patient = Patient(fhir_id=fhir_id, fhir_resource=fhir_resource)
        self.db.add(patient)
        await self.db.flush()
        return patient

    async def get_patient(self, fhir_id: str) -> Patient | None:
        result = await self.db.execute(select(Patient).where(Patient.fhir_id == fhir_id, Patient.is_active == True))
        return result.scalar_one_or_none()

    async def get_patient_by_uuid(self, patient_id: uuid.UUID) -> Patient | None:
        result = await self.db.execute(select(Patient).where(Patient.id == patient_id, Patient.is_active == True))
        return result.scalar_one_or_none()

    async def update_patient(self, fhir_id: str, fhir_resource: dict) -> Patient | None:
        patient = await self.get_patient(fhir_id)
        if not patient:
            return None
        patient.fhir_resource = fhir_resource
        patient.version_id += 1
        await self.db.flush()
        return patient

    async def delete_patient(self, fhir_id: str) -> bool:
        patient = await self.get_patient(fhir_id)
        if not patient:
            return False
        patient.is_active = False
        await self.db.flush()
        return True

    async def search_patients(self, skip: int = 0, limit: int = 20, user_id: uuid.UUID | None = None) -> list[Patient]:
        query = select(Patient).where(Patient.is_active == True)
        if user_id:
            query = query.where(Patient.user_id == user_id)
        result = await self.db.execute(query.offset(skip).limit(limit))
        return list(result.scalars().all())
