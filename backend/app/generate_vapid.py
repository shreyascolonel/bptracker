"""Generate VAPID keys for Web Push notifications.

Usage:
  docker compose run --rm api python -m app.generate_vapid
"""

from py_vapid import Vapid01

if __name__ == "__main__":
    v = Vapid01()
    v.generate_keys()
    print("Add these to your .env file:\n")
    print(f"VAPID_PUBLIC_KEY={v.public_key}")
    print(f"VAPID_PRIVATE_KEY={v.private_key}")
    print("\nVAPID_SUBJECT=mailto:your-email@example.com")
    print("\nThen rebuild: docker compose up -d --build")
