import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_active_user, require_editor, require_admin
from app.models.user import User
from app.schemas.dashboard import (
    DashboardCreate, DashboardUpdate, DashboardResponse, DashboardWithWidgets,
    DashboardListResponse, WidgetCreate, WidgetUpdate, WidgetResponse,
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.get("/", response_model=DashboardListResponse, status_code=status.HTTP_200_OK)
async def list_dashboards(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all dashboards."""
    dashboards, total = await DashboardService.list_dashboards(db, skip=skip, limit=limit)
    return DashboardListResponse(
        total=total,
        items=[DashboardResponse.model_validate(d) for d in dashboards],
    )


@router.post("/", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    data: DashboardCreate,
    current_user: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Create a new dashboard (editor/admin)."""
    dashboard = await DashboardService.create(db, data, created_by=current_user)
    return DashboardResponse.model_validate(dashboard)


@router.get("/default", response_model=DashboardWithWidgets, status_code=status.HTTP_200_OK)
async def get_default_dashboard(
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the default dashboard with all widgets."""
    dashboard = await DashboardService.get_by_slug(db, "main")
    if not dashboard:
        # Try to find any dashboard marked as default
        dashboards, _ = await DashboardService.list_dashboards(db, skip=0, limit=1)
        if not dashboards:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No dashboards found",
            )
        dashboard = dashboards[0]
        dashboard = await DashboardService.get_by_id(db, dashboard.id)

    return DashboardWithWidgets.model_validate(dashboard)


@router.get("/{dashboard_id}", response_model=DashboardWithWidgets, status_code=status.HTTP_200_OK)
async def get_dashboard(
    dashboard_id: uuid.UUID,
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard with widgets by ID."""
    dashboard = await DashboardService.get_or_404(db, dashboard_id)
    return DashboardWithWidgets.model_validate(dashboard)


@router.patch("/{dashboard_id}", response_model=DashboardResponse, status_code=status.HTTP_200_OK)
async def update_dashboard(
    dashboard_id: uuid.UUID,
    data: DashboardUpdate,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Update dashboard (editor/admin)."""
    dashboard = await DashboardService.get_or_404(db, dashboard_id)
    dashboard = await DashboardService.update(db, dashboard, data)
    return DashboardResponse.model_validate(dashboard)


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    dashboard_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete dashboard (admin only)."""
    dashboard = await DashboardService.get_or_404(db, dashboard_id)
    await DashboardService.delete(db, dashboard)
    return None


# Widget endpoints
@router.get(
    "/{dashboard_id}/widgets",
    response_model=list[WidgetResponse],
    status_code=status.HTTP_200_OK,
)
async def list_widgets(
    dashboard_id: uuid.UUID,
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all widgets for a dashboard."""
    await DashboardService.get_or_404(db, dashboard_id)
    widgets = await DashboardService.list_widgets(db, dashboard_id)
    return [WidgetResponse.model_validate(w) for w in widgets]


@router.post(
    "/{dashboard_id}/widgets",
    response_model=WidgetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_widget(
    dashboard_id: uuid.UUID,
    data: WidgetCreate,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Add a widget to a dashboard (editor/admin)."""
    dashboard = await DashboardService.get_or_404(db, dashboard_id)
    widget = await DashboardService.create_widget(db, dashboard, data)
    return WidgetResponse.model_validate(widget)


@router.get(
    "/{dashboard_id}/widgets/{widget_id}",
    response_model=WidgetResponse,
    status_code=status.HTTP_200_OK,
)
async def get_widget(
    dashboard_id: uuid.UUID,
    widget_id: uuid.UUID,
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific widget."""
    await DashboardService.get_or_404(db, dashboard_id)
    widget = await DashboardService.get_widget_or_404(db, widget_id)
    if widget.dashboard_id != dashboard_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found in this dashboard",
        )
    return WidgetResponse.model_validate(widget)


@router.patch(
    "/{dashboard_id}/widgets/{widget_id}",
    response_model=WidgetResponse,
    status_code=status.HTTP_200_OK,
)
async def update_widget(
    dashboard_id: uuid.UUID,
    widget_id: uuid.UUID,
    data: WidgetUpdate,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Update a widget (editor/admin)."""
    await DashboardService.get_or_404(db, dashboard_id)
    widget = await DashboardService.get_widget_or_404(db, widget_id)
    if widget.dashboard_id != dashboard_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found in this dashboard",
        )
    widget = await DashboardService.update_widget(db, widget, data)
    return WidgetResponse.model_validate(widget)


@router.delete(
    "/{dashboard_id}/widgets/{widget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_widget(
    dashboard_id: uuid.UUID,
    widget_id: uuid.UUID,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Delete a widget (editor/admin)."""
    await DashboardService.get_or_404(db, dashboard_id)
    widget = await DashboardService.get_widget_or_404(db, widget_id)
    if widget.dashboard_id != dashboard_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found in this dashboard",
        )
    await DashboardService.delete_widget(db, widget)
    return None
