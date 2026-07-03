import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.research import ResearchService
from app.services.audit import AuditService
from app.schemas.research import (
    ResearchStudyCreate, ResearchStudyResponse,
    ResearchCohortCreate, ResearchCohortResponse,
    AccessRequest, AccessLogResponse,
)
from app.middleware.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.research import IRBStatus

router = APIRouter(prefix="/research", tags=["Research"])


@router.post("/studies", response_model=ResearchStudyResponse, status_code=status.HTTP_201_CREATED)
async def create_study(
    data: ResearchStudyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    service = ResearchService(db)
    study = await service.create_study(**data.model_dump())
    audit = AuditService(db)
    await audit.log_event("research.study.created", "research_study", resource_id=str(study.id), actor_id=current_user.id)
    return study


@router.get("/studies", response_model=list[ResearchStudyResponse])
async def list_studies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
):
    service = ResearchService(db)
    return await service.list_studies(skip=skip, limit=limit)


@router.get("/studies/{study_id}", response_model=ResearchStudyResponse)
async def get_study(
    study_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
):
    service = ResearchService(db)
    study = await service.get_study(study_id)
    if not study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")
    return study


@router.patch("/studies/{study_id}/irb", response_model=ResearchStudyResponse)
async def update_irb(
    study_id: uuid.UUID,
    status: IRBStatus,
    approval_date: str | None = Query(None),
    expiry_date: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    from datetime import datetime
    service = ResearchService(db)
    parsed_approval = datetime.fromisoformat(approval_date) if approval_date else None
    parsed_expiry = datetime.fromisoformat(expiry_date) if expiry_date else None
    study = await service.update_irb_status(study_id, status, parsed_approval, parsed_expiry)
    if not study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")
    audit = AuditService(db)
    await audit.log_event("research.study.irb_updated", "research_study", resource_id=str(study.id), actor_id=current_user.id, details={"irb_status": status.value})
    return study


@router.post("/cohorts", response_model=ResearchCohortResponse, status_code=status.HTTP_201_CREATED)
async def create_cohort(
    data: ResearchCohortCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    service = ResearchService(db)
    cohort = await service.create_cohort(**data.model_dump())
    audit = AuditService(db)
    await audit.log_event("research.cohort.created", "research_cohort", resource_id=str(cohort.id), actor_id=current_user.id)
    return cohort


@router.post("/access", response_model=AccessLogResponse)
async def request_access(
    data: AccessRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ResearchService(db)
    try:
        log = await service.request_access(
            study_id=data.study_id,
            cohort_id=data.cohort_id,
            purpose=data.purpose,
            requester=current_user,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    audit = AuditService(db)
    await audit.log_event(
        "research.access.requested", "research_access",
        resource_id=str(log.id), actor_id=current_user.id,
        details={"verdict": log.verdict.value, "purpose": data.purpose.value},
    )
    return log


@router.get("/access-logs", response_model=list[AccessLogResponse])
async def get_access_logs(
    study_id: uuid.UUID | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.AUDITOR)),
):
    service = ResearchService(db)
    return await service.get_access_logs(study_id=study_id, skip=skip, limit=limit)
