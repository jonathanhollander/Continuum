# Continuum SaaS - Claude Code Context

## Critical Info

- **Tech Stack**: SvelteKit 5 (runes: $state, $derived) + FastAPI + SQLModel + Alembic
- **Database**: PostgreSQL (Railway prod) / SQLite (local dev)
- **Auth**: JWT + WebAuthn/Passkeys

---

## Quick Start

```bash
# Frontend (terminal 1)
cd frontend && npm install && npm run dev    # http://localhost:5173

# Backend (terminal 2)
pip install -r backend/requirements.txt       # Python 3.11, exact pins
(cd backend && alembic upgrade head)
python -m backend.main                        # from repo root; http://localhost:8000

# Dev user auto-seeded locally: dev@continuum.im / dev123
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
- **Deploy**: push to `main`; Railway builds from GitHub (config in `.railway/railway.ts`, IaC — `checkSuites: true` means any future GitHub check would gate deploys).
- **Migrations**: deploys run none. After a model change, `pg_dump` first, then run `alembic upgrade head` against production by hand.
- **Pre-deploy**: run `npm run check` and `npm run build` (in `frontend/`) by hand.
- **Logs**: `railway logs`; wait for a deploy with `railway deployment list --json` (newest `SUCCESS` with your `commitHash`).

---

## Important Notes for Claude

1. **Docs index**: `docs/README.md`. Open work: `docs/PUNCHLIST.md`.
2. **SyncManager is Critical**: All data sync goes through `sync.svelte.ts`. Don't bypass it.
3. **All Models Must Be Imported**: Alembic won't detect changes to models not imported in `env.py`.
4. **Compassionate Language**: End-of-life planning requires gentle, supportive language.
5. **Testing**: mostly manual — run the app. A few backend scripts live in `backend/tests/` and `backend/test_*.py`.
6. **Dev User (local only)**: `dev@continuum.im` / `dev123`, seeded outside production.
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

All project docs live in `docs/` (index: `docs/README.md`). Open work: `docs/PUNCHLIST.md` (the recovery plan `docs/RECOVERY_EXECUTION_PLAN.md` is complete).

Detailed guides exist for specific topics:
- `docs/MIGRATIONS.md` - Alembic database migrations
- `docs/ERROR_HANDLING_GUIDE.md` - Error system details
- `docs/CONFIGURATION.md` - Environment configuration
- `docs/MEDIA_UPLOAD_GUIDE.md` - File upload system
- `docs/EMAIL_ARCHITECTURE.md` - Email service

---

## Code Navigation (OpenWiki, CodeGraph, graphify)

Use the existing knowledge indexes before broad repository searches; follow [AGENTS.md](AGENTS.md#locate-code-with-the-existing-knowledge-indexes) for the shared discovery rules.

- **OpenWiki** (`openwiki/`): use `openwiki/quickstart.md` and the relevant topic for system/workflow orientation, then follow its source references. Read relevant pages only; source and tests win if the wiki is stale.
- **CodeGraph** (`.codegraph/`): use `codegraph_explore` (MCP; load it via tool search if deferred) or `codegraph explore "<symbols or question>"` before grep/source reads for indexed symbols and call paths. Reuse returned source without rereading it.
- **graphify** (`graphify-out/graph.json`): use `graphify query`, `graphify path` or `graphify explain` for architecture, concepts and relationships; `graphify-out/GRAPH_REPORT.md` is the overview. The package is `graphifyy`, the CLI is `graphify`.

Once a question is answered, do not repeat it through every tool. Use narrow `rg` or targeted reads for a concrete gap, unindexed content or stale source; retrieve clipped ranges rather than starting a broad search. Missing indexes do not block work or authorize installing/rebuilding them. Routine discovery must not call external LLM providers.

---

_Last Updated: 2026-10-27 16:05 EST_

<!-- OPENWIKI:START -->

## OpenWiki

See [AGENTS.md](AGENTS.md) for OpenWiki agent instructions.

<!-- OPENWIKI:END -->
