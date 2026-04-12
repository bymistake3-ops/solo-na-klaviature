import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, get_current_active_user, require_editor, require_admin
from app.models.user import User
from app.models.metric_definition import MetricDefinition
from app.models.dimension_definition import DimensionDefinition
from app.schemas.metric import (
    MetricDefinitionCreate, MetricDefinitionUpdate, MetricDefinitionResponse,
    DimensionDefinitionCreate, DimensionDefinitionUpdate, DimensionDefinitionResponse,
)

router = APIRouter(tags=["metrics"])


# Metric Definitions
@router.get(
    "/metrics",
    response_model=list[MetricDefinitionResponse],
    status_code=status.HTTP_200_OK,
)
async def list_metrics(
    data_source_id: Optional[uuid.UUID] = Query(None),
    is_visible: Optional[bool] = Query(None),
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all metric definitions, optionally filtered by data source."""
    query = select(MetricDefinition)
    if data_source_id:
        query = query.where(MetricDefinition.data_source_id == data_source_id)
    if is_visible is not None:
        query = query.where(MetricDefinition.is_visible == is_visible)
    query = query.order_by(MetricDefinition.sort_order.asc())
    result = await db.execute(query)
    return [MetricDefinitionResponse.model_validate(m) for m in result.scalars().all()]


@router.post(
    "/metrics",
    response_model=MetricDefinitionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_metric(
    data: MetricDefinitionCreate,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Create a metric definition (editor/admin)."""
    metric = MetricDefinition(**data.model_dump())
    db.add(metric)
    await db.flush()
    await db.refresh(metric)
    return MetricDefinitionResponse.model_validate(metric)


@router.get(
    "/metrics/{metric_id}",
    response_model=MetricDefinitionResponse,
    status_code=status.HTTP_200_OK,
)
async def get_metric(
    metric_id: uuid.UUID,
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get metric definition by ID."""
    result = await db.execute(
        select(MetricDefinition).where(MetricDefinition.id == metric_id)
    )
    metric = result.scalar_one_or_none()
    if not metric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric not found")
    return MetricDefinitionResponse.model_validate(metric)


@router.patch(
    "/metrics/{metric_id}",
    response_model=MetricDefinitionResponse,
    status_code=status.HTTP_200_OK,
)
async def update_metric(
    metric_id: uuid.UUID,
    data: MetricDefinitionUpdate,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Update metric definition (editor/admin)."""
    result = await db.execute(
        select(MetricDefinition).where(MetricDefinition.id == metric_id)
    )
    metric = result.scalar_one_or_none()
    if not metric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(metric, field, value)
    await db.flush()
    await db.refresh(metric)
    return MetricDefinitionResponse.model_validate(metric)


@router.delete("/metrics/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_metric(
    metric_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete metric definition (admin only)."""
    result = await db.execute(
        select(MetricDefinition).where(MetricDefinition.id == metric_id)
    )
    metric = result.scalar_one_or_none()
    if not metric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric not found")
    await db.delete(metric)
    await db.flush()
    return None


# Dimension Definitions
@router.get(
    "/dimensions",
    response_model=list[DimensionDefinitionResponse],
    status_code=status.HTTP_200_OK,
)
async def list_dimensions(
    data_source_id: Optional[uuid.UUID] = Query(None),
    is_visible: Optional[bool] = Query(None),
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all dimension definitions."""
    query = select(DimensionDefinition)
    if data_source_id:
        query = query.where(DimensionDefinition.data_source_id == data_source_id)
    if is_visible is not None:
        query = query.where(DimensionDefinition.is_visible == is_visible)
    result = await db.execute(query)
    return [DimensionDefinitionResponse.model_validate(d) for d in result.scalars().all()]


@router.post(
    "/dimensions",
    response_model=DimensionDefinitionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dimension(
    data: DimensionDefinitionCreate,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Create a dimension definition (editor/admin)."""
    dimension = DimensionDefinition(**data.model_dump())
    db.add(dimension)
    await db.flush()
    await db.refresh(dimension)
    return DimensionDefinitionResponse.model_validate(dimension)


@router.patch(
    "/dimensions/{dimension_id}",
    response_model=DimensionDefinitionResponse,
    status_code=status.HTTP_200_OK,
)
async def update_dimension(
    dimension_id: uuid.UUID,
    data: DimensionDefinitionUpdate,
    _editor: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Update dimension definition (editor/admin)."""
    result = await db.execute(
        select(DimensionDefinition).where(DimensionDefinition.id == dimension_id)
    )
    dimension = result.scalar_one_or_none()
    if not dimension:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dimension not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dimension, field, value)
    await db.flush()
    await db.refresh(dimension)
    return DimensionDefinitionResponse.model_validate(dimension)


@router.delete("/dimensions/{dimension_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dimension(
    dimension_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete dimension definition (admin only)."""
    result = await db.execute(
        select(DimensionDefinition).where(DimensionDefinition.id == dimension_id)
    )
    dimension = result.scalar_one_or_none()
    if not dimension:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dimension not found")
    await db.delete(dimension)
    await db.flush()
    return None
