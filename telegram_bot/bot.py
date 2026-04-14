"""
Telegram-бот для ежедневных упражнений по развитию интеллекта.
Хранит подписчиков локально, читает упражнения из exercises.json.
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
MOSCOW_TZ = ZoneInfo("Europe/Moscow")
SEND_HOUR = int(os.getenv("SEND_HOUR", "9"))
SEND_MINUTE = int(os.getenv("SEND_MINUTE", "0"))

# Путь к файлу упражнений: сначала ищем рядом со скриптом,
# затем на уровень выше (для Railway, где exercises.json лежит в корне репо)
def _find_exercises_file() -> Path:
    override = os.getenv("EXERCISES_FILE", "")
    if override:
        return Path(override)
    for candidate in [
        Path(__file__).parent / "exercises.json",
        Path(__file__).parent.parent / "exercises.json",
        Path("exercises.json"),
    ]:
        if candidate.exists():
            logger.info("Found exercises file: %s", candidate)
            return candidate
    logger.warning("exercises.json not found, using default path")
    return Path("exercises.json")

EXERCISES_FILE = _find_exercises_file()

# Файл подписчиков: /data/subscribers.json (Railway volume) или рядом со скриптом
_default_subscribers = Path(os.getenv("DATA_DIR", "/data")) / "subscribers.json"
SUBSCRIBERS_FILE = Path(os.getenv("SUBSCRIBERS_FILE", str(_default_subscribers)))


# ── Работа с подписчиками ─────────────────────────────────────────────────────

def load_subscribers() -> set[int]:
    SUBSCRIBERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if SUBSCRIBERS_FILE.exists():
        try:
            data = json.loads(SUBSCRIBERS_FILE.read_text(encoding="utf-8"))
            return set(data)
        except Exception as e:
            logger.error("Failed to load subscribers: %s", e)
    return set()


def save_subscribers(subscribers: set[int]) -> None:
    SUBSCRIBERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SUBSCRIBERS_FILE.write_text(
        json.dumps(sorted(subscribers), indent=2), encoding="utf-8"
    )


# ── Работа с упражнениями ─────────────────────────────────────────────────────

def load_exercises() -> list[dict]:
    try:
        return json.loads(EXERCISES_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error("Cannot load exercises from %s: %s", EXERCISES_FILE, e)
        return []


def get_todays_exercise() -> str | None:
    """Возвращает текст упражнения на сегодня или None если не запланировано."""
    exercises = load_exercises()
    today = datetime.now(MOSCOW_TZ).strftime("%d.%m.%Y")
    entry = next((e for e in exercises if e.get("date") == today), None)
    if not entry:
        return None
    # Новый формат: поле "text"
    if "text" in entry:
        return entry["text"]
    # Старый формат: массив "exercises"
    texts = entry.get("exercises", [])
    return "\n\n―――――――――\n\n".join(texts) if texts else None


# ── Команды бота ──────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    subscribers = load_subscribers()

    if chat_id not in subscribers:
        subscribers.add(chat_id)
        save_subscribers(subscribers)
        logger.info("New subscriber: %s (total: %d)", chat_id, len(subscribers))
        await update.message.reply_text(
            "✅ Вы подписались на ежедневные упражнения!\n\n"
            "Каждый день в 09:00 по Москве вы будете получать новое задание для тренировки интеллекта.\n\n"
            "Доступные команды:\n"
            "📌 /today — получить сегодняшнее упражнение прямо сейчас\n"
            "❌ /stop — отписаться от рассылки"
        )
    else:
        await update.message.reply_text(
            "Вы уже подписаны на рассылку.\n\n"
            "📌 /today — получить сегодняшнее упражнение\n"
            "❌ /stop — отписаться"
        )


async def cmd_stop(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    subscribers = load_subscribers()

    if chat_id in subscribers:
        subscribers.discard(chat_id)
        save_subscribers(subscribers)
        logger.info("Unsubscribed: %s (total: %d)", chat_id, len(subscribers))
        await update.message.reply_text(
            "❌ Вы отписались от ежедневных упражнений.\n\n"
            "Чтобы подписаться снова — нажмите /start"
        )
    else:
        await update.message.reply_text(
            "Вы не были подписаны.\n"
            "Нажмите /start чтобы подписаться."
        )


async def cmd_today(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = get_todays_exercise()
    if text:
        await update.message.reply_text(text)
    else:
        today = datetime.now(MOSCOW_TZ).strftime("%d.%m.%Y")
        await update.message.reply_text(
            f"На сегодня ({today}) упражнение не запланировано.\n"
            "Загляните завтра!"
        )


async def cmd_myid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    await update.message.reply_text(
        f"Ваш Telegram chat_id:\n\n{chat_id}\n\n"
        "Это число нужно, если вы хотите добавить себя в список вручную."
    )


# ── Ежедневная рассылка ───────────────────────────────────────────────────────

async def broadcast_daily(app: Application) -> None:
    text = get_todays_exercise()
    today = datetime.now(MOSCOW_TZ).strftime("%d.%m.%Y")

    if not text:
        logger.info("No exercise for %s — skipping broadcast.", today)
        return

    subscribers = load_subscribers()
    if not subscribers:
        logger.info("No subscribers — skipping broadcast.")
        return

    logger.info("Broadcasting exercise for %s to %d subscribers", today, len(subscribers))

    failed: set[int] = set()
    for chat_id in subscribers:
        try:
            await app.bot.send_message(chat_id=chat_id, text=text)
            logger.info("  ✓ sent to %s", chat_id)
        except Exception as e:
            logger.warning("  ✗ failed for %s: %s", chat_id, e)
            failed.add(chat_id)

    if failed:
        active = subscribers - failed
        save_subscribers(active)
        logger.info("Removed %d unreachable subscribers. Active: %d", len(failed), len(active))


# ── Запуск ────────────────────────────────────────────────────────────────────

def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError(
            "TELEGRAM_BOT_TOKEN не задан. "
            "Установите переменную окружения и перезапустите бота."
        )

    logger.info("Starting bot...")
    logger.info("Exercises file : %s (exists=%s)", EXERCISES_FILE, EXERCISES_FILE.exists())
    logger.info("Subscribers file: %s", SUBSCRIBERS_FILE)
    logger.info("Daily broadcast : %02d:%02d MSK", SEND_HOUR, SEND_MINUTE)

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start",    cmd_start))
    app.add_handler(CommandHandler("stop",     cmd_stop))
    app.add_handler(CommandHandler("today",    cmd_today))
    app.add_handler(CommandHandler("exercise", cmd_today))   # псевдоним
    app.add_handler(CommandHandler("myid",     cmd_myid))

    scheduler = AsyncIOScheduler(timezone=MOSCOW_TZ)
    scheduler.add_job(
        broadcast_daily,
        trigger="cron",
        hour=SEND_HOUR,
        minute=SEND_MINUTE,
        args=[app],
    )
    scheduler.start()

    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
