from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import BloodPressureReading, DailyActivity, PushSubscription
from app.schemas import (
    ActivityCreate,
    ActivityResponse,
    ActivityUpdate,
    BloodPressureCreate,
    BloodPressureResponse,
    DashboardSummary,
    PushSubscriptionCreate,
)

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/config/public")
def public_config():
    return {
        "vapid_public_key": settings.vapid_public_key,
        "step_goal": settings.min_daily_steps,
        "bp_times": {
            "morning": settings.bp_morning_time,
            "afternoon": settings.bp_afternoon_time,
            "evening": settings.bp_evening_time,
        },
        "walking_reminder_time": settings.walking_reminder_time,
    }


# --- Blood Pressure ---


@router.post("/blood-pressure", response_model=BloodPressureResponse)
def create_bp_reading(payload: BloodPressureCreate, db: Session = Depends(get_db)):
    reading = BloodPressureReading(
        systolic=payload.systolic,
        diastolic=payload.diastolic,
        pulse=payload.pulse,
        period=payload.period,
        recorded_at=payload.recorded_at or datetime.utcnow(),
        notes=payload.notes,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("/blood-pressure", response_model=list[BloodPressureResponse])
def list_bp_readings(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(BloodPressureReading)
        .filter(BloodPressureReading.recorded_at >= since)
        .order_by(BloodPressureReading.recorded_at.desc())
        .all()
    )


@router.delete("/blood-pressure/{reading_id}")
def delete_bp_reading(reading_id: int, db: Session = Depends(get_db)):
    reading = db.get(BloodPressureReading, reading_id)
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    db.delete(reading)
    db.commit()
    return {"ok": True}


# --- Activity ---


@router.post("/activity", response_model=ActivityResponse)
def upsert_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    activity = db.query(DailyActivity).filter(DailyActivity.activity_date == payload.activity_date).first()
    if activity:
        activity.steps = payload.steps
        activity.calories_burned = payload.calories_burned
        activity.notes = payload.notes
        activity.updated_at = datetime.utcnow()
    else:
        activity = DailyActivity(
            activity_date=payload.activity_date,
            steps=payload.steps,
            calories_burned=payload.calories_burned,
            notes=payload.notes,
        )
        db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.patch("/activity/{activity_date}", response_model=ActivityResponse)
def update_activity(activity_date: date, payload: ActivityUpdate, db: Session = Depends(get_db)):
    activity = db.query(DailyActivity).filter(DailyActivity.activity_date == activity_date).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found for this date")
    if payload.steps is not None:
        activity.steps = payload.steps
    if payload.calories_burned is not None:
        activity.calories_burned = payload.calories_burned
    if payload.notes is not None:
        activity.notes = payload.notes
    activity.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/activity", response_model=list[ActivityResponse])
def list_activity(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days - 1)
    return (
        db.query(DailyActivity)
        .filter(DailyActivity.activity_date >= since)
        .order_by(DailyActivity.activity_date.asc())
        .all()
    )


# --- Dashboard ---


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=6)

    today_activity = db.query(DailyActivity).filter(DailyActivity.activity_date == today).first()
    activities = (
        db.query(DailyActivity)
        .filter(DailyActivity.activity_date >= week_start)
        .order_by(DailyActivity.activity_date.asc())
        .all()
    )
    activity_map = {a.activity_date: a for a in activities}

    weekly_steps = []
    weekly_calories = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        act = activity_map.get(d)
        weekly_steps.append({"date": d.isoformat(), "steps": act.steps if act else 0})
        weekly_calories.append({"date": d.isoformat(), "calories": act.calories_burned if act else 0})

    bp_start = datetime.combine(today, datetime.min.time())
    bp_end = bp_start + timedelta(days=1)
    today_bp = (
        db.query(BloodPressureReading)
        .filter(BloodPressureReading.recorded_at >= bp_start, BloodPressureReading.recorded_at < bp_end)
        .all()
    )
    bp_today: dict[str, BloodPressureResponse | None] = {
        "morning": None,
        "afternoon": None,
        "evening": None,
    }
    for reading in today_bp:
        if reading.period in bp_today and bp_today[reading.period] is None:
            bp_today[reading.period] = BloodPressureResponse.model_validate(reading)

    bp_since = datetime.combine(week_start, datetime.min.time())
    bp_readings = (
        db.query(BloodPressureReading)
        .filter(BloodPressureReading.recorded_at >= bp_since)
        .order_by(BloodPressureReading.recorded_at.asc())
        .all()
    )

    weekly_bp_systolic = [
        {"date": r.recorded_at.date().isoformat(), "period": r.period, "value": r.systolic}
        for r in bp_readings
    ]
    weekly_bp_diastolic = [
        {"date": r.recorded_at.date().isoformat(), "period": r.period, "value": r.diastolic}
        for r in bp_readings
    ]

    return DashboardSummary(
        today_steps=today_activity.steps if today_activity else 0,
        today_calories=today_activity.calories_burned if today_activity else 0,
        step_goal=settings.min_daily_steps,
        bp_today=bp_today,
        weekly_steps=weekly_steps,
        weekly_calories=weekly_calories,
        weekly_bp_systolic=weekly_bp_systolic,
        weekly_bp_diastolic=weekly_bp_diastolic,
    )


# --- Push subscriptions ---


@router.post("/push/subscribe")
def subscribe_push(payload: PushSubscriptionCreate, db: Session = Depends(get_db)):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == payload.endpoint).first()
    if existing:
        existing.p256dh = payload.keys.get("p256dh", "")
        existing.auth = payload.keys.get("auth", "")
    else:
        db.add(
            PushSubscription(
                endpoint=payload.endpoint,
                p256dh=payload.keys.get("p256dh", ""),
                auth=payload.keys.get("auth", ""),
            )
        )
    db.commit()
    return {"ok": True}


@router.post("/push/test")
def test_push(db: Session = Depends(get_db)):
    from app.notifications import notify

    notify(db, "BP Tracker", "Notifications are working!", tag="test")
    return {"ok": True}
