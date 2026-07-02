import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.fhir import FHIRService
from app.services.audit import AuditService
from app.schemas.patient import PatientCreate, PatientResponse
from app.middleware.auth import require_role
from app.middleware.access_control import get_patient_scope
from app.models.user import User, UserRole

router = APIRouter(prefix="/fhir/Patient", tags=["FHIR Patient"])


@router.get("", response_model=list[PatientResponse])
async def search_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
    patient_scope: uuid.UUID | None = Depends(get_patient_scope),
):
    fhir = FHIRService(db)
    return await fhir.search_patients(skip=skip, limit=limit, user_id=patient_scope)


@router.get("/{fhir_id}", response_model=PatientResponse)
async def get_patient(
    fhir_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER, UserRole.PATIENT)),
    patient_scope: uuid.UUID | None = Depends(get_patient_scope),
):
    fhir = FHIRService(db)
    patient = await fhir.get_patient(fhir_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    if patient_scope and patient.user_id != patient_scope:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return patient


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    fhir = FHIRService(db)
    patient = await fhir.create_patient(data.fhir_resource)
    audit = AuditService(db)
    await audit.log_event("patient.created", "patient", resource_id=patient.fhir_id, actor_id=current_user.id)
    return patient


@router.put("/{fhir_id}", response_model=PatientResponse)
async def update_patient(
    fhir_id: str,
    data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROVIDER)),
):
    fhir = FHIRService(db)
    patient = await fhir.update_patient(fhir_id, data.fhir_resource)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    audit = AuditService(db)
    await audit.log_event("patient.updated", "patient", resource_id=fhir_id, actor_id=current_user.id)
    return patient


@router.delete("/{fhir_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    fhir_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    fhir = FHIRService(db)
    deleted = await fhir.delete_patient(fhir_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    audit = AuditService(db)
    await audit.log_event("patient.deleted", "patient", resource_id=fhir_id, actor_id=current_user.id)
