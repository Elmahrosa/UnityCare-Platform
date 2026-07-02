import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.medical import AppointmentStatus


class VitalSignsCreate(BaseModel):
    heart_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    temperature: Optional[float] = None


class VitalSignsResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    heart_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    recorded_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    reason: Optional[str] = None
    notes: Optional[str] = None
    scheduled_at: datetime


class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    scheduled_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MedicalRecordCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    record_type: str
    title: str
    description: Optional[str] = None
    icd_code: Optional[str] = None
    icd_description: Optional[str] = None
    data: Optional[dict] = None


class MedicalRecordResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    record_type: str
    title: str
    description: Optional[str] = None
    icd_code: Optional[str] = None
    icd_description: Optional[str] = None
    data: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IcdCodeCreate(BaseModel):
    code: str
    description: str
    category: Optional[str] = None


class IcdCodeResponse(BaseModel):
    id: uuid.UUID
    code: str
    description: str
    category: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}
