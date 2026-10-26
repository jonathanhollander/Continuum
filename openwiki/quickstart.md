---
type: guide
title: Quickstart
description: Orientation for a new developer on Continuum — what the product is, how to run the SvelteKit frontend and FastAPI backend locally, how to sign in, where the main systems live, and which wiki page covers each task.
tags: [quickstart, onboarding, setup]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
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
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Quickstart

Continuum is end-of-life planning software: one place for a person's accounts, documents, medical wishes, contacts, letters and memories, plus **Pulse**, a welfare check-in that alerts chosen guardians if the person stops responding. Its users may be planning ahead or grieving, so user-facing text is deliberately gentle ("Save my thoughts", not "Submit").

The stack is a SvelteKit 2 / Svelte 5 single-page app (`frontend/`) and a FastAPI + SQLModel + Alembic backend (`backend/`), deployed as one service on Railway at `https://continuum.estate`. The root `README.md` still describes an old Next.js version; ignore it. `legacy_nextjs_archive/` is that old code.

## Run it locally

Backend (Python 3.11), from the repository root:

```bash
pip install -r backend/requirements.txt     # exact pins
(cd backend && alembic upgrade head)
python -m backend.main                       # http://localhost:8000
```

Backend modules import each other as `backend.…`, so start it from the repository root (`python -m backend.main` or `uvicorn backend.main:app`). `start.sh` runs `uvicorn main:app` from inside `backend/`, which does not match that import style.

Frontend (Node 20+), in a second terminal:

```bash
cd frontend && npm install && npm run dev    # http://localhost:5173
```

Vite proxies `/api` to port 8000. With no environment set, the backend uses SQLite (`continuum_saas.db`), development mode (CSRF warnings only, `_technical` error details shown), and the local email outbox (`backend/outbox/`) instead of sending mail.

## Signing in locally

- `dev@continuum.im` / `dev123` — seeded on every backend start if missing.
- `jh@continuum.estate` with any password — a development bypass on the password login endpoint (see [Authentication](/openwiki/systems/authentication.md)).
- Magic links are written to `backend/outbox/` as HTML files in local mode.

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
- There is no automated test suite or CI; test by running the app. Run `npm run check` and `npm run build` in `frontend/` before deploying.
- Deploy with `railway up`.

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
