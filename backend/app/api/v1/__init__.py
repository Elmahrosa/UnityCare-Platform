from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.consents import router as consents_router
from app.api.v1.audit import router as audit_router
from app.api.v1.admin import router as admin_router

__all__ = ["auth_router", "patients_router", "consents_router", "audit_router", "admin_router"]
