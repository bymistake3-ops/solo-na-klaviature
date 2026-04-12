import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.deps import get_db, get_current_active_user, require_editor
from app.core.config import settings
from app.models.import_log import ImportLog, ImportStatus
from app.models.user import User
from app.schemas.import_log import ImportLogResponse, ImportLogListResponse, ImportResult
from app.services.csv_importer import CSVImporter
from app.services.data_source_service import DataSourceService

router = APIRouter(prefix="/imports", tags=["imports"])


@router.post(
    "/upload/{data_source_id}",
    response_model=ImportResult,
    status_code=status.HTTP_201_CREATED,
)
async def upload_csv(
    data_source_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
):
    """Upload and import a CSV file for a specific data source."""
    # Validate data source exists
    ds = await DataSourceService.get_or_404(db, data_source_id)

    if not ds.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data source is not active",
        )

    # Validate file type
    if file.content_type not in (
        "text/csv",
        "application/csv",
        "text/plain",
        "application/octet-stream",
        "application/vnd.ms-excel",
    ):
        if not (file.filename or "").endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are accepted",
            )

    # Read file content
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    importer = CSVImporter(db)
    result = await importer.import_csv(
        data_source=ds,
        content=content,
        original_filename=file.filename or "upload.csv",
        imported_by=current_user,
    )
    return result


@router.get("/", response_model=ImportLogListResponse, status_code=status.HTTP_200_OK)
async def list_imports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    data_source_id: Optional[uuid.UUID] = Query(None),
    status: Optional[ImportStatus] = Query(None),
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List import logs."""
    query = select(ImportLog)
    count_query = select(func.count(ImportLog.id))

    if data_source_id:
        query = query.where(ImportLog.data_source_id == data_source_id)
        count_query = count_query.where(ImportLog.data_source_id == data_source_id)
    if status:
        query = query.where(ImportLog.status == status)
        count_query = count_query.where(ImportLog.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(ImportLog.imported_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    return ImportLogListResponse(
        total=total,
        items=[ImportLogResponse.model_validate(log) for log in logs],
    )


@router.get("/{import_id}", response_model=ImportLogResponse, status_code=status.HTTP_200_OK)
async def get_import(
    import_id: uuid.UUID,
    _user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get import log by ID."""
    result = await db.execute(select(ImportLog).where(ImportLog.id == import_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import log not found",
        )
    return ImportLogResponse.model_validate(log)
