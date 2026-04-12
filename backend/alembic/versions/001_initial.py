"""Initial migration - create all tables

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums
    user_role = postgresql.ENUM("admin", "editor", "viewer", name="user_role")
    user_role.create(op.get_bind())

    granularity_type = postgresql.ENUM("day", "week", "month", "custom", name="granularity_type")
    granularity_type.create(op.get_bind())

    import_status = postgresql.ENUM(
        "pending", "processing", "success", "error", "duplicate", name="import_status"
    )
    import_status.create(op.get_bind())

    widget_type = postgresql.ENUM(
        "kpi_card", "line_chart", "bar_chart", "area_chart", "pie_chart", "data_table", "metric_summary",
        name="widget_type",
    )
    widget_type.create(op.get_bind())

    # Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column(
            "role",
            sa.Enum("admin", "editor", "viewer", name="user_role"),
            nullable=False,
            server_default="viewer",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Invites table
    op.create_table(
        "invites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("token", sa.String(128), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "editor", "viewer", name="user_role"),
            nullable=False,
            server_default="viewer",
        ),
        sa.Column("invited_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("used_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["invited_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["used_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_invites_token", "invites", ["token"], unique=True)

    # Data sources table
    op.create_table(
        "data_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_type", sa.String(50), nullable=False, server_default="csv"),
        sa.Column("schema", postgresql.JSONB(), nullable=False),
        sa.Column("column_mapping", postgresql.JSONB(), nullable=False),
        sa.Column(
            "granularity",
            sa.Enum("day", "week", "month", "custom", name="granularity_type"),
            nullable=True,
        ),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_data_sources_slug", "data_sources", ["slug"], unique=True)

    # Imports table
    op.create_table(
        "imports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("data_source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("file_hash", sa.String(64), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "processing", "success", "error", "duplicate", name="import_status"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("row_count", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("imported_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "imported_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("period_from", sa.Date(), nullable=True),
        sa.Column("period_to", sa.Date(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["imported_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_imports_data_source_id", "imports", ["data_source_id"])
    op.create_index("ix_imports_file_hash", "imports", ["file_hash"])

    # Import rows table
    op.create_table(
        "import_rows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("import_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("data_source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("period_number", sa.Integer(), nullable=True),
        sa.Column("granularity", sa.String(20), nullable=True),
        sa.Column("dimensions", postgresql.JSONB(), nullable=True),
        sa.Column("metrics", postgresql.JSONB(), nullable=True),
        sa.Column("raw_data", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["import_id"], ["imports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_import_rows_import_id", "import_rows", ["import_id"])
    op.create_index("ix_import_rows_data_source_id", "import_rows", ["data_source_id"])
    op.create_index("ix_import_rows_period_start", "import_rows", ["period_start"])
    op.create_index("ix_import_rows_period_end", "import_rows", ["period_end"])

    # Metric definitions table
    op.create_table(
        "metric_definitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("data_source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("key", sa.String(100), nullable=False),
        sa.Column("name_ru", sa.String(255), nullable=False),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("description_ru", sa.Text(), nullable=True),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("data_type", sa.String(50), nullable=True),
        sa.Column("aggregation", sa.String(50), nullable=True),
        sa.Column("format_pattern", sa.String(100), nullable=True),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_metric_definitions_data_source_id", "metric_definitions", ["data_source_id"])
    op.create_index("ix_metric_definitions_key", "metric_definitions", ["key"])

    # Dimension definitions table
    op.create_table(
        "dimension_definitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("data_source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("key", sa.String(100), nullable=False),
        sa.Column("name_ru", sa.String(255), nullable=False),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("data_type", sa.String(50), nullable=True),
        sa.Column("is_filterable", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default="true"),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_dimension_definitions_data_source_id", "dimension_definitions", ["data_source_id"])
    op.create_index("ix_dimension_definitions_key", "dimension_definitions", ["key"])

    # Dashboards table
    op.create_table(
        "dashboards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("data_source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("layout", postgresql.JSONB(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_dashboards_slug", "dashboards", ["slug"], unique=True)

    # Dashboard widgets table
    op.create_table(
        "dashboard_widgets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("dashboard_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column(
            "widget_type",
            sa.Enum(
                "kpi_card", "line_chart", "bar_chart", "area_chart", "pie_chart",
                "data_table", "metric_summary",
                name="widget_type",
            ),
            nullable=False,
        ),
        sa.Column("data_source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metric_keys", postgresql.JSONB(), nullable=True),
        sa.Column("dimension_keys", postgresql.JSONB(), nullable=True),
        sa.Column("filters", postgresql.JSONB(), nullable=True),
        sa.Column("chart_config", postgresql.JSONB(), nullable=True),
        sa.Column("position", postgresql.JSONB(), nullable=True),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["dashboard_id"], ["dashboards.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_dashboard_widgets_dashboard_id", "dashboard_widgets", ["dashboard_id"])


def downgrade() -> None:
    op.drop_table("dashboard_widgets")
    op.drop_table("dashboards")
    op.drop_table("dimension_definitions")
    op.drop_table("metric_definitions")
    op.drop_table("import_rows")
    op.drop_table("imports")
    op.drop_table("data_sources")
    op.drop_table("invites")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS widget_type")
    op.execute("DROP TYPE IF EXISTS import_status")
    op.execute("DROP TYPE IF EXISTS granularity_type")
    op.execute("DROP TYPE IF EXISTS user_role")
