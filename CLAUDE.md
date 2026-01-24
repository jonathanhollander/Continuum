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
cd backend && pip install -r requirements.txt
alembic upgrade head
python main.py                                # http://localhost:8000

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
- JWT tokens (7-day expiration) stored in localStorage
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
- **API calls**: Use `apiFetch()` from `errorHandler.ts`
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
- **Pre-deploy**: Wait for GitHub Actions (lint, build, type-check) to pass
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

Detailed guides exist for specific topics:
- `MIGRATIONS.md` - Alembic database migrations
- `ERROR_HANDLING_GUIDE.md` - Error system details
- `CONFIGURATION.md` - Environment configuration
- `MEDIA_UPLOAD_GUIDE.md` - File upload system
- `EMAIL_ARCHITECTURE.md` - Email service

---

_Last Updated: January 24, 2026_
