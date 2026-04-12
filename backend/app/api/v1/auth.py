from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    AccessTokenResponse,
    LogoutRequest,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user and return access + refresh tokens."""
    user = await AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return AuthService.create_tokens(user)


@router.post("/refresh", response_model=AccessTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    refresh_data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Get new access token using refresh token."""
    return await AuthService.refresh_access_token(db, refresh_data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    logout_data: LogoutRequest = LogoutRequest(),
    current_user: User = Depends(get_current_active_user),
):
    """Logout (client should discard tokens)."""
    # Stateless JWT: just return 204. Client removes tokens.
    # To implement token blacklist, add a Redis/DB revocation list.
    return None


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_me(
    current_user: User = Depends(get_current_active_user),
):
    """Get current authenticated user info."""
    return UserResponse.model_validate(current_user)
