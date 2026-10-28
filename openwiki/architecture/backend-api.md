---
type: architecture
title: Backend API and Routers
description: How the FastAPI app in backend/main.py is assembled — middleware, router registration order, the generic /api/data collection API driven by MODEL_MAP, dedicated domain routers, and the dual-message error layer.
tags: [backend, fastapi, api, routers, errors]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-28T04:26:57.052Z
sources:
  - id: openwiki-source-82a325da453da1db06378e6d
    resource: repo://backend/config.py
  - id: openwiki-source-43cec924cc2faa688a976aa9
    resource: repo://backend/csrf.py
  - id: openwiki-source-91574aa19b9d1f3eea4fd100
    resource: repo://backend/errors.py
  - id: openwiki-source-ccaad9f5ec32d2642fa00d82
    resource: repo://backend/limiter.py
  - id: openwiki-source-fcffbe3e28749eaf9a39557c
    resource: repo://backend/main.py
  - id: openwiki-source-c034c695277ec964fa4adfb2
    resource: repo://backend/private_access.py
  - id: openwiki-source-4be256b5d86d6f7252b493a6
    resource: repo://backend/routers/estate_data.py
generated: { by: "claude-code", at: "2026-10-28T04:26:57.052Z" }
---

# Backend API and Routers

`backend/main.py` assembles one FastAPI app, started as `backend.main:app`. JSON APIs live under `/api`; when `frontend/dist` exists the same process serves the static SPA.

## Application lifecycle and boundaries

The FastAPI lifespan configures logging, creates tables, seeds `dev@continuum.im` with password `dev123` only outside production, and calls the Pulse scheduler start/stop functions. Uvicorn's stderr handlers are pointed at stdout at import time so Railway does not label startup lines as errors. API probes must use a disposable database and avoid lifespan startup unless the scheduler is isolated. The shared slowapi limiter uses client IP; generic estate mutations allow 600/minute to accommodate local-data migration.

`RequestIdMiddleware` gives responses an `X-Request-ID`, and `UtcJsonMiddleware` (`backend/utils/utc_json.py`) emits naive-UTC datetimes as `...Z` in every JSON response. Security headers (including `X-Content-Type-Options: nosniff` and a `Permissions-Policy`), CORS from settings, CSRF, the private-preview access gate and production HTTPS forwarding handling wrap requests. HTTPS redirect excludes `/api/health` so direct container probes work. Interactive docs (`/docs`, `/redoc`, `/openapi.json`) exist only when `DEBUG` is on.

## Private-preview access gate

`backend/private_access.py` registers `enforce_private_access` as an HTTP middleware right after CSRF. It is inactive unless `PRIVATE_ACCESS_USER_ID` (a positive integer in `backend/config.py`) is set. Independently of that, POSTs to signup and passkey-registration paths return 403 with the signup-closed message whenever signup is disabled (`SIGNUP_ENABLED` off, or private mode on). When the user id is set, every `/api` path plus `/openapi.json`, `/docs` and `/redoc` is gated: a fixed allowlist (health, CSRF token, access status, token login, passkey login, magic link, refresh, logout) passes through, and everything else needs a valid bearer token whose user id equals the configured id, otherwise 403 `Continuum is in private preview.` in the standard error envelope. Token validation reuses `get_current_user` in a thread-pool worker. `OPTIONS` preflights and non-API SPA paths are never gated. The auth router applies the same rule inside password login and signup; see [Authentication](/openwiki/systems/authentication.md).

The active router list covers auth, admin users, email, Pulse, contacts, estate data, medical, memories, media, support, AI proxy/settings, export and recipient access. The old dedicated documents, insurance, pets and heirlooms router files are not the mounted API contract: their corresponding records use the generic estate collection surface. In particular `documents` resolves to `Document` in `MODEL_MAP`; the older `vault_documents`, `future_letters`, `contact_relationships`, `medical_profiles` and QR aliases are no longer in the map.

## Generic estate persistence

`/api/data/{data_type}` resolves the URL through `MODEL_MAP`; unknown types return 400. GET scopes records by authenticated `user_id`. `financial_assets` and `financial_accounts` share `FinancialAccount`; `letters` maps to `Letter`. `activity_log` returns only the newest 200 entries.

Asset-backed `properties`, `digital_assets` and `heirlooms` have separate category membership. For legacy rows with no category the read-time rule chooses digital when platform/username exists, otherwise heirloom when recipient/story exists, otherwise property. The `assets` collection sees all owner Asset rows. Create sets category on the server; update/delete require membership and do not let the client move a record by changing category.

POST accepts a raw object or sole `{data: {...}}` wrapper, validates it with `EstateItemCreate` (non-empty, field-count cap, alphanumeric/underscore keys, strings up to 100,000 characters, no protected identifiers/timestamps even in nested objects), injects `user_id`, serializes custom attributes and validates the model. `funeral_data`, `advanced_assets` and `digital_guardian` are singleton objects: GET returns the first owner row or `{}`, and POST upserts that row. Structured singleton fields are encoded as JSON text.

PUT checks ownership, applies the same rules through `EstateItemUpdate`, converts ISO strings for datetime columns, turns an empty string into null for number/boolean/date columns, ignores unknown attributes, and re-validates the changed fields against the model so a type mismatch is a 422. DELETE checks ownership before removal. Item mutations and their audit row commit together; an audit insert is not a separate successful transaction after the record save.

Receipt recovery has an additional conditional PUT contract for one advanced-asset history field (`transactions`, `maintenance` or `claims`). `{data: {field: newList}, if_unchanged: {field: rawPreviousValue}}` compares the stored raw value; a concurrent change returns 409 so the browser original remains available. Ordinary writes retain the raw/wrapped contract.

Custom-field definition routes precede the generic dynamic route so FastAPI matches them correctly.

## Health, errors and SPA fallback

`/api/health` (GET and HEAD) runs `SELECT 1`, tests a write in `UPLOAD_DIR`, and reports scheduler status. A deliberately disabled scheduler is reported as `disabled`; a stopped enabled scheduler is reported without itself failing the Railway health check. Database/storage failure or an exception inspecting scheduler status yields 503.

`ContinuumException` carries technical and user messages. The browser receives `{error: {message, code, details, timestamp}}`; `_technical` is restricted to local development outside Railway. Starlette/FastAPI `HTTPException`s (including routing 404/405) keep their headers and their string details become user messages. Request validation returns 422 `VALIDATION_ERROR` listing field names only, never the submitted values; rate limiting returns 429 `RATE_LIMITED` with slowapi's Retry-After headers; numbers too large for a column (SQLite `OverflowError`, PostgreSQL `DataError`) return 422 `VALUE_OUT_OF_RANGE`. Unexpected exceptions are logged with a traceback and returned as generic 500 `INTERNAL_ERROR`.

The backend resolves `frontend/dist` relative to its own source, mounts existing `_app`/images directories, and serves real files or `index.html` for GET/HEAD client routes. `/` itself is a permanent 301 redirect to `/marketing2`, preserving the query string. Unknown `/api` paths return 404, with path traversal blocked. With no frontend build API startup still works and SPA routes return 404 `Frontend build not found`.

## CSRF

The double-submit cookie requires the `X-CSRF-Token` header to match `csrf_token` on state-changing requests. Exact auth/public paths (including the Postmark bounce webhook, which has its own shared secret) and token-bearing Pulse `respond`, `confirm` and `nudge` prefixes are exempt. Production rejects failure with 403; development logs and allows it. This does not replace endpoint authentication and ownership checks.

## Related pages

- [Data Model and Migrations](/openwiki/architecture/data-model-and-migrations.md)
- [Authentication](/openwiki/systems/authentication.md)
- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
