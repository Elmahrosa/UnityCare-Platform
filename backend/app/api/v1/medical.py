import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.medical import MedicalService
from app.services.audit import AuditService
from app.schemas.medical import (
    VitalSignsCreate, VitalSignsResponse,
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    MedicalRecordCreate, MedicalRecordResponse,
    IcdCodeCreate, IcdCodeResponse,
)
from app.middleware.auth import get_current_user, require_role
from app.middleware.access_control import get_patient_scope
from app.models.user import User, UserRole

router = APIRouter(tags=["Medical"])


# -- Vitals ------------------------------------------------------------------


@router.get("/iot/{user_id}/vitals", response_model=VitalSignsResponse | None)
async def get_latest_vitals(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
    patient_scope: uuid.UUID | None = Depends(get_patient_scope),
):
    if patient_scope and user_id != patient_scope:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    service = MedicalService(db)
    vitals = await service.get_latest_vitals(user_id)
    return vitals


@router.get("/iot/{user_id}/vitals/history", response_model=list[VitalSignsResponse])
async def get_vitals_history(
    user_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
    patient_scope: uuid.UUID | None = Depends(get_patient_scope),
):
    if patient_scope and user_id != patient_scope:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    service = MedicalService(db)
    return await service.get_vitals_history(user_id, limit=limit)


@router.post("/iot/{user_id}/vitals", response_model=VitalSignsResponse, status_code=status.HTTP_201_CREATED)
async def record_vitals(
    user_id: uuid.UUID,
    data: VitalSignsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    service = MedicalService(db)
    vitals = await service.create_vitals(
        user_id=user_id,
        heart_rate=data.heart_rate,
        oxygen_saturation=data.oxygen_saturation,
        blood_pressure_systolic=data.blood_pressure_systolic,
        blood_pressure_diastolic=data.blood_pressure_diastolic,
        temperature=data.temperature,
    )
    audit = AuditService(db)
    await audit.log_event("vitals.recorded", "vitals", resource_id=str(vitals.id), actor_id=current_user.id)
    return vitals


# -- Appointments ------------------------------------------------------------


@router.post("/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    service = MedicalService(db)
    apt = await service.create_appointment(**data.model_dump())
    audit = AuditService(db)
    await audit.log_event("appointment.created", "appointment", resource_id=str(apt.id), actor_id=current_user.id)
    return apt


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
    patient_scope: uuid.UUID | None = Depends(get_patient_scope),
):
    service = MedicalService(db)
    apt = await service.get_appointment(appointment_id)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if patient_scope and apt.patient_id != patient_scope:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return apt


@router.patch("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: uuid.UUID,
    data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    service = MedicalService(db)
    apt = await service.update_appointment(appointment_id, **data.model_dump(exclude_none=True))
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    audit = AuditService(db)
    await audit.log_event("appointment.updated", "appointment", resource_id=str(apt.id), actor_id=current_user.id)
    return apt


@router.get("/appointments/doctor/{doctor_id}", response_model=list[AppointmentResponse])
async def get_doctor_appointments(
    doctor_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    service = MedicalService(db)
    return await service.get_appointments_by_doctor(doctor_id, skip=skip, limit=limit)


@router.get("/appointments/patient/{patient_id}", response_model=list[AppointmentResponse])
async def get_patient_appointments(
    patient_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
    patient_scope: uuid.UUID | None = Depends(get_patient_scope),
):
    if patient_scope and patient_id != patient_scope:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    service = MedicalService(db)
    return await service.get_appointments_by_patient(patient_id, skip=skip, limit=limit)


@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    service = MedicalService(db)
    deleted = await service.delete_appointment(appointment_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    audit = AuditService(db)
    await audit.log_event("appointment.deleted", "appointment", resource_id=str(appointment_id), actor_id=current_user.id)


# -- Medical Records ---------------------------------------------------------


@router.post("/records", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_medical_record(
    data: MedicalRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    service = MedicalService(db)
    record = await service.create_medical_record(**data.model_dump())
    audit = AuditService(db)
    await audit.log_event("record.created", "medical_record", resource_id=str(record.id), actor_id=current_user.id)
    return record


@router.get("/records/{record_id}", response_model=MedicalRecordResponse)
async def get_medical_record(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
    patient_scope: uuid.UUID | None = Depends(get_patient_scope),
):
    service = MedicalService(db)
    record = await service.get_medical_record(record_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found")
    if patient_scope and record.patient_id != patient_scope:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return record


@router.get("/records/patient/{patient_id}", response_model=list[MedicalRecordResponse])
async def get_patient_records(
    patient_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
    patient_scope: uuid.UUID | None = Depends(get_patient_scope),
):
    if patient_scope and patient_id != patient_scope:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    service = MedicalService(db)
    return await service.get_records_by_patient(patient_id, skip=skip, limit=limit)


# -- ICD-10 Codes -----------------------------------------------------------


@router.get("/icd-codes", response_model=list[IcdCodeResponse])
async def search_icd_codes(
    q: str = Query("", min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    service = MedicalService(db)
    return await service.search_icd_codes(q, limit=limit)


@router.get("/icd-codes/{code}", response_model=IcdCodeResponse)
async def get_icd_code(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
):
    service = MedicalService(db)
    icd = await service.get_icd_code(code)
    if not icd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ICD-10 code not found")
    return icd


@router.post("/icd-codes", response_model=IcdCodeResponse, status_code=status.HTTP_201_CREATED)
async def create_icd_code(
    data: IcdCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    service = MedicalService(db)
    icd = await service.create_icd_code(code=data.code, description=data.description, category=data.category)
    audit = AuditService(db)
    await audit.log_event("icd_code.created", "icd_code", resource_id=icd.code, actor_id=current_user.id)
    return icd
