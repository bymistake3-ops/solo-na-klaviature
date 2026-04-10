import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from app.schemas.user import UserResponse


class InviteCreate(BaseModel):
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.viewer
    expires_in_days: int = 7


class InviteResponse(BaseModel):
    id: uuid.UUID
    email: Optional[str] = None
    token: str
    role: UserRole
    invited_by: Optional[uuid.UUID] = None
    used_by: Optional[uuid.UUID] = None
    used_at: Optional[datetime] = None
    expires_at: datetime
    is_active: bool
    created_at: datetime
    invite_url: Optional[str] = None

    model_config = {"from_attributes": True}


class InviteListResponse(BaseModel):
    total: int
    items: list[InviteResponse]


class RegisterWithInvite(BaseModel):
    token: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
