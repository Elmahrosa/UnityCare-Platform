import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.PATIENT
    locale: str = "en"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    mfa_enabled: bool
    is_active: bool
    locale: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class MFAEnableRequest(BaseModel):
    code: str


class MFAVerifyRequest(BaseModel):
    code: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    locale: Optional[str] = None
