import uuid
from sqlalchemy import select, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.medical import VitalSigns, Appointment, MedicalRecord, IcdCode


class MedicalService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # -- Vitals ----------------------------------------------------------

    async def create_vitals(self, user_id: uuid.UUID, **kwargs) -> VitalSigns:
        record = VitalSigns(user_id=user_id, **kwargs)
        self.db.add(record)
        await self.db.flush()
        return record

    async def get_latest_vitals(self, user_id: uuid.UUID) -> VitalSigns | None:
        result = await self.db.execute(
            select(VitalSigns)
            .where(VitalSigns.user_id == user_id)
            .order_by(desc(VitalSigns.recorded_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_vitals_history(self, user_id: uuid.UUID, limit: int = 20) -> list[VitalSigns]:
        result = await self.db.execute(
            select(VitalSigns)
            .where(VitalSigns.user_id == user_id)
            .order_by(desc(VitalSigns.recorded_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    # -- Appointments ----------------------------------------------------

    async def create_appointment(self, **kwargs) -> Appointment:
        apt = Appointment(**kwargs)
        self.db.add(apt)
        await self.db.flush()
        return apt

    async def get_appointment(self, appointment_id: uuid.UUID) -> Appointment | None:
        result = await self.db.execute(select(Appointment).where(Appointment.id == appointment_id))
        return result.scalar_one_or_none()

    async def update_appointment(self, appointment_id: uuid.UUID, **kwargs) -> Appointment | None:
        apt = await self.get_appointment(appointment_id)
        if not apt:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(apt, key, value)
        await self.db.flush()
        return apt

    async def get_appointments_by_doctor(
        self, doctor_id: uuid.UUID, skip: int = 0, limit: int = 50
    ) -> list[Appointment]:
        result = await self.db.execute(
            select(Appointment)
            .where(Appointment.doctor_id == doctor_id)
            .order_by(desc(Appointment.scheduled_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_appointments_by_patient(
        self, patient_id: uuid.UUID, skip: int = 0, limit: int = 50
    ) -> list[Appointment]:
        result = await self.db.execute(
            select(Appointment)
            .where(Appointment.patient_id == patient_id)
            .order_by(desc(Appointment.scheduled_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def delete_appointment(self, appointment_id: uuid.UUID) -> bool:
        apt = await self.get_appointment(appointment_id)
        if not apt:
            return False
        await self.db.delete(apt)
        await self.db.flush()
        return True

    # -- Medical Records -------------------------------------------------

    async def create_medical_record(self, **kwargs) -> MedicalRecord:
        record = MedicalRecord(**kwargs)
        self.db.add(record)
        await self.db.flush()
        return record

    async def get_medical_record(self, record_id: uuid.UUID) -> MedicalRecord | None:
        result = await self.db.execute(select(MedicalRecord).where(MedicalRecord.id == record_id))
        return result.scalar_one_or_none()

    async def get_records_by_patient(
        self, patient_id: uuid.UUID, skip: int = 0, limit: int = 50
    ) -> list[MedicalRecord]:
        result = await self.db.execute(
            select(MedicalRecord)
            .where(MedicalRecord.patient_id == patient_id)
            .order_by(desc(MedicalRecord.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def delete_medical_record(self, record_id: uuid.UUID) -> bool:
        record = await self.get_medical_record(record_id)
        if not record:
            return False
        await self.db.delete(record)
        await self.db.flush()
        return True

    # -- ICD-10 Codes ----------------------------------------------------

    async def search_icd_codes(self, query: str, limit: int = 20) -> list[IcdCode]:
        stmt = select(IcdCode).where(
            IcdCode.is_active == True,
            or_(
                IcdCode.code.ilike(f"%{query}%"),
                IcdCode.description.ilike(f"%{query}%"),
            ),
        ).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_icd_code(self, code: str) -> IcdCode | None:
        result = await self.db.execute(
            select(IcdCode).where(IcdCode.code == code, IcdCode.is_active == True)
        )
        return result.scalar_one_or_none()

    async def create_icd_code(self, code: str, description: str, category: str | None = None) -> IcdCode:
        existing = await self.get_icd_code(code)
        if existing:
            return existing
        icd = IcdCode(code=code, description=description, category=category)
        self.db.add(icd)
        await self.db.flush()
        return icd
