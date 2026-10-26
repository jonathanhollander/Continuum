---
type: system
title: Authentication
description: How users sign in to Continuum — password, magic link, WebAuthn passkeys and the jh@continuum.estate development bypass — and how JWT access and refresh tokens, get_current_user, the WebAuthn challenge store, CSRF exemptions, rate limits and the frontend auth store fit together.
tags: [auth, jwt, webauthn, passkeys, security]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-9d39a51fb1867de8482d70e3
    resource: repo://backend/auth.py
  - id: openwiki-source-87d81f66b697288fe96a6b72
    resource: repo://backend/challenge_store.py
  - id: openwiki-source-43cec924cc2faa688a976aa9
    resource: repo://backend/csrf.py
  - id: openwiki-source-988e9d9be22f74fe8d2eaaca
    resource: repo://backend/routers/auth.py
  - id: openwiki-source-5314c7322469359ea3b510ed
    resource: repo://frontend/src/lib/stores/auth.ts
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Authentication

Authentication is token-based. The backend issues a short-lived JWT access token (plus a refresh token), the frontend keeps the access token in `localStorage['continuum_auth_token']` and sends it as `Authorization: Bearer …`, and every protected endpoint resolves the caller with `get_current_user`.

Key files: `backend/auth.py` (hashing, JWTs, refresh tokens, dependencies), `backend/routers/auth.py` (`/api/auth/*` endpoints), `backend/security.py` (WebAuthn options and verification), `backend/challenge_store.py` (WebAuthn challenges), `backend/csrf.py`, and `frontend/src/lib/stores/auth.ts`.

## Sign-in methods

| Method | Endpoints | Notes |
|---|---|---|
| Password | `POST /api/auth/signup`, `POST /api/auth/token` (OAuth2 form: `username`, `password`) | Both limited to 5/minute |
| Magic link | `POST /api/auth/magic-link`, `GET /api/auth/magic-link/verify?token=` | Email link to `/auth/verify`; 5/minute |
| Passkey | `POST /api/auth/passkey/register/start|finish`, `POST /api/auth/passkey/login/start|finish` | WebAuthn via `@simplewebauthn/browser`; 10/minute |
| Dev bypass | `POST /api/auth/token` with username `jh@continuum.estate` | Any password; see below |

Each successful sign-in returns `{ access_token, refresh_token, token_type: "bearer", expires_in }`.

**Passwords** are pre-hashed with SHA-256 and then hashed with Argon2 (bcrypt still accepted for older hashes; legacy `$2a/$2b/$2y$` hashes are checked directly with the `bcrypt` library). An unrecognised stored value counts as a failed check rather than an error.

**Magic links** are JWTs with `type: "magic_link"`, a random `jti` and a 15-minute lifetime. The request endpoint always answers "If this email is registered…" so it does not reveal which emails exist. Verification accepts each `jti` once: it records a revoked row in `refresh_tokens` keyed by a hash of the `jti`, so a second use is rejected. Tokens without a `jti` are refused.

**Passkeys**: registration start creates the `User` row (with an empty `public_key` placeholder), stores the WebAuthn challenge, and returns options; finish verifies the attestation and stores the credential as a `PulseCredential` row. Login start optionally looks up the email's credentials to restrict the prompt; login finish pops the challenge, verifies the assertion against the stored public key and sign count, and updates the sign count. The relying party comes from `RP_ID`, `RP_NAME` and `ORIGIN` (see [Development, Configuration and Deployment](/openwiki/operations/development-and-deployment.md)).

**Dev bypass**: `/api/auth/token` with username `jh@continuum.estate` skips password verification and creates that user (password hash `BYPASS_AUTH`) if missing. The check has no environment condition, so it is active wherever the code runs; it logs a `SECURITY BYPASS` warning each time.

## Tokens

- **Access token** — HS256 JWT signed with `JWT_SECRET_KEY`, `sub` = user id as a string, expiry `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (15).
- **Refresh token** — 64 random URL-safe bytes; only its SHA-256 hash is stored in `refresh_tokens` with a 7-day expiry. `POST /api/auth/refresh` rotates it (old token revoked, new pair issued). `POST /api/auth/logout` revokes one token; `POST /api/auth/logout-all` revokes every token for the user.

`get_current_user` decodes the Bearer token, requires an integer `sub`, rejects tokens whose `type` is anything other than absent or `"access"` (so a magic-link token cannot be used as a session), and loads the `User`; any failure is a 401. `optional_current_user` returns `None` instead of raising.

## Frontend auth store

`frontend/src/lib/stores/auth.ts` exposes `init`, `signup`, `login`, `logout` and passkey support detection.

- `init()` (called by the root layout) reads the stored token and calls `/api/auth/me`; on failure it deletes the token and marks the user signed out.
- `login()` posts the form to `/api/auth/token`, stores **only** the access token, fetches `/me`, and registers the email in the local keyring that namespaces cached data (see [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)).
- `logout()` removes the token locally; it does not call `/api/auth/logout`.

The frontend never stores or uses the refresh token, so a session ends when the 15-minute access token expires: the next `/me` or API call returns 401, and the API helpers log the user out and send them to `/login`.

The login page (`src/routes/login`) drives the passkey flow with `startAuthentication` and the magic-link request; `src/routes/auth/verify` exchanges the link token and stores the returned access token.

## CSRF and rate limits

The CSRF middleware (see [Backend API and Routers](/openwiki/architecture/backend-api.md)) exempts the sign-in endpoints by exact path — token, signup, refresh, the four passkey routes, magic link and its verify — plus the public Pulse `/api/pulse/respond/` and `/api/pulse/confirm/` token routes. Rate limits are per client IP via `slowapi`, set on each endpoint with `@limiter.limit`.

## Related pages

- [Backend API and Routers](/openwiki/architecture/backend-api.md)
- [Pulse Welfare Check-ins](/openwiki/systems/pulse-welfare.md)
- [Email and AI Services](/openwiki/systems/email-and-ai.md)
