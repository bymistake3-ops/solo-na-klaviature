import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.invite import Invite
from app.models.user import User, UserRole
from app.core.security import generate_invite_token
from app.schemas.invite import InviteCreate, RegisterWithInvite
from app.services.user_service import UserService
from app.schemas.user import UserCreate


class InviteService:

    @staticmethod
    async def create_invite(
        db: AsyncSession,
        invite_data: InviteCreate,
        created_by: User,
    ) -> Invite:
        token = generate_invite_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=invite_data.expires_in_days)

        invite = Invite(
            email=invite_data.email,
            token=token,
            role=invite_data.role,
            invited_by=created_by.id,
            expires_at=expires_at,
            is_active=True,
        )
        db.add(invite)
        await db.flush()
        await db.refresh(invite)
        return invite

    @staticmethod
    async def get_invite_by_token(db: AsyncSession, token: str) -> Optional[Invite]:
        result = await db.execute(select(Invite).where(Invite.token == token))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_invite_by_id(db: AsyncSession, invite_id: uuid.UUID) -> Optional[Invite]:
        result = await db.execute(select(Invite).where(Invite.id == invite_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_invites(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        is_active: Optional[bool] = None,
    ) -> tuple[list[Invite], int]:
        query = select(Invite)
        count_query = select(func.count(Invite.id))

        if is_active is not None:
            query = query.where(Invite.is_active == is_active)
            count_query = count_query.where(Invite.is_active == is_active)

        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(Invite.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def revoke_invite(db: AsyncSession, invite_id: uuid.UUID) -> Invite:
        result = await db.execute(select(Invite).where(Invite.id == invite_id))
        invite = result.scalar_one_or_none()
        if not invite:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
        invite.is_active = False
        await db.flush()
        await db.refresh(invite)
        return invite

    @staticmethod
    async def register_with_invite(
        db: AsyncSession,
        registration: RegisterWithInvite,
    ) -> User:
        invite = await InviteService.get_invite_by_token(db, registration.token)
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invite token not found",
            )
        if not invite.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite has been revoked",
            )
        if invite.used_by is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite has already been used",
            )
        now = datetime.now(timezone.utc)
        if invite.expires_at.replace(tzinfo=timezone.utc) < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite has expired",
            )

        # If invite was for specific email, enforce it
        if invite.email and invite.email.lower() != registration.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invite is for a different email address",
            )

        user_create = UserCreate(
            email=registration.email,
            password=registration.password,
            full_name=registration.full_name,
            role=invite.role,
        )
        user = await UserService.create(db, user_create, role=invite.role)

        # Mark invite as used
        invite.used_by = user.id
        invite.used_at = now
        invite.is_active = False
        await db.flush()

        return user
