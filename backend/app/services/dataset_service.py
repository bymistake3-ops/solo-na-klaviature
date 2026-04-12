import uuid
from datetime import date
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.import_log import ImportRow
from app.models.metric_definition import MetricDefinition
from app.schemas.dataset import (
    DatasetRecordResponse,
    DatasetListResponse,
    KPIResponse,
    KPIValue,
    SummaryResponse,
    PeriodSummary,
)


class DatasetService:

    @staticmethod
    async def get_records(
        db: AsyncSession,
        data_source_id: uuid.UUID,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        granularity: Optional[str] = None,
        metric_keys: Optional[list[str]] = None,
        sort_by: str = "period_start",
        sort_order: str = "asc",
        limit: int = 100,
        offset: int = 0,
    ) -> DatasetListResponse:
        query = select(ImportRow).where(ImportRow.data_source_id == data_source_id)
        count_query = select(func.count(ImportRow.id)).where(
            ImportRow.data_source_id == data_source_id
        )

        if date_from:
            query = query.where(ImportRow.period_start >= date_from)
            count_query = count_query.where(ImportRow.period_start >= date_from)
        if date_to:
            query = query.where(ImportRow.period_end <= date_to)
            count_query = count_query.where(ImportRow.period_end <= date_to)
        if granularity:
            query = query.where(ImportRow.granularity == granularity)
            count_query = count_query.where(ImportRow.granularity == granularity)

        # Apply sorting
        sort_col = getattr(ImportRow, sort_by, ImportRow.period_start)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        rows = result.scalars().all()

        # Filter metrics if requested
        items = []
        for row in rows:
            metrics = row.metrics
            if metric_keys and metrics:
                metrics = {k: v for k, v in metrics.items() if k in metric_keys}
            items.append(
                DatasetRecordResponse(
                    id=row.id,
                    data_source_id=row.data_source_id,
                    period_start=row.period_start,
                    period_end=row.period_end,
                    period_number=row.period_number,
                    granularity=row.granularity,
                    dimensions=row.dimensions,
                    metrics=metrics,
                )
            )

        return DatasetListResponse(
            total=total,
            items=items,
            date_from=date_from,
            date_to=date_to,
            granularity=granularity,
        )

    @staticmethod
    async def get_kpis(
        db: AsyncSession,
        data_source_id: uuid.UUID,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> KPIResponse:
        # Get current period rows
        query = select(ImportRow).where(ImportRow.data_source_id == data_source_id)
        if date_from:
            query = query.where(ImportRow.period_start >= date_from)
        if date_to:
            query = query.where(ImportRow.period_end <= date_to)

        result = await db.execute(query)
        rows = result.scalars().all()

        # Get metric definitions
        metric_defs_result = await db.execute(
            select(MetricDefinition).where(
                MetricDefinition.data_source_id == data_source_id,
                MetricDefinition.is_visible == True,
            ).order_by(MetricDefinition.sort_order)
        )
        metric_defs = metric_defs_result.scalars().all()

        # Aggregate metrics by summing
        aggregated: dict[str, float] = {}
        for row in rows:
            if row.metrics:
                for k, v in row.metrics.items():
                    if isinstance(v, (int, float)):
                        aggregated[k] = aggregated.get(k, 0.0) + v

        kpis = []
        if metric_defs:
            for md in metric_defs:
                agg_method = md.aggregation or "sum"
                value = aggregated.get(md.key)
                if value is not None and agg_method == "avg" and len(rows) > 0:
                    value = value / len(rows)
                kpis.append(
                    KPIValue(
                        key=md.key,
                        name_ru=md.name_ru,
                        name_en=md.name_en,
                        value=value,
                        unit=md.unit,
                        format_pattern=md.format_pattern,
                    )
                )
        else:
            # Return raw aggregated values when no definitions
            for k, v in aggregated.items():
                kpis.append(KPIValue(key=k, name_ru=k, value=v))

        return KPIResponse(
            data_source_id=data_source_id,
            period_from=date_from,
            period_to=date_to,
            kpis=kpis,
        )

    @staticmethod
    async def get_summary(
        db: AsyncSession,
        data_source_id: uuid.UUID,
        granularity: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> SummaryResponse:
        query = select(ImportRow).where(ImportRow.data_source_id == data_source_id)
        if date_from:
            query = query.where(ImportRow.period_start >= date_from)
        if date_to:
            query = query.where(ImportRow.period_end <= date_to)
        if granularity:
            query = query.where(ImportRow.granularity == granularity)

        query = query.order_by(ImportRow.period_start.asc())
        result = await db.execute(query)
        rows = result.scalars().all()

        periods = [
            PeriodSummary(
                period_start=row.period_start,
                period_end=row.period_end,
                metrics=row.metrics or {},
            )
            for row in rows
        ]

        return SummaryResponse(
            data_source_id=data_source_id,
            granularity=granularity,
            period_from=date_from,
            period_to=date_to,
            total_records=len(rows),
            periods=periods,
        )
