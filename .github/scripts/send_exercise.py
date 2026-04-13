"""
Скрипт для отправки ежедневных упражнений через Telegram Bot API.
Запускается через GitHub Actions.
"""

import json
import os
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

import requests

MOSCOW_TZ = ZoneInfo("Europe/Moscow")

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
DATE_OVERRIDE = os.environ.get("DATE_OVERRIDE", "").strip()


def load_exercises(path: str = "exercises.json") -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_subscribers(path: str = "subscribers.txt") -> list[str]:
    subscribers = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                subscribers.append(line)
    return subscribers


def get_target_date() -> str:
    if DATE_OVERRIDE:
        return DATE_OVERRIDE
    return datetime.now(MOSCOW_TZ).strftime("%d.%m.%Y")


def send_message(chat_id: str, text: str, parse_mode: str | None = None) -> bool:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload: dict = {"chat_id": chat_id, "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    resp = requests.post(url, json=payload, timeout=10)
    return resp.status_code == 200


def main() -> None:
    if not BOT_TOKEN:
        print("ОШИБКА: переменная TELEGRAM_BOT_TOKEN не задана.")
        print("Добавьте её в Settings → Secrets → Actions вашего репозитория.")
        sys.exit(1)

    target_date = get_target_date()
    print(f"Дата для отправки: {target_date}")

    exercises = load_exercises()
    day_entry = next((e for e in exercises if e["date"] == target_date), None)

    if not day_entry:
        print(f"На {target_date} упражнений нет — ничего не отправляем.")
        sys.exit(0)

    # Поддержка двух форматов:
    # Новый:  {"date": "...", "text": "готовый текст сообщения"}
    # Старый: {"date": "...", "exercises": ["текст1", "текст2"]}
    if "text" in day_entry:
        messages_to_send = [day_entry["text"]]
        use_header = False
    else:
        messages_to_send = day_entry["exercises"]
        use_header = True

    print(f"Найдено упражнений: {len(messages_to_send)}")

    subscribers = load_subscribers()
    if not subscribers:
        print("ПРЕДУПРЕЖДЕНИЕ: файл subscribers.txt пуст — некому отправлять.")
        sys.exit(0)

    print(f"Подписчиков: {len(subscribers)}")

    ok_count = 0
    fail_count = 0

    for chat_id in subscribers:
        for idx, exercise_text in enumerate(messages_to_send, start=1):
            if use_header:
                if len(messages_to_send) == 1:
                    header = f"🧠 *Упражнение на {target_date}*"
                else:
                    header = f"🧠 *Упражнение {idx} из {len(messages_to_send)} на {target_date}*"
                message = f"{header}\n\n{exercise_text}"
            else:
                message = exercise_text

            success = send_message(chat_id, message, parse_mode="Markdown" if use_header else None)
            if success:
                ok_count += 1
                print(f"  ✓ → {chat_id} (упражнение {idx})")
            else:
                fail_count += 1
                print(f"  ✗ → {chat_id} (упражнение {idx}) — ошибка отправки")

    print(f"\nИтог: {ok_count} отправлено, {fail_count} ошибок.")
    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
