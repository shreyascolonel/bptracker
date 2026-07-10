from datetime import date, datetime

from pydantic import BaseModel, Field


class BloodPressureCreate(BaseModel):
    systolic: int = Field(ge=50, le=300)
    diastolic: int = Field(ge=30, le=200)
    pulse: int | None = Field(default=None, ge=30, le=250)
    period: str = Field(pattern="^(morning|afternoon|evening)$")
    recorded_at: datetime | None = None
    notes: str | None = None


class BloodPressureResponse(BaseModel):
    id: int
    systolic: int
    diastolic: int
    pulse: int | None
    period: str
    recorded_at: datetime
    notes: str | None

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    activity_date: date
    steps: int = Field(ge=0)
    calories_burned: float = Field(ge=0)
    notes: str | None = None


class ActivityUpdate(BaseModel):
    steps: int | None = Field(default=None, ge=0)
    calories_burned: float | None = Field(default=None, ge=0)
    notes: str | None = None


class ActivityResponse(BaseModel):
    id: int
    activity_date: date
    steps: int
    calories_burned: float
    notes: str | None
    updated_at: datetime

    model_config = {"from_attributes": True}


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: dict[str, str]


class DashboardSummary(BaseModel):
    today_steps: int
    today_calories: float
    step_goal: int
    bp_today: dict[str, BloodPressureResponse | None]
    weekly_steps: list[dict]
    weekly_calories: list[dict]
    weekly_bp_systolic: list[dict]
    weekly_bp_diastolic: list[dict]
