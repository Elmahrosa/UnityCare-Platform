import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.database import Base


class IRBStatus(str, enum.Enum):
    APPROVED = "approved"
    PENDING = "pending"
    EXPIRED = "expired"
    REJECTED = "rejected"
    NOT_REQUIRED = "not_required"


class DataClassification(str, enum.Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    PHI = "phi"
    RESTRICTED = "restricted"


class CohortType(str, enum.Enum):
    OPEN = "open"
    BLINDED = "blinded"
    CONTROLLED = "controlled"


class AccessPurpose(str, enum.Enum):
    RESEARCH = "research"
    QUALITY_ASSURANCE = "quality_assurance"
    AUDIT = "audit"
    REPRODUCTION = "reproduction"
    COLLABORATION = "collaboration"


class ComplianceVerdict(str, enum.Enum):
    GRANTED = "granted"
    DENIED = "denied"
    PENDING_REVIEW = "pending_review"


class ResearchStudy(Base):
    __tablename__ = "research_studies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    irb_status: Mapped[IRBStatus] = mapped_column(SAEnum(IRBStatus), default=IRBStatus.PENDING, index=True)
    irb_approval_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    irb_expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_classification: Mapped[DataClassification] = mapped_column(SAEnum(DataClassification), default=DataClassification.CONFIDENTIAL)
    geographic_scope: Mapped[str | None] = mapped_column(String(50), default="US")
    principal_investigator: Mapped[str] = mapped_column(String(255), nullable=False)
    institution: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    cohorts: Mapped[list["ResearchCohort"]] = relationship(back_populates="study", cascade="all, delete-orphan")


class ResearchCohort(Base):
    __tablename__ = "research_cohorts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("research_studies.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cohort_type: Mapped[CohortType] = mapped_column(SAEnum(CohortType), default=CohortType.OPEN)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    member_count: Mapped[int] = mapped_column(default=0)
    allowed_purposes: Mapped[list] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    study: Mapped[ResearchStudy] = relationship(back_populates="cohorts")


class ResearchAccessLog(Base):
    __tablename__ = "research_access_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("research_studies.id", ondelete="CASCADE"), nullable=False, index=True)
    cohort_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("research_cohorts.id", ondelete="SET NULL"), nullable=True)
    requester_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    purpose: Mapped[AccessPurpose] = mapped_column(SAEnum(AccessPurpose), nullable=False)
    verdict: Mapped[ComplianceVerdict] = mapped_column(SAEnum(ComplianceVerdict), nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    dimensions_evaluated: Mapped[dict] = mapped_column(JSON, default=dict)
    access_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
