import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel
from app.models.widget import WidgetType


class DashboardCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    data_source_id: Optional[uuid.UUID] = None
    layout: Optional[dict[str, Any]] = None
    is_default: bool = False


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    data_source_id: Optional[uuid.UUID] = None
    layout: Optional[dict[str, Any]] = None
    is_default: Optional[bool] = None


class DashboardResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    data_source_id: Optional[uuid.UUID] = None
    layout: Optional[dict[str, Any]] = None
    is_default: bool
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DashboardWithWidgets(DashboardResponse):
    widgets: list["WidgetResponse"] = []


class DashboardListResponse(BaseModel):
    total: int
    items: list[DashboardResponse]


class WidgetCreate(BaseModel):
    title: str
    widget_type: WidgetType
    data_source_id: Optional[uuid.UUID] = None
    metric_keys: Optional[list[str]] = None
    dimension_keys: Optional[list[str]] = None
    filters: Optional[dict[str, Any]] = None
    chart_config: Optional[dict[str, Any]] = None
    position: Optional[dict[str, Any]] = None
    is_visible: bool = True
    sort_order: int = 0


class WidgetUpdate(BaseModel):
    title: Optional[str] = None
    widget_type: Optional[WidgetType] = None
    data_source_id: Optional[uuid.UUID] = None
    metric_keys: Optional[list[str]] = None
    dimension_keys: Optional[list[str]] = None
    filters: Optional[dict[str, Any]] = None
    chart_config: Optional[dict[str, Any]] = None
    position: Optional[dict[str, Any]] = None
    is_visible: Optional[bool] = None
    sort_order: Optional[int] = None


class WidgetResponse(BaseModel):
    id: uuid.UUID
    dashboard_id: uuid.UUID
    title: str
    widget_type: WidgetType
    data_source_id: Optional[uuid.UUID] = None
    metric_keys: Optional[list[str]] = None
    dimension_keys: Optional[list[str]] = None
    filters: Optional[dict[str, Any]] = None
    chart_config: Optional[dict[str, Any]] = None
    position: Optional[dict[str, Any]] = None
    is_visible: bool
    sort_order: int

    model_config = {"from_attributes": True}


DashboardWithWidgets.model_rebuild()
