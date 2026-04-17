"""
Опрашивает Telegram Bot API на новые команды и обрабатывает их.
Запускается каждые 10 минут через GitHub Actions.

Команды:
  /start   — подписаться на ежедневные упражнения
  /stop    — отписаться
  /today   — получить сегодняшнее упражнение
  /exercise — то же что /today
  /myid    — узнать свой chat_id
"""

import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests


def clean_text(text: str) -> str:
    """Убирает нумерацию вида '| Упражнение #005' из текста."""
    return re.sub(r"\s*\|\s*Упражнение\s*#\d+", "", text).strip()

BOT_TOKEN      = os.environ.get("TELEGRAM_BOT_TOKEN", "")
MOSCOW_TZ      = ZoneInfo("Europe/Moscow")
MAX_MESSAGE_AGE_SEC = 1800   # игнорировать сообщения старше 30 минут
OFFSET_FILE    = Path("telegram_offset.txt")
SUBSCRIBERS_FILE = Path("subscribers.txt")
EXERCISES_FILE = Path("exercises.json")
API_URL        = f"https://api.telegram.org/bot{BOT_TOKEN}"


# ── Telegram API ──────────────────────────────────────────────────────────────

def tg_send(chat_id: int, text: str) -> None:
    try:
        r = requests.post(
            f"{API_URL}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=10,
        )
        if not r.ok:
            print(f"  sendMessage error → {chat_id}: {r.text[:200]}")
    except Exception as e:
        print(f"  sendMessage exception → {chat_id}: {e}")


# ── Offset (отслеживание обработанных сообщений) ──────────────────────────────

def load_offset() -> int:
    if OFFSET_FILE.exists():
        try:
            return int(OFFSET_FILE.read_text().strip())
        except ValueError:
            pass
    return 0


def save_offset(offset: int) -> None:
    OFFSET_FILE.write_text(str(offset))


# ── Подписчики ────────────────────────────────────────────────────────────────

def load_subscribers() -> set[int]:
    if not SUBSCRIBERS_FILE.exists():
        return set()
    result = set()
    for line in SUBSCRIBERS_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            try:
                result.add(int(line))
            except ValueError:
                pass
    return result


def save_subscribers(subscribers: set[int]) -> None:
    if SUBSCRIBERS_FILE.exists():
        comments = [
            l for l in SUBSCRIBERS_FILE.read_text(encoding="utf-8").splitlines()
            if l.startswith("#")
        ]
    else:
        comments = ["# Список подписчиков (обновляется автоматически)"]
    lines = comments + [str(s) for s in sorted(subscribers)]
    SUBSCRIBERS_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Подписчики сохранены: {len(subscribers)} чел.")


# ── Упражнения ────────────────────────────────────────────────────────────────

def get_todays_exercise() -> str | None:
    if not EXERCISES_FILE.exists():
        print("exercises.json не найден")
        return None
    exercises = json.loads(EXERCISES_FILE.read_text(encoding="utf-8"))
    today = datetime.now(MOSCOW_TZ).strftime("%d.%m.%Y")
    entry = next((e for e in exercises if e.get("date") == today), None)
    if not entry:
        return None
    if "text" in entry:
        return clean_text(entry["text"])
    texts = entry.get("exercises", [])
    return "\n\n―――――――――\n\n".join(clean_text(t) for t in texts) if texts else None


# ── Главная логика ────────────────────────────────────────────────────────────

def main() -> None:
    if not BOT_TOKEN:
        print("ОШИБКА: TELEGRAM_BOT_TOKEN не задан")
        sys.exit(1)

    offset = load_offset()
    print(f"Текущий offset: {offset}")

    # Получаем новые обновления
    try:
        r = requests.get(
            f"{API_URL}/getUpdates",
            params={"offset": offset, "timeout": 0, "allowed_updates": ["message"]},
            timeout=20,
        )
        r.raise_for_status()
    except Exception as e:
        print(f"getUpdates ошибка: {e}")
        sys.exit(1)

    updates = r.json().get("result", [])
    print(f"Новых обновлений: {len(updates)}")

    if not updates:
        return

    subscribers = load_subscribers()
    subscribers_changed = False

    for update in updates:
        update_id = update["update_id"]
        offset = max(offset, update_id + 1)

        message = update.get("message", {})
        text    = message.get("text", "").strip()
        chat    = message.get("chat", {})
        chat_id = chat.get("id")

        if not chat_id or not text or not text.startswith("/"):
            continue

        # Игнорируем сообщения старше 30 минут (защита от повторной обработки при сбросе offset)
        msg_date = message.get("date", 0)
        if time.time() - msg_date > MAX_MESSAGE_AGE_SEC:
            print(f"  Пропуск старого сообщения от {chat_id} (возраст {int(time.time()-msg_date)}с)")
            continue

        # Убираем @имя_бота из команды (например /start@mybot → /start)
        command = text.split()[0].lower().split("@")[0]
        print(f"Команда '{command}' от {chat_id}")

        if command == "/start":
            if chat_id not in subscribers:
                subscribers.add(chat_id)
                subscribers_changed = True
                tg_send(
                    chat_id,
                    "✅ Вы подписались на ежедневные упражнения!\n\n"
                    "Каждый день в 09:00 по Москве вы будете получать новое задание "
                    "для тренировки интеллекта.\n\n"
                    "📌 /today — получить сегодняшнее упражнение прямо сейчас\n"
                    "❌ /stop — отписаться от рассылки",
                )
            else:
                tg_send(
                    chat_id,
                    "Вы уже подписаны на рассылку.\n\n"
                    "📌 /today — получить сегодняшнее упражнение\n"
                    "❌ /stop — отписаться",
                )

        elif command == "/stop":
            if chat_id in subscribers:
                subscribers.discard(chat_id)
                subscribers_changed = True
                tg_send(
                    chat_id,
                    "❌ Вы отписались от ежедневных упражнений.\n\n"
                    "Чтобы подписаться снова — нажмите /start",
                )
            else:
                tg_send(chat_id, "Вы не были подписаны. Нажмите /start чтобы подписаться.")

        elif command in ("/today", "/exercise"):
            exercise = get_todays_exercise()
            if exercise:
                tg_send(chat_id, exercise)
            else:
                today = datetime.now(MOSCOW_TZ).strftime("%d.%m.%Y")
                tg_send(chat_id, f"На сегодня ({today}) упражнение не запланировано.")

        elif command == "/myid":
            tg_send(chat_id, f"Ваш chat_id: {chat_id}")

    if subscribers_changed:
        save_subscribers(subscribers)

    save_offset(offset)
    print(f"Новый offset сохранён: {offset}")


if __name__ == "__main__":
    main()
