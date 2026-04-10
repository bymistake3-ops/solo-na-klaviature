import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserUpdate


class UserService:

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        user_create: UserCreate,
        role: Optional[UserRole] = None,
    ) -> User:
        existing = await UserService.get_by_email(db, user_create.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )

        user = User(
            email=user_create.email.lower(),
            hashed_password=get_password_hash(user_create.password),
            full_name=user_create.full_name,
            role=role or user_create.role,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def update(
        db: AsyncSession, user: User, user_update: UserUpdate
    ) -> User:
        update_data = user_update.model_dump(exclude_unset=True)

        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        if "email" in update_data:
            update_data["email"] = update_data["email"].lower()

        for field, value in update_data.items():
            setattr(user, field, value)

        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def delete(db: AsyncSession, user: User) -> None:
        await db.delete(user)
        await db.flush()

    @staticmethod
    async def list_users(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[User], int]:
        query = select(User)
        count_query = select(func.count(User.id))

        if role is not None:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
            count_query = count_query.where(User.is_active == is_active)

        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        users = result.scalars().all()

        return list(users), total

    @staticmethod
    async def ensure_admin_exists(db: AsyncSession, email: str, password: str, full_name: str) -> User:
        existing = await UserService.get_by_email(db, email)
        if existing:
            return existing

        user = User(
            email=email.lower(),
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role=UserRole.admin,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user
