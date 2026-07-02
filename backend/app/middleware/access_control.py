import uuid
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.models.patient import Patient


async def get_patient_scope(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> uuid.UUID | None:
    """Horizontal access control: returns current_user.id if PATIENT, None if unrestricted.

    PATIENT users can only access resources where the owner user_id matches
    their own. ADMIN/PROVIDER roles are unrestricted.

    Raises 403 if a PATIENT has no linked Patient profile.
    """
    if current_user.role != UserRole.PATIENT:
        return None

    result = await db.execute(
        select(Patient.user_id).where(
            Patient.user_id == current_user.id,
            Patient.is_active == True,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient profile not found",
        )
    return current_user.id
