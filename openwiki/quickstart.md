---
type: guide
title: Quickstart
description: Orientation for a new developer on Continuum — what the product is, how to run the SvelteKit frontend and FastAPI backend locally, how to sign in, where the main systems live, and which wiki page covers each task.
tags: [quickstart, onboarding, setup]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-27T00:41:19.118Z
sources:
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-fcffbe3e28749eaf9a39557c
    resource: repo://backend/main.py
  - id: openwiki-source-a2371d6362e5db4bc834ad03
    resource: repo://CLAUDE.md
  - id: openwiki-source-196170e31ff8ec60a116165b
    resource: repo://docs/README.md
  - id: openwiki-source-1047363cf615000e4c9bb694
    resource: repo://frontend/package.json
  - id: openwiki-source-d61d83066a37e33b8d45f791
    resource: repo://start.sh
generated: { by: "codex", at: "2026-10-27T00:41:19.118Z" }
---

# Quickstart

Continuum is Jonathan's personal legacy and financial handover for his son. The recovery prioritizes recording his words and practical information, preserving complete saves, and making a readable copy his son can use. It is also end-of-life planning software: one place for a person's accounts, documents, medical wishes, contacts, letters and memories, plus **Pulse**, a welfare check-in that alerts chosen guardians if the person stops responding. Its users may be planning ahead or grieving, so user-facing text is deliberately gentle ("Save my thoughts", not "Submit").

The stack is a SvelteKit 2 / Svelte 5 single-page app (`frontend/`) and a FastAPI + SQLModel + Alembic backend (`backend/`), deployed as one service on Railway at `https://continuum.estate`. The former root Next.js README is archived under `docs/archive/`; use `docs/README.md` as the current documentation index. `legacy_nextjs_archive/` is that old code.

## Run it locally

Backend (Python 3.11), from the repository root. Use an isolated virtual environment and explicitly configure a disposable database, uploads directory and local outbox before running checks; do not point setup or probes at the owner's existing records:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt     # exact pins
(cd backend && alembic upgrade head)
PULSE_SCHEDULER_ENABLED=false python -m backend.main # http://localhost:8000
```

Backend modules import each other as `backend.…`, so start it from the repository root (`python -m backend.main` or `uvicorn backend.main:app`). `start.sh` runs `uvicorn main:app` from inside `backend/`, which does not match that import style.

Frontend (Node 20+), in a second terminal:

```bash
cd frontend
npm ci                                      # fresh checkout; preserve active dependency work
npm run dev    # http://localhost:5173
```

Vite proxies `/api` to port 8000. Defaults use SQLite (`continuum_saas.db`) and development mode; local-only error details are suppressed on Railway. Email falls back to `backend/outbox` only when an external provider is not configured. For checks, explicitly isolate storage/database/outbox and disable external sends. The scheduler now honors `PULSE_SCHEDULER_ENABLED=false`; without that override its default is enabled.

## Signing in locally

- `dev@continuum.im` / `dev123` — seeded on every backend start if missing.
- Password verification is required for every account; the former hard-coded bypass is removed.
- Magic links are written to the configured local outbox in local mode. A request receipt is not proof of sent or delivered email.

## Where things live

| Area | Location |
|---|---|
| App entry, middleware, router registration, SPA serving | `backend/main.py` |
| Settings | `backend/config.py` |
| Models | `backend/database.py`, `backend/estate_models.py`, `backend/pulse_models.py`, `backend/models/` |
| API routers | `backend/routers/` (generic module data: `estate_data.py`) |
| Pulse scheduler and escalation | `backend/pulse_scheduler.py`, `backend/pulse_logic.py` |
| Email | `backend/services/email_service.py`, `backend/templates/emails/` |
| Routes and module pages | `frontend/src/routes/` (`modules/<name>/`) |
| Sidebar and catalog | `frontend/src/lib/config/navigation.ts` |
| Data sync | `frontend/src/lib/services/sync.svelte.ts`, stores in `frontend/src/lib/stores/` |
| Project docs and current plan | `docs/` (index `docs/README.md`) |

## Working conventions

- Module data goes through the SyncManager stores; don't call the API directly from pages.
- Every model must be imported in `backend/alembic/env.py` for autogenerate to see it.
- The frontend has `check` and `build` scripts and no configured test/test:e2e script. Use focused regression checks plus desktop/phone browser journeys with synthetic data. A build alone does not prove fields survived a save/reload.
- A knowledge refresh does not authorize deployment or correspondence. Run `npm run check` and `npm run build` before any separately authorized deployment.
- Handover flows use the server snapshot for binder, PDF, structured copy and attachment manifest. Verify actual file bytes and partial-coverage reporting, including the recipient view.

## Which page to read

| Task | Page |
|---|---|
| Understand how the pieces connect | [System Architecture Overview](/openwiki/architecture/overview.md) |
| Add or change an endpoint | [Backend API and Routers](/openwiki/architecture/backend-api.md) |
| Add a column or table | [Data Model and Migrations](/openwiki/architecture/data-model-and-migrations.md) |
| Add a module page or sidebar entry | [Routes, Modules and Navigation](/openwiki/frontend/routes-and-navigation.md) |
| Make a store save to the server | [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md) |
| Login, tokens, passkeys | [Authentication](/openwiki/systems/authentication.md) |
| Check-ins and guardian alerts | [Pulse Welfare Check-ins](/openwiki/systems/pulse-welfare.md) |
| Uploads, PDFs, the binder | [Media, Documents and Export](/openwiki/systems/media-documents-and-export.md) |
| Email delivery or the AI concierge | [Email and AI Services](/openwiki/systems/email-and-ai.md) |
| Environment variables and Railway | [Development, Configuration and Deployment](/openwiki/operations/development-and-deployment.md) |
