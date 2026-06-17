import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.audit import AuditService
from app.middleware.auth import require_role
from app.models.user import User, UserRole

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/events")
async def get_audit_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    actor_id: uuid.UUID | None = None,
    action: str | None = None,
    resource_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.AUDITOR)),
):
    service = AuditService(db)
    events, total = await service.get_events(
        skip=skip, limit=limit, actor_id=actor_id, action=action, resource_type=resource_type
    )
    return {"events": events, "total": total, "skip": skip, "limit": limit}


@router.get("/verify")
async def verify_chain(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.AUDITOR)),
):
    service = AuditService(db)
    is_valid = await service.verify_chain()
    return {"chain_valid": is_valid}
