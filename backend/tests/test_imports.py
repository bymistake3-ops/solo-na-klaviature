import io
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.data_source import DataSource, Granularity
from app.core.security import get_password_hash
from tests.conftest import get_auth_headers


def make_new_users_csv(rows: int = 10) -> bytes:
    lines = ["period_start,period_end,period_number,new_users"]
    from datetime import date, timedelta
    start = date(2024, 1, 1)
    for i in range(rows):
        d = start + timedelta(days=i)
        lines.append(f"{d},{d},{i+1},{100 + i}")
    return "\n".join(lines).encode("utf-8")


async def create_test_data_source(db: AsyncSession, admin: User) -> DataSource:
    ds = DataSource(
        name="Test Users",
        slug=f"test_users_{id(db)}",
        description="Test data source",
        source_type="csv",
        schema={
            "columns": [
                {"name": "period_start", "data_type": "date", "required": True},
                {"name": "period_end", "data_type": "date", "required": True},
                {"name": "period_number", "data_type": "integer", "required": False},
                {"name": "new_users", "data_type": "integer", "required": True},
            ]
        },
        column_mapping={
            "period_start": "period_start",
            "period_end": "period_end",
            "period_number": "period_number",
            "new_users": "new_users",
        },
        granularity=Granularity.day,
        category="users",
        is_active=True,
        created_by=admin.id,
    )
    db.add(ds)
    await db.flush()
    await db.refresh(ds)
    return ds


@pytest.mark.asyncio
async def test_upload_csv_success(client: AsyncClient, db: AsyncSession, admin_user: User):
    ds = await create_test_data_source(db, admin_user)
    headers = get_auth_headers(admin_user)

    csv_content = make_new_users_csv(10)
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}

    response = await client.post(
        f"/api/v1/imports/upload/{ds.id}",
        headers=headers,
        files=files,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["rows_processed"] == 10
    assert data["rows_inserted"] == 10
    assert data["rows_updated"] == 0


@pytest.mark.asyncio
async def test_upload_csv_duplicate(client: AsyncClient, db: AsyncSession, admin_user: User):
    ds = await create_test_data_source(db, admin_user)
    headers = get_auth_headers(admin_user)

    csv_content = make_new_users_csv(5)

    # First upload
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    response1 = await client.post(
        f"/api/v1/imports/upload/{ds.id}",
        headers=headers,
        files=files,
    )
    assert response1.status_code == 201
    assert response1.json()["status"] == "success"

    # Second upload with same content -> duplicate
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    response2 = await client.post(
        f"/api/v1/imports/upload/{ds.id}",
        headers=headers,
        files=files,
    )
    assert response2.status_code == 201
    assert response2.json()["status"] == "duplicate"


@pytest.mark.asyncio
async def test_upload_csv_viewer_forbidden(client: AsyncClient, db: AsyncSession, admin_user: User, viewer_user: User):
    ds = await create_test_data_source(db, admin_user)
    headers = get_auth_headers(viewer_user)

    csv_content = make_new_users_csv(3)
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}

    response = await client.post(
        f"/api/v1/imports/upload/{ds.id}",
        headers=headers,
        files=files,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_upload_csv_empty_file(client: AsyncClient, db: AsyncSession, admin_user: User):
    ds = await create_test_data_source(db, admin_user)
    headers = get_auth_headers(admin_user)

    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = await client.post(
        f"/api/v1/imports/upload/{ds.id}",
        headers=headers,
        files=files,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_upload_nonexistent_datasource(client: AsyncClient, admin_user: User):
    import uuid
    headers = get_auth_headers(admin_user)
    csv_content = make_new_users_csv(3)
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}

    response = await client.post(
        f"/api/v1/imports/upload/{uuid.uuid4()}",
        headers=headers,
        files=files,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_imports(client: AsyncClient, db: AsyncSession, admin_user: User):
    headers = get_auth_headers(admin_user)
    response = await client.get("/api/v1/imports/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data


@pytest.mark.asyncio
async def test_upload_and_reimport_updates(client: AsyncClient, db: AsyncSession, admin_user: User):
    """Re-importing different content for same periods should update rows."""
    ds = await create_test_data_source(db, admin_user)
    headers = get_auth_headers(admin_user)

    csv_content1 = make_new_users_csv(5)
    files = {"file": ("v1.csv", io.BytesIO(csv_content1), "text/csv")}
    r1 = await client.post(f"/api/v1/imports/upload/{ds.id}", headers=headers, files=files)
    assert r1.status_code == 201

    # Different content, same periods -> should update
    from datetime import date, timedelta
    lines = ["period_start,period_end,period_number,new_users"]
    start = date(2024, 1, 1)
    for i in range(5):
        d = start + timedelta(days=i)
        lines.append(f"{d},{d},{i+1},{999}")  # different values
    csv_content2 = "\n".join(lines).encode("utf-8")

    files = {"file": ("v2.csv", io.BytesIO(csv_content2), "text/csv")}
    r2 = await client.post(f"/api/v1/imports/upload/{ds.id}", headers=headers, files=files)
    assert r2.status_code == 201
    data = r2.json()
    assert data["status"] == "success"
    assert data["rows_updated"] == 5
    assert data["rows_inserted"] == 0
