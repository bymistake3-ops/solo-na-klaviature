import asyncio
import uuid
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.core.deps import get_db
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token
from datetime import timedelta

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Create all tables once per test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Get test DB session."""
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Get test HTTP client with overridden DB dependency."""
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(db: AsyncSession) -> User:
    """Create an admin user for tests."""
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test Admin",
        role=UserRole.admin,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def viewer_user(db: AsyncSession) -> User:
    """Create a viewer user for tests."""
    user = User(
        email=f"viewer_{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test Viewer",
        role=UserRole.viewer,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


def get_auth_headers(user: User) -> dict:
    """Get Authorization headers for a user."""
    token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=30),
        additional_claims={"role": user.role.value, "email": user.email},
    )
    return {"Authorization": f"Bearer {token}"}
