# Technical Specification — Analytics Platform

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  Next.js 14 (App Router) + TypeScript + Tailwind + Recharts │
│  Port: 3000                                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API (JSON)
                       │ JWT Bearer Token
┌──────────────────────▼──────────────────────────────────────┐
│                         BACKEND                             │
│  FastAPI + SQLAlchemy 2.0 async + Alembic                   │
│  Port: 8000                                                 │
│  /api/v1/...                                                │
└──────────────────────┬──────────────────────────────────────┘
                       │ asyncpg
┌──────────────────────▼──────────────────────────────────────┐
│                       DATABASE                              │
│  PostgreSQL 16                                              │
│  Port: 5432                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. API Endpoints

### Auth
```
POST /api/v1/auth/login           # Вход. Returns: access_token, refresh_token, user
POST /api/v1/auth/refresh         # Обновить access token
POST /api/v1/auth/logout          # Выход (client-side token removal)
GET  /api/v1/auth/me              # Текущий пользователь
```

### Users (admin only for list/create/delete)
```
GET    /api/v1/users              # Список пользователей
POST   /api/v1/users              # Создать пользователя
GET    /api/v1/users/{id}         # Пользователь по ID
PATCH  /api/v1/users/{id}         # Обновить пользователя
DELETE /api/v1/users/{id}         # Деактивировать пользователя
```

### Invites (admin only)
```
POST   /api/v1/invites            # Создать invite link
GET    /api/v1/invites            # Список invite links
DELETE /api/v1/invites/{id}       # Отозвать invite
POST   /api/v1/invites/{token}/register  # Регистрация по invite token
GET    /api/v1/invites/{token}/info      # Информация об invite (публичный)
```

### Data Sources (admin/editor)
```
GET    /api/v1/data-sources       # Список источников данных
POST   /api/v1/data-sources       # Создать источник данных
GET    /api/v1/data-sources/{id}  # Источник данных по ID
PATCH  /api/v1/data-sources/{id}  # Обновить источник данных
DELETE /api/v1/data-sources/{id}  # Удалить источник данных
```

### Imports (editor+)
```
POST /api/v1/imports/upload/{data_source_id}  # Загрузить CSV файл
GET  /api/v1/imports                           # История импортов
GET  /api/v1/imports/{id}                      # Импорт по ID
```

### Datasets (viewer+)
```
GET /api/v1/datasets/{data_source_id}/records  # Записи с фильтрацией
GET /api/v1/datasets/{data_source_id}/kpi      # Агрегированные KPI
GET /api/v1/datasets/{data_source_id}/summary  # Сводка по периодам
```

### Metrics & Dimensions
```
GET /api/v1/metrics                  # Реестр метрик
GET /api/v1/dimensions               # Реестр измерений
```

### Dashboards (viewer+)
```
GET    /api/v1/dashboards                      # Список дашбордов
POST   /api/v1/dashboards                      # Создать дашборд (editor+)
GET    /api/v1/dashboards/{id}                 # Дашборд по ID
PUT    /api/v1/dashboards/{id}                 # Обновить дашборд (editor+)
DELETE /api/v1/dashboards/{id}                 # Удалить дашборд (admin)
GET    /api/v1/dashboards/{id}/widgets         # Виджеты дашборда
POST   /api/v1/dashboards/{id}/widgets         # Добавить виджет (editor+)
PUT    /api/v1/dashboards/{id}/widgets/{wid}   # Обновить виджет
DELETE /api/v1/dashboards/{id}/widgets/{wid}   # Удалить виджет
```

---

## 3. Authentication Flow

### Login
```
Client → POST /api/v1/auth/login {email, password}
Server → 200 {access_token, refresh_token, token_type, user}
Client → stores tokens in localStorage
Client → adds Authorization: Bearer <access_token> to all requests
```

### Token Refresh
```
Client → POST /api/v1/auth/refresh {refresh_token}
Server → 200 {access_token, token_type}
Client → replaces access_token in localStorage
```

### 401 Handling (Frontend Interceptor)
```
Request → 401 Unauthorized
→ check if refresh_token exists
→ POST /api/v1/auth/refresh
→ retry original request with new access_token
→ if refresh fails → clear tokens → redirect to /login
```

---

## 4. CSV Import Pipeline

```
1. User uploads CSV file (multipart/form-data)
2. Validate file type and size (max 50MB)
3. Compute SHA256 hash → check for duplicates
4. Create ImportLog record (status=processing)
5. Detect encoding (utf-8, cp1251, auto)
6. Parse CSV with pandas
7. Normalize column names (strip, lowercase, replace spaces)
8. Apply column_mapping (CSV col → canonical field)
9. Validate required fields
10. Parse dates flexibly (multiple formats)
11. Coerce numeric values
12. For each row:
    - Check if period_start+period_end exists → UPDATE or INSERT
    - Store metrics as JSONB
13. Update ImportLog (status=success, row_count, period_from, period_to)
14. Return ImportResult
```

---

## 5. Role-Based Access Control

| Endpoint | viewer | editor | admin |
|----------|--------|--------|-------|
| GET /auth/me | ✓ | ✓ | ✓ |
| GET /datasets | ✓ | ✓ | ✓ |
| GET /dashboards | ✓ | ✓ | ✓ |
| POST /imports/upload | ✗ | ✓ | ✓ |
| POST /data-sources | ✗ | ✓ | ✓ |
| POST /dashboards/*/widgets | ✗ | ✓ | ✓ |
| GET /users | ✗ | ✗ | ✓ |
| POST /invites | ✗ | ✗ | ✓ |
| DELETE /users/{id} | ✗ | ✗ | ✓ |

---

## 6. Dataset Query Parameters

```
GET /api/v1/datasets/{id}/records
  ?date_from=2024-01-01         # Фильтр с даты
  ?date_to=2024-12-31           # Фильтр по дату
  ?granularity=day|week|month   # Гранулярность
  ?metrics[]=new_users          # Список метрик (multi-value)
  ?sort_by=period_start         # Сортировка
  ?sort_order=asc|desc          # Направление
  ?limit=100                    # Пагинация
  ?offset=0                     # Смещение
```

---

## 7. Filter System Design

Фильтры применяются на уровне SQL-запроса в `DatasetService`:
- `date_from/date_to` → WHERE import_rows.period_start >= / period_end <=
- `granularity` → WHERE import_rows.granularity = 
- `metric_keys` → post-processing в Python (фильтрация ключей из JSONB)
- `sort_by` → ORDER BY column (только whitelist)

Новые типы фильтров добавляются в `DatasetService.get_records()` без изменения моделей.

---

## 8. Print Mode

Реализован через CSS `@media print`:
```css
@media print {
  .print\:hidden { display: none !important; }
  /* Скрывает: sidebar, filter panel, buttons, header actions */
}
```

Активируется нативным диалогом браузера (Ctrl+P / ⌘+P).  
Все Recharts графики рендерятся как SVG → корректно печатаются.

---

## 9. Data Source Extensibility

Добавление нового CSV без изменений кода:

1. `POST /api/v1/data-sources` — регистрация схемы и column_mapping
2. `POST /api/v1/metrics/definitions` — добавление метрик с русскими названиями
3. `POST /api/v1/imports/upload/{id}` — загрузка данных
4. Данные автоматически появляются в фильтрах и виджетах

---

## 10. Non-Functional Requirements

| Требование | Значение |
|------------|----------|
| Max upload size | 50 MB |
| Access token TTL | 30 минут |
| Refresh token TTL | 7 дней |
| API response time (p95) | < 500ms |
| CSV processing | < 30s для 100k строк |
| Database | PostgreSQL 16+ |
| Python version | 3.12+ |
| Node.js version | 20+ |
