import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token, create_refresh_token
from datetime import timedelta
from tests.conftest import get_auth_headers


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@test.com", "password": "password"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, admin_user: User):
    headers = get_auth_headers(admin_user)
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == admin_user.email
    assert data["role"] == UserRole.admin.value


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, admin_user: User):
    refresh_token = create_refresh_token(
        subject=str(admin_user.id),
        expires_delta=timedelta(days=7),
    )
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_refresh_with_access_token_fails(client: AsyncClient, admin_user: User):
    access_token = create_access_token(
        subject=str(admin_user.id),
        expires_delta=timedelta(minutes=30),
        additional_claims={"role": admin_user.role.value, "email": admin_user.email},
    )
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": access_token},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, admin_user: User):
    headers = get_auth_headers(admin_user)
    response = await client.post("/api/v1/auth/logout", headers=headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_me_with_viewer_role(client: AsyncClient, viewer_user: User):
    headers = get_auth_headers(viewer_user)
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == UserRole.viewer.value
