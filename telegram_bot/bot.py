import json
import logging
import os
from datetime import datetime, date
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

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8598697652:AAElNoRcrN8EOayZDjjSKgJU7HgITq8ts8M")
SUBSCRIBERS_FILE = Path(os.getenv("SUBSCRIBERS_FILE", "/data/subscribers.json"))
SEND_HOUR = int(os.getenv("SEND_HOUR", "9"))
SEND_MINUTE = int(os.getenv("SEND_MINUTE", "0"))
MOSCOW_TZ = ZoneInfo("Europe/Moscow")

EXERCISES = [
    {"id": 1,  "date": "13.04.2026", "text": "Запомни 7 слов: стол, река, книга, огонь, машина, дерево, кофе. Через 5 минут воспроизведи."},
    {"id": 2,  "date": "14.04.2026", "text": "За 2 минуты напиши максимум слов на букву «К»."},
    {"id": 3,  "date": "15.04.2026", "text": "Считай от 100 до 1 с шагом -3."},
    {"id": 4,  "date": "16.04.2026", "text": "Придумай 10 нестандартных способов использования ручки."},
    {"id": 5,  "date": "17.04.2026", "text": "Запомни число 73916482 за 30 секунд. Воспроизведи."},
    {"id": 6,  "date": "18.04.2026", "text": "Найди вокруг себя 5 предметов одного цвета."},
    {"id": 7,  "date": "19.04.2026", "text": "Напиши фразу «Я развиваю свой мозг каждый день» нерабочей рукой."},
    {"id": 8,  "date": "20.04.2026", "text": "Запомни 8 слов и воспроизведи их в обратном порядке."},
    {"id": 9,  "date": "21.04.2026", "text": "Назови 10 животных, 10 городов и 10 профессий за 2 минуты."},
    {"id": 10, "date": "22.04.2026", "text": "Придумай 5 способов связать слова «море» и «компьютер»."},
    {"id": 11, "date": "23.04.2026", "text": "Закрой глаза на 3 минуты и найди 5 разных звуков."},
    {"id": 12, "date": "24.04.2026", "text": "Придумай 10 идей, как заработать 1000 ₽ за день."},
    {"id": 13, "date": "25.04.2026", "text": "Запомни список из 10 слов и воспроизведи через 10 минут."},
    {"id": 14, "date": "26.04.2026", "text": "Считай от 200 до 0 с шагом -7."},
    {"id": 15, "date": "27.04.2026", "text": "Найди лишнее: кошка, собака, стол, лев. Объясни почему."},
    {"id": 16, "date": "28.04.2026", "text": "Напиши 15 антонимов к разным словам."},
    {"id": 17, "date": "29.04.2026", "text": "Нарисуй круг и квадрат одновременно двумя руками."},
    {"id": 18, "date": "30.04.2026", "text": "Придумай продукт, который улучшает память."},
    {"id": 19, "date": "01.05.2026", "text": "Запомни 5 имен и придумай ассоциации к каждому."},
    {"id": 20, "date": "02.05.2026", "text": "Придумай 10 ассоциаций к слову «скорость»."},
    {"id": 21, "date": "03.05.2026", "text": "Сконцентрируйся 10 минут на одной задаче без отвлечений."},
    {"id": 22, "date": "04.05.2026", "text": "Придумай загадку с ответами только «да/нет»."},
    {"id": 23, "date": "05.05.2026", "text": "Запомни 9 цифр и воспроизведи их через 5 минут."},
    {"id": 24, "date": "06.05.2026", "text": "Напиши слово «интеллект» задом наперёд."},
    {"id": 25, "date": "07.05.2026", "text": "Назови 20 слов на букву «М» за 2 минуты."},
    {"id": 26, "date": "08.05.2026", "text": "Придумай 10 идей бизнеса без интернета."},
    {"id": 27, "date": "09.05.2026", "text": "Считай от 150 до 0 с шагом -5."},
    {"id": 28, "date": "10.05.2026", "text": "Запомни 8 предметов вокруг себя и воспроизведи их через 5 минут."},
    {"id": 29, "date": "11.05.2026", "text": "Придумай 10 способов улучшить свою память."},
    {"id": 30, "date": "12.05.2026", "text": "Найди 5 круглых предметов вокруг себя."},
    {"id": 31, "date": "13.05.2026", "text": "Придумай 5 историй, связывающих 5 случайных слов."},
    {"id": 32, "date": "14.05.2026", "text": "Запомни 10 слов через метод истории."},
    {"id": 33, "date": "15.05.2026", "text": "Считай от 300 до 0 с шагом -9."},
    {"id": 34, "date": "16.05.2026", "text": "Придумай 10 способов использования телефона без интернета."},
    {"id": 35, "date": "17.05.2026", "text": "Закрой глаза и сосредоточься на дыхании 5 минут."},
    {"id": 36, "date": "18.05.2026", "text": "Запомни список из 12 слов."},
    {"id": 37, "date": "19.05.2026", "text": "Придумай 10 ассоциаций к слову «деньги»."},
    {"id": 38, "date": "20.05.2026", "text": "Напиши 15 глаголов за 1 минуту."},
]

# Build date -> exercise map
EXERCISE_BY_DATE: dict[str, dict] = {ex["date"]: ex for ex in EXERCISES}


def load_subscribers() -> set[int]:
    SUBSCRIBERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if SUBSCRIBERS_FILE.exists():
        try:
            data = json.loads(SUBSCRIBERS_FILE.read_text())
            return set(data)
        except Exception:
            pass
    return set()


def save_subscribers(subscribers: set[int]) -> None:
    SUBSCRIBERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SUBSCRIBERS_FILE.write_text(json.dumps(list(subscribers)))


def get_todays_exercise() -> dict | None:
    today = datetime.now(MOSCOW_TZ).date()
    key = today.strftime("%d.%m.%Y")
    return EXERCISE_BY_DATE.get(key)


def format_exercise_message(exercise: dict, today: date | None = None) -> str:
    if today is None:
        today = datetime.now(MOSCOW_TZ).date()
    date_str = today.strftime("%d.%m.%Y")
    return (
        f"🧠 *Упражнение на {date_str}*\n\n"
        f"_{exercise['text']}_"
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    subscribers = load_subscribers()
    if chat_id not in subscribers:
        subscribers.add(chat_id)
        save_subscribers(subscribers)
        await update.message.reply_text(
            "✅ Вы подписались на ежедневные упражнения для мозга!\n\n"
            "Каждый день в 09:00 по Москве вы будете получать новое упражнение.\n\n"
            "Используйте /exercise чтобы получить сегодняшнее упражнение прямо сейчас."
        )
    else:
        await update.message.reply_text(
            "Вы уже подписаны. Используйте /exercise чтобы получить сегодняшнее упражнение."
        )


async def stop(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    subscribers = load_subscribers()
    if chat_id in subscribers:
        subscribers.discard(chat_id)
        save_subscribers(subscribers)
        await update.message.reply_text("❌ Вы отписались от ежедневных упражнений.")
    else:
        await update.message.reply_text("Вы не были подписаны.")


async def exercise(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    ex = get_todays_exercise()
    if ex:
        await update.message.reply_text(
            format_exercise_message(ex),
            parse_mode="Markdown",
        )
    else:
        today = datetime.now(MOSCOW_TZ).date().strftime("%d.%m.%Y")
        await update.message.reply_text(
            f"На сегодня ({today}) упражнения нет. Заходите позже!"
        )


async def myid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    await update.message.reply_text(
        f"Ваш Telegram chat\\_id:\n\n`{chat_id}`\n\n"
        "Скопируйте это число и добавьте в файл `subscribers.txt` в репозитории на GitHub.",
        parse_mode="Markdown",
    )


async def send_daily_exercise(app: Application) -> None:
    ex = get_todays_exercise()
    if not ex:
        logger.info("No exercise for today, skipping broadcast.")
        return

    msg = format_exercise_message(ex)
    subscribers = load_subscribers()
    logger.info("Sending daily exercise to %d subscribers", len(subscribers))

    failed = set()
    for chat_id in subscribers:
        try:
            await app.bot.send_message(
                chat_id=chat_id,
                text=msg,
                parse_mode="Markdown",
            )
        except Exception as e:
            logger.warning("Failed to send to %s: %s", chat_id, e)
            failed.add(chat_id)

    if failed:
        active = subscribers - failed
        save_subscribers(active)
        logger.info("Removed %d unreachable subscribers", len(failed))


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("stop", stop))
    app.add_handler(CommandHandler("exercise", exercise))
    app.add_handler(CommandHandler("myid", myid))

    scheduler = AsyncIOScheduler(timezone=MOSCOW_TZ)
    scheduler.add_job(
        send_daily_exercise,
        trigger="cron",
        hour=SEND_HOUR,
        minute=SEND_MINUTE,
        args=[app],
    )
    scheduler.start()
    logger.info("Scheduler started — daily broadcast at %02d:%02d MSK", SEND_HOUR, SEND_MINUTE)

    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
