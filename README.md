# СОЛО на клавиатуре — Аналитическая платформа

Внутренняя аналитическая платформа для мониторинга ключевых показателей продукта «СОЛО на клавиатуре»: активность пользователей, прогресс обучения, конверсия, удержание и монетизация.

---

## О проекте

Платформа позволяет командам роста, продукта и маркетинга в режиме реального времени отслеживать метрики, загружать данные из CSV-файлов, строить дашборды и настраивать пороговые алерты — без необходимости писать SQL-запросы вручную.

---

## Возможности платформы

- **Дашборды** — настраиваемые виджеты с графиками и KPI-карточками
- **Загрузка данных** — импорт CSV с автоматическим определением схемы
- **Метрики в реальном времени** — DAU/WAU/MAU, удержание, конверсия, ARPU
- **Фильтрация и срезы** — по дате, сегменту пользователей, источнику
- **Алерты** — уведомления при выходе метрики за пороговое значение
- **Ролевая модель** — администраторы, аналитики и зрители с разными правами
- **REST API** — полная документация через Swagger UI
- **Демо-данные** — автоматическая загрузка при первом запуске

---

## Технологии

| Слой | Технология |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic |
| База данных | PostgreSQL 16 |
| Аутентификация | JWT (access + refresh токены) |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Контейнеризация | Docker, Docker Compose |
| Тестирование | pytest (backend), Jest (frontend) |

---

## Быстрый старт (Docker Compose)

### Требования

- Docker >= 24
- Docker Compose >= 2.20

### Шаги

```bash
# 1. Клонировать репозиторий
git clone <repo-url> solo-na-klaviature
cd solo-na-klaviature

# 2. Создать файл окружения
cp .env.example .env
# Отредактировать .env: задать надёжные пароли и SECRET_KEY

# 3. Запустить все сервисы
make up
# или напрямую:
docker compose up -d --build

# 4. Открыть платформу
# Frontend:  http://localhost:3000
# API docs:  http://localhost:8000/docs
```

При первом запуске автоматически выполнятся:
1. Применение миграций базы данных (`alembic upgrade head`)
2. Создание учётной записи администратора
3. Загрузка демо-данных (если `SEED_DEMO_DATA=true`)

---

## Ручной запуск (без Docker)

### Backend

```bash
cd backend

# Создать и активировать виртуальное окружение
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Установить зависимости
pip install -r requirements.txt

# Настроить переменные окружения
cp ../.env.example .env
# Задать DATABASE_URL, SECRET_KEY и прочие переменные

# Применить миграции
alembic upgrade head

# Загрузить демо-данные
python seed/seed.py

# Запустить сервер
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Настроить переменные окружения
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Запустить в режиме разработки
npm run dev
```

Frontend будет доступен на http://localhost:3000.

---

## Учётные данные по умолчанию

| Поле | Значение |
|---|---|
| Email | admin@solo.ru |
| Пароль | admin123 |

**Обязательно смените пароль после первого входа в продакшн-окружении.**

---

## Структура проекта

```
solo-na-klaviature/
├── backend/
│   ├── app/
│   │   ├── api/            # Роутеры FastAPI (endpoints)
│   │   ├── core/           # Конфигурация, безопасность, зависимости
│   │   ├── models/         # SQLAlchemy ORM модели
│   │   ├── schemas/        # Pydantic схемы запросов/ответов
│   │   └── main.py         # Точка входа приложения
│   ├── alembic/            # Миграции базы данных
│   ├── seed/               # Скрипты и данные для демо-заполнения
│   ├── tests/              # pytest тесты
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router страницы
│   │   ├── components/     # React компоненты
│   │   ├── hooks/          # Кастомные React хуки
│   │   ├── lib/            # API клиент, утилиты
│   │   └── types/          # TypeScript типы
│   ├── public/             # Статические файлы
│   ├── Dockerfile
│   ├── next.config.ts
│   └── package.json
├── docs/                   # Дополнительная документация
├── docker-compose.yml
├── .env.example
├── .gitignore
├── Makefile
└── README.md
```

---

## Как добавить новый источник данных

1. Создать новую SQLAlchemy модель в `backend/app/models/`
2. Сгенерировать миграцию:
   ```bash
   alembic revision --autogenerate -m "add new data source"
   ```
3. Добавить Pydantic схемы в `backend/app/schemas/`
4. Реализовать CRUD-роутер в `backend/app/api/`
5. Зарегистрировать роутер в `backend/app/main.py`
6. Добавить компонент загрузки на фронтенде в `frontend/src/components/`
7. При необходимости добавить тестовые данные в `backend/seed/`

---

## Как добавить новую метрику

1. Добавить SQL-запрос или агрегацию в соответствующий сервисный слой (`backend/app/api/metrics.py` или отдельный файл)
2. Описать Pydantic-схему ответа
3. Добавить endpoint, например `GET /api/metrics/my-new-metric`
4. На фронтенде создать хук (`useMyNewMetric`) и виджет в `frontend/src/components/widgets/`
5. Добавить виджет на дашборд

---

## Роли пользователей

| Роль | Права |
|---|---|
| **admin** | Полный доступ: управление пользователями, источниками данных, метриками, дашбордами, алертами |
| **analyst** | Просмотр и создание дашбордов, загрузка CSV, настройка алертов для себя |
| **viewer** | Только просмотр дашбордов и метрик, без права редактирования |

Роли назначаются администратором через интерфейс или API.

---

## API документация

После запуска бэкенда документация доступна по адресам:

- **Swagger UI** (интерактивная): http://localhost:8000/docs
- **ReDoc** (удобное чтение): http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

Все защищённые endpoint требуют заголовка:
```
Authorization: Bearer <access_token>
```

Получить токен можно через `POST /api/auth/login`.

---

## Как расширить платформу

### Добавить внешний источник данных (например, ClickHouse)

1. Установить драйвер в `requirements.txt` (например, `clickhouse-driver`)
2. Добавить настройки подключения в `backend/app/core/config.py`
3. Создать адаптер в `backend/app/core/clickhouse.py`
4. Использовать адаптер в сервисном слое вместо / наряду с PostgreSQL

### Добавить отправку алертов в Telegram / Slack

1. Установить `httpx` (уже включён) или соответствующий SDK
2. Создать `backend/app/services/notifications.py`
3. Добавить настройки webhook-URL в `.env` и `config.py`
4. Вызывать сервис из фонового задания (APScheduler или Celery)

### Добавить экспорт отчётов в PDF/Excel

1. Установить `openpyxl` или `reportlab` в `requirements.txt`
2. Добавить endpoint `GET /api/reports/{id}/export?format=xlsx`
3. На фронтенде добавить кнопку «Экспорт» в нужных компонентах

---

## Полезные команды (Makefile)

```bash
make up             # Собрать и запустить все сервисы
make down           # Остановить сервисы
make logs           # Смотреть логи в реальном времени
make migrate        # Применить миграции БД
make seed           # Загрузить демо-данные
make test-backend   # Запустить тесты бэкенда
make test-frontend  # Запустить тесты фронтенда
make shell-backend  # bash в контейнере бэкенда
make shell-db       # psql в контейнере PostgreSQL
```

---

## Лицензия

Внутренний проект. Все права защищены.
