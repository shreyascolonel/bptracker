from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://bpuser:changeme@localhost:5432/bp_tracker"
    tz: str = "Asia/Kolkata"

    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_subject: str = "mailto:you@example.com"

    ntfy_topic: str = ""
    ntfy_server: str = "https://ntfy.sh"

    bp_morning_time: str = "08:00"
    bp_afternoon_time: str = "14:00"
    bp_evening_time: str = "20:00"
    walking_reminder_time: str = "18:00"
    min_daily_steps: int = 5000

    class Config:
        env_file = ".env"


settings = Settings()
