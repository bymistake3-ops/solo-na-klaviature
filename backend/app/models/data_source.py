import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Granularity(str, PyEnum):
    day = "day"
    week = "week"
    month = "month"
    custom = "custom"


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, default="csv")
    schema: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    column_mapping: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    granularity: Mapped[Granularity | None] = mapped_column(
        Enum(Granularity, name="granularity_type"), nullable=True
    )
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    creator = relationship("User", back_populates="data_sources")
    imports = relationship("ImportLog", back_populates="data_source", lazy="select")
    import_rows = relationship("ImportRow", back_populates="data_source", lazy="select")
    metric_definitions = relationship("MetricDefinition", back_populates="data_source", lazy="select")
    dimension_definitions = relationship("DimensionDefinition", back_populates="data_source", lazy="select")
    dashboards = relationship("Dashboard", back_populates="data_source", lazy="select")
    widgets = relationship("DashboardWidget", back_populates="data_source", lazy="select")
