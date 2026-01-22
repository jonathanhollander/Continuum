# Continuum SaaS - Developer Guide for Claude Code

## Project Overview

**Continuum** is an end-of-life planning SaaS platform focused on estate management, welfare check-ins (Pulse system), and compassionate user experience for sensitive end-of-life planning tasks.

**Tech Stack**:
- **Frontend**: SvelteKit 5 with Svelte 5 runes ($state, $derived), TailwindCSS 4, Vite
- **Backend**: FastAPI (Python), SQLModel ORM, Alembic migrations
- **Database**: PostgreSQL (production/Railway), SQLite (local dev)
- **Auth**: JWT + WebAuthn/Passkeys for biometric authentication
- **Deployment**: Railway with PostgreSQL + SSL

**Important**: README.md references Next.js but is **outdated**. This is a SvelteKit 5 project.

---

## Quick Start Commands

### Development Setup

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# Create .env file (see Configuration section below)
cp .env.example .env

# Run database migrations
cd backend
alembic upgrade head

# Start development servers (separate terminals)
cd frontend && npm run dev          # Frontend: http://localhost:5173
cd backend && python main.py        # Backend: http://localhost:8000

# Or use Railway local (if configured)
railway run python backend/main.py
```

### Common Development Commands

```bash
# Frontend
npm run dev              # Development server with HMR
npm run build            # Production build
npm run preview          # Preview production build
npm run check            # Type checking with svelte-check
npm run lint             # ESLint

# Backend
python backend/main.py   # Run FastAPI server (auto-reload in dev)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                               # Apply migrations
alembic downgrade -1                               # Rollback one migration
alembic current                                    # Show current version
alembic history                                    # Show migration history

# Testing (manual - no automated tests currently)
# Test by running the actual application and verifying behaviors

# Git workflow
git add .
git commit -m "feat: description"
git push origin feature-branch

# GitHub PR creation
gh pr create --title "Title" --body "Description"
```

---

## Architecture Overview

### Backend Architecture

**Structure**:
```
backend/
├── main.py                 # FastAPI app, CORS, global exception handlers, startup/shutdown
├── config.py              # Pydantic Settings for environment variables
├── database.py            # SQLModel engine, session management, base models
├── auth.py                # JWT token creation/validation, password hashing
├── security.py            # WebAuthn/Passkey implementation
├── errors.py              # Custom exception classes with compassionate messages
├── estate_models.py       # 22 estate-related SQLModel models
├── pulse_models.py        # 9 Pulse welfare check-in models
├── pulse_logic.py         # Pulse check-in logic and escalation
├── pulse_scheduler.py     # APScheduler for automated Pulse checks
├── routers/               # FastAPI routers (modular endpoints)
│   ├── auth.py           # Authentication endpoints (login, signup, token refresh)
│   ├── pulse.py          # Pulse welfare check-in endpoints
│   ├── contacts.py       # Contact management
│   ├── estate_data.py    # Estate profile, documents, letters, etc.
│   ├── insurance.py      # Insurance policies
│   ├── medical.py        # Medical profiles, directives
│   ├── pets.py           # Pet care information
│   ├── memories.py       # Family memories, heirlooms, time capsules
│   └── media.py          # File upload/download endpoints
├── services/             # Business logic services
│   ├── email_service.py  # Email sending (Postmark/SMTP/local file)
│   └── media_service.py  # File storage and retrieval
├── models/               # Additional SQLModel models
│   ├── email_log.py      # Email delivery tracking
│   └── media.py          # Media file metadata
├── templates/            # Jinja2 email templates
├── utils/                # Utility functions
└── alembic/              # Database migrations
    ├── env.py            # Alembic configuration (imports ALL models)
    └── versions/         # Migration files
```

**Key Patterns**:

1. **Modular Routers**: Each domain (pulse, contacts, medical) has its own router with prefix `/api/{domain}`
2. **Dependency Injection**: Uses FastAPI's `Depends()` for auth, database sessions
3. **Global Exception Handlers**: Three handlers in main.py convert all errors to consistent JSON format
4. **Pydantic Settings**: All config from environment variables via `backend/config.py`
5. **SQLModel**: Combines SQLAlchemy + Pydantic for type-safe ORM models
6. **Alembic Migrations**: All 35+ models imported in `alembic/env.py` for auto-detection

**Database Models** (35+ total):
- **Core**: User, Estate, EmailLog, MediaFile
- **Estate**: Asset, FinancialAccount, Vendor, HomeAccess, Utility, Document, Letter, JournalEntry, Subscription, CalendarEvent
- **Insurance**: InsurancePolicy
- **Medical**: MedicalProfile, MedicalDirective, Pet
- **Family**: FamilyMemory, VisualMemory, ExternalArchive, ContactRelationship, LifeEvent
- **Memories**: TimeCapsuleMessage, FuneralData, AdvancedAssetData
- **Pulse**: PulseSettings, PulseVault, PulseCheckin, PulseEscalationLog, PulseEscalationTier, PulseContact, PulseSafetyTimer, PulseMessage, PulseCredential

**Error Handling**:
- Custom exception classes in `backend/errors.py` (15+ types)
- All exceptions extend `ContinuumException` with dual messages:
  - `message`: Technical detail for logging
  - `user_message`: Compassionate user-facing message
- Global handlers convert to consistent JSON: `{"error": {"message": "...", "code": "...", "details": {...}}}`

**Authentication**:
- JWT tokens with 7-day expiration
- Password hashing with bcrypt
- WebAuthn/Passkeys for biometric authentication
- Dev user auto-seeded: `dev@continuum.im` / `dev123`

### Frontend Architecture

**Structure**:
```
frontend/src/
├── routes/                    # SvelteKit file-based routing
│   ├── +page.svelte          # Landing page
│   ├── +layout.svelte        # Root layout (sidebar, notifications)
│   ├── login/+page.svelte    # Login page
│   ├── signup/+page.svelte   # Signup page
│   ├── dashboard/+page.svelte # Main dashboard
│   └── modules/              # Feature modules (60+ pages)
│       ├── pulse/+page.svelte          # Pulse check-in
│       ├── contacts/+page.svelte       # Contact management
│       ├── medical/+page.svelte        # Medical profiles
│       ├── insurance/+page.svelte      # Insurance policies
│       ├── pets/+page.svelte           # Pet care
│       ├── family-hub/+page.svelte     # Family tree
│       ├── heirlooms/+page.svelte      # Digital heirlooms
│       ├── time-capsule/+page.svelte   # Time capsules
│       └── [more modules...]/
├── lib/
│   ├── components/           # Reusable Svelte components
│   │   ├── ui/              # Base UI components (Modal, SmartInput, FileUploader)
│   │   ├── layout/          # Layout components (Sidebar, Header)
│   │   ├── modules/         # Module-specific components
│   │   ├── archetypes/      # Archetype components (AssetManager, DocumentVault)
│   │   ├── concierge/       # AI Concierge flow
│   │   └── ErrorNotification.svelte        # Error display component
│   │   └── NotificationContainer.svelte    # Global notification manager
│   ├── stores/              # Svelte stores (state management)
│   │   ├── auth.ts                      # Authentication state
│   │   ├── notificationStore.ts         # Global notifications
│   │   ├── onboardingStore.svelte.ts    # Onboarding flow
│   │   ├── digitalAssetsStore.svelte.ts # Digital assets
│   │   ├── heirloomStore.svelte.ts      # Heirlooms
│   │   └── [domain]Store.svelte.ts      # Domain-specific stores
│   ├── services/            # Business logic services
│   │   ├── sync.svelte.ts               # SyncManager pattern (see below)
│   │   ├── errorHandler.ts              # Error parsing and handling
│   │   ├── mediaService.ts              # File upload/download
│   │   ├── mediaMigration.ts            # IndexedDB → Backend migration
│   │   ├── exportService.ts             # Data export
│   │   └── indexedDB.ts                 # Local IndexedDB (legacy)
│   ├── config.ts            # API base URL configuration
│   └── data/                # Static data (smart samples, module definitions)
└── app.css                  # Global TailwindCSS styles
```

**Key Patterns**:

1. **SyncManager Pattern** (`sync.svelte.ts`):
   - Centralized data synchronization between localStorage, API, and UI
   - Two classes: `SyncManager<T>` (collections) and `SingletonSyncManager<T>` (single objects)
   - **Flow**: Instant load from localStorage → Optimistic updates → API sync → Mirror server as truth
   - **Migration**: Automatically uploads local data to cloud on first sync if server is empty
   - **Optimistic UI**: Update UI immediately, rollback on API failure
   - **Usage**:
     ```typescript
     const contactsSync = new SyncManager('contacts', 'contacts');
     await contactsSync.init(); // Loads from localStorage & syncs
     await contactsSync.create(newContact); // Optimistic create
     await contactsSync.update(contactId, updates); // Optimistic update
     await contactsSync.delete(contactId); // Optimistic delete
     ```

2. **Svelte 5 Runes**: Modern reactivity with `$state`, `$derived`, `$effect`
   ```svelte
   <script>
     let count = $state(0);
     let doubled = $derived(count * 2);
     $effect(() => {
       console.log('Count changed:', count);
     });
   </script>
   ```

3. **Error Handling**:
   - `errorHandler.ts` parses API errors and provides retry logic
   - `notificationStore.ts` manages global error/success/info notifications
   - All API calls wrapped with `apiFetch()` or `handleApiRequest()`
   - Compassionate error messages displayed with retry buttons

4. **Component Architecture**:
   - **Archetypes**: Reusable patterns (AssetManager, DocumentVault)
   - **Modules**: Feature-specific pages (60+ modules)
   - **UI Components**: Base components (Modal, SmartInput, FileUploader)
   - **Smart Components**: Context-aware (SmartInput detects field type, provides suggestions)

5. **TailwindCSS 4**: Utility-first CSS with custom design tokens

### Pulse Welfare Check-In System

**Purpose**: Automated wellness check-ins for users. If they don't respond, escalate to emergency contacts.

**Flow**:
1. User configures Pulse settings (check-in interval, escalation tiers)
2. Scheduler runs every 15 minutes (configurable)
3. Sends check-in request via email/SMS
4. User responds via token link
5. If no response → Escalate to next tier of contacts
6. Final tier → Full access to Pulse vault and emergency credentials

**Key Components**:
- `backend/pulse_scheduler.py`: APScheduler job runner
- `backend/pulse_logic.py`: Check-in logic and escalation
- `backend/routers/pulse.py`: API endpoints
- `frontend/src/routes/modules/pulse/`: UI pages

---

## Configuration & Environment Variables

**Environment Files**:
- `.env`: Main project environment variables (backend + frontend)
- `github_issues/.env`: GitHub API token for issue scripts

**Required Variables** (`.env`):
```bash
# Environment
ENVIRONMENT=development          # development | production
DEBUG=true

# Database
DATABASE_URL=sqlite:///./continuum_saas.db
# Production: postgresql://user:pass@host:5432/db?sslmode=require

# Frontend
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT Authentication (CHANGE IN PRODUCTION)
JWT_SECRET_KEY=continuum-dev-secret-key-change-in-production
SECRET_KEY=continuum-secret-key-change-in-production

# WebAuthn/Passkeys
RP_ID=localhost                    # Production: your-domain.com
RP_NAME="Continuum Estate"
ORIGIN=http://localhost:5173       # Production: https://your-domain.com

# Email (Postmark recommended)
POSTMARK_API_KEY=your_postmark_key_here
POSTMARK_FROM_EMAIL=noreply@continuum.im

# OR use SMTP
SMTP_ENABLED=false
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_username
SMTP_PASSWORD=your_password
SMTP_FROM_EMAIL=noreply@continuum.im

# File Storage
UPLOAD_DIR=backend/uploads
MAX_UPLOAD_SIZE=10485760  # 10MB

# Pulse Scheduler
PULSE_SCHEDULER_ENABLED=true
PULSE_CHECK_INTERVAL_MINUTES=15

# External APIs (optional)
GITHUB_TOKEN=ghp_your_token_here
VITE_OPENROUTER_API_KEY=your_openrouter_key
```

**Railway Deployment Variables**:
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
FRONTEND_URL=https://your-app.up.railway.app
RAILWAY_STATIC_URL=https://your-app.up.railway.app
JWT_SECRET_KEY=generate_secure_random_key
SECRET_KEY=generate_secure_random_key
RP_ID=your-app.up.railway.app
ORIGIN=https://your-app.up.railway.app
```

---

## Important Architectural Decisions

### 1. SyncManager Pattern (Critical)

**Location**: `frontend/src/lib/services/sync.svelte.ts`

**Purpose**: Unified data synchronization across localStorage, API, and UI state.

**Key Features**:
- **Instant Load**: Data loads from localStorage immediately (no loading spinners)
- **Optimistic Updates**: UI updates before API confirmation (rollback on failure)
- **Server as Truth**: After sync, server data mirrors to local storage
- **Automatic Migration**: If server is empty but local has data, uploads to cloud
- **Rollback on Failure**: Reverts optimistic updates if API call fails

**Usage Pattern**:
```typescript
// In a Svelte store (e.g., contactsStore.svelte.ts)
import { SyncManager } from '$lib/services/sync.svelte';

export const contactsSync = new SyncManager('contacts', 'contacts');

// In a component
<script>
  import { contactsSync } from '$lib/stores/contactsStore.svelte';

  let contacts = $derived(contactsSync.items);

  async function addContact(data) {
    await contactsSync.create(data);
    // UI updates immediately, API call happens in background
  }
</script>
```

### 2. Error Handling System (P1-High Complete)

**Backend** (`backend/errors.py`):
- 15+ custom exception classes extending `ContinuumException`
- Dual messages: technical (logging) + compassionate (user-facing)
- Global handlers in `main.py` convert all errors to consistent JSON

**Frontend** (`frontend/src/lib/services/errorHandler.ts`):
- `parseApiError()`: Parse backend error responses
- `apiFetch()`: Wrapper for fetch with automatic error handling
- `retryWithBackoff()`: Exponential backoff retry logic
- `notificationStore`: Global state for error/success/info notifications

**Example Error Flow**:
```python
# Backend raises compassionate error
raise ResourceNotFoundError(resource_type="contact", resource_id="123")
# → User sees: "We couldn't find that contact. It may have been moved or deleted."
```

### 3. Database Migrations (P1-High Complete)

**Tool**: Alembic with SQLModel

**Critical Setup** (`backend/alembic/env.py`):
- **All 35+ models must be imported** for Alembic to detect schema changes
- Path resolution: `project_root = Path(__file__).parent.parent.parent`
- Uses `SQLModel.metadata` (not Base.metadata)
- Database URL from `settings.DATABASE_URL`

**Common Issues**:
- **ModuleNotFoundError**: Check sys.path calculation
- **ImportError**: Verify all model names match actual class names (grep to confirm)
- **NameError in migration**: Add `import sqlmodel` to generated migration files

### 4. Authentication Flow

**Methods**:
1. **JWT Tokens**: Primary auth method (7-day expiration)
2. **WebAuthn/Passkeys**: Biometric authentication (Face ID, Touch ID, Windows Hello)

**Flow**:
1. User logs in → Backend generates JWT token
2. Token stored in localStorage (`auth` store)
3. All API requests include `Authorization: Bearer {token}` header
4. Backend validates token via `get_current_user()` dependency

**Dev User** (auto-seeded):
- Email: `dev@continuum.im`
- Password: `dev123`

### 5. Compassionate UX Principles

**Context**: End-of-life planning is emotionally sensitive. Language must be gentle, supportive, and non-demanding.

**Principles**:
- **No Imperative Verbs**: "Save your changes" instead of "Submit"
- **Acknowledge Effort**: "You're making progress" instead of "Task incomplete"
- **Offer Support**: "We're here to help" instead of "Error occurred"
- **Gentle Guidance**: "When you're ready" instead of "Complete this now"

**Examples**:
- ❌ "Submit" → ✅ "Save my thoughts"
- ❌ "Delete" → ✅ "Remove this item"
- ❌ "Error: Not found" → ✅ "We couldn't find that. It may have been moved."
- ❌ "Complete your profile" → ✅ "Continue when you're ready"

### 6. Module Architecture

**60+ Modules** organized by domain:
- **Core**: Dashboard, Catalog, Settings
- **Estate Planning**: Contacts, Documents, Letters, Property, Subscriptions
- **Financial**: Financial Accounts, Insurance, Advanced Registry
- **Medical**: Medical Profiles, Directives, Pets
- **Family**: Family Hub, Heirlooms, Visual Memories, Time Capsule
- **Pulse**: Welfare check-ins, Emergency contacts, Vault
- **Memories**: Legacy Journal, Accomplishments, Family Tree
- **Tools**: Executor Guide, Simulator, Analytics, QR Codes

**Each Module**:
- Route: `/modules/{module-name}/+page.svelte`
- Store: `{moduleName}Store.svelte.ts` (if needed)
- Router: `backend/routers/{domain}.py` (if has API)

---

## Testing Strategy

**Current State**: No automated tests. Manual testing by running the application.

**Manual Testing Workflow**:
1. Run frontend + backend
2. Perform actions in UI
3. Verify behaviors:
   - Data persists after refresh (localStorage)
   - API calls succeed (Network tab)
   - Errors display gracefully
   - Optimistic updates work correctly

**Future**: Add E2E tests (Playwright) and unit tests (Vitest for frontend, pytest for backend).

---

## Common Issues & Solutions

### Issue: "Module Not Found" in Alembic

**Symptom**: `ModuleNotFoundError: No module named 'backend'`

**Solution**: Fix sys.path in `backend/alembic/env.py`:
```python
project_root = Path(__file__).parent.parent.parent  # env.py → alembic/ → backend/ → project/
sys.path.insert(0, str(project_root))
```

### Issue: "ImportError: cannot import name X from backend.estate_models"

**Symptom**: Alembic can't find model classes

**Solution**: Grep for actual model names and update imports:
```bash
grep "^class " backend/estate_models.py
# Update alembic/env.py imports with actual names
```

### Issue: Migration file fails with "NameError: name 'sqlmodel' is not defined"

**Symptom**: Generated migration missing sqlmodel import

**Solution**: Add to migration file:
```python
import sqlmodel  # Add this line
```

### Issue: CORS errors in browser

**Symptom**: Frontend can't reach backend API

**Solution**: Check `.env` CORS_ORIGINS includes frontend URL:
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Issue: GitHub API 403 errors

**Symptom**: `Resource not accessible by personal access token`

**Solution**: Ensure token has `repo` scope and is in `.env`:
```bash
# .env and github_issues/.env
GITHUB_TOKEN=ghp_your_token_here
```

### Issue: WebAuthn registration fails

**Symptom**: `startRegistration is not defined`

**Solution**: Check WebAuthn imports in settings page:
```typescript
import { startRegistration } from '@simplewebauthn/browser';
```

### Issue: Data not syncing to backend

**Symptom**: Changes save locally but not to database

**Solution**: Verify SyncManager is calling `.sync()` on init:
```typescript
const store = new SyncManager('key', 'endpoint');
await store.init(); // Critical - triggers sync
```

---

## Key Files to Know

### Backend

- `backend/main.py`: FastAPI app entry point, routers, global handlers
- `backend/config.py`: All environment variables and settings
- `backend/database.py`: SQLModel engine, session management
- `backend/auth.py`: JWT token creation/validation
- `backend/errors.py`: Custom exception classes (15+)
- `backend/estate_models.py`: 22 estate-related models
- `backend/pulse_models.py`: 9 Pulse welfare models
- `backend/alembic/env.py`: Migration configuration (imports ALL models)
- `backend/routers/*.py`: Domain-specific API endpoints

### Frontend

- `frontend/src/routes/+layout.svelte`: Root layout with sidebar and notifications
- `frontend/src/routes/+page.svelte`: Landing page
- `frontend/src/routes/dashboard/+page.svelte`: Main dashboard
- `frontend/src/lib/services/sync.svelte.ts`: SyncManager pattern (critical)
- `frontend/src/lib/services/errorHandler.ts`: Error handling
- `frontend/src/lib/stores/auth.ts`: Authentication state
- `frontend/src/lib/stores/notificationStore.ts`: Global notifications
- `frontend/src/lib/config.ts`: API base URL configuration

### Documentation

- `MIGRATIONS.md`: Database migration guide (600+ lines)
- `ERROR_HANDLING_GUIDE.md`: Error handling guide (600+ lines)
- `CONFIGURATION.md`: Configuration management guide
- `MEDIA_UPLOAD_GUIDE.md`: File upload implementation
- `EMAIL_ARCHITECTURE.md`: Email service architecture
- `CLAUDE.md`: This file - developer guide

### GitHub Integration

- `github_issues/`: Scripts for posting updates to GitHub issues
- `github_issues/post_update.py`: Helper script with auto .env loading
- `github_issues/SCRIPTS_USAGE.md`: Usage documentation

---

## Railway Deployment

**Platform**: Railway with PostgreSQL

**Key Requirements**:
- PostgreSQL with SSL (`sslmode=require`)
- Environment variables (see Configuration section)
- Build command: `cd backend && pip install -r requirements.txt && cd ../frontend && npm install && npm run build`
- Start command: `cd backend && alembic upgrade head && python main.py`

**Database Connection**:
```python
# backend/config.py handles SSL automatically
def get_database_connect_args(self) -> dict:
    if "postgresql" in self.DATABASE_URL:
        return {"sslmode": "require"}
    return {}
```

**Deployment Checklist**:
1. Set ENVIRONMENT=production
2. Change JWT_SECRET_KEY and SECRET_KEY
3. Set DATABASE_URL to Railway PostgreSQL
4. Update RP_ID, ORIGIN, FRONTEND_URL to production domain
5. Run migrations: `alembic upgrade head`
6. Validate config: Check for warnings on startup

---

## GitHub Issue Management

**Scripts Location**: `github_issues/`

**Usage**:
```bash
cd github_issues
python3 post_update.py complete_issue_X.py  # Post completion update
python3 post_update.py claim_issue_X.py     # Claim issue
```

**Token Setup**: Token stored in `github_issues/.env` and main `.env` file.

**Available Scripts**: See `github_issues/SCRIPTS_USAGE.md` for full list.

### IMPORTANT: GitHub CLI Token Issue

**Problem**: The `GITHUB_TOKEN` environment variable overrides the keyring token which has proper `repo` scope for issue management.

**Symptom**: `gh issue close` or `gh issue comment` fails with:
```
GraphQL: Resource not accessible by personal access token (addComment)
```

**Solution**: Unset `GITHUB_TOKEN` before running `gh` commands:
```bash
unset GITHUB_TOKEN && gh issue close <number> --comment "message"
unset GITHUB_TOKEN && gh issue view <number>
```

**Why**:
- `GITHUB_TOKEN` env var (from `.env`): Limited permissions, used by Python scripts
- Keyring token (from `gh auth login`): Has `repo` scope including issue management
- When `GITHUB_TOKEN` is set, it takes precedence over keyring

**Verification**:
```bash
# Check which token is active
unset GITHUB_TOKEN && gh auth status

# Should show: "Logged in to github.com account jonathanhollander (keyring)"
# With scopes: 'gist', 'read:org', 'repo', 'workflow'
```

---

## Recent Completed Work

### Phase 3: Infrastructure (P0-Critical + P1-High) - CLOSED

**Completed and Closed Issues**:
- ✅ Issue #7: Configuration Management - Centralized Pydantic Settings (CLOSED)
- ✅ Issue #8: Alembic Migrations - Database migration system (CLOSED)
- ✅ Issue #9: Error Handling - Compassionate error messages (CLOSED)
- ✅ Issue #19: Structured Logging - Request correlation, email status API (CLOSED)

**Status**: 4 P1-High issues completed and closed. Remaining issues (1-6, 10-18) still open.

### What Was Completed

**Issue #7 - Configuration Management**:
- Created `backend/config.py` with Pydantic Settings
- Centralized all environment variables (JWT, database, CORS, email, etc.)
- Railway deployment support with SSL
- Removed all hardcoded URLs and secrets

**Issue #8 - Alembic Migrations**:
- Set up `backend/alembic/` with proper configuration
- All 35+ SQLModel models imported for auto-detection
- Created `MIGRATIONS.md` (600+ lines) documentation
- Verified auto-generation, apply, and rollback working

**Issue #9 - Error Handling**:
- Created `backend/errors.py` with 15+ custom exception classes
- Dual message system: technical (logs) + compassionate (users)
- Global exception handlers in `backend/main.py`
- Frontend notification system (`notificationStore`, `ErrorNotification`, `NotificationContainer`)
- Created `ERROR_HANDLING_GUIDE.md` (600+ lines)

**Issue #19 - Structured Logging**:
- Created `backend/utils/logger.py` with rotating file handler
- Replaced 50+ print() statements across 11 backend files
- Added `RequestIdMiddleware` for request correlation
- Created `backend/routers/email.py` for email status API
- Updated signup/login to use global notifications
- Created `ERROR_LOGGING_GUIDE.md` (600+ lines)

---

## Development Workflow

### Starting a New Session

1. Pull latest changes: `git pull origin main`
2. Check for new migrations: `alembic current`
3. Apply migrations if needed: `alembic upgrade head`
4. Start backend: `python backend/main.py`
5. Start frontend: `cd frontend && npm run dev`
6. Test login with dev user: `dev@continuum.im` / `dev123`

### Making Changes

1. Create feature branch: `git checkout -b feature/description`
2. Make changes
3. Test manually in browser
4. Check for errors in terminal and browser console
5. Commit with descriptive message: `git commit -m "feat: description"`
6. Push and create PR: `gh pr create --title "Title" --body "Description"`

### Database Changes

1. Modify SQLModel models in `backend/estate_models.py` or `backend/pulse_models.py`
2. Import new models in `backend/alembic/env.py` (CRITICAL)
3. Generate migration: `alembic revision --autogenerate -m "description"`
4. Review migration file in `backend/alembic/versions/`
5. Add `import sqlmodel` if using SQLModel types
6. Test migration: `alembic upgrade head`
7. Test rollback: `alembic downgrade -1` then `alembic upgrade head`

### Adding New Endpoints

1. Create/update router in `backend/routers/{domain}.py`
2. Import router in `backend/main.py`: `from backend.routers import new_router`
3. Include router: `app.include_router(new_router.router)`
4. Use custom exceptions from `backend/errors.py`
5. Test with curl or frontend

### Adding New Frontend Pages

1. Create route: `frontend/src/routes/{path}/+page.svelte`
2. Create store if needed: `frontend/src/lib/stores/{domain}Store.svelte.ts`
3. Use SyncManager for data: `new SyncManager('key', 'endpoint')`
4. Use `apiFetch()` for API calls
5. Add to sidebar: `frontend/src/lib/components/layout/Sidebar.svelte`

---

## Node.js Version Requirement

**Required**: Node.js >= 22.11.0

**Check Version**: `node --version`

**Install/Upgrade**: Use nvm or download from nodejs.org

---

## Important Notes for Future Claude Instances

1. **README.md is Outdated**: Ignore Next.js references. This is SvelteKit 5.
2. **SyncManager is Critical**: All data sync goes through `sync.svelte.ts`. Don't bypass it.
3. **All Models Must Be Imported**: Alembic won't detect changes to models not imported in `env.py`.
4. **Compassionate Language**: This is end-of-life planning. Language must be gentle and supportive.
5. **No Automated Tests**: Manual testing only. Test by running the app and verifying behaviors.
6. **Dev User Always Available**: `dev@continuum.im` / `dev123` (auto-seeded on startup)
7. **Token in .env**: GitHub token stored in both `.env` and `github_issues/.env`
8. **Railway Uses PostgreSQL**: Local uses SQLite, production uses PostgreSQL with SSL

---

## Resources

- **Documentation**: See all `*_GUIDE.md` files in project root
- **GitHub Repo**: (insert repo URL here)
- **Railway Dashboard**: (insert Railway URL here)
- **API Docs**: http://localhost:8000/docs (when backend running)
- **Frontend**: http://localhost:5173 (when frontend running)

---

_Last Updated: January 21, 2026 - After completing P0-Critical and P1-High (Issues #8, #9)_
