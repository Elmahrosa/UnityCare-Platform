import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.research import IRBStatus, DataClassification, CohortType, AccessPurpose, ComplianceVerdict


class ResearchStudyCreate(BaseModel):
    name: str
    description: str | None = None
    irb_status: IRBStatus = IRBStatus.PENDING
    irb_approval_date: datetime | None = None
    irb_expiry_date: datetime | None = None
    data_classification: DataClassification = DataClassification.CONFIDENTIAL
    geographic_scope: str | None = "US"
    principal_investigator: str
    institution: str


class ResearchStudyResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    irb_status: IRBStatus
    irb_approval_date: datetime | None
    irb_expiry_date: datetime | None
    data_classification: DataClassification
    geographic_scope: str | None
    principal_investigator: str
    institution: str
    is_active: bool
    created_at: datetime
    cohorts: list["ResearchCohortResponse"] = []

    class Config:
        from_attributes = True


class ResearchCohortCreate(BaseModel):
    study_id: uuid.UUID
    name: str
    cohort_type: CohortType = CohortType.OPEN
    description: str | None = None
    member_count: int = 0
    allowed_purposes: list[str] = []


class ResearchCohortResponse(BaseModel):
    id: uuid.UUID
    study_id: uuid.UUID
    name: str
    cohort_type: CohortType
    description: str | None
    member_count: int
    allowed_purposes: list
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AccessRequest(BaseModel):
    study_id: uuid.UUID
    cohort_id: uuid.UUID | None = None
    purpose: AccessPurpose


class AccessLogResponse(BaseModel):
    id: uuid.UUID
    study_id: uuid.UUID
    cohort_id: uuid.UUID | None
    requester_id: uuid.UUID
    purpose: AccessPurpose
    verdict: ComplianceVerdict
    explanation: str | None
    dimensions_evaluated: dict
    access_time: datetime

    class Config:
        from_attributes = True
