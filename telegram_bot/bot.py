"""
Telegram-бот для ежедневных упражнений по развитию интеллекта.

Если задан GITHUB_TOKEN — подписчики и упражнения хранятся прямо в GitHub-репозитории:
ничего не слетает при перезапуске или обновлении контента.
"""

import base64
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# ── Настройки ─────────────────────────────────────────────────────────────────

BOT_TOKEN     = os.getenv("TELEGRAM_BOT_TOKEN", "")
MOSCOW_TZ     = ZoneInfo("Europe/Moscow")
SEND_HOUR     = int(os.getenv("SEND_HOUR", "9"))
SEND_MINUTE   = int(os.getenv("SEND_MINUTE", "0"))

GITHUB_TOKEN  = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO   = os.getenv("GITHUB_REPO", "bymistake3-ops/solo-na-klaviature")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")

USE_GITHUB = bool(GITHUB_TOKEN)


# ── GitHub API ────────────────────────────────────────────────────────────────

def _gh_headers() -> dict:
    return {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }


async def _github_read(path: str) -> tuple[str, str]:
    """Читает файл из репозитория. Возвращает (содержимое, sha)."""
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, headers=_gh_headers(), params={"ref": GITHUB_BRANCH})
        r.raise_for_status()
        data = r.json()
        content = base64.b64decode(data["content"]).decode("utf-8")
        return content, data["sha"]


async def _github_write(path: str, content: str, sha: str | None, message: str) -> None:
    """Записывает файл в репозиторий."""
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}"
    payload: dict = {
        "message": message,
        "content": base64.b64encode(content.encode()).decode(),
        "branch": GITHUB_BRANCH,
    }
    if sha:
        payload["sha"] = sha
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.put(url, headers=_gh_headers(), json=payload)
        r.raise_for_status()


# ── Упражнения ────────────────────────────────────────────────────────────────

async def load_exercises() -> list[dict]:
    """Загружает упражнения из GitHub или локального файла."""
    if USE_GITHUB:
        try:
            content, _ = await _github_read("exercises.json")
            return json.loads(content)
        except Exception as e:
            logger.error("GitHub: не удалось загрузить exercises.json: %s", e)
            return []
    # Локальный режим — ищем файл рядом со скриптом или уровнем выше
    for p in [
        Path(__file__).parent / "exercises.json",
        Path(__file__).parent.parent / "exercises.json",
        Path("exercises.json"),
    ]:
        if p.exists():
            return json.loads(p.read_text(encoding="utf-8"))
    logger.error("exercises.json не найден")
    return []


async def get_todays_exercise() -> str | None:
    """Возвращает текст упражнения на сегодня или None."""
    exercises = await load_exercises()
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


# ── Подписчики ────────────────────────────────────────────────────────────────

_LOCAL_SUBS = Path(os.getenv("SUBSCRIBERS_FILE", "/app/subscribers.json"))


async def load_subscribers() -> set[int]:
    if USE_GITHUB:
        try:
            content, _ = await _github_read("subscribers.txt")
            result = set()
            for line in content.splitlines():
                line = line.strip()
                if line and not line.startswith("#"):
                    try:
                        result.add(int(line))
                    except ValueError:
                        pass
            return result
        except Exception as e:
            logger.error("GitHub: не удалось загрузить subscribers.txt: %s", e)
            return set()
    # Локальный режим
    _LOCAL_SUBS.parent.mkdir(parents=True, exist_ok=True)
    if _LOCAL_SUBS.exists():
        try:
            return set(json.loads(_LOCAL_SUBS.read_text()))
        except Exception:
            pass
    return set()


async def save_subscribers(subscribers: set[int]) -> None:
    if USE_GITHUB:
        try:
            try:
                current, sha = await _github_read("subscribers.txt")
            except Exception:
                current = "# Список подписчиков (не редактируйте вручную)\n"
                sha = None
            comments = [l for l in current.splitlines() if l.startswith("#")]
            lines = comments + [str(s) for s in sorted(subscribers)]
            await _github_write(
                "subscribers.txt",
                "\n".join(lines) + "\n",
                sha,
                f"subscribers: {len(subscribers)} total",
            )
            logger.info("GitHub: подписчики сохранены (%d)", len(subscribers))
        except Exception as e:
            logger.error("GitHub: не удалось сохранить subscribers.txt: %s", e)
        return
    # Локальный режим
    _LOCAL_SUBS.parent.mkdir(parents=True, exist_ok=True)
    _LOCAL_SUBS.write_text(json.dumps(sorted(subscribers), ensure_ascii=False))


# ── Команды бота ──────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    subscribers = await load_subscribers()

    if chat_id not in subscribers:
        subscribers.add(chat_id)
        await save_subscribers(subscribers)
        logger.info("Новый подписчик: %s (всего: %d)", chat_id, len(subscribers))
        await update.message.reply_text(
            "✅ Вы подписались на ежедневные упражнения!\n\n"
            "Каждый день в 09:00 по Москве вы будете получать новое задание "
            "для тренировки интеллекта.\n\n"
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
    subscribers = await load_subscribers()

    if chat_id in subscribers:
        subscribers.discard(chat_id)
        await save_subscribers(subscribers)
        logger.info("Отписался: %s (всего: %d)", chat_id, len(subscribers))
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
    text = await get_todays_exercise()
    if text:
        await update.message.reply_text(text)
    else:
        today = datetime.now(MOSCOW_TZ).strftime("%d.%m.%Y")
        await update.message.reply_text(
            f"На сегодня ({today}) упражнение не запланировано.\n"
            "Загляните завтра!"
        )


async def cmd_myid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(f"Ваш chat_id: {update.effective_chat.id}")


# ── Ежедневная рассылка ───────────────────────────────────────────────────────

async def broadcast_daily(app: Application) -> None:
    text = await get_todays_exercise()
    today = datetime.now(MOSCOW_TZ).strftime("%d.%m.%Y")

    if not text:
        logger.info("На %s упражнений нет — пропускаем рассылку.", today)
        return

    subscribers = await load_subscribers()
    if not subscribers:
        logger.info("Подписчиков нет — пропускаем рассылку.")
        return

    logger.info("Рассылка на %s → %d подписчиков", today, len(subscribers))

    failed: set[int] = set()
    for chat_id in subscribers:
        try:
            await app.bot.send_message(chat_id=chat_id, text=text)
            logger.info("  ✓ %s", chat_id)
        except Exception as e:
            logger.warning("  ✗ %s: %s", chat_id, e)
            failed.add(chat_id)

    if failed:
        active = subscribers - failed
        await save_subscribers(active)
        logger.info("Удалено недоступных: %d. Активных: %d", len(failed), len(active))


# ── Запуск ────────────────────────────────────────────────────────────────────

def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN не задан")

    storage = "GitHub (постоянное)" if USE_GITHUB else "локальное (временное)"
    logger.info("Запуск бота | Хранилище: %s | Рассылка: %02d:%02d МСК",
                storage, SEND_HOUR, SEND_MINUTE)

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start",    cmd_start))
    app.add_handler(CommandHandler("stop",     cmd_stop))
    app.add_handler(CommandHandler("today",    cmd_today))
    app.add_handler(CommandHandler("exercise", cmd_today))
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
