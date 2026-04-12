"""
Seed script for Solo Analytics platform.
Creates admin user, data sources, imports all demo CSVs,
creates metric/dimension definitions, and sets up the default dashboard.

Usage:
    cd backend
    python seed/seed.py
"""
import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.data_source import DataSource
from app.models.metric_definition import MetricDefinition
from app.models.dimension_definition import DimensionDefinition
from app.models.dashboard import Dashboard
from app.models.widget import DashboardWidget, WidgetType
from app.core.security import get_password_hash
from app.services.csv_importer import CSVImporter
from app.registry.data_source_registry import DEFAULT_DATA_SOURCES
from app.registry.metric_registry import DEFAULT_METRICS
from app.registry.dimension_registry import DEFAULT_DIMENSIONS

DEMO_DATA_DIR = Path(__file__).parent / "demo_data"

# Map slug -> CSV files to import
SLUG_CSV_MAP = {
    "new_users_daily": ["new_users_daily.csv"],
    "new_users_weekly": ["new_users_weekly.csv"],
    "new_users_monthly": ["new_users_monthly.csv"],
    "new_payments_daily": ["new_payments_daily.csv"],
    "new_payments_weekly": ["new_payments_weekly.csv"],
    "new_payments_monthly": ["new_payments_monthly.csv"],
    "repeat_payments_daily": ["repeat_payments_daily.csv"],
    "repeat_payments_weekly": ["repeat_payments_weekly.csv"],
    "repeat_payments_monthly": ["repeat_payments_monthly.csv"],
}


async def create_admin(db: AsyncSession) -> User:
    result = await db.execute(
        select(User).where(User.email == settings.FIRST_ADMIN_EMAIL)
    )
    existing = result.scalar_one_or_none()
    if existing:
        print(f"  Admin user already exists: {settings.FIRST_ADMIN_EMAIL}")
        return existing

    admin = User(
        email=settings.FIRST_ADMIN_EMAIL,
        hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
        full_name=settings.FIRST_ADMIN_NAME,
        role=UserRole.admin,
        is_active=True,
    )
    db.add(admin)
    await db.flush()
    await db.refresh(admin)
    print(f"  Created admin: {admin.email} (password: {settings.FIRST_ADMIN_PASSWORD})")
    return admin


async def create_data_sources(db: AsyncSession, admin: User) -> dict[str, DataSource]:
    sources = {}
    for ds_data in DEFAULT_DATA_SOURCES:
        result = await db.execute(
            select(DataSource).where(DataSource.slug == ds_data["slug"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  Data source already exists: {ds_data['slug']}")
            sources[ds_data["slug"]] = existing
            continue

        from app.models.data_source import Granularity
        gran = None
        if ds_data.get("granularity"):
            gran = Granularity(ds_data["granularity"])

        ds = DataSource(
            name=ds_data["name"],
            slug=ds_data["slug"],
            description=ds_data.get("description"),
            source_type=ds_data.get("source_type", "csv"),
            schema=ds_data["schema"],
            column_mapping=ds_data["column_mapping"],
            granularity=gran,
            category=ds_data.get("category"),
            is_active=ds_data.get("is_active", True),
            created_by=admin.id,
        )
        db.add(ds)
        await db.flush()
        await db.refresh(ds)
        sources[ds.slug] = ds
        print(f"  Created data source: {ds.slug}")

    return sources


async def create_metric_definitions(
    db: AsyncSession, sources: dict[str, DataSource]
) -> None:
    for m in DEFAULT_METRICS:
        slug = m["data_source_slug"]
        ds = sources.get(slug)
        if not ds:
            print(f"  WARNING: Data source not found for metric: {slug}")
            continue

        result = await db.execute(
            select(MetricDefinition).where(
                MetricDefinition.data_source_id == ds.id,
                MetricDefinition.key == m["key"],
            )
        )
        if result.scalar_one_or_none():
            continue

        metric = MetricDefinition(
            data_source_id=ds.id,
            key=m["key"],
            name_ru=m["name_ru"],
            name_en=m.get("name_en"),
            description_ru=m.get("description_ru"),
            unit=m.get("unit"),
            data_type=m.get("data_type"),
            aggregation=m.get("aggregation"),
            format_pattern=m.get("format_pattern"),
            is_visible=m.get("is_visible", True),
            sort_order=m.get("sort_order", 0),
        )
        db.add(metric)

    await db.flush()
    print(f"  Metric definitions seeded ({len(DEFAULT_METRICS)} metrics)")


async def create_dimension_definitions(
    db: AsyncSession, sources: dict[str, DataSource]
) -> None:
    for d in DEFAULT_DIMENSIONS:
        slug = d["data_source_slug"]
        ds = sources.get(slug)
        if not ds:
            continue

        result = await db.execute(
            select(DimensionDefinition).where(
                DimensionDefinition.data_source_id == ds.id,
                DimensionDefinition.key == d["key"],
            )
        )
        if result.scalar_one_or_none():
            continue

        dim = DimensionDefinition(
            data_source_id=ds.id,
            key=d["key"],
            name_ru=d["name_ru"],
            name_en=d.get("name_en"),
            data_type=d.get("data_type"),
            is_filterable=d.get("is_filterable", True),
            is_visible=d.get("is_visible", True),
        )
        db.add(dim)

    await db.flush()
    print(f"  Dimension definitions seeded ({len(DEFAULT_DIMENSIONS)} dimensions)")


async def import_csv_files(
    db: AsyncSession,
    sources: dict[str, DataSource],
    admin: User,
) -> None:
    importer = CSVImporter(db)

    for slug, csv_files in SLUG_CSV_MAP.items():
        ds = sources.get(slug)
        if not ds:
            print(f"  WARNING: No data source for slug '{slug}', skipping import")
            continue

        for csv_filename in csv_files:
            csv_path = DEMO_DATA_DIR / csv_filename
            if not csv_path.exists():
                print(f"  WARNING: CSV file not found: {csv_path}")
                continue

            content = csv_path.read_bytes()
            result = await importer.import_csv(
                data_source=ds,
                content=content,
                original_filename=csv_filename,
                imported_by=admin,
            )
            print(
                f"  Imported {csv_filename} -> {result.status.value}: "
                f"{result.rows_inserted} inserted, {result.rows_updated} updated"
                + (f" (errors: {len(result.errors)})" if result.errors else "")
            )


async def create_default_dashboard(
    db: AsyncSession,
    sources: dict[str, DataSource],
    admin: User,
) -> Dashboard:
    result = await db.execute(select(Dashboard).where(Dashboard.slug == "main"))
    existing = result.scalar_one_or_none()
    if existing:
        print("  Default dashboard already exists")
        return existing

    ds_new_users = sources.get("new_users_daily")
    ds_new_payments = sources.get("new_payments_daily")
    ds_repeat_payments = sources.get("repeat_payments_daily")

    dashboard = Dashboard(
        name="Главный дашборд",
        slug="main",
        description="Основные KPI и метрики платформы",
        is_default=True,
        created_by=admin.id,
        layout={
            "cols": 12,
            "rowHeight": 80,
        },
    )
    db.add(dashboard)
    await db.flush()
    await db.refresh(dashboard)

    widgets = []

    # KPI cards row
    if ds_new_users:
        widgets.append(DashboardWidget(
            dashboard_id=dashboard.id,
            title="Новые пользователи",
            widget_type=WidgetType.kpi_card,
            data_source_id=ds_new_users.id,
            metric_keys=["new_users"],
            position={"x": 0, "y": 0, "w": 3, "h": 2},
            chart_config={"color": "#4F46E5"},
            sort_order=0,
        ))

    if ds_new_payments:
        widgets.append(DashboardWidget(
            dashboard_id=dashboard.id,
            title="Новые платежи",
            widget_type=WidgetType.kpi_card,
            data_source_id=ds_new_payments.id,
            metric_keys=["total_payments_count"],
            position={"x": 3, "y": 0, "w": 3, "h": 2},
            chart_config={"color": "#059669"},
            sort_order=1,
        ))
        widgets.append(DashboardWidget(
            dashboard_id=dashboard.id,
            title="Выручка (брутто)",
            widget_type=WidgetType.kpi_card,
            data_source_id=ds_new_payments.id,
            metric_keys=["total_amount_gross"],
            position={"x": 6, "y": 0, "w": 3, "h": 2},
            chart_config={"color": "#D97706"},
            sort_order=2,
        ))

    if ds_repeat_payments:
        widgets.append(DashboardWidget(
            dashboard_id=dashboard.id,
            title="Повторные платежи",
            widget_type=WidgetType.kpi_card,
            data_source_id=ds_repeat_payments.id,
            metric_keys=["total_payments_count"],
            position={"x": 9, "y": 0, "w": 3, "h": 2},
            chart_config={"color": "#7C3AED"},
            sort_order=3,
        ))

    # Charts row
    if ds_new_users:
        widgets.append(DashboardWidget(
            dashboard_id=dashboard.id,
            title="Динамика новых пользователей",
            widget_type=WidgetType.line_chart,
            data_source_id=ds_new_users.id,
            metric_keys=["new_users"],
            position={"x": 0, "y": 2, "w": 6, "h": 4},
            chart_config={
                "color": "#4F46E5",
                "x_axis": "period_start",
                "fill": True,
            },
            sort_order=4,
        ))

    if ds_new_payments:
        widgets.append(DashboardWidget(
            dashboard_id=dashboard.id,
            title="Сумма новых платежей (брутто/нетто)",
            widget_type=WidgetType.area_chart,
            data_source_id=ds_new_payments.id,
            metric_keys=["total_amount_gross", "total_amount_net"],
            position={"x": 6, "y": 2, "w": 6, "h": 4},
            chart_config={
                "colors": {"total_amount_gross": "#D97706", "total_amount_net": "#059669"},
                "x_axis": "period_start",
            },
            sort_order=5,
        ))

    # Data table
    if ds_new_payments:
        widgets.append(DashboardWidget(
            dashboard_id=dashboard.id,
            title="Детализация платежей",
            widget_type=WidgetType.data_table,
            data_source_id=ds_new_payments.id,
            metric_keys=[
                "total_payments_count",
                "payments_afterjoin_count",
                "payments_byguest_count",
                "total_amount_gross",
                "total_amount_net",
                "avg_amount_gross",
            ],
            position={"x": 0, "y": 6, "w": 12, "h": 5},
            chart_config={"page_size": 20},
            sort_order=6,
        ))

    # Metric summary
    if ds_repeat_payments:
        widgets.append(DashboardWidget(
            dashboard_id=dashboard.id,
            title="Итоги повторных платежей",
            widget_type=WidgetType.metric_summary,
            data_source_id=ds_repeat_payments.id,
            metric_keys=["total_payments_count", "total_amount_gross", "total_amount_net", "avg_amount_gross"],
            position={"x": 0, "y": 11, "w": 12, "h": 3},
            sort_order=7,
        ))

    for widget in widgets:
        db.add(widget)

    await db.flush()
    print(f"  Created default dashboard 'main' with {len(widgets)} widgets")
    return dashboard


async def seed():
    print("Starting seed process...")
    print(f"Database: {settings.DATABASE_URL}")

    async with async_session_factory() as db:
        try:
            print("\n1. Creating admin user...")
            admin = await create_admin(db)

            print("\n2. Creating data sources...")
            sources = await create_data_sources(db, admin)

            print("\n3. Creating metric definitions...")
            await create_metric_definitions(db, sources)

            print("\n4. Creating dimension definitions...")
            await create_dimension_definitions(db, sources)

            print("\n5. Importing CSV demo data...")
            await import_csv_files(db, sources, admin)

            print("\n6. Creating default dashboard...")
            await create_default_dashboard(db, sources, admin)

            await db.commit()
            print("\nSeed completed successfully!")
            print(f"\nAdmin credentials:")
            print(f"  Email:    {settings.FIRST_ADMIN_EMAIL}")
            print(f"  Password: {settings.FIRST_ADMIN_PASSWORD}")

        except Exception as e:
            await db.rollback()
            print(f"\nSeed FAILED: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(seed())
