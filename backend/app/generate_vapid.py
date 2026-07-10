"""Generate VAPID keys for Web Push notifications.

Usage:
  docker compose run --rm api python -m app.generate_vapid
"""

import base64

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import ec


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def generate_vapid_keypair() -> tuple[str, str]:
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    private_value = private_key.private_numbers().private_value.to_bytes(32, "big")

    public_numbers = private_key.public_key().public_numbers()
    public_bytes = (
        b"\x04"
        + public_numbers.x.to_bytes(32, "big")
        + public_numbers.y.to_bytes(32, "big")
    )
    return _b64url(public_bytes), _b64url(private_value)


if __name__ == "__main__":
    public_key, private_key = generate_vapid_keypair()
    print("Add these to your .env file:\n")
    print(f"VAPID_PUBLIC_KEY={public_key}")
    print(f"VAPID_PRIVATE_KEY={private_key}")
    print("\nVAPID_SUBJECT=mailto:your-email@example.com")
    print("\nThen rebuild: docker compose up -d --build")
