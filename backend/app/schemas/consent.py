import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.consent import ConsentPurpose, ConsentStatus


class ConsentCreate(BaseModel):
    patient_id: uuid.UUID
    purpose: ConsentPurpose
    jurisdiction: str = "US"
    expires_at: Optional[datetime] = None
    consent_data: Optional[dict] = None


class ConsentResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    purpose: ConsentPurpose
    status: ConsentStatus
    jurisdiction: str
    version: int
    expires_at: Optional[datetime]
    consent_data: Optional[dict]
    signature_hash: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConsentRevoke(BaseModel):
    reason: Optional[str] = None
