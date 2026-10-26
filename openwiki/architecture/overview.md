---
type: architecture
title: System Architecture Overview
description: How Continuum's static SvelteKit single-page app, the FastAPI backend that also serves it, and the SQLite/PostgreSQL database fit together, and how a request flows from a module page to the database and back.
tags: [architecture, overview, frontend, backend, deployment]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-43cec924cc2faa688a976aa9
    resource: repo://backend/csrf.py
  - id: openwiki-source-fcffbe3e28749eaf9a39557c
    resource: repo://backend/main.py
  - id: openwiki-source-79cd44ea11c40597832d7dd7
    resource: repo://frontend/src/lib/api/client.ts
  - id: openwiki-source-9e1f8b42a6b85abeadc5dee0
    resource: repo://frontend/src/lib/config.ts
  - id: openwiki-source-17706240e8ad2d6632263f60
    resource: repo://frontend/src/lib/services/aiConciergeService.ts
  - id: openwiki-source-927356adb03f037fb4b7dca3
    resource: repo://frontend/src/lib/services/errorHandler.ts
  - id: openwiki-source-e3bf734261f21a2f92f35877
    resource: repo://frontend/src/routes/%2Blayout.ts
  - id: openwiki-source-a893f51acc4cb0c9f3b93fc4
    resource: repo://frontend/svelte.config.js
  - id: openwiki-source-378e3cf05ab0d05d335c68d5
    resource: repo://frontend/vite.config.ts
  - id: openwiki-source-7f4d4870536a9fe6b18e7b19
    resource: repo://nixpacks.toml
  - id: openwiki-source-0f7600e0d2d7c91e381ed675
    resource: repo://railway.toml
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# System Architecture Overview

Continuum is one deployable unit: a FastAPI process that serves both the JSON API and a statically built SvelteKit single-page app. Data lives in a SQL database (SQLite locally, PostgreSQL on Railway). A background scheduler inside the same process runs the Pulse welfare check-ins.

```
Browser (SvelteKit SPA, ssr=false)
   │  localStorage cache + JWT in localStorage
   │  fetch /api/...  (Authorization: Bearer <token>)
   ▼
FastAPI  backend/main.py  ──►  routers/*  ──►  SQLModel  ──►  SQLite | PostgreSQL
   │                                         ▲
   ├─ serves frontend/dist (index.html fallback)
   └─ APScheduler: Pulse check-ins ─────────┘ ──► email service
```

## Frontend build

`frontend/` is SvelteKit 2 with Svelte 5, Vite 6 and Tailwind 4. `svelte.config.js` uses `@sveltejs/adapter-static` writing to `frontend/dist` with `fallback: 'index.html'`, so every route is rendered in the browser. The root `+layout.ts` sets `ssr = false` and calls `auth.init()` on load to restore the session from the stored token.

In development Vite runs on port 5173 and proxies `/api` to `http://localhost:8000`. The API base URL comes from `frontend/src/lib/config.ts`: `VITE_API_URL` if set, otherwise `http://localhost:8000` in dev and a relative path (same origin) in production builds.

## Backend and SPA serving

`backend/main.py` assembles the FastAPI app, registers the domain routers under `/api`, then mounts `frontend/dist/_app` and `frontend/dist/images` and adds a catch-all route that returns real files from `frontend/dist` or falls back to `index.html`. In production the browser therefore talks to a single origin. Details are in [Backend API and Routers](/openwiki/architecture/backend-api.md).

Railway builds the image with Nixpacks (`railway.toml`, `nixpacks.toml`): it installs Python 3.11 and Node 20, installs `backend/requirements.txt` into `/opt/venv`, runs `npm run build` in `frontend/`, and starts `uvicorn backend.main:app`. The Railway health check is `/api/health`.

## Request flow

1. A module page calls its store. Most stores wrap a `SyncManager` (`frontend/src/lib/services/sync.svelte.ts`) that renders from a localStorage cache first, applies the change optimistically, and sends the request (see [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)).
2. Requests carry the JWT from `localStorage['continuum_auth_token']` as a Bearer header. The helpers in `frontend/src/lib/api/client.ts` log the user out and redirect to `/login` on a 401.
3. FastAPI runs the middleware chain (request ID, security headers, CORS, CSRF, HTTPS redirect in production), resolves the user with `get_current_user`, and the router reads or writes SQLModel rows scoped to that user.
4. Errors come back as `{ "error": { "message", "code", ... } }`; `parseApiError` in `frontend/src/lib/services/errorHandler.ts` turns them into `ErrorDetails` for notifications.

The backend's CSRF middleware rejects state-changing requests without a matching `X-CSRF-Token` header when `ENVIRONMENT` is production. The frontend satisfies it in one place: `frontend/src/hooks.client.ts` wraps `window.fetch` before the app loads and, for every `POST`/`PUT`/`PATCH`/`DELETE` to the page's own origin or the configured API origin, copies the `csrf_token` cookie into that header. If the cookie is missing it first calls `/api/health` to get a fresh one. Callers that already set the header are left alone.

## Background work and integrations

- **Pulse scheduler** — started on app startup; runs the welfare check-in and escalation logic ([Pulse Welfare Check-ins](/openwiki/systems/pulse-welfare.md)).
- **Email** — `backend/services/email_service.py` sends transactional and Pulse email and records delivery in `email_logs` ([Email and AI Services](/openwiki/systems/email-and-ai.md)).
- **AI** — the frontend concierge calls the backend `/api/ai/chat` proxy.
- **Files** — uploads go through `/api/media` to backend storage, while some features still keep files in browser IndexedDB or data URLs ([Media, Documents and Export](/openwiki/systems/media-documents-and-export.md)).

## Legacy code

`legacy_nextjs_archive/` is an earlier Next.js version kept for reference; it is not built or served. Root-level `npm` scripts do not run the active app — work in `frontend/`.

## Related pages

- [Backend API and Routers](/openwiki/architecture/backend-api.md)
- [Data Model and Migrations](/openwiki/architecture/data-model-and-migrations.md)
- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
