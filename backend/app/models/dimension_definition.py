import uuid
from sqlalchemy import (
    Boolean,
    ForeignKey,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class DimensionDefinition(Base):
    __tablename__ = "dimension_definitions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    data_source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=True, index=True
    )
    key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name_ru: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    data_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_filterable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    data_source = relationship("DataSource", back_populates="dimension_definitions")
