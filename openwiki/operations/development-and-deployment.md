---
type: operations
title: Development, Configuration and Deployment
description: How Continuum is configured through backend/config.py and environment variables, what production mode changes, the dev and test seed users, logging and audit utilities, the manual testing approach, and how Railway builds and runs the app with Nixpacks.
tags: [operations, configuration, deployment, railway, logging]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-82a325da453da1db06378e6d
    resource: repo://backend/config.py
  - id: openwiki-source-fcffbe3e28749eaf9a39557c
    resource: repo://backend/main.py
  - id: openwiki-source-d408df1b63b94f7ec0ac26b4
    resource: repo://backend/requirements.txt
  - id: openwiki-source-088afb8de4a4d25acdc7f8dc
    resource: repo://backend/seed.py
  - id: openwiki-source-66d8cca2fb261b19c13013c1
    resource: repo://backend/utils/audit.py
  - id: openwiki-source-0ff495a1eaaf2069d92ec948
    resource: repo://backend/utils/logger.py
  - id: openwiki-source-7f4d4870536a9fe6b18e7b19
    resource: repo://nixpacks.toml
  - id: openwiki-source-1ab94efcf6f027306f9d48e5
    resource: repo://Procfile
  - id: openwiki-source-0f7600e0d2d7c91e381ed675
    resource: repo://railway.toml
  - id: openwiki-source-6edb3f73cf0628642d8c8a74
    resource: repo://scripts/smoke_test.py
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Development, Configuration and Deployment

For first-run steps see [Quickstart](/openwiki/quickstart.md). This page covers what the settings mean and how the app is built and shipped.

## Configuration

All backend settings live in one Pydantic `Settings` class in `backend/config.py`, read from environment variables (and `.env`). A module-level `settings` instance is imported everywhere. Main groups:

| Group | Variables (defaults) |
|---|---|
| Environment | `ENVIRONMENT` (`development`), `DEBUG` (`True`) |
| URLs | `FRONTEND_URL` (`http://localhost:5173`), `API_URL`, `CORS_ORIGINS` |
| Database | `DATABASE_URL` (`sqlite:///./continuum_saas.db`), `DB_ECHO`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW` |
| Auth | `JWT_SECRET_KEY`, `JWT_ALGORITHM` (`HS256`), `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (15), `JWT_REFRESH_TOKEN_EXPIRE_DAYS` (7), `SECRET_KEY` |
| WebAuthn | `RP_ID` (`localhost`), `RP_NAME`, `ORIGIN` |
| Email | `POSTMARK_API_KEY`, `POSTMARK_FROM_EMAIL`, `SMTP_*`, `EMAIL_MAX_RETRIES`, `OUTBOX_DIR` |
| Files | `UPLOAD_DIR` (`backend/uploads`), `MAX_UPLOAD_SIZE` (10 MB), `AWS_*` for S3-compatible storage |
| Pulse | `PULSE_SCHEDULER_ENABLED`, `PULSE_CHECK_INTERVAL_MINUTES` (15) |
| AI and search | `OPENROUTER_API_KEY` (falls back to legacy `VITE_OPENROUTER_API_KEY`), `TAVILY_API_KEY` |
| Rate limits | `DEFAULT_RATE_LIMIT_SENSITIVE` (`5/minute`), `DEFAULT_RATE_LIMIT_STANDARD` (`30/minute`) |
| Railway | `RAILWAY_ENVIRONMENT`, `RAILWAY_STATIC_URL`, `RAILWAY_PUBLIC_DOMAIN` |

Validators adjust values at load time:

- A `postgres://` `DATABASE_URL` (as Railway provides) is rewritten to `postgresql://` for SQLAlchemy 2.
- In production, `RP_ID`, `ORIGIN` and `FRONTEND_URL` that are still at their localhost defaults become `continuum.estate` / `https://continuum.estate`. Explicitly set values win. Outside production, `RAILWAY_PUBLIC_DOMAIN` fills `RP_ID` and `ORIGIN` the same way.

`ENVIRONMENT` values `production`/`prod` count as production and `development`/`dev`/`local` as development. Production mode turns on CSRF rejection (403), the HTTPS redirect, `Secure` cookies and JSON logging, and hides the `_technical` error field. On load in production, `validate_production_config()` logs warnings — default JWT or secret keys, localhost URLs, `RP_ID=localhost`, SQLite, wildcard CORS — but does not stop startup.

The frontend has its own small config in `frontend/src/lib/config.ts` (`VITE_API_URL`, app name and version).

## Seed users

- `backend/main.py` seeds `dev@continuum.im` / `dev123` on every startup if that user does not exist.
- `backend/seed.py` is a standalone script that creates `test@continuum.estate` with a mock passkey key.

## Logging and audit

`backend/utils/logger.py` provides `setup_logging()` and `get_logger(name)`. Startup calls `setup_logging` with level `DEBUG` when `DEBUG` is true and JSON output when `ENVIRONMENT` is exactly `production`; otherwise output is human-readable. Logs go to the console and to a rotating file in `backend/logs` (10 MB × 5). Helpers such as `log_request_start`, `log_email_send`, `log_auth_event` and `log_database_error` add structured context.

`backend/utils/audit.py` writes `AuditLog` rows (user, IP, user agent, action, resource, success, details) through `log_audit` and wrappers such as `log_auth_success`, `log_deletion`, `log_pulse_escalation` and `log_data_export`. An audit failure is logged and swallowed so it never fails the user's action.

## Testing

There is no automated test suite or CI. Testing is manual: run the app and use it in a browser. A few by-hand scripts exist:

- `scripts/smoke_test.py` replays the exact payloads the UI's stores send for each record type, re-fetches them, and prints a PASS/FAIL line per type. It always exits 0 and is not wired into any build or deploy.
- `backend/tests/manual_security_check.py` is a manual security probe.

Before deploying, run `npm run check` and `npm run build` in `frontend/` by hand.

## Railway deployment

Production runs on Railway at `https://continuum.estate`, with PostgreSQL.

- `railway.toml` selects the Nixpacks builder and sets the health check to `/api/health`.
- `nixpacks.toml` installs Python 3.11, Node 20 and build libraries, creates `/opt/venv`, installs `backend/requirements.txt`, runs `npm install` and `npm run build` in `frontend/`, and starts `uvicorn backend.main:app` on `$PORT` (default 8080). `PYTHONPATH=/app`.
- `Procfile` carries the same start command.
- `backend/requirements.txt` uses exact pins copied from production's `pip freeze`. Unpinned installs pulled a newer SQLModel/SQLAlchemy that broke login and seeding.

Deploy with `railway up` and read logs with `railway logs`. Schema changes go out by running `alembic upgrade head` against the production database (see [Data Model and Migrations](/openwiki/architecture/data-model-and-migrations.md)); the startup `create_all` and column patches also run on boot. The HTTPS redirect trusts `X-Forwarded-Proto` because Railway terminates TLS at its proxy, and never redirects `/api/health`, which Railway probes over plain HTTP.

## Related pages

- [Quickstart](/openwiki/quickstart.md)
- [Data Model and Migrations](/openwiki/architecture/data-model-and-migrations.md)
- [Backend API and Routers](/openwiki/architecture/backend-api.md)
