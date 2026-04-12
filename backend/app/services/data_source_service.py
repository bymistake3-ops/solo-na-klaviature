import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.data_source import DataSource
from app.models.user import User
from app.schemas.data_source import DataSourceCreate, DataSourceUpdate


class DataSourceService:

    @staticmethod
    async def get_by_id(db: AsyncSession, ds_id: uuid.UUID) -> Optional[DataSource]:
        result = await db.execute(select(DataSource).where(DataSource.id == ds_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_slug(db: AsyncSession, slug: str) -> Optional[DataSource]:
        result = await db.execute(select(DataSource).where(DataSource.slug == slug))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        ds_create: DataSourceCreate,
        created_by: Optional[User] = None,
    ) -> DataSource:
        existing = await DataSourceService.get_by_slug(db, ds_create.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Data source with slug '{ds_create.slug}' already exists",
            )

        ds = DataSource(
            name=ds_create.name,
            slug=ds_create.slug,
            description=ds_create.description,
            source_type=ds_create.source_type,
            schema=ds_create.schema,
            column_mapping=ds_create.column_mapping,
            granularity=ds_create.granularity,
            category=ds_create.category,
            is_active=ds_create.is_active,
            created_by=created_by.id if created_by else None,
        )
        db.add(ds)
        await db.flush()
        await db.refresh(ds)
        return ds

    @staticmethod
    async def update(
        db: AsyncSession,
        ds: DataSource,
        ds_update: DataSourceUpdate,
    ) -> DataSource:
        update_data = ds_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ds, field, value)
        await db.flush()
        await db.refresh(ds)
        return ds

    @staticmethod
    async def delete(db: AsyncSession, ds: DataSource) -> None:
        await db.delete(ds)
        await db.flush()

    @staticmethod
    async def list_data_sources(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[DataSource], int]:
        query = select(DataSource)
        count_query = select(func.count(DataSource.id))

        if category is not None:
            query = query.where(DataSource.category == category)
            count_query = count_query.where(DataSource.category == category)
        if is_active is not None:
            query = query.where(DataSource.is_active == is_active)
            count_query = count_query.where(DataSource.is_active == is_active)

        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(DataSource.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_or_404(db: AsyncSession, ds_id: uuid.UUID) -> DataSource:
        ds = await DataSourceService.get_by_id(db, ds_id)
        if not ds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Data source {ds_id} not found",
            )
        return ds
