import uuid
from enum import Enum as PyEnum
from sqlalchemy import (
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class WidgetType(str, PyEnum):
    kpi_card = "kpi_card"
    line_chart = "line_chart"
    bar_chart = "bar_chart"
    area_chart = "area_chart"
    pie_chart = "pie_chart"
    data_table = "data_table"
    metric_summary = "metric_summary"


class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dashboard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    widget_type: Mapped[WidgetType] = mapped_column(
        Enum(WidgetType, name="widget_type"), nullable=False
    )
    data_source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True
    )
    metric_keys: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    dimension_keys: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    filters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    chart_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    position: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    dashboard = relationship("Dashboard", back_populates="widgets")
    data_source = relationship("DataSource", back_populates="widgets")
