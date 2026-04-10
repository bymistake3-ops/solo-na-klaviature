import uuid
from typing import Optional
from pydantic import BaseModel


class MetricDefinitionCreate(BaseModel):
    data_source_id: Optional[uuid.UUID] = None
    key: str
    name_ru: str
    name_en: Optional[str] = None
    description_ru: Optional[str] = None
    unit: Optional[str] = None
    data_type: Optional[str] = None
    aggregation: Optional[str] = None
    format_pattern: Optional[str] = None
    is_visible: bool = True
    sort_order: int = 0


class MetricDefinitionUpdate(BaseModel):
    name_ru: Optional[str] = None
    name_en: Optional[str] = None
    description_ru: Optional[str] = None
    unit: Optional[str] = None
    data_type: Optional[str] = None
    aggregation: Optional[str] = None
    format_pattern: Optional[str] = None
    is_visible: Optional[bool] = None
    sort_order: Optional[int] = None


class MetricDefinitionResponse(BaseModel):
    id: uuid.UUID
    data_source_id: Optional[uuid.UUID] = None
    key: str
    name_ru: str
    name_en: Optional[str] = None
    description_ru: Optional[str] = None
    unit: Optional[str] = None
    data_type: Optional[str] = None
    aggregation: Optional[str] = None
    format_pattern: Optional[str] = None
    is_visible: bool
    sort_order: int

    model_config = {"from_attributes": True}


class DimensionDefinitionCreate(BaseModel):
    data_source_id: Optional[uuid.UUID] = None
    key: str
    name_ru: str
    name_en: Optional[str] = None
    data_type: Optional[str] = None
    is_filterable: bool = True
    is_visible: bool = True


class DimensionDefinitionUpdate(BaseModel):
    name_ru: Optional[str] = None
    name_en: Optional[str] = None
    data_type: Optional[str] = None
    is_filterable: Optional[bool] = None
    is_visible: Optional[bool] = None


class DimensionDefinitionResponse(BaseModel):
    id: uuid.UUID
    data_source_id: Optional[uuid.UUID] = None
    key: str
    name_ru: str
    name_en: Optional[str] = None
    data_type: Optional[str] = None
    is_filterable: bool
    is_visible: bool

    model_config = {"from_attributes": True}
