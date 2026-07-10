import logging
from contextlib import asynccontextmanager
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routes import router
from app.scheduler import send_bp_reminder, send_walking_reminder

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone=ZoneInfo(settings.tz))


def _parse_time(time_str: str) -> tuple[int, int]:
    hour, minute = time_str.strip().split(":")
    return int(hour), int(minute)


def _run_bp_reminder(period: str) -> None:
    db = SessionLocal()
    try:
        send_bp_reminder(db, period)
    finally:
        db.close()


def _run_walking_reminder() -> None:
    db = SessionLocal()
    try:
        send_walking_reminder(db)
    finally:
        db.close()


def setup_scheduler() -> None:
    schedules = [
        ("morning", settings.bp_morning_time),
        ("afternoon", settings.bp_afternoon_time),
        ("evening", settings.bp_evening_time),
    ]
    for period, time_str in schedules:
        hour, minute = _parse_time(time_str)
        scheduler.add_job(
            _run_bp_reminder,
            CronTrigger(hour=hour, minute=minute, timezone=ZoneInfo(settings.tz)),
            args=[period],
            id=f"bp-{period}",
            replace_existing=True,
        )
        logger.info("Scheduled BP %s reminder at %s", period, time_str)

    wh, wm = _parse_time(settings.walking_reminder_time)
    scheduler.add_job(
        _run_walking_reminder,
        CronTrigger(hour=wh, minute=wm, timezone=ZoneInfo(settings.tz)),
        id="walking-reminder",
        replace_existing=True,
    )
    logger.info("Scheduled walking reminder at %s", settings.walking_reminder_time)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    setup_scheduler()
    scheduler.start()
    logger.info("BP Tracker API started (TZ=%s)", settings.tz)
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="BP Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
