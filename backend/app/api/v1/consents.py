import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.consent import ConsentService
from app.schemas.consent import ConsentCreate, ConsentResponse, ConsentRevoke
from app.middleware.auth import get_current_user, require_role
from app.models.user import User, UserRole

router = APIRouter(prefix="/consent", tags=["Consent"])


@router.post("", response_model=ConsentResponse, status_code=status.HTTP_201_CREATED)
async def create_consent(
    data: ConsentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
):
    service = ConsentService(db)
    consent = await service.create_consent(
        patient_id=data.patient_id,
        purpose=data.purpose,
        jurisdiction=data.jurisdiction,
        expires_at=data.expires_at,
        consent_data=data.consent_data,
        granted_by=current_user.id,
    )
    return consent


@router.get("/{consent_id}", response_model=ConsentResponse)
async def get_consent(
    consent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
):
    service = ConsentService(db)
    consent = await service.get_consent(consent_id)
    if not consent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent not found")
    return consent


@router.get("/patient/{patient_id}", response_model=list[ConsentResponse])
async def get_patient_consents(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
):
    service = ConsentService(db)
    return await service.get_patient_consents(patient_id)


@router.post("/{consent_id}/revoke", response_model=ConsentResponse)
async def revoke_consent(
    consent_id: uuid.UUID,
    data: ConsentRevoke | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
):
    service = ConsentService(db)
    consent = await service.revoke_consent(consent_id, actor_id=current_user.id)
    if not consent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent not found or already revoked")
    return consent


@router.get("/{consent_id}/versions", response_model=list)
async def get_consent_versions(
    consent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.AUDITOR)),
):
    service = ConsentService(db)
    return await service.get_consent_versions(consent_id)
