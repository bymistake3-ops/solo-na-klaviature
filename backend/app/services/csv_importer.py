import hashlib
import io
import uuid
from datetime import date, datetime, timezone
from typing import Optional, Any
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.data_source import DataSource
from app.models.import_log import ImportLog, ImportRow, ImportStatus
from app.models.user import User
from app.schemas.import_log import ImportResult


DATE_FORMATS = [
    "%Y-%m-%d",
    "%d.%m.%Y",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%Y/%m/%d",
    "%d-%m-%Y",
]


def detect_encoding(content: bytes) -> str:
    """Detect file encoding, preferring utf-8."""
    try:
        content.decode("utf-8")
        return "utf-8"
    except UnicodeDecodeError:
        pass
    try:
        content.decode("cp1251")
        return "cp1251"
    except UnicodeDecodeError:
        pass
    try:
        import chardet
        detected = chardet.detect(content)
        return detected.get("encoding") or "utf-8"
    except ImportError:
        return "utf-8"


def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def parse_date_flexible(value: Any) -> Optional[date]:
    """Try multiple date formats."""
    if pd.isna(value) or value is None:
        return None
    if isinstance(value, (date, datetime)):
        if isinstance(value, datetime):
            return value.date()
        return value
    s = str(value).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    # Try pandas
    try:
        return pd.to_datetime(s).date()
    except Exception:
        return None


def coerce_numeric(value: Any) -> Optional[float]:
    if pd.isna(value) or value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", ".").replace(" ", "")
    try:
        return float(s)
    except ValueError:
        return None


class CSVImporter:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def import_csv(
        self,
        data_source: DataSource,
        content: bytes,
        original_filename: str,
        imported_by: Optional[User] = None,
    ) -> ImportResult:
        errors: list[str] = []
        warnings: list[str] = []

        # Compute hash for dedup
        file_hash = compute_sha256(content)

        # Check for duplicate import
        existing_result = await self.db.execute(
            select(ImportLog).where(
                ImportLog.data_source_id == data_source.id,
                ImportLog.file_hash == file_hash,
                ImportLog.status == ImportStatus.success,
            )
        )
        existing_import = existing_result.scalar_one_or_none()

        # Create import log entry
        import_log = ImportLog(
            data_source_id=data_source.id,
            filename=f"{uuid.uuid4()}_{original_filename}",
            original_filename=original_filename,
            file_hash=file_hash,
            status=ImportStatus.processing,
            imported_by=imported_by.id if imported_by else None,
            imported_at=datetime.now(timezone.utc),
        )
        self.db.add(import_log)
        await self.db.flush()
        await self.db.refresh(import_log)

        if existing_import:
            import_log.status = ImportStatus.duplicate
            warnings.append(f"Duplicate file detected - same content was previously imported (import id: {existing_import.id})")
            await self.db.flush()
            return ImportResult(
                import_id=import_log.id,
                status=ImportStatus.duplicate,
                rows_processed=0,
                rows_inserted=0,
                rows_updated=0,
                errors=errors,
                warnings=warnings,
            )

        try:
            result = await self._process_csv(
                data_source=data_source,
                content=content,
                import_log=import_log,
                errors=errors,
                warnings=warnings,
            )
            return result
        except Exception as e:
            import_log.status = ImportStatus.error
            import_log.error_message = str(e)
            await self.db.flush()
            return ImportResult(
                import_id=import_log.id,
                status=ImportStatus.error,
                rows_processed=0,
                rows_inserted=0,
                rows_updated=0,
                errors=[str(e)],
                warnings=warnings,
            )

    async def _process_csv(
        self,
        data_source: DataSource,
        content: bytes,
        import_log: ImportLog,
        errors: list[str],
        warnings: list[str],
    ) -> ImportResult:
        encoding = detect_encoding(content)
        try:
            df = pd.read_csv(io.BytesIO(content), encoding=encoding, dtype=str)
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {e}")

        if df.empty:
            raise ValueError("CSV file is empty")

        # Clean column names
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        schema = data_source.schema  # {"columns": [...]}
        column_mapping = data_source.column_mapping  # {csv_col: canonical_field}
        granularity = data_source.granularity.value if data_source.granularity else "day"

        # Validate required columns from mapping
        mapped_cols = set(column_mapping.keys())
        csv_cols = set(df.columns)
        missing = mapped_cols - csv_cols
        if missing:
            missing_required = []
            schema_cols = {col["name"]: col for col in schema.get("columns", [])} if schema else {}
            for col in missing:
                canonical = column_mapping.get(col)
                if canonical and schema_cols.get(canonical, {}).get("required", False):
                    missing_required.append(col)
            if missing_required:
                raise ValueError(f"Required columns missing from CSV: {missing_required}")
            else:
                for col in missing:
                    warnings.append(f"Optional column '{col}' not found in CSV, skipping")

        # Rename CSV columns to canonical names
        rename_map = {k: v for k, v in column_mapping.items() if k in df.columns}
        df = df.rename(columns=rename_map)

        # Identify date columns
        period_start_col = "period_start"
        period_end_col = "period_end"

        if period_start_col not in df.columns:
            # Try to find date column
            date_candidates = [c for c in df.columns if "date" in c or "period" in c or "start" in c]
            if date_candidates:
                df = df.rename(columns={date_candidates[0]: period_start_col})
                warnings.append(f"Using '{date_candidates[0]}' as period_start")
            else:
                raise ValueError("Cannot determine period_start column")

        if period_end_col not in df.columns:
            # Default period_end = period_start for daily
            df[period_end_col] = df[period_start_col]
            warnings.append("period_end not found, using period_start as period_end")

        # Identify numeric (metric) columns
        schema_columns = {col["name"]: col for col in schema.get("columns", [])} if schema else {}
        exclude_cols = {period_start_col, period_end_col, "period_number", "granularity"}
        canonical_names = set(column_mapping.values())
        dimension_cols = [
            col for col in df.columns
            if col not in exclude_cols
            and col in schema_columns
            and schema_columns[col].get("data_type") == "string"
        ]

        metric_cols = [
            col for col in df.columns
            if col not in exclude_cols
            and col not in dimension_cols
            and col != "period_number"
        ]

        rows_processed = 0
        rows_inserted = 0
        rows_updated = 0
        min_date: Optional[date] = None
        max_date: Optional[date] = None

        for idx, row in df.iterrows():
            rows_processed += 1

            # Parse dates
            period_start = parse_date_flexible(row.get(period_start_col))
            period_end = parse_date_flexible(row.get(period_end_col))

            if period_start is None:
                errors.append(f"Row {idx + 2}: invalid period_start value '{row.get(period_start_col)}'")
                continue
            if period_end is None:
                period_end = period_start

            if min_date is None or period_start < min_date:
                min_date = period_start
            if max_date is None or period_end > max_date:
                max_date = period_end

            # Parse period_number
            period_number = None
            if "period_number" in df.columns:
                pn = row.get("period_number")
                if pn is not None and not pd.isna(pn):
                    try:
                        period_number = int(float(str(pn)))
                    except (ValueError, TypeError):
                        pass

            # Extract dimension values
            dimensions = {}
            for dim_col in dimension_cols:
                val = row.get(dim_col)
                if val is not None and not (isinstance(val, float) and pd.isna(val)):
                    dimensions[dim_col] = str(val).strip()

            # Extract metric values
            metrics = {}
            for metric_col in metric_cols:
                val = coerce_numeric(row.get(metric_col))
                if val is not None:
                    metrics[metric_col] = val

            # Raw row data
            raw_data = {}
            for col in df.columns:
                v = row.get(col)
                if v is not None and not (isinstance(v, float) and pd.isna(v)):
                    raw_data[col] = str(v)

            # Check if a row with same data_source + period_start + period_end exists
            existing_row_result = await self.db.execute(
                select(ImportRow).where(
                    ImportRow.data_source_id == data_source.id,
                    ImportRow.period_start == period_start,
                    ImportRow.period_end == period_end,
                )
            )
            existing_row = existing_row_result.scalar_one_or_none()

            if existing_row:
                # Update existing
                existing_row.import_id = import_log.id
                existing_row.period_number = period_number
                existing_row.granularity = granularity
                existing_row.dimensions = dimensions
                existing_row.metrics = metrics
                existing_row.raw_data = raw_data
                rows_updated += 1
            else:
                new_row = ImportRow(
                    import_id=import_log.id,
                    data_source_id=data_source.id,
                    period_start=period_start,
                    period_end=period_end,
                    period_number=period_number,
                    granularity=granularity,
                    dimensions=dimensions,
                    metrics=metrics,
                    raw_data=raw_data,
                )
                self.db.add(new_row)
                rows_inserted += 1

        await self.db.flush()

        # Finalize import log
        import_log.status = ImportStatus.success
        import_log.row_count = rows_processed
        import_log.period_from = min_date
        import_log.period_to = max_date
        import_log.error_message = "; ".join(errors) if errors else None
        await self.db.flush()

        return ImportResult(
            import_id=import_log.id,
            status=ImportStatus.success,
            rows_processed=rows_processed,
            rows_inserted=rows_inserted,
            rows_updated=rows_updated,
            errors=errors,
            warnings=warnings,
            period_from=min_date,
            period_to=max_date,
        )
