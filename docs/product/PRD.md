# Product Requirements Document — СОЛО на клавиатуре Analytics Platform

**Version:** 1.0  
**Date:** 2026-04-10  
**Status:** Approved for MVP Development  
**Product Owner:** СОЛО на клавиатуре Team

---

## 1. Product Vision

### 1.1 Problem Statement

The СОЛО на клавиатуре team currently tracks business performance metrics through a combination of spreadsheets, manual CSV exports from billing and CRM systems, and ad-hoc chart generation. This process has the following pain points:

- **Fragmented data:** Metrics live in different files with inconsistent naming, formatting, and date ranges.
- **Slow reporting:** Generating a weekly business review takes 2–4 hours of manual effort per week.
- **No shared source of truth:** Different team members may work from different versions of the data.
- **No visualization consistency:** Charts are created differently each time, making trend comparison across time periods difficult.
- **Lack of filtering:** Slicing data by payment type, period granularity, or cohort requires manual spreadsheet manipulation.

### 1.2 Vision Statement

The СОЛО на клавиатуре Analytics Platform is a self-hosted, internal business intelligence tool that gives the product team a single, authoritative view of all key business metrics. It transforms raw CSV exports into interactive dashboards that are always up-to-date, consistently formatted, and filterable — replacing the manual reporting workflow entirely.

### 1.3 Success Criteria for MVP

- The team can upload a weekly CSV export and see updated charts within 2 minutes.
- A business review meeting requires zero spreadsheet preparation.
- Any team member with Viewer access can answer "how did we do last month?" without asking a colleague.
- The platform is available 99% of working hours (Monday–Saturday, 09:00–22:00 MSK).

---

## 2. User Personas

### 2.1 Admin — Administrador (Администратор)

**Who:** The technical lead or product owner responsible for the platform.

**Goals:**
- Invite and manage team members.
- Configure data sources and define which CSV schemas map to which metrics.
- Ensure data is uploaded on schedule.
- Monitor import health (failed imports, data gaps).

**Frustrations:**
- Onboarding new team members into multiple tools.
- Manually updating charts after each CSV export.

**Technical comfort:** High. Understands CSV formats, can read error messages, comfortable with configuration.

**Key tasks:**
- Create and revoke invite links.
- Register new data sources (e.g., "new_users_daily", "payments_monthly").
- Re-upload corrected data when a past export contains errors.
- Delete users who leave the team.

---

### 2.2 Editor — Аналитик (Analyst / Editor)

**Who:** A product manager or analyst who builds and maintains dashboards.

**Goals:**
- Create dashboards tailored to specific review cadences (weekly, monthly).
- Configure widgets with the right metric, chart type, and filters.
- Upload new CSV exports as they become available.
- Iterate on dashboard layouts based on team feedback.

**Frustrations:**
- Building the same chart from scratch every week.
- No way to show year-over-year comparison without copying the spreadsheet.

**Technical comfort:** Medium. Comfortable with data but not with code or database tools.

**Key tasks:**
- Upload CSV files.
- Create and configure dashboards.
- Add, move, and configure widgets.
- Apply date range filters.

---

### 2.3 Viewer — Наблюдатель (Stakeholder / Viewer)

**Who:** A team member who needs to review metrics but is not responsible for data management.

**Goals:**
- See the current state of key metrics at a glance.
- Understand trends over time without needing to process data.
- Filter by period to answer specific questions.
- Print or export a dashboard view for a meeting.

**Frustrations:**
- Always having to ask someone to "send the latest numbers."
- Charts in presentations going stale between preparation and the meeting.

**Technical comfort:** Low to medium. Expects a polished, self-explanatory UI.

**Key tasks:**
- View dashboards.
- Apply filters (date range, period type).
- Use print mode to generate a PDF-ready view.

---

## 3. MVP User Stories

### Epic 1: Authentication and User Management

---

**US-101: Admin creates user invite**

> As an Admin, I want to generate an invite link for a new team member so that they can create an account without requiring me to set a password for them.

**Acceptance Criteria:**
- Admin can navigate to Settings > Users > Invite.
- Admin selects the role for the invitee (Editor or Viewer).
- System generates a unique invite URL (e.g., `https://analytics.sololearn.ru/invite/abc123`).
- The URL is displayed and copyable.
- The invite expires after 7 days.
- The invite is listed in Settings > Invites with its status (Pending / Accepted / Expired / Revoked).

---

**US-102: New user accepts invite**

> As an invited user, I want to click an invite link and set my password so that I can access the platform.

**Acceptance Criteria:**
- Clicking the invite URL opens a registration form.
- The form requires a display name and password (minimum 8 characters, at least one digit).
- On submission, the account is created, the invite is marked as Accepted, and the user is redirected to the dashboard home.
- If the invite is expired or already used, the user sees a clear error message: "Эта ссылка недействительна или уже использована."
- Accepting the invite automatically logs the user in (access token + refresh token issued).

---

**US-103: User logs in**

> As a registered user, I want to log in with my email and password so that I can access the platform.

**Acceptance Criteria:**
- Login form requires email and password.
- On success, user is redirected to the last visited page or the dashboard home.
- On failure (wrong credentials), user sees: "Неверный email или пароль."
- After 5 consecutive failed attempts within 10 minutes, the account is temporarily locked for 15 minutes. The user sees: "Слишком много попыток. Попробуйте через 15 минут."
- Access token is stored in memory (not localStorage). Refresh token is in httpOnly cookie.

---

**US-104: Admin manages users**

> As an Admin, I want to view all team members and remove users who have left the team.

**Acceptance Criteria:**
- Settings > Users shows a list of all users with name, email, role, and last login date.
- Admin can change a user's role (Admin/Editor/Viewer) via a dropdown.
- Admin can delete a user. Deletion requires a confirmation dialog: "Удалить пользователя [имя]? Это действие нельзя отменить."
- Deleted users' sessions are immediately invalidated (all their refresh tokens are revoked).
- An Admin cannot delete their own account if they are the last Admin.

---

### Epic 2: Data Sources and CSV Import

---

**US-201: Admin registers a data source**

> As an Admin, I want to register a new data source with its expected CSV schema so that the platform knows how to parse future uploads for that source.

**Acceptance Criteria:**
- Admin navigates to Settings > Data Sources > Add New.
- Admin provides: name (e.g., "Новые пользователи — по дням"), identifier slug (e.g., `new_users_daily`), period type (day / week / month), and the list of expected CSV columns with their types.
- On save, the data source appears in the list and is available as a target for CSV uploads.
- The data source's column schema is versioned; editing columns creates a new schema version and does not invalidate past imports.

---

**US-202: Editor uploads a CSV file**

> As an Editor, I want to upload a CSV file to a registered data source so that the platform has the latest data.

**Acceptance Criteria:**
- Upload UI is available at Data Sources > [source name] > Upload.
- User selects a file from their computer (`.csv` extension required).
- On upload, the platform returns a job ID and shows "Файл загружен, обработка..."
- Progress is shown (queued → parsing → validating → storing → complete).
- On success: "Импорт завершён. Загружено [N] записей."
- On failure: the user sees a specific error (e.g., "Колонка 'new_users' не найдена в строке 1" or "Неверный формат даты в строке 42: '2024/01/15' — ожидается 'YYYY-MM-DD'").
- Files are accepted up to 50 MB.
- Duplicate period detection: if records for the same `(data_source, period_start, period_end)` already exist, the user is warned and must confirm replacement: "Данные за этот период уже существуют. Заменить?"

---

**US-203: User views import history**

> As an Editor or Admin, I want to see the history of all CSV imports so that I can track what data has been loaded and debug failures.

**Acceptance Criteria:**
- Data Sources > [source name] > Import History shows a list of all imports with: date/time, status (success/failed), number of records loaded, and the name of the file.
- Failed imports show an expandable error panel with the error message and the row number(s) that caused the failure.
- Imports can be filtered by status.

---

**US-204: Admin re-uploads corrected data**

> As an Admin, I want to replace data for a specific period by uploading a corrected CSV so that errors in past exports can be fixed.

**Acceptance Criteria:**
- Uploading a CSV that covers a period range already present in the database triggers a replacement confirmation dialog.
- On confirmation, old records for the overlapping periods are deleted and replaced with the new records.
- The old import record is marked with status "replaced" and a reference to the new import.
- The replacement appears in import history with a "Замена" badge.

---

### Epic 3: Dashboards

---

**US-301: Editor creates a dashboard**

> As an Editor, I want to create a new dashboard with a name and description so that I can organize charts for a specific review context (e.g., weekly metrics, payment analysis).

**Acceptance Criteria:**
- Home page has a "Создать дашборд" button.
- Dashboard name is required (max 100 characters). Description is optional.
- Created dashboard is immediately accessible and appears on the home page dashboard list.
- Dashboards are listed in reverse creation order by default.

---

**US-302: Editor adds a widget to a dashboard**

> As an Editor, I want to add a chart widget to a dashboard so that I can visualize a specific metric over time.

**Acceptance Criteria:**
- Dashboard edit mode has an "Добавить виджет" button.
- Widget configuration modal includes:
  - Widget title (optional; defaults to metric label)
  - Data source selection
  - Metric selection (filtered to metrics available in the selected data source)
  - Chart type: Line, Bar, Area (MVP types)
  - Optional: secondary metric for dual-axis comparison
  - Optional: comparison period toggle (current vs. previous period)
- Widget is added to the dashboard grid and renders data immediately.
- Empty state widget (no data for selected filters) shows: "Нет данных для выбранных фильтров."

---

**US-303: Editor configures the dashboard layout**

> As an Editor, I want to drag and resize widgets on the dashboard grid so that I can arrange them in a meaningful visual order.

**Acceptance Criteria:**
- Dashboard uses a 12-column grid.
- Widgets can be dragged to a new position.
- Widgets have a resize handle; minimum size is 3 columns × 2 rows.
- Layout changes are saved automatically after a 1-second debounce.
- Users see a "Сохранено" confirmation toast after layout changes are persisted.

---

**US-304: Viewer views a dashboard with filters**

> As a Viewer, I want to apply date range and period granularity filters to a dashboard so that I can focus on the time window relevant to my question.

**Acceptance Criteria:**
- Dashboard toolbar has: date range picker (from / to), period type selector (Day / Week / Month).
- Filter changes update all widgets simultaneously.
- The applied filter state is reflected in the URL query string (`?from=2025-01-01&to=2025-12-31&period=month`) so filtered views can be bookmarked or shared.
- Widgets that have no data for the selected filter show an empty state, not an error.
- The date picker supports quick presets: "Последние 30 дней", "Последние 3 месяца", "Этот год", "Прошлый год."

---

**US-305: Viewer uses print mode**

> As a Viewer, I want to activate print mode on a dashboard so that I can generate a clean PDF for a meeting or report.

**Acceptance Criteria:**
- Print mode button is always visible in the dashboard toolbar.
- In print mode: all navigation, toolbars, and interactive controls are hidden. Only the dashboard title, applied filter description, and widgets are visible.
- Widget layout is linearized for print (single column, full width, no grid gaps).
- Browser's native print dialog is triggered automatically, or a "Скачать PDF" button uses `window.print()` with `@media print` CSS.
- Charts render in black-and-white-friendly colors in print mode (high-contrast palette).
- Each widget includes its title in print mode.

---

**US-306: Admin deletes a dashboard**

> As an Admin, I want to delete a dashboard that is no longer needed.

**Acceptance Criteria:**
- Dashboard settings (gear icon) includes a "Удалить дашборд" option.
- Deletion requires confirmation: "Удалить дашборд '[название]'? Все виджеты будут удалены. Это действие нельзя отменить."
- Deleted dashboards are soft-deleted (not immediately purged) and are not shown to any user.

---

### Epic 4: Metrics and Dimensions

---

**US-401: User views available metrics**

> As an Editor, I want to see a list of all available metrics for a data source so that I can choose the right one when configuring a widget.

**Acceptance Criteria:**
- Widget configuration modal shows metrics grouped by data source.
- Each metric shows: name (in Russian), identifier, data type (count / currency / percentage / ratio), and the unit of measurement.
- Metrics from inactive or deleted data sources are not shown.

---

**US-402: Admin registers a new metric definition**

> As an Admin, I want to define a new metric by mapping it to a CSV column so that it becomes available for widget configuration.

**Acceptance Criteria:**
- Settings > Data Sources > [source] > Metrics > Add Metric.
- Admin provides: metric identifier, Russian label, column name, data type, and optional formatting (e.g., "₽", "%", integer).
- The new metric is immediately available in widget configuration.

---

## 4. Post-MVP Roadmap

The following features are explicitly out of scope for MVP but are planned:

| Feature | Phase | Notes |
|---------|-------|-------|
| Cohort analysis | Phase 2 | Requires event-level data model |
| Funnel visualization | Phase 2 | Requires sequence data |
| Retention charts | Phase 2 | 30/60/90 day retention curves |
| Public shareable dashboard links | Phase 2 | Read-only, no auth required |
| Email/Telegram digest delivery | Phase 2 | Weekly summary push |
| Custom metric formulas | Phase 2 | Computed metrics (e.g., ARPU = revenue / users) |
| Multi-workspace support | Phase 3 | Full tenant isolation |
| SFTP/S3 scheduled import | Phase 4 | Auto-import from storage buckets |
| Direct database connector | Phase 4 | Read from source DB instead of CSV |
| AI-generated insights | Phase 5 | Anomaly detection and narrative summaries |

---

## 5. Platform Metrics (Meta-KPIs)

These metrics measure the success of the analytics platform itself:

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Time to first chart after CSV upload | < 2 minutes | Import job duration log |
| Weekly active users | 100% of invited users | Session log |
| Failed import rate | < 5% of uploads | Import status log |
| Dashboard page load time (P95) | < 2 seconds | Frontend performance monitoring |
| Data freshness | < 7 days since last import per active data source | Admin dashboard health widget |
| Manual reporting time saved | > 2 hours/week | Team survey (quarterly) |

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Dashboard page (with 6 widgets) must load in under 2 seconds on a modern browser over a 20 Mbps connection.
- CSV import of 1,000 rows must complete in under 30 seconds.
- API endpoints must respond in under 500ms at the 95th percentile under normal load.

### 6.2 Security
- All HTTP communication uses TLS (HTTPS).
- SQL queries use parameterized statements; no string interpolation in queries.
- Uploaded CSV files are scanned for file size before processing; content type is validated.
- CORS is configured to allow only the frontend origin.
- Rate limiting: 100 requests per minute per IP on auth endpoints; 1000 requests per minute per user on all other endpoints.

### 6.3 Accessibility
- All interactive elements are keyboard-navigable.
- Charts have text fallbacks (data tables) for screen reader users in print mode.
- Color palette is WCAG AA compliant for contrast ratios.

### 6.4 Browser Support
- Chrome 120+, Firefox 120+, Safari 17+, Edge 120+.
- Mobile browsers: read-only viewing is supported; dashboard editing is desktop-only.

### 6.5 Data Retention
- Uploaded CSV files are retained for 30 days, then deleted.
- Imported data records are retained indefinitely until explicitly replaced or the data source is deleted.
- Soft-deleted entities are purged after 90 days.
