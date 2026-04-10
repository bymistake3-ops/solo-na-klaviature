import uuid
from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel
from app.models.import_log import ImportStatus


class ImportLogResponse(BaseModel):
    id: uuid.UUID
    data_source_id: uuid.UUID
    filename: str
    original_filename: str
    file_hash: str
    status: ImportStatus
    row_count: Optional[int] = None
    error_message: Optional[str] = None
    imported_by: Optional[uuid.UUID] = None
    imported_at: datetime
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    metadata_: Optional[dict[str, Any]] = None

    model_config = {"from_attributes": True}


class ImportLogListResponse(BaseModel):
    total: int
    items: list[ImportLogResponse]


class ImportRowResponse(BaseModel):
    id: uuid.UUID
    import_id: uuid.UUID
    data_source_id: uuid.UUID
    period_start: date
    period_end: date
    period_number: Optional[int] = None
    granularity: Optional[str] = None
    dimensions: Optional[dict[str, Any]] = None
    metrics: Optional[dict[str, Any]] = None
    raw_data: Optional[dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ImportResult(BaseModel):
    import_id: uuid.UUID
    status: ImportStatus
    rows_processed: int
    rows_inserted: int
    rows_updated: int
    errors: list[str] = []
    warnings: list[str] = []
    period_from: Optional[date] = None
    period_to: Optional[date] = None
