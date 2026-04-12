import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.dataset import DatasetListResponse, KPIResponse, SummaryResponse
from app.services.data_source_service import DataSourceService
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get(
    "/{data_source_id}/records",
    response_model=DatasetListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_dataset_records(
    data_source_id: uuid.UUID,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    granularity: Optional[str] = Query(None, description="day|week|month"),
    metrics: Optional[list[str]] = Query(None, alias="metrics[]"),
    sort_by: str = Query("period_start"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dataset records for a data source with filtering and pagination."""
    await DataSourceService.get_or_404(db, data_source_id)

    return await DatasetService.get_records(
        db=db,
        data_source_id=data_source_id,
        date_from=date_from,
        date_to=date_to,
        granularity=granularity,
        metric_keys=metrics,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{data_source_id}/kpi",
    response_model=KPIResponse,
    status_code=status.HTTP_200_OK,
)
async def get_kpis(
    data_source_id: uuid.UUID,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated KPIs for a data source."""
    await DataSourceService.get_or_404(db, data_source_id)
    return await DatasetService.get_kpis(
        db=db,
        data_source_id=data_source_id,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/{data_source_id}/summary",
    response_model=SummaryResponse,
    status_code=status.HTTP_200_OK,
)
async def get_summary(
    data_source_id: uuid.UUID,
    granularity: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get period-by-period summary stats for a data source."""
    await DataSourceService.get_or_404(db, data_source_id)
    return await DatasetService.get_summary(
        db=db,
        data_source_id=data_source_id,
        granularity=granularity,
        date_from=date_from,
        date_to=date_to,
    )
