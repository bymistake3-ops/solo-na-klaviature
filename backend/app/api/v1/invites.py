import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_active_user, require_admin
from app.models.user import User
from app.schemas.invite import InviteCreate, InviteResponse, InviteListResponse, RegisterWithInvite
from app.schemas.user import UserResponse
from app.schemas.auth import TokenResponse
from app.services.invite_service import InviteService

router = APIRouter(prefix="/invites", tags=["invites"])


@router.post("/", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite(
    invite_data: InviteCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create an invite link (admin only)."""
    invite = await InviteService.create_invite(db, invite_data, current_user)

    # Build invite URL
    base_url = str(request.base_url).rstrip("/")
    invite_url = f"{base_url}/api/v1/invites/{invite.token}/register"

    response = InviteResponse.model_validate(invite)
    response.invite_url = invite_url
    return response


@router.get("/", response_model=InviteListResponse, status_code=status.HTTP_200_OK)
async def list_invites(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = Query(None),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all invites (admin only)."""
    invites, total = await InviteService.list_invites(
        db, skip=skip, limit=limit, is_active=is_active
    )
    return InviteListResponse(
        total=total,
        items=[InviteResponse.model_validate(i) for i in invites],
    )


@router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invite(
    invite_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an invite (admin only)."""
    await InviteService.revoke_invite(db, invite_id)
    return None


@router.post("/{token}/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_with_invite(
    token: str,
    registration: RegisterWithInvite,
    db: AsyncSession = Depends(get_db),
):
    """Register a new account using an invite token. Returns access + refresh tokens."""
    from app.services.auth_service import AuthService
    # Ensure the token in path matches the body token
    if registration.token != token:
        registration.token = token

    user = await InviteService.register_with_invite(db, registration)
    return AuthService.create_tokens(user)


@router.get("/{token}/info", response_model=InviteResponse, status_code=status.HTTP_200_OK)
async def get_invite_info(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get invite info by token (public endpoint to check validity before registering)."""
    invite = await InviteService.get_invite_by_token(db, token)
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    return InviteResponse.model_validate(invite)
