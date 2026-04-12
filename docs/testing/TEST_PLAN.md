# Test Plan — Analytics Platform

## 1. Стратегия тестирования

| Уровень | Инструмент | Покрытие |
|---------|-----------|----------|
| Unit (backend) | pytest + pytest-asyncio | Services, CSV importer |
| Integration (backend) | pytest + httpx | API endpoints |
| Unit (frontend) | vitest | Utils, formatters |
| E2E (опционально) | Playwright | Критические flows |

---

## 2. Backend Tests

### 2.1 Auth Tests (`test_auth.py`)

| ID | Тест | Ожидаемый результат |
|----|------|---------------------|
| AUTH-01 | POST /auth/login с верными данными | 200, access_token + refresh_token |
| AUTH-02 | POST /auth/login с неверным паролем | 401 |
| AUTH-03 | POST /auth/login с несуществующим email | 401 |
| AUTH-04 | GET /auth/me с валидным токеном | 200, user object |
| AUTH-05 | GET /auth/me без токена | 401 |
| AUTH-06 | POST /auth/refresh с валидным refresh | 200, новый access_token |
| AUTH-07 | POST /auth/refresh с невалидным токеном | 401 |
| AUTH-08 | POST /auth/logout | 204 |

### 2.2 Import Tests (`test_imports.py`)

| ID | Тест | Ожидаемый результат |
|----|------|---------------------|
| IMP-01 | Загрузка валидного CSV (new_users_daily) | 201, status=success, rows_processed > 0 |
| IMP-02 | Загрузка того же файла второй раз | 201, status=duplicate |
| IMP-03 | Загрузка с обновлёнными данными | 201, rows_updated > 0 |
| IMP-04 | Загрузка не-CSV файла | 400 |
| IMP-05 | Загрузка пустого CSV | 400 |
| IMP-06 | CSV без обязательных колонок | 400/422 |
| IMP-07 | CSV с некорректными датами | Предупреждение, строки пропускаются |
| IMP-08 | CSV с кодировкой CP1251 | 201, данные декодированы корректно |
| IMP-09 | Загрузка без прав editor | 403 |
| IMP-10 | Загрузка для несуществующего data_source | 404 |

### 2.3 Dataset Tests

| ID | Тест | Ожидаемый результат |
|----|------|---------------------|
| DS-01 | GET /datasets/{id}/records без фильтров | 200, список записей |
| DS-02 | GET /datasets/{id}/records ?date_from=2024-01-01 | Только записи >= date_from |
| DS-03 | GET /datasets/{id}/records ?granularity=month | Только месячные записи |
| DS-04 | GET /datasets/{id}/records ?sort_order=desc | Записи отсортированы |
| DS-05 | GET /datasets/{id}/kpi | 200, список KPI значений |
| DS-06 | GET /datasets/{id}/summary | 200, периоды с метриками |

### 2.4 Invite Tests

| ID | Тест | Ожидаемый результат |
|----|------|---------------------|
| INV-01 | Создание invite (admin) | 201, token + invite_url |
| INV-02 | Создание invite (не-admin) | 403 |
| INV-03 | Регистрация по валидному invite | 201, user + tokens |
| INV-04 | Регистрация по использованному invite | 400 |
| INV-05 | Регистрация по истёкшему invite | 400 |
| INV-06 | Регистрация с неправильным email | 400 |
| INV-07 | Отзыв invite (admin) | 204 |

---

## 3. Frontend Tests

### 3.1 Formatters Tests

| ID | Тест |
|----|------|
| FMT-01 | formatRub(1234567) → "1 234 567 руб." |
| FMT-02 | formatCount(0) → "0 чел." |
| FMT-03 | formatPercent(12.5) → "12,5%" |
| FMT-04 | formatDate("2024-01-01") → "1 янв. 2024" |

### 3.2 API Client Tests

| ID | Тест |
|----|------|
| API-01 | authApi.login → корректный запрос |
| API-02 | 401 → trigger refresh → retry |
| API-03 | refresh fail → redirect to /login |

---

## 4. Тест расширяемости

**Сценарий:** Добавить новый источник данных без изменений кода

1. POST /api/v1/data-sources с новой схемой
2. Загрузить CSV с новыми полями
3. Проверить что данные появились в /datasets
4. Проверить что старые источники не сломались
5. Проверить что новые метрики доступны в filter panel

**Критерий успеха:** Все шаги выполняются через API, код не изменялся.

---

## 5. Тест прав доступа

| Роль | Действие | Ожидание |
|------|----------|----------|
| viewer | GET /datasets | 200 ✓ |
| viewer | POST /imports/upload | 403 ✗ |
| viewer | GET /users | 403 ✗ |
| editor | POST /imports/upload | 201 ✓ |
| editor | GET /users | 403 ✗ |
| editor | POST /data-sources | 201 ✓ |
| admin | Все endpoints | 200/201/204 ✓ |

---

## 6. Тест печатной версии

1. Открыть дашборд с данными
2. Открыть Print Preview (Ctrl+P)
3. Проверить: sidebar скрыт
4. Проверить: filter panel скрыта
5. Проверить: KPI карточки видны
6. Проверить: Графики видны (SVG)
7. Проверить: Таблица данных не обрезана
8. Сохранить как PDF → проверить качество

---

## 7. Demo Data Tests

Проверка корректности seed данных:
- `new_users_daily.csv` — 2 года дневных данных (2024-2025)
- `new_payments_daily.csv` — корректные суммы и количества
- После seed: admin user создан
- После seed: все data_sources зарегистрированы
- После seed: metric_definitions созданы с русскими названиями
- После seed: default dashboard создан с виджетами
