import json
import logging
from pathlib import Path

import httpx
from pywebpush import WebPushException, webpush
from sqlalchemy.orm import Session

from app.config import settings
from app.models import PushSubscription

logger = logging.getLogger(__name__)


def _vapid_configured() -> bool:
    return bool(settings.vapid_public_key and settings.vapid_private_key)


def send_web_push(db: Session, title: str, body: str, tag: str | None = None) -> int:
    if not _vapid_configured():
        return 0

    payload = json.dumps({"title": title, "body": body, "tag": tag or "bp-tracker"})
    sent = 0
    stale: list[PushSubscription] = []

    for sub in db.query(PushSubscription).all():
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
            )
            sent += 1
        except WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):
                stale.append(sub)
            logger.warning("Web push failed for %s: %s", sub.endpoint[:40], exc)

    for sub in stale:
        db.delete(sub)
    if stale:
        db.commit()

    return sent


def _send_ntfy_sync(title: str, body: str) -> bool:
    if not settings.ntfy_topic:
        return False

    url = f"{settings.ntfy_server.rstrip('/')}/{settings.ntfy_topic}"
    try:
        with httpx.Client(timeout=10) as client:
            response = client.post(
                url,
                content=body.encode("utf-8"),
                headers={"Title": title, "Priority": "default", "Tags": "heart,walking"},
            )
            return response.is_success
    except httpx.HTTPError as exc:
        logger.warning("ntfy notification failed: %s", exc)
        return False


def notify(db: Session, title: str, body: str, tag: str | None = None) -> None:
    send_web_push(db, title, body, tag)
    _send_ntfy_sync(title, body)
