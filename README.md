# BP Tracker

Self-hosted health tracker for **blood pressure**, **walking steps**, and **calories burned**. Designed to run entirely on your NAS via Docker — all data stays in a local PostgreSQL database.

## Features

- **Blood pressure logging** — morning, afternoon, and evening readings with pulse and notes
- **Activity tracking** — daily steps and calories burned
- **Visual graphs** — 7-day trends for BP, steps, and calories on the dashboard
- **Scheduled reminders**
  - BP test reminders 3× daily (configurable times)
  - Evening walking reminder if steps are below your daily goal
- **Notifications** — browser push (PWA) + optional [ntfy.sh](https://ntfy.sh) for phone alerts
- **NAS-ready** — Docker Compose stack with persistent PostgreSQL volume

## Quick Start (NAS / Docker)

### 1. Copy environment file

```bash
cp .env.example .env
```

Edit `.env` — at minimum change `POSTGRES_PASSWORD` and `TZ`.

### 2. Start the stack

```bash
docker compose up -d --build
```

Open **http://your-nas-ip:3005** (or whatever `WEB_PORT` you set).

### 3. Enable notifications (optional)

Generate VAPID keys for browser push:

```bash
docker compose run --rm api python -m app.generate_vapid
```

Copy the output into `.env`, then rebuild:

```bash
docker compose up -d --build
```

In the app, go to **Settings → Enable Notifications**.

For phone alerts without HTTPS, set a unique `NTFY_TOPIC` in `.env` and subscribe to it in the ntfy mobile app.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | — | Database password (change this!) |
| `TZ` | `Asia/Kolkata` | Timezone for reminder scheduling |
| `WEB_PORT` | `3005` | Port exposed on your NAS |
| `BP_MORNING_TIME` | `08:00` | Morning BP reminder |
| `BP_AFTERNOON_TIME` | `14:00` | Afternoon BP reminder |
| `BP_EVENING_TIME` | `20:00` | Evening BP reminder |
| `WALKING_REMINDER_TIME` | `18:00` | Walking nudge if steps low |
| `MIN_DAILY_STEPS` | `5000` | Step goal for walking reminder |
| `VAPID_PUBLIC_KEY` | — | Web push public key |
| `VAPID_PRIVATE_KEY` | — | Web push private key |
| `NTFY_TOPIC` | — | Optional ntfy topic for phone alerts |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────▶│   Nginx     │────▶│  FastAPI     │
│   (React)   │     │  (frontend) │     │  + Scheduler │
└─────────────┘     └─────────────┘     └──────┬───────┘
                                               │
                                        ┌──────▼───────┐
                                        │  PostgreSQL  │
                                        │  (NAS volume)│
                                        └──────────────┘
```

- **frontend** — React SPA with Recharts graphs, served by nginx
- **api** — FastAPI backend with APScheduler for timed reminders
- **db** — PostgreSQL 16 with persistent `postgres_data` volume

## Synology / QNAP Tips

1. Install **Container Manager** (Synology) or **Container Station** (QNAP).
2. Upload this folder or clone via SSH.
3. Run `docker compose up -d --build` from the project directory.
4. Map port `3005` (or your chosen port) in the NAS firewall if needed.
5. For HTTPS and push notifications, put nginx/your NAS reverse proxy in front with a valid certificate.

## Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
DATABASE_URL=postgresql://bpuser:changeme@localhost:5432/bp_tracker uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Run PostgreSQL locally or use `docker compose up db -d`.

## Data Backup

All health data lives in the Docker volume `postgres_data`. Back it up with:

```bash
docker compose exec db pg_dump -U bpuser bp_tracker > backup.sql
```

Restore:
```bash
cat backup.sql | docker compose exec -T db psql -U bpuser bp_tracker
```

## License

MIT — use freely for personal health tracking.
