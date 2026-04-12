# Data Contract — Analytics Platform

## 1. Canonical Data Model

### Принципы
- Все данные хранятся в `import_rows` с `metrics JSONB`
- Ключи метрик совпадают с canonical field names из `column_mapping`
- Новые метрики добавляются без миграций схемы БД
- Русские названия хранятся в `metric_definitions.name_ru`

---

## 2. Текущие CSV-источники данных

### 2.1 Новые пользователи (new_users)

**Granularity:** день / неделя / месяц

| CSV-колонка | Canonical field | Тип | Обязательное | Описание |
|-------------|----------------|-----|--------------|----------|
| period_start | period_start | date | ✓ | Начало периода |
| period_end | period_end | date | ✓ | Конец периода |
| period_number | period_number | integer | — | Номер периода |
| new_users | new_users | integer | ✓ | Количество новых пользователей |

---

### 2.2 Новые оплаты (new_payments)

**Granularity:** день / неделя / месяц

| CSV-колонка | Canonical field | Тип | Обязательное | Описание |
|-------------|----------------|-----|--------------|----------|
| period_start | period_start | date | ✓ | Начало периода |
| period_end | period_end | date | ✓ | Конец периода |
| period_number | period_number | integer | — | Номер периода |
| total_payments_count | total_payments_count | integer | ✓ | Всего оплат |
| payments_afterjoin_count | payments_afterjoin_count | integer | — | Оплаты после регистрации |
| payments_byguest_count | payments_byguest_count | integer | — | Оплаты от гостей |
| discounts_count | discounts_count | integer | — | Применено скидок |
| total_amount_gross | total_amount_gross | float | ✓ | Выручка gross (до вычетов) |
| total_amount_net | total_amount_net | float | ✓ | Выручка net (после вычетов) |
| avg_amount_gross | avg_amount_gross | float | — | Средний чек gross |
| avg_amount_net | avg_amount_net | float | — | Средний чек net |
| median_amount_gross | median_amount_gross | float | — | Медианный чек gross |
| median_amount_net | median_amount_net | float | — | Медианный чек net |

---

### 2.3 Повторные оплаты (repeat_payments)

Аналогичная схема что и new_payments.

---

## 3. Metric Definitions (Реестр метрик)

Каждая метрика регистрируется в `metric_definitions`:

```json
{
  "key": "total_amount_gross",
  "name_ru": "Выручка (gross)",
  "name_en": "Gross Revenue",
  "description_ru": "Суммарная выручка до вычета комиссий",
  "unit": "rub",
  "data_type": "float",
  "aggregation": "sum",
  "format_pattern": "{value} руб.",
  "is_visible": true,
  "sort_order": 5
}
```

### Допустимые значения unit
| unit | Описание | Формат |
|------|----------|--------|
| count | Количество (целые) | 1 234 чел. |
| rub | Рубли | 1 234 567 руб. |
| avg_rub | Средний чек | 1 234 руб. |
| percent | Процент | 12,5% |

### Допустимые значения aggregation
| aggregation | Описание |
|------------|----------|
| sum | Суммировать за период |
| avg | Среднее за период |
| last | Последнее значение |
| max | Максимум |

---

## 4. Как зарегистрировать новый источник данных

### Шаг 1: Определить схему CSV

```json
{
  "columns": [
    {"name": "period_start", "data_type": "date", "required": true},
    {"name": "period_end", "data_type": "date", "required": true},
    {"name": "my_new_metric", "data_type": "integer", "required": true},
    {"name": "my_dimension", "data_type": "string", "required": false}
  ]
}
```

### Шаг 2: Определить column_mapping

```json
{
  "period_start": "period_start",
  "period_end": "period_end",
  "my_new_metric": "my_new_metric",
  "my_dimension": "my_dimension"
}
```

### Шаг 3: Создать data_source через API

```http
POST /api/v1/data-sources
{
  "name": "Мой новый отчёт",
  "slug": "my_new_report_daily",
  "description": "Описание нового источника данных",
  "source_type": "csv",
  "schema": { ...выше... },
  "column_mapping": { ...выше... },
  "granularity": "day",
  "category": "users"
}
```

### Шаг 4: Добавить metric_definitions

```http
POST /api/v1/metrics/definitions
{
  "data_source_id": "<uuid нового источника>",
  "key": "my_new_metric",
  "name_ru": "Мой новый показатель",
  "unit": "count",
  "aggregation": "sum"
}
```

### Шаг 5: Загрузить CSV

```http
POST /api/v1/imports/upload/<data_source_id>
Content-Type: multipart/form-data
file: my_file.csv
```

---

## 5. Форматы дат в CSV

Поддерживаемые форматы:
- `YYYY-MM-DD` (ISO, предпочтительный)
- `DD.MM.YYYY` (российский)
- `DD/MM/YYYY`
- `MM/DD/YYYY` (американский)
- `YYYY/MM/DD`

---

## 6. Кодировки CSV

Автоматически определяются:
1. UTF-8 (предпочтительная)
2. CP1251 (Windows-1251, часто в российских выгрузках)

---

## 7. Семантика обновления данных

- Если строка с `period_start + period_end + data_source_id` уже существует — она **обновляется**
- Если файл полностью совпадает (SHA256 hash) с уже импортированным — статус `duplicate`, данные не дублируются
- Исторические данные сохраняются при каждом импорте через `import_rows.import_id`

---

## 8. Будущие источники данных (примеры)

Платформа готова принять без изменений кода:
- `tariffs_daily` — аналитика по тарифам
- `funnels_weekly` — воронки конверсий
- `cohorts_monthly` — когортный анализ
- `traffic_daily` — источники трафика
- `retention_monthly` — удержание пользователей
