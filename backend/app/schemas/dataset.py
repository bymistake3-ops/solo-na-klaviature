import uuid
from datetime import date
from typing import Optional, Any
from pydantic import BaseModel


class DatasetRecordResponse(BaseModel):
    id: uuid.UUID
    data_source_id: uuid.UUID
    period_start: date
    period_end: date
    period_number: Optional[int] = None
    granularity: Optional[str] = None
    dimensions: Optional[dict[str, Any]] = None
    metrics: Optional[dict[str, Any]] = None

    model_config = {"from_attributes": True}


class DatasetListResponse(BaseModel):
    total: int
    items: list[DatasetRecordResponse]
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    granularity: Optional[str] = None


class KPIValue(BaseModel):
    key: str
    name_ru: str
    name_en: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    format_pattern: Optional[str] = None
    change_pct: Optional[float] = None  # % change vs previous period


class KPIResponse(BaseModel):
    data_source_id: uuid.UUID
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    kpis: list[KPIValue]


class PeriodSummary(BaseModel):
    period_start: date
    period_end: date
    metrics: dict[str, Any]


class SummaryResponse(BaseModel):
    data_source_id: uuid.UUID
    granularity: Optional[str] = None
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    total_records: int
    periods: list[PeriodSummary]
