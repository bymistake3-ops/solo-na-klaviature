import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel
from app.models.data_source import Granularity


class ColumnDefinition(BaseModel):
    name: str
    data_type: str  # 'string', 'integer', 'float', 'date', 'boolean'
    required: bool = False
    description: Optional[str] = None


class DataSourceCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    source_type: str = "csv"
    schema: dict[str, Any]  # column definitions
    column_mapping: dict[str, str]  # CSV col -> canonical field
    granularity: Optional[Granularity] = None
    category: Optional[str] = None
    is_active: bool = True


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schema: Optional[dict[str, Any]] = None
    column_mapping: Optional[dict[str, str]] = None
    granularity: Optional[Granularity] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class DataSourceResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    source_type: str
    schema: dict[str, Any]
    column_mapping: dict[str, str]
    granularity: Optional[Granularity] = None
    category: Optional[str] = None
    is_active: bool
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DataSourceListResponse(BaseModel):
    total: int
    items: list[DataSourceResponse]
