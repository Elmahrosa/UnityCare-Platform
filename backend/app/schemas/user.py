import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
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
    password: str = Field(..., max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class MFAEnableRequest(BaseModel):
    code: str


class MFAVerifyRequest(BaseModel):
    code: str


class MFADisableRequest(BaseModel):
    password: str = Field(..., max_length=128)


class MFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    locale: Optional[str] = None
