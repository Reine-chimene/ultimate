from datetime import datetime, time
from zoneinfo import ZoneInfo


def format_meeting_time(dt: datetime, timezone: str, city: str) -> str:
    if dt.tzinfo is None:
        local_dt = dt.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo(timezone))
    else:
        local_dt = dt.astimezone(ZoneInfo(timezone))
    return f"{local_dt.strftime('%H:%M')} — heure de {city}"


def format_availability_slot(
    start: time | None,
    end: time | None,
    timezone: str,
    city: str,
) -> str:
    if start and end:
        return f"Disponible ce soir · {start.strftime('%Hh')}–{end.strftime('%Hh')} · heure de {city}"
    if start:
        return f"Disponible ce soir · à partir de {start.strftime('%Hh')} · heure de {city}"
    return "Disponible ce soir"


def format_availability_until(note: str | None, timezone: str) -> str | None:
    if note:
        return note
    try:
        now = datetime.now(ZoneInfo(timezone))
        return f"Disponible jusqu'à {now.replace(hour=23, minute=30).strftime('%H:%M')}"
    except Exception:
        return "Disponible ce soir"
