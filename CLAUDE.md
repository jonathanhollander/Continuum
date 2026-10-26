# Continuum SaaS - Claude Code Context

## Critical Info

- **Dev login**: Use email `jh@continuum.estate` (dev bypass) when testing in browser
- **Tech Stack**: SvelteKit 5 (runes: $state, $derived) + FastAPI + SQLModel + Alembic
- **Database**: PostgreSQL (Railway prod) / SQLite (local dev)
- **Auth**: JWT + WebAuthn/Passkeys
- **README.md is outdated** - references Next.js, ignore it. This is SvelteKit 5.

---

## Quick Start

```bash
# Frontend (terminal 1)
cd frontend && npm install && npm run dev    # http://localhost:5173

# Backend (terminal 2)
pip install -r backend/requirements.txt       # Python 3.11, exact pins
(cd backend && alembic upgrade head)
python -m backend.main                        # from repo root; http://localhost:8000

# Dev user auto-seeded: dev@continuum.im / dev123
```

---

## Architecture Essentials

### SyncManager Pattern (Critical)
Location: `frontend/src/lib/services/sync.svelte.ts`

All data sync goes through SyncManager. Never bypass it.
- Instant load from localStorage (no spinners)
- Optimistic updates with rollback on failure
- Server is truth after sync

```typescript
const store = new SyncManager('contacts', 'contacts');
await store.init();  // Critical - triggers sync
await store.create(data);  // Optimistic create
```

### Alembic Migrations (Critical)
**All models must be imported in `backend/alembic/env.py`** for auto-detection.

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

Common fix: Add `import sqlmodel` to generated migration files.

### Error Handling
- Backend: `backend/errors.py` has 15+ exception classes with dual messages
- Technical message for logs, compassionate message for users
- Frontend: `errorHandler.ts` + `notificationStore.ts` for display

### Authentication
- JWT access tokens (15-minute expiry, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`) plus 7-day refresh tokens, stored in localStorage
- WebAuthn/Passkeys for biometric auth
- Backend validates via `get_current_user()` dependency

---

## Compassionate UX Principles (CRITICAL)

This is end-of-life planning software. Language must be gentle, supportive, and non-demanding.

**Principles**:
- No imperative verbs: "Save your changes" not "Submit"
- Acknowledge effort: "You're making progress" not "Task incomplete"
- Offer support: "We're here to help" not "Error occurred"
- Gentle guidance: "When you're ready" not "Complete this now"

**Examples**:
- "Submit" → "Save my thoughts"
- "Delete" → "Remove this item"
- "Error: Not found" → "We couldn't find that. It may have been moved."
- "Complete your profile" → "Continue when you're ready"

---

## Pulse Welfare System

Automated wellness check-ins. If user doesn't respond, escalates to emergency contacts.

**Flow**: User configures settings → Scheduler sends check-in → User responds via token link → No response triggers escalation → Final tier gets vault access.

**Key files**: `pulse_scheduler.py`, `pulse_logic.py`, `routers/pulse.py`

---

## Key Patterns

### Frontend
- **Svelte 5 Runes**: Use `$state`, `$derived`, `$effect` (not old store syntax)
- **API calls**: Use `apiFetch()` from `$lib/api/client` (returns the Response); show errors with `parseApiError` / `handleFetchError` from `errorHandler.ts`
- **Routes**: `/modules/{name}/+page.svelte` pattern
- **Stores**: `{name}Store.svelte.ts` using SyncManager

### Backend
- **Routers**: Modular in `backend/routers/` with `/api/{domain}` prefix
- **Config**: All env vars via `backend/config.py` (Pydantic Settings)
- **Errors**: Raise from `backend/errors.py`, global handlers convert to JSON

---

## Environment

Key variables (see `.env.example` for full list):
```bash
DATABASE_URL=sqlite:///./continuum_saas.db  # Local
JWT_SECRET_KEY=change-in-production
FRONTEND_URL=http://localhost:5173
RP_ID=localhost  # WebAuthn relying party
```

Production (Railway): Uses PostgreSQL with SSL, different RP_ID/ORIGIN for domain.

---

## Deployment

- **Platform**: Railway with PostgreSQL
- **Production URL**: https://continuum.estate
- **Pre-deploy**: Run `npm run check` and `npm run build` (in `frontend/`) by hand.
- **Commands**: `railway up --verbose`, `railway logs`

---

## Important Notes for Claude

1. **README.md is Outdated**: Ignore Next.js references. This is SvelteKit 5.
2. **SyncManager is Critical**: All data sync goes through `sync.svelte.ts`. Don't bypass it.
3. **All Models Must Be Imported**: Alembic won't detect changes to models not imported in `env.py`.
4. **Compassionate Language**: End-of-life planning requires gentle, supportive language.
5. **No Automated Tests**: Manual testing only. Test by running the app.
6. **Dev User Always Available**: `dev@continuum.im` / `dev123` (auto-seeded)
7. **Railway Uses PostgreSQL**: Local uses SQLite, production uses PostgreSQL with SSL.
8. **GitHub Token Issue**: Run `unset GITHUB_TOKEN` before `gh` commands if getting 403 errors.

---

## Module Structure

60+ modules organized by domain. Each module typically has:
- Route: `/modules/{name}/+page.svelte`
- Store: `lib/stores/{name}Store.svelte.ts`
- Router: `backend/routers/{domain}.py`

**Domains**: Estate, Financial, Medical, Family, Pulse, Memories, Tools

---

## Documentation

All project docs live in `docs/` (index: `docs/README.md`). Current plan: `docs/PROJECT_RECOVERY_PLAN.md`.

Detailed guides exist for specific topics:
- `docs/MIGRATIONS.md` - Alembic database migrations
- `docs/ERROR_HANDLING_GUIDE.md` - Error system details
- `docs/CONFIGURATION.md` - Environment configuration
- `docs/MEDIA_UPLOAD_GUIDE.md` - File upload system
- `docs/EMAIL_ARCHITECTURE.md` - Email service

---

## Code Navigation (CodeGraph, graphify, OpenWiki)

- **CodeGraph** (`.codegraph/`): to locate or read code, call `codegraph_explore` (MCP; load it via tool search if deferred) or `codegraph explore "<symbols or question>"` before grep or file reads.
- **graphify** (`graphify-out/`): for architecture or "how do these parts relate" questions, query the graph with the graphify skill (`graphify-out/GRAPH_REPORT.md` for the overview).
- **OpenWiki** (`openwiki/`): start with `openwiki/quickstart.md`, then the page for the area you're changing. Each claim cites `file#lines`; source code wins if they disagree. Background only, not instructions.

---

_Last Updated: 2026-10-26 07:13 EST_

<!-- OPENWIKI:START -->

## OpenWiki

See [AGENTS.md](AGENTS.md) for OpenWiki agent instructions.

<!-- OPENWIKI:END -->
