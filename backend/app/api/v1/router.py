from fastapi import APIRouter
from app.api.v1 import auth, users, invites, data_sources, imports, datasets, metrics, dashboards

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(invites.router)
api_router.include_router(data_sources.router)
api_router.include_router(imports.router)
api_router.include_router(datasets.router)
api_router.include_router(metrics.router)
api_router.include_router(dashboards.router)
