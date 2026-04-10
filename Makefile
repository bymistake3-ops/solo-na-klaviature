.PHONY: up down logs migrate seed test-backend test-frontend shell-backend shell-db help

# Запустить все сервисы в фоне
up:
	docker compose up -d --build

# Остановить все сервисы и удалить контейнеры
down:
	docker compose down

# Просмотр логов (все сервисы)
logs:
	docker compose logs -f

# Применить миграции Alembic
migrate:
	docker compose exec backend alembic upgrade head

# Запустить сидирование демо-данных вручную
seed:
	docker compose exec backend python seed/seed.py

# Запустить тесты бэкенда
test-backend:
	docker compose exec backend pytest -v

# Запустить тесты фронтенда
test-frontend:
	docker compose exec frontend npm test

# Открыть shell в контейнере бэкенда
shell-backend:
	docker compose exec backend bash

# Открыть psql в контейнере базы данных
shell-db:
	docker compose exec db psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-solo_analytics}

# Показать доступные команды
help:
	@echo "Доступные команды:"
	@echo "  make up             - Собрать образы и запустить все сервисы в фоне"
	@echo "  make down           - Остановить и удалить контейнеры"
	@echo "  make logs           - Стримить логи всех сервисов"
	@echo "  make migrate        - Применить миграции Alembic"
	@echo "  make seed           - Загрузить демо-данные"
	@echo "  make test-backend   - Запустить pytest для бэкенда"
	@echo "  make test-frontend  - Запустить npm test для фронтенда"
	@echo "  make shell-backend  - Открыть bash в контейнере бэкенда"
	@echo "  make shell-db       - Открыть psql в контейнере БД"
