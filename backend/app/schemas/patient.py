import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class PatientCreate(BaseModel):
    fhir_resource: dict


class PatientResponse(BaseModel):
    id: uuid.UUID
    fhir_id: str
    user_id: Optional[uuid.UUID]
    fhir_resource: dict
    version_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
