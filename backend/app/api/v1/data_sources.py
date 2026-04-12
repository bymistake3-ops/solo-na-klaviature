import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_active_user, require_admin, require_editor
from app.models.user import User
from app.schemas.data_source import (
    DataSourceCreate, DataSourceUpdate, DataSourceResponse, DataSourceListResponse
)
from app.services.data_source_service import DataSourceService

router = APIRouter(prefix="/data-sources", tags=["data-sources"])


@router.get("/", response_model=DataSourceListResponse, status_code=status.HTTP_200_OK)
async def list_data_sources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all data sources."""
    sources, total = await DataSourceService.list_data_sources(
        db, skip=skip, limit=limit, category=category, is_active=is_active
    )
    return DataSourceListResponse(
        total=total,
        items=[DataSourceResponse.model_validate(s) for s in sources],
    )


@router.post("/", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    ds_create: DataSourceCreate,
    current_user: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Create a new data source (editor/admin)."""
    ds = await DataSourceService.create(db, ds_create, created_by=current_user)
    return DataSourceResponse.model_validate(ds)


@router.get("/{ds_id}", response_model=DataSourceResponse, status_code=status.HTTP_200_OK)
async def get_data_source(
    ds_id: uuid.UUID,
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get data source by ID."""
    ds = await DataSourceService.get_or_404(db, ds_id)
    return DataSourceResponse.model_validate(ds)


@router.get("/slug/{slug}", response_model=DataSourceResponse, status_code=status.HTTP_200_OK)
async def get_data_source_by_slug(
    slug: str,
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get data source by slug."""
    ds = await DataSourceService.get_by_slug(db, slug)
    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Data source with slug '{slug}' not found",
        )
    return DataSourceResponse.model_validate(ds)


@router.patch("/{ds_id}", response_model=DataSourceResponse, status_code=status.HTTP_200_OK)
async def update_data_source(
    ds_id: uuid.UUID,
    ds_update: DataSourceUpdate,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Update data source (editor/admin)."""
    ds = await DataSourceService.get_or_404(db, ds_id)
    ds = await DataSourceService.update(db, ds, ds_update)
    return DataSourceResponse.model_validate(ds)


@router.delete("/{ds_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(
    ds_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete data source (admin only)."""
    ds = await DataSourceService.get_or_404(db, ds_id)
    await DataSourceService.delete(db, ds)
    return None
