import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.dashboard import Dashboard
from app.models.widget import DashboardWidget
from app.models.user import User
from app.schemas.dashboard import (
    DashboardCreate, DashboardUpdate,
    WidgetCreate, WidgetUpdate,
)


class DashboardService:

    @staticmethod
    async def get_by_id(db: AsyncSession, dashboard_id: uuid.UUID) -> Optional[Dashboard]:
        result = await db.execute(
            select(Dashboard)
            .options(selectinload(Dashboard.widgets))
            .where(Dashboard.id == dashboard_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_slug(db: AsyncSession, slug: str) -> Optional[Dashboard]:
        result = await db.execute(
            select(Dashboard)
            .options(selectinload(Dashboard.widgets))
            .where(Dashboard.slug == slug)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_or_404(db: AsyncSession, dashboard_id: uuid.UUID) -> Dashboard:
        d = await DashboardService.get_by_id(db, dashboard_id)
        if not d:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dashboard {dashboard_id} not found",
            )
        return d

    @staticmethod
    async def list_dashboards(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Dashboard], int]:
        count_result = await db.execute(select(func.count(Dashboard.id)))
        total = count_result.scalar_one()

        result = await db.execute(
            select(Dashboard)
            .order_by(Dashboard.is_default.desc(), Dashboard.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def create(
        db: AsyncSession,
        data: DashboardCreate,
        created_by: Optional[User] = None,
    ) -> Dashboard:
        # If setting as default, unset others
        if data.is_default:
            await db.execute(
                select(Dashboard).where(Dashboard.is_default == True)
            )
            existing_defaults_result = await db.execute(
                select(Dashboard).where(Dashboard.is_default == True)
            )
            for d in existing_defaults_result.scalars().all():
                d.is_default = False

        dashboard = Dashboard(
            name=data.name,
            slug=data.slug,
            description=data.description,
            data_source_id=data.data_source_id,
            layout=data.layout,
            is_default=data.is_default,
            created_by=created_by.id if created_by else None,
        )
        db.add(dashboard)
        await db.flush()
        await db.refresh(dashboard)
        return dashboard

    @staticmethod
    async def update(
        db: AsyncSession,
        dashboard: Dashboard,
        data: DashboardUpdate,
    ) -> Dashboard:
        update_data = data.model_dump(exclude_unset=True)

        if update_data.get("is_default"):
            existing_defaults_result = await db.execute(
                select(Dashboard).where(
                    Dashboard.is_default == True,
                    Dashboard.id != dashboard.id,
                )
            )
            for d in existing_defaults_result.scalars().all():
                d.is_default = False

        for field, value in update_data.items():
            setattr(dashboard, field, value)
        await db.flush()
        await db.refresh(dashboard)
        return dashboard

    @staticmethod
    async def delete(db: AsyncSession, dashboard: Dashboard) -> None:
        await db.delete(dashboard)
        await db.flush()

    # Widget operations
    @staticmethod
    async def get_widget(
        db: AsyncSession, widget_id: uuid.UUID
    ) -> Optional[DashboardWidget]:
        result = await db.execute(
            select(DashboardWidget).where(DashboardWidget.id == widget_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_widget_or_404(
        db: AsyncSession, widget_id: uuid.UUID
    ) -> DashboardWidget:
        w = await DashboardService.get_widget(db, widget_id)
        if not w:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Widget {widget_id} not found",
            )
        return w

    @staticmethod
    async def create_widget(
        db: AsyncSession,
        dashboard: Dashboard,
        data: WidgetCreate,
    ) -> DashboardWidget:
        widget = DashboardWidget(
            dashboard_id=dashboard.id,
            title=data.title,
            widget_type=data.widget_type,
            data_source_id=data.data_source_id,
            metric_keys=data.metric_keys,
            dimension_keys=data.dimension_keys,
            filters=data.filters,
            chart_config=data.chart_config,
            position=data.position,
            is_visible=data.is_visible,
            sort_order=data.sort_order,
        )
        db.add(widget)
        await db.flush()
        await db.refresh(widget)
        return widget

    @staticmethod
    async def update_widget(
        db: AsyncSession,
        widget: DashboardWidget,
        data: WidgetUpdate,
    ) -> DashboardWidget:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(widget, field, value)
        await db.flush()
        await db.refresh(widget)
        return widget

    @staticmethod
    async def delete_widget(db: AsyncSession, widget: DashboardWidget) -> None:
        await db.delete(widget)
        await db.flush()

    @staticmethod
    async def list_widgets(
        db: AsyncSession, dashboard_id: uuid.UUID
    ) -> list[DashboardWidget]:
        result = await db.execute(
            select(DashboardWidget)
            .where(DashboardWidget.dashboard_id == dashboard_id)
            .order_by(DashboardWidget.sort_order.asc())
        )
        return list(result.scalars().all())
