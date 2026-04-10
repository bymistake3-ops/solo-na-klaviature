# Project Assumptions — СОЛО на клавиатуре Analytics Platform

**Version:** 1.0  
**Date:** 2026-04-10  
**Status:** Approved for MVP

---

## 1. Overview

This document captures the key assumptions made during the design and early development of the СОЛО на клавиатуре analytics platform. Each assumption is recorded with its rationale and the consequences if the assumption turns out to be wrong. Reviewing and challenging these assumptions early reduces rework later.

---

## 2. Technology Choices

### 2.1 Frontend: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Recharts

**Assumption:** The frontend will be built with Next.js 14 using the App Router, TypeScript for type safety, Tailwind CSS for utility-first styling, shadcn/ui for accessible component primitives, and Recharts for data visualizations.

**Rationale:**
- Next.js 14 with the App Router provides server components, streaming, and built-in API route support, giving a strong foundation for a data-heavy application.
- TypeScript eliminates entire categories of runtime bugs and makes refactoring safer as the codebase grows.
- Tailwind CSS eliminates context switching between CSS files and component files; utilities compose predictably and are tree-shaken at build time.
- shadcn/ui provides accessible, unstyled component primitives that integrate natively with Tailwind. Components are copied into the project (not a runtime dependency), giving full ownership of the component code.
- Recharts is a React-native charting library with a declarative API. It renders SVG, which is printable and accessible. It handles the chart types needed for MVP (line, bar, area) without requiring a separate D3 knowledge domain.

**Consequences if wrong:**
- If shadcn/ui primitives prove insufficient for complex chart interactions, a lower-level alternative (Radix UI primitives directly, or a headless solution) would be introduced without changing the rest of the stack.
- If Recharts performance degrades on large datasets (>10,000 data points per render), the charts would be migrated to a Canvas-based library (e.g., uPlot or ECharts). For MVP data volumes (monthly/weekly/daily CSV exports, typically <500 rows), this is not a concern.

### 2.2 Backend: FastAPI (Python 3.12) + SQLAlchemy 2.x + Alembic + PostgreSQL

**Assumption:** The API server will be Python-based, using FastAPI as the web framework, SQLAlchemy 2.x (with async support) as the ORM, Alembic for schema migrations, and PostgreSQL 15 as the primary data store.

**Rationale:**
- FastAPI provides automatic OpenAPI documentation, Pydantic-based request/response validation, and native async support — all essential for a data API.
- Python is the natural home for data processing logic (CSV parsing, metric computation, statistical aggregations). Keeping the data transformation layer in the same language as the API eliminates a serialization boundary.
- SQLAlchemy 2.x with the `async` session interface allows concurrent I/O without blocking the event loop.
- Alembic provides version-controlled database migrations that are essential for a team environment and production deployments.
- PostgreSQL offers JSONB columns (used for widget configuration), full-text search if needed, window functions for cohort queries, and a mature ecosystem.

**Consequences if wrong:**
- If query performance becomes a bottleneck for aggregations, ClickHouse or DuckDB would be evaluated as a read-optimized layer, while PostgreSQL remains the source of truth for transactional data.

### 2.3 Authentication: JWT with Refresh Tokens

**Assumption:** Authentication will use stateless JWT access tokens (15-minute expiry) combined with long-lived refresh tokens (30-day expiry) stored in the database. Access tokens are sent in the `Authorization: Bearer` header. Refresh tokens are stored in an httpOnly cookie.

**Rationale:**
- Short-lived access tokens limit the blast radius of a compromised token.
- Refresh tokens stored in httpOnly cookies are inaccessible to JavaScript, preventing XSS token theft.
- Storing refresh tokens in the database allows immediate revocation (logout, role change, suspicious activity).
- This approach does not require a separate session store or Redis for MVP.

**Consequences if wrong:**
- If the team grows and a shared Redis instance becomes available, refresh tokens could be migrated to Redis for lower-latency validation lookups.

### 2.4 Infrastructure: Docker Compose

**Assumption:** For MVP development and staging, Docker Compose will orchestrate all services: the Next.js frontend, the FastAPI backend, PostgreSQL, and a background worker process (for CSV import jobs).

**Rationale:**
- Docker Compose provides a reproducible local development environment with a single `docker compose up` command.
- It matches the production topology closely enough to catch environment-specific bugs before deployment.
- No Kubernetes expertise is required for the initial team.

**Consequences if wrong:**
- If the team adopts a managed cloud platform (e.g., Railway, Render, or AWS ECS), the Docker images already built for Compose translate directly with minimal changes to deployment manifests.

---

## 3. MVP Scope Decisions

### 3.1 Single Workspace, No Multi-Tenancy

**Assumption:** The MVP serves a single internal team (СОЛО на клавиатуре product team). There is no concept of organizations, workspaces, or tenants in the MVP data model.

**Rationale:**
- Adding multi-tenancy from day one would require row-level security policies, tenant-scoped queries on every endpoint, tenant-aware indexes, and more complex invitation flows. This doubles the implementation cost without delivering value while the product is used by one team.
- The data model is designed so that a `workspace_id` foreign key can be added to all core tables in a single migration when multi-tenancy is required (see Phase 3 in ROADMAP.md).

**Consequences if wrong:**
- If a second client or workspace is onboarded before Phase 3, a migration will be required. The schema design anticipates this by using surrogate UUIDs for all primary keys and avoiding any assumptions of global uniqueness in business keys.

### 3.2 No Self-Registration

**Assumption:** Users cannot register themselves. All accounts are created by an Admin via invite links.

**Rationale:**
- The platform is internal. Open registration would require email verification infrastructure, CAPTCHA, and spam protection — all unnecessary for an internal tool.
- Invite links are simpler to implement and give Admins complete control over who accesses the platform.

### 3.3 No Real-Time Updates

**Assumption:** Dashboard data is fetched on page load or explicit refresh. There are no WebSocket connections or polling for live updates in MVP.

**Rationale:**
- The source data is batch-imported via CSV. Real-time data streams do not exist in the current workflow, so real-time UI updates would add complexity without value.

### 3.4 Single Currency and Locale

**Assumption:** All monetary amounts are in Russian Rubles (RUB). The platform does not support currency conversion or multi-currency display in MVP.

**Rationale:**
- The current CSV exports from the СОЛО на клавиатуре billing system use RUB exclusively. Multi-currency support would require a currency field in every financial metric and exchange rate lookup, which is out of scope.

### 3.5 Immutable Imported Records

**Assumption:** Once a CSV import is processed and records are written to the `dataset_records` table, individual records are not editable through the UI. Corrections are made by re-uploading a corrected CSV for the same period, which replaces the previous import for that (data_source, period_start, period_end) combination.

**Rationale:**
- Editable records would require an audit trail, conflict resolution UX, and more complex queries. The re-upload approach is simpler and auditable.

---

## 4. Data Model Assumptions

### 4.1 Period-Based Data

**Assumption:** All imported data is period-based. Every record has a `period_start` and `period_end` timestamp, and a `period_type` (day, week, month). There are no event-level or session-level records in MVP.

**Rationale:**
- The existing СОЛО на клавиатуре data exports are already aggregated by period. The analytics platform visualizes pre-aggregated data, not raw events.
- Computing aggregations from raw events requires a streaming pipeline or OLAP engine — out of scope for MVP.

### 4.2 Metric Values as Floats

**Assumption:** All metric values are stored as `DOUBLE PRECISION` (float8) in PostgreSQL. Integer counts (e.g., `new_users`, `payments_count`) are stored as floats with the expectation that they will always be whole numbers.

**Rationale:**
- Using a single numeric type for all metrics simplifies the storage schema and metric computation code. Precision loss is not a concern for the value ranges in scope (counts up to ~100,000; currency amounts up to ~10,000,000 RUB).
- If high-precision accounting is required in the future (e.g., for auditable financial reports), `NUMERIC(18, 4)` columns would be used instead.

### 4.3 UUID Primary Keys

**Assumption:** All database tables use UUID v4 primary keys generated by the application layer, not auto-incrementing integers.

**Rationale:**
- UUIDs are safe to expose in URLs without leaking record counts or creation order.
- UUIDs enable distributed ID generation without a central sequence, making future sharding easier.
- The slight storage overhead (16 bytes vs 4–8 bytes) is negligible at MVP scale.

### 4.4 Soft Deletes for Data Sources

**Assumption:** Data sources are soft-deleted (a `deleted_at` timestamp is set). Hard deletes are not performed.

**Rationale:**
- Soft deletes preserve the referential integrity of historical import records and dashboard widgets that reference the deleted data source.
- Hard-deleting a data source would orphan widget configurations and break dashboards.

---

## 5. Authentication and Authorization Assumptions

### 5.1 Invite Links, Not Email Registration

**Assumption:** User onboarding uses single-use invite tokens. An Admin generates an invite link, shares it via any channel (email, Telegram, etc.), and the recipient clicks the link to set their password and activate their account.

**Rationale:**
- Sending emails requires an SMTP integration or transactional email service (SendGrid, Postmark). This is a non-trivial dependency for MVP.
- Invite links decouple the invitation mechanism from the delivery channel. The Admin chooses how to share the link.

**Invite token behavior:**
- Tokens are UUIDs, stored hashed in the database.
- Tokens expire after 7 days.
- Tokens are single-use: accepting an invite invalidates the token.
- An Admin can revoke an unused token before it is accepted.

### 5.2 Three Roles: Admin, Editor, Viewer

**Assumption:** The permission model has three roles:

| Role    | Permissions |
|---------|-------------|
| Admin   | Full access: manage users, invites, data sources, imports, dashboards, widgets |
| Editor  | Create and edit dashboards and widgets; upload CSVs; view all data |
| Viewer  | Read-only: view dashboards and data; cannot upload or create |

**Rationale:**
- Three roles cover the realistic user types on the team without the complexity of custom role definitions.
- RBAC (Role-Based Access Control) is enforced at the API layer via a dependency-injected permission checker.

### 5.3 No Password Recovery in MVP

**Assumption:** There is no "Forgot Password" flow in MVP. If a user loses access, an Admin resets their password directly in the admin panel or revokes their account and issues a new invite.

**Rationale:**
- Password recovery requires email delivery infrastructure. Given the small team size, Admin-mediated recovery is acceptable.

---

## 6. CSV Format Assumptions

### 6.1 UTF-8 Encoding

**Assumption:** All CSV files are UTF-8 encoded. Files in other encodings (Windows-1251, cp1252) are rejected with a clear error message directing the user to re-export or convert.

**Rationale:**
- UTF-8 is the universal standard. Accepting multiple encodings would require encoding detection (chardet), which is unreliable and adds complexity.

### 6.2 Comma Delimiter

**Assumption:** The CSV delimiter is a comma (`,`). Semicolon-delimited files (common in Russian Excel exports) are not automatically detected.

**Rationale:**
- The import pipeline validates the header row against the expected schema for each data source. A wrong delimiter will cause a header validation failure with an actionable error message. The user can re-export with comma delimiters.
- Auto-detecting delimiters adds ambiguity; an explicit contract is simpler to maintain.

### 6.3 ISO 8601 Dates

**Assumption:** Date columns (`period_start`, `period_end`) use ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`. Mixed formats within a single file are rejected.

### 6.4 Decimal Point (Not Comma) for Numbers

**Assumption:** Numeric columns use `.` as the decimal separator. Russian locale formatting with `,` as the decimal separator will cause a parse error.

### 6.5 Header Row Required

**Assumption:** Every CSV file must have a header row as the first row. The header column names must exactly match the expected field names defined in the data source schema (case-insensitive comparison is applied).

### 6.6 Empty Cells Treated as NULL

**Assumption:** Empty cells in optional columns are stored as NULL. Empty cells in required columns cause a row-level validation error, and the entire import is rejected (not partial).

---

## 7. Localization Assumptions

### 7.1 UI Language: Russian

**Assumption:** The entire user interface is in Russian. English strings do not appear to end users.

**Rationale:**
- The user base is the Russian-speaking СОЛО на клавиатуре team.
- Using Russian in the UI avoids cognitive overhead for the users.

**Implementation:**
- All user-facing strings are stored in a `locales/ru.json` file on the frontend.
- The `next-intl` library manages locale loading. Even though only Russian is supported in MVP, using a proper i18n library makes adding other languages trivial.
- Metric and dimension labels have a `label_ru` field in their registry definitions.

### 7.2 Code Language: English

**Assumption:** All source code, comments, variable names, function names, API field names, database column names, and internal documentation are in English.

**Rationale:**
- English is the lingua franca of software development. English identifiers are compatible with all tooling (linters, IDEs, search tools) without encoding issues.
- Mixing Russian identifiers into code would break grep searches, cause issues with some build tools, and make the codebase harder to share with non-Russian-speaking contributors.

### 7.3 Timezone: Europe/Moscow (UTC+3)

**Assumption:** All period boundaries in the CSV data are in Moscow time (Europe/Moscow, UTC+3). The platform stores timestamps in UTC in the database and converts to Moscow time for display.

**Rationale:**
- The СОЛО на клавиатуре business operates in the Moscow timezone. Users expect period labels to match Moscow calendar days.
- Storing in UTC and displaying in local time is the standard pattern that avoids DST-related bugs.

---

## 8. Infrastructure and Deployment Assumptions

### 8.1 Stateless API Servers

**Assumption:** FastAPI instances are stateless. All state lives in PostgreSQL. This allows horizontal scaling by adding more API container replicas.

### 8.2 Background Worker for CSV Processing

**Assumption:** CSV import processing (parsing, validation, transformation, storage) runs in a background worker process, not in the HTTP request handler. The API endpoint for CSV upload returns immediately with a job ID. The client polls the import status endpoint.

**Rationale:**
- Large CSV files (e.g., 12 months of daily data = ~365 rows, still fast) should not block an HTTP connection.
- Separating the worker makes the import pipeline independently testable and scalable.
- For MVP, the worker is a simple in-process async task (asyncio background task). If job queuing becomes necessary, Celery + Redis is the planned upgrade path.

### 8.3 File Storage: Local Volume for MVP

**Assumption:** Uploaded CSV files are stored in a Docker volume mounted at `/app/uploads` for MVP. They are kept for 30 days for debugging purposes, then purged.

**Rationale:**
- S3-compatible storage (MinIO, AWS S3) is the right long-term solution but adds an infrastructure dependency for MVP.
- The Docker volume approach works for a single-node deployment.

---

## 9. Open Questions (Decided Later)

| Question | Decision Made | Date |
|----------|---------------|------|
| Should the platform support scheduling automatic CSV imports via SFTP/S3? | No, out of scope for Phase 1 | 2026-04-10 |
| Should dashboards be shareable via public links? | No, requires auth bypass mechanism, deferred to Phase 2 | 2026-04-10 |
| Should widget data be cached? | No Redis in MVP; PostgreSQL query cache is sufficient | 2026-04-10 |
| Should there be an audit log for all write operations? | Yes, `created_at`/`updated_at`/`deleted_at` on all entities. Full audit log deferred to Phase 2 | 2026-04-10 |
