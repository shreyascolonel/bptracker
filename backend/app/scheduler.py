from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.models import BloodPressureReading, DailyActivity
from app.notifications import notify


def _today_local() -> date:
    return datetime.now().date()


def _has_bp_for_period(db: Session, period: str, day: date) -> bool:
    start = datetime.combine(day, datetime.min.time())
    end = start + timedelta(days=1)
    return (
        db.query(BloodPressureReading)
        .filter(
            BloodPressureReading.period == period,
            BloodPressureReading.recorded_at >= start,
            BloodPressureReading.recorded_at < end,
        )
        .first()
        is not None
    )


def send_bp_reminder(db: Session, period: str) -> None:
    labels = {
        "morning": "Morning",
        "afternoon": "Afternoon",
        "evening": "Evening",
    }
    today = _today_local()
    if _has_bp_for_period(db, period, today):
        return

    label = labels.get(period, period.title())
    notify(
        db,
        title=f"Blood Pressure — {label}",
        body=f"Time to record your {label.lower()} blood pressure reading.",
        tag=f"bp-{period}",
    )


def send_walking_reminder(db: Session) -> None:
    today = _today_local()
    activity = db.query(DailyActivity).filter(DailyActivity.activity_date == today).first()
    steps = activity.steps if activity else 0

    if steps >= settings.min_daily_steps:
        return

    remaining = settings.min_daily_steps - steps
    notify(
        db,
        title="Walking Reminder",
        body=f"You've logged {steps:,} steps today. {remaining:,} more to reach your daily goal of {settings.min_daily_steps:,}.",
        tag="walking-reminder",
    )
