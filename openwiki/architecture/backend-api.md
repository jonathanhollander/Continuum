---
type: architecture
title: Backend API and Routers
description: How the FastAPI app in backend/main.py is assembled — middleware, router registration order, the generic /api/data collection API driven by MODEL_MAP, dedicated domain routers, and the dual-message error layer.
tags: [backend, fastapi, api, routers, errors]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-43cec924cc2faa688a976aa9
    resource: repo://backend/csrf.py
  - id: openwiki-source-91574aa19b9d1f3eea4fd100
    resource: repo://backend/errors.py
  - id: openwiki-source-ccaad9f5ec32d2642fa00d82
    resource: repo://backend/limiter.py
  - id: openwiki-source-fcffbe3e28749eaf9a39557c
    resource: repo://backend/main.py
  - id: openwiki-source-1e5af31bf167b154eac9b49f
    resource: repo://backend/routers/documents.py
  - id: openwiki-source-4be256b5d86d6f7252b493a6
    resource: repo://backend/routers/estate_data.py
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Backend API and Routers

The backend is a single FastAPI application defined in `backend/main.py` and started as `backend.main:app` (uvicorn). It serves the JSON API under `/api/...` and, when a frontend build exists, the single-page app itself.

## Application assembly

`backend/main.py` creates the `FastAPI` app, then wires, in order:

- **Rate limiting** — the shared `slowapi` `Limiter` from `backend/limiter.py` (keyed by client IP) is attached as `app.state.limiter`, with the stock `RateLimitExceeded` handler. Individual endpoints opt in with `@limiter.limit(...)`; the generic data routes use `30/minute`.
- **Request IDs** — `RequestIdMiddleware` gives every request a UUID in `request.state.request_id` and echoes it in the `X-Request-ID` response header.
- **Routers** — included explicitly (see below).
- **Startup hook** — `on_startup` configures logging (JSON logs in production), runs `create_db_and_tables()`, seeds the dev user `dev@continuum.im` / `dev123` if missing, and starts the Pulse scheduler. `on_shutdown` stops the scheduler.
- **Security headers** — an HTTP middleware applies the `secure` package's CSP, HSTS and `no-referrer` policy to every response.
- **CORS** — origins come from `settings.get_cors_origins_list()`; production pins the allowed methods and headers (including `X-CSRF-Token`), development can allow `*`.
- **CSRF** — `CSRFMiddleware` (see below).
- **HTTPS redirect** — only registered when `settings.is_production()`. It reads `X-Forwarded-Proto` (Railway terminates TLS at its proxy) and never redirects `/api/health`, which Railway probes over plain HTTP.
- **Exception handlers** — for `ContinuumException`, `HTTPException` and any other `Exception`.

## Router map

| Prefix | Module | Purpose |
|---|---|---|
| `/api/auth` | `routers/auth.py` | Signup, password token, passkeys, magic link, refresh, logout, `/me` |
| `/api/emails` | `routers/email.py` | Email delivery status, resend, Postmark webhook, bounces |
| `/api/pulse` | `routers/pulse.py` | Pulse check-ins, settings, guardian contacts, portal tokens |
| `/api/contacts` | `routers/contacts.py` | Contacts (stored as `PulseContact`) and relationships |
| `/api/data/vault_documents` | `routers/documents.py` | Vault documents |
| `/api/data` | `routers/estate_data.py` | Generic collection API + custom field definitions |
| `/api/insurance`, `/api/pets`, `/api/heirlooms` | one router each | Simple CRUD |
| `/api/medical` | `routers/medical.py` | Medical profile and directives |
| `/api/memories` | `routers/memories.py` | Family memories, visual memories, external archives |
| `/api/media` | `routers/media.py` | File upload, download, metadata |
| `/api/support` | `routers/support.py` | Support discovery search |
| `/api/ai` | `routers/ai_proxy.py` | AI chat proxy |

Registration order matters: `documents.router` is included **before** `estate_data.router`, because the generic `/api/data/{data_type}` route would otherwise capture `/api/data/vault_documents`.

`main.py` also defines a few endpoints directly: `/api/csrf-token`, `/api/health` (runs `SELECT 1`, writes and deletes a file in `UPLOAD_DIR`, and reads whether the scheduler is running; reports `environment` and `version`, and returns 503 when any check fails), and the `/api/estate` and `/api/estate/profile` blob endpoints.

## The generic collection API (`/api/data/{data_type}`)

`backend/routers/estate_data.py` exposes one CRUD surface for most module data. `MODEL_MAP` translates the URL segment to a SQLModel class; an unknown `data_type` returns 400.

- `GET /api/data/{data_type}` returns every row of that model where `user_id` matches the caller.
- `POST` accepts either a raw JSON object or a `{ "data": {...} }` wrapper, rejects protected keys (`id`, `user_id`, `created_at`, `updated_at`, …), injects `user_id`, JSON-encodes a dict `custom_attributes`, validates through `model.model_validate`, commits and writes an audit entry.
- `PUT /{data_type}/{item_id}` checks ownership (403 otherwise), applies only keys that exist as attributes on the model (unknown keys are silently ignored), and audits.
- `DELETE` checks ownership, writes a deletion audit record, then deletes.

Several URL aliases share one table. `properties`, `digital_assets` and `heirlooms` all map to `Asset`; `financial_assets` maps to `FinancialAccount`; `future_letters` maps to `Letter`. Because the GET handler filters only by `user_id`, each alias returns **all** rows of the shared model, not just the rows created through that alias.

Custom field definitions (`/api/data/custom-fields/...`) are declared before the generic routes so FastAPI matches them first.

## Dedicated routers

Domains with their own shapes use small dedicated routers that follow the same pattern: `Depends(get_current_user)` for the caller, `Depends(get_session)` for the database session, ownership checks on update and delete. Examples are `contacts.py` (contacts are `PulseContact` rows, shared with Pulse guardians) and `memories.py` (three sub-collections).

## CSRF protection

`backend/csrf.py` implements a double-submit cookie. Every response without a `csrf_token` cookie gets one; state-changing requests (`POST`, `PUT`, `DELETE`, `PATCH`) must send the same value in `X-CSRF-Token`. Exemptions are exact paths — password token, signup, refresh, the passkey routes, magic link and its verify, health and the API docs — plus two token prefixes, `/api/pulse/respond/` and `/api/pulse/confirm/`, which only match when a token follows the prefix. A failed check raises 403 **only in production**; in development it logs a warning and lets the request through.

## Error handling

`backend/errors.py` defines `ContinuumException` with two messages: a technical `message` for logs and a `user_message` written for the end user, plus a status code and an `error_code` that defaults to the class name. Subclasses cover authentication, authorization, expired tokens, not found, conflicts, validation, invalid data type, database, email, external service, file upload/size/type and rate limits.

The global handlers in `main.py` turn every error into the same JSON envelope via `ErrorResponse.to_dict()`:

```json
{ "error": { "message": "<user message>", "code": "...", "details": {}, "timestamp": "..." },
  "_technical": "<technical message>" }
```

A plain `HTTPException` keeps its `detail` as the user message; any other exception is logged with a traceback and returns a generic 500 message. The `_technical` field is added only when `settings.is_development()` is true, so production and other environments never return it.

## SPA serving

After the API routes, `main.py` mounts `frontend/dist/_app` and `frontend/dist/images` when they exist, serves `frontend/dist/index.html` for `/`, and uses a catch-all route that returns real files from `frontend/dist` (with path-traversal checks) or falls back to `index.html` for client-side routing. Unmatched `/api...` paths return a 404 JSON error instead of the SPA. Without a build, the catch-all answers 404 "Frontend build not found".

## Related pages

- [Data Model and Migrations](/openwiki/architecture/data-model-and-migrations.md)
- [Authentication](/openwiki/systems/authentication.md)
- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
