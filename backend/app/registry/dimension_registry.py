"""Default dimension definitions."""

DEFAULT_DIMENSIONS = [
    # new_users data source has no string dimensions, but period-based
    # payments dimensions
    {
        "data_source_slug": "new_payments_daily",
        "key": "payment_type",
        "name_ru": "Тип платежа",
        "name_en": "Payment Type",
        "data_type": "string",
        "is_filterable": True,
        "is_visible": True,
    },
    {
        "data_source_slug": "new_payments_daily",
        "key": "channel",
        "name_ru": "Канал",
        "name_en": "Channel",
        "data_type": "string",
        "is_filterable": True,
        "is_visible": True,
    },
    {
        "data_source_slug": "repeat_payments_daily",
        "key": "payment_type",
        "name_ru": "Тип платежа",
        "name_en": "Payment Type",
        "data_type": "string",
        "is_filterable": True,
        "is_visible": True,
    },
]
