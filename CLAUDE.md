# CLAUDE.md - Continuum SaaS AI Assistant Guide

## Project Overview

**Continuum** is a comprehensive digital estate planning and wellness SaaS application that helps users manage their digital legacy, financial information, family matters, and integrate a "Pulse" safety/wellness check-in system. This is a production-ready application with a modern dual-stack architecture deployed on Railway.io.

**Core Purpose**: Enable users to organize their digital estate, create legacy content, manage important documents, and provide safety check-in mechanisms for loved ones.

---

## Architecture Overview

### Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | SvelteKit | 2.49.1 |
| **UI Library** | Svelte | 5.45.6 |
| **Build Tool** | Vite | 7.2.6 |
| **Styling** | Tailwind CSS | 4.1.18 |
| **Backend Framework** | FastAPI | 0.109.0+ |
| **Web Server** | Uvicorn | 0.27.0+ |
| **ORM** | SQLModel | 0.0.14+ |
| **Database (Dev)** | SQLite | - |
| **Database (Prod)** | PostgreSQL | - |
| **Authentication** | WebAuthn | simplewebauthn 13.2.2 |
| **Node Version** | Node.js | 22.12.0+ |
| **Python Version** | Python | 3.11+ |
| **Deployment** | Railway + Nixpacks | - |

### Architecture Pattern

This is a **monorepo with dual-stack architecture**:
- **Frontend**: SvelteKit SPA (pre-rendered static files)
- **Backend**: FastAPI serving both API endpoints and static frontend files
- **Database**: SQLModel/SQLAlchemy with automatic migrations

```
┌─────────────────────────────────────────────┐
│  Railway.io (Production)                    │
│  ┌────────────────────────────────────────┐ │
│  │  Uvicorn (FastAPI)                     │ │
│  │  ├─ Static Files (frontend/dist)      │ │
│  │  ├─ API Routes (/api/*)                │ │
│  │  └─ PostgreSQL Connection             │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Local Development                          │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Vite        │      │  Uvicorn        │ │
│  │  Port 5173   │◄────►│  Port 8000      │ │
│  │  (SvelteKit) │      │  (FastAPI)      │ │
│  └──────────────┘      └─────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Folder Structure

```
/home/user/Continuum/
├── backend/                          # Python FastAPI backend
│   ├── main.py                       # FastAPI app entry point (CRITICAL)
│   ├── database.py                   # Database models & connection logic
│   ├── estate_models.py              # Estate planning SQLModel models
│   ├── pulse_models.py               # Pulse safety system models
│   ├── pulse_logic.py                # Business logic for Pulse
│   ├── pulse_scheduler.py            # APScheduler for notifications
│   ├── email_service.py              # Email functionality
│   ├── security.py                   # WebAuthn authentication
│   ├── requirements.txt              # Python dependencies
│   └── routers/                      # API route handlers
│       ├── pulse.py                  # Pulse API endpoints
│       ├── contacts.py               # Contact management
│       └── estate_data.py            # Estate data CRUD
│
├── frontend/                         # SvelteKit frontend
│   ├── src/
│   │   ├── routes/                   # File-based routing (60+ pages)
│   │   │   ├── +layout.svelte        # Root layout with navigation
│   │   │   ├── +page.svelte          # Home page
│   │   │   ├── login/                # Authentication flows
│   │   │   ├── dashboard/            # Main dashboard
│   │   │   ├── modules/              # Feature modules (15+ modules)
│   │   │   ├── pulse/                # Pulse system pages
│   │   │   ├── admin/                # Admin pages
│   │   │   ├── settings/             # User settings
│   │   │   └── [many more...]
│   │   │
│   │   ├── lib/
│   │   │   ├── components/           # Reusable Svelte components
│   │   │   │   ├── modules/          # Module-specific components
│   │   │   │   ├── layout/           # Layout components
│   │   │   │   ├── dashboard/        # Dashboard components
│   │   │   │   └── [others...]
│   │   │   │
│   │   │   ├── stores/               # Svelte stores (30+ stores)
│   │   │   │   ├── pulse.ts          # Pulse state management
│   │   │   │   ├── estateStore.ts    # Estate data store
│   │   │   │   ├── familyStore.ts    # Family information
│   │   │   │   ├── dictionary.ts     # Content dictionary (71KB)
│   │   │   │   ├── conciergeEngine.ts # AI concierge logic
│   │   │   │   └── [30+ stores...]
│   │   │   │
│   │   │   ├── services/             # Frontend services
│   │   │   │   ├── sync.svelte.ts    # Backend sync service (CRITICAL)
│   │   │   │   ├── encryption.ts     # Client-side encryption
│   │   │   │   ├── exportService.ts  # PDF/data export
│   │   │   │   ├── indexedDB.ts      # Offline storage
│   │   │   │   └── [more services...]
│   │   │   │
│   │   │   ├── data/                 # Static data & config
│   │   │   │   ├── registry.json     # Module registry (IMPORTANT)
│   │   │   │   └── tasks/            # Onboarding task data
│   │   │   │
│   │   │   ├── assets/               # Images, icons, etc.
│   │   │   └── utils.ts              # Utility functions
│   │   │
│   │   ├── app.css                   # Global styles
│   │   └── app.html                  # HTML template
│   │
│   ├── static/                       # Static assets
│   ├── dist/                         # Build output (generated)
│   ├── package.json                  # Frontend dependencies
│   ├── svelte.config.js              # SvelteKit configuration
│   ├── vite.config.ts                # Vite build config
│   ├── tsconfig.json                 # TypeScript config
│   └── tailwind.config.js            # Tailwind CSS config
│
├── scripts/                          # Build & utility scripts
│   ├── generate_registry.ts          # Generate module registry
│   ├── saas_ignition.py              # Database seeding
│   └── seed-content.ts
│
├── package.json                      # Root monorepo config
├── nixpacks.toml                     # Railway deployment config (CRITICAL)
├── railway.toml                      # Railway service config
├── start.sh                          # Local development startup
├── eslint.config.mjs                 # ESLint configuration
├── dev.db                            # SQLite dev database (gitignored)
└── README.md                         # (Outdated - refers to Next.js)
```

---

## Key Entry Points

### Frontend
- **Main Entry**: `frontend/src/app.html`
- **Root Layout**: `frontend/src/routes/+layout.svelte`
- **Dev Server**: `http://localhost:5173`
- **Build Output**: `frontend/dist/` (served by backend in production)

### Backend
- **Main Entry**: `backend/main.py:15` (FastAPI app creation)
- **Dev Server**: `http://localhost:8000`
- **Health Check**: `GET /api/health`
- **API Prefix**: `/api/`

### Important Files to Review Before Changes
1. `backend/main.py` - API routes, CORS, startup logic
2. `backend/database.py` - Database models and connection
3. `frontend/src/routes/+layout.svelte` - Global navigation
4. `frontend/src/lib/services/sync.svelte.ts` - Data synchronization
5. `frontend/src/lib/data/registry.json` - Module configuration
6. `nixpacks.toml` - Deployment configuration

---

## Database Models & Schema

### Core Models (`backend/database.py`)

#### User Management
- **User** - Main user account
  - `id` (primary key)
  - `external_id` (unique WebAuthn ID)
  - `email` (unique)
  - `public_key` (WebAuthn public key)
  - `sign_count` (for replay protection)

#### Estate Data
- **Estate** - User's estate information
  - `transparent_data` (JSON, server-accessible)
  - `encrypted_vault` (bytes, client-encrypted)

### Pulse System Models (`backend/pulse_models.py`)
- **PulseSettings** - Check-in frequency configuration
- **PulseCheckin** - Individual check-in records
- **PulseContact** - Emergency contacts/guardians
- **PulseEscalationTier** - Multi-tier notification system
- **PulseEscalationLog** - Escalation event history
- **PulseSafetyTimer** - Time-bound safety timers
- **PulseVault** - Encrypted content vaults
- **PulseMessage** - Bidirectional messaging
- **PulseCredential** - WebAuthn credentials

### Estate Planning Models (`backend/estate_models.py`)
- **Asset** - Real estate, vehicles, financial assets
- **FinancialAccount** - Bank accounts, investments
- **Document** - Legal documents (wills, trusts)
- **Letter** - Legacy letters to beneficiaries
- **JournalEntry** - Personal reflections
- **Subscription** - Recurring services
- **CalendarEvent** - Important dates
- **Vendor** - Service providers
- **HomeAccess** - Access codes (doors, wifi, safes)
- **Utility** - Utility account information

### Database Connection Details
- **Dev**: SQLite at `./continuum_saas.db`
- **Prod**: PostgreSQL with SSL enforcement (`sslmode=require`)
- **Migration**: Automatic schema migration on startup (see `database.py:49-100`)
- **Retry Logic**: 5 retries with 3s delay for connection failures

---

## API Structure

### Authentication Endpoints
- `POST /api/auth/register/challenge` - WebAuthn registration challenge
- `POST /api/auth/register/verify` - Verify registration response
- `POST /api/auth/login/challenge` - WebAuthn login challenge
- `POST /api/auth/login/verify` - Verify login response

### Pulse System (`/api/pulse/`)
- Wellness check-in system endpoints
- Located in: `backend/routers/pulse.py`
- Includes: check-ins, escalation, contacts, vaults

### Estate Data (`/api/estate/` or `/api/data/`)
- CRUD operations for estate planning data
- Located in: `backend/routers/estate_data.py`
- Pattern: `/api/data/{endpoint}?user_id={id}`

### Contacts (`/api/contacts/`)
- Contact management endpoints
- Located in: `backend/routers/contacts.py`

---

## Frontend Architecture

### SvelteKit Routing (File-Based)

SvelteKit uses file-based routing in `frontend/src/routes/`:
- `+page.svelte` - Page component
- `+layout.svelte` - Layout wrapper
- `+server.ts` - API routes (not used in this project)
- `[param]/` - Dynamic route segments
- `(group)/` - Route groups (optional)

**Example Routes**:
- `/` → `routes/+page.svelte`
- `/dashboard` → `routes/dashboard/+page.svelte`
- `/modules/pulse` → `routes/modules/pulse/+page.svelte`
- `/pulse/portal/[token]` → `routes/pulse/portal/[token]/+page.svelte`

### State Management (Svelte Stores)

The application uses **30+ Svelte stores** located in `frontend/src/lib/stores/`:

**Critical Stores**:
- `pulse.ts` - Pulse system state
- `estateStore.ts` - Estate planning data
- `familyStore.ts` - Family information
- `conciergeEngine.ts` - AI concierge suggestions
- `dictionary.ts` - Large content library (71KB)
- `persistence.ts` - LocalStorage abstraction

**Store Pattern**:
```typescript
// Using Svelte 5 runes
import { writable } from 'svelte/store';

export const myStore = writable(initialValue);

// In components:
import { myStore } from '$lib/stores/myStore';
$: value = $myStore; // Auto-subscribes
```

### Services (`frontend/src/lib/services/`)

**Critical Service: `sync.svelte.ts`**
- Manages data synchronization between frontend and backend
- Implements `SyncManager<T>` class for type-safe syncing
- Pattern:
  ```typescript
  const manager = new SyncManager<MyType>('storageKey', 'api-endpoint');
  await manager.init(); // Loads from localStorage, then syncs
  ```

**Other Key Services**:
- `encryption.ts` - Client-side AES encryption for sensitive data
- `indexedDB.ts` - Offline-first data persistence
- `exportService.ts` - PDF generation and data exports
- `aiConciergeService.ts` - AI-powered suggestions

### Component Organization

Components are organized by feature/domain:
```
lib/components/
├── modules/           # Module-specific components
│   ├── pulse/
│   ├── legacy-journal/
│   ├── visual-memories/
│   └── [15+ modules...]
├── layout/            # Navigation, headers, footers
├── dashboard/         # Dashboard-specific components
└── admin/             # Admin UI components
```

### Module Registry System

**File**: `frontend/src/lib/data/registry.json`

This JSON file defines all available modules (features) in the application:
```json
{
  "id": "module-id",
  "title": "Module Title",
  "description": "Description...",
  "icon": "emoji",
  "role": "owner|executor|both"
}
```

**Used for**:
- Dynamic navigation generation
- Module catalog page
- Role-based access control
- Onboarding flows

---

## Development Workflows

### Local Development Setup

```bash
# Prerequisites
node >= 22.12.0
python >= 3.11

# Initial setup
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

cd ../frontend
npm install

# Start development (from root)
./start.sh
# This starts both frontend (5173) and backend (8000)

# OR start individually:
cd backend && uvicorn main:app --reload --port 8000
cd frontend && npm run dev
```

### Build Commands

```bash
# Frontend build (static SPA)
cd frontend
npm run build  # Output: frontend/dist/

# Type checking
npm run check

# Type checking with watch mode
npm run check:watch
```

### Database Management

```bash
# Database auto-initializes on backend startup
# Location: ./continuum_saas.db (SQLite)

# View database:
sqlite3 continuum_saas.db
.tables
.schema users

# Reset database (development):
rm continuum_saas.db
# Restart backend to reinitialize
```

### Environment Variables

**Backend** (`backend/.env` or Railway environment):
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db  # Production
DATABASE_URL=sqlite:///./continuum_saas.db         # Development (default)
FRONTEND_URL=https://your-domain.com               # CORS
PORT=8000                                          # Server port (Railway uses dynamic)
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_BASE=http://localhost:8000  # Development
VITE_API_BASE=                        # Production (same origin)
```

---

## Deployment (Railway + Nixpacks)

### Deployment Configuration

**File**: `nixpacks.toml` (CRITICAL for deployment)

```toml
providers = ["python", "node"]  # Dual-stack build

[phases.setup]
nixPkgs = ["python311", "gcc", "nodejs_22"]

[variables]
NIXPACKS_NODE_VERSION = "22"
PYTHONPATH = "/app"

[phases.install]
# 1. Install Python dependencies in venv
# 2. Install frontend Node dependencies

[phases.build]
# Build frontend static files

[start]
cmd = "/opt/venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
```

### Deployment Flow

1. **Railway detects push to main branch**
2. **Nixpacks builds**:
   - Creates Python venv
   - Installs backend dependencies
   - Installs frontend dependencies
   - Builds frontend (`npm run build`)
3. **Starts Uvicorn server**:
   - Serves API at `/api/*`
   - Serves static frontend from `frontend/dist/`
   - Uses dynamic `$PORT` from Railway

### Key Deployment Details

- **Static File Serving**: Backend serves frontend via FastAPI `StaticFiles`
- **Database SSL**: PostgreSQL connections require `sslmode=require`
- **Connection Retry**: 5 retries with 3s delay for database startup
- **Health Check**: Currently disabled (see `railway.toml:5`)
- **Startup Tasks**:
  1. Database connection with retry
  2. Table creation/migration
  3. Seed dev user (ID 1)
  4. Start APScheduler for Pulse notifications

---

## Code Conventions & Best Practices

### TypeScript/JavaScript Conventions

1. **Import Aliases**:
   ```typescript
   import { Component } from '$lib/components/Component.svelte';
   import { store } from '$lib/stores/store';
   import { goto } from '$app/navigation';
   import { page } from '$app/stores';
   ```

2. **Svelte 5 Runes** (New Reactivity):
   ```typescript
   let count = $state(0);           // Reactive state
   let doubled = $derived(count * 2); // Derived value
   $effect(() => {                  // Side effects
     console.log(count);
   });
   ```

3. **TypeScript Strict Mode**: Enabled in `tsconfig.json`

4. **Component Naming**: PascalCase for components, camelCase for utilities

### Python Conventions

1. **Type Hints**: Use type hints for all function signatures
   ```python
   def get_user(user_id: int) -> Optional[User]:
       ...
   ```

2. **SQLModel Patterns**:
   ```python
   class MyModel(SQLModel, table=True):
       __tablename__ = "my_models"
       id: Optional[int] = Field(default=None, primary_key=True)
   ```

3. **FastAPI Patterns**:
   ```python
   @app.get("/api/endpoint")
   def endpoint(session: Session = Depends(get_session)):
       ...
   ```

### File Naming Conventions

- **Svelte Components**: `ComponentName.svelte`
- **TypeScript Files**: `fileName.ts` or `fileName.svelte.ts` (for Svelte context)
- **Python Files**: `snake_case.py`
- **Routes**: `+page.svelte`, `+layout.svelte`
- **Test Files**: Not currently implemented

### Code Organization

1. **Separation of Concerns**:
   - UI components in `lib/components/`
   - Business logic in `lib/services/`
   - State in `lib/stores/`
   - Static data in `lib/data/`

2. **API Routes**:
   - Grouped by domain in `backend/routers/`
   - Each router handles one major feature area

3. **Database Models**:
   - Core models in `database.py`
   - Domain models in separate files (`pulse_models.py`, `estate_models.py`)

---

## Common Development Tasks

### Adding a New Module

1. **Create route**: `frontend/src/routes/modules/my-module/+page.svelte`
2. **Add components**: `frontend/src/lib/components/modules/my-module/`
3. **Update registry**: Add entry to `frontend/src/lib/data/registry.json`
4. **Add store** (if needed): `frontend/src/lib/stores/myModule.ts`
5. **Add backend model** (if needed): Update `backend/estate_models.py`
6. **Add API endpoint** (if needed): Create/update `backend/routers/`

### Adding a New Database Model

1. **Define model** in `backend/estate_models.py` or create new file:
   ```python
   class NewModel(SQLModel, table=True):
       __tablename__ = "new_models"
       id: Optional[int] = Field(default=None, primary_key=True)
       user_id: int = Field(foreign_key="users.id")
       # ... other fields
   ```

2. **Import in** `backend/database.py`:
   ```python
   from backend.estate_models import NewModel
   ```

3. **Add migration** (if needed) in `database.py:migrate_db()`

4. **Restart backend** to create tables

### Adding a New API Endpoint

1. **Create/update router** in `backend/routers/`:
   ```python
   from fastapi import APIRouter, Depends
   from sqlmodel import Session

   router = APIRouter(prefix="/api/my-feature", tags=["my-feature"])

   @router.get("/items")
   def get_items(session: Session = Depends(get_session)):
       # ...
   ```

2. **Register in** `backend/main.py`:
   ```python
   from backend.routers import my_feature
   app.include_router(my_feature.router)
   ```

### Adding a New Frontend Service

1. **Create service** in `frontend/src/lib/services/myService.ts`:
   ```typescript
   export class MyService {
     // Service logic
   }

   export const myService = new MyService();
   ```

2. **Use in components**:
   ```typescript
   import { myService } from '$lib/services/myService';
   ```

### Working with the Sync System

The `SyncManager` class provides automatic sync between frontend and backend:

```typescript
import { SyncManager } from '$lib/services/sync.svelte';

// Create manager
const contacts = new SyncManager<Contact>('contacts', 'contacts');

// Initialize (loads from localStorage, then syncs with backend)
await contacts.init();

// Access items
const items = contacts.items;

// Add item
await contacts.add({ name: 'John Doe' });

// Update item
await contacts.update(id, { name: 'Jane Doe' });

// Delete item
await contacts.delete(id);

// Manual sync
await contacts.sync();
```

---

## Testing & Quality

### Current State
- **No formal test suite** currently implemented
- **Type checking**: TypeScript strict mode + `svelte-check`
- **Linting**: ESLint configured (legacy Next.js config)
- **Manual testing**: Via development server and production staging

### Type Checking

```bash
cd frontend
npm run check        # One-time check
npm run check:watch  # Watch mode
```

### Future Recommendations
- Add Vitest for unit tests
- Add Playwright for E2E tests
- Add pytest for backend tests
- Implement CI/CD testing pipeline

---

## Important Patterns & Gotchas

### 1. Client-Side Encryption
- Sensitive data is encrypted in the browser before being sent to backend
- Server stores encrypted blobs, cannot decrypt
- Encryption keys are derived from user credentials
- See: `frontend/src/lib/services/encryption.ts`

### 2. Dual Data Storage
- **transparent_data**: JSON field, server-accessible, for AI/search
- **encrypted_vault**: Encrypted blob, opaque to server
- Trade-off between functionality and privacy

### 3. WebAuthn Authentication
- Passwordless authentication using device biometrics/security keys
- Challenge-response flow
- Public key stored in database
- See: `backend/security.py`

### 4. Offline-First Architecture
- Data stored in localStorage and IndexedDB
- Syncs with backend when online
- Can work offline with cached data
- See: `frontend/src/lib/services/indexedDB.ts`

### 5. Module System
- Modules are self-contained feature areas
- Registered in `registry.json`
- Role-based access (owner/executor/both)
- Dynamic navigation generation

### 6. Pulse Escalation System
- Multi-tier notification system
- Configurable delays between tiers
- APScheduler runs background jobs
- See: `backend/pulse_scheduler.py`

### 7. Static File Serving in Production
- Frontend builds to `dist/`
- Backend serves static files
- All API routes prefixed with `/api/`
- Same-origin deployment (no CORS issues)

### 8. Database Migration Strategy
- Simple column addition migration on startup
- See: `backend/database.py:migrate_db()`
- More complex migrations require manual SQL
- Consider using Alembic for production

### 9. Development User Seeding
- User ID 1 is auto-created in development
- Email: `dev@continuum.im`
- See: `backend/main.py:seed_dev_user()`

### 10. Port Configuration
- Development: Fixed ports (5173, 8000)
- Production: Dynamic `$PORT` from Railway
- Backend must use `$PORT` environment variable

---

## Git Workflow

### Branch Strategy
- **Main branch**: Production-ready code
- **Feature branches**: `claude/feature-name-SESSION_ID` format
- **Deployment**: Main branch auto-deploys to Railway

### Commit Messages
Recent commits show focus on:
- Deployment fixes (healthcheck, database connections)
- Infrastructure stabilization (Nixpacks, SSL)
- Version pinning (Node 22, Python 3.11)

### Pull Requests
- Create PR from feature branch to main
- Include description of changes
- Test locally before pushing
- Ensure build succeeds

---

## Debugging & Troubleshooting

### Common Issues

**1. Database Connection Failures**
- Check `DATABASE_URL` environment variable
- Ensure PostgreSQL is running (production)
- Check SSL requirement for PostgreSQL
- Review retry logic in `database.py:49-63`

**2. Frontend Build Failures**
- Check Node version (>= 22.12.0)
- Clear `node_modules` and reinstall
- Check for TypeScript errors: `npm run check`
- Review Vite config in `vite.config.ts`

**3. Backend Import Errors**
- Check `PYTHONPATH=/app` in Nixpacks
- Ensure all dependencies in `requirements.txt`
- Verify Python version (>= 3.11)

**4. CORS Issues (Development)**
- Backend allows all origins in development
- Check `VITE_API_BASE` in frontend `.env`
- Ensure backend is running on port 8000

**5. Static File Serving Issues**
- Ensure frontend build completed: `frontend/dist/` exists
- Check FastAPI static file mount in `main.py`
- Verify fallback to `index.html` for SPA routing

### Debugging Tools

**Backend**:
```bash
# Run with debug logging
cd backend
uvicorn main:app --reload --log-level debug

# Database inspection
sqlite3 continuum_saas.db
SELECT * FROM users;
```

**Frontend**:
```bash
# Dev server with HMR
cd frontend
npm run dev

# Build and preview
npm run build
npm run preview

# Type checking
npm run check
```

---

## Performance Considerations

### Frontend
- **Large stores**: `dictionary.ts` is 71KB, loaded at startup
- **Bundle size**: Monitor with `npm run build` output
- **Lazy loading**: Consider code splitting for modules
- **Images**: Optimize in `static/` directory

### Backend
- **Database queries**: Use SQLAlchemy query optimization
- **Connection pooling**: Consider for high traffic
- **APScheduler**: Monitor job execution for Pulse system
- **Static files**: Consider CDN for production

---

## Security Notes

### Current Security Measures
- WebAuthn passwordless authentication
- Client-side encryption for sensitive data
- SSL/TLS for database connections (production)
- CORS configured for known origins

### Security Considerations for AI Assistants
1. **Never commit secrets** to git (`.env` files, keys, tokens)
2. **Don't log sensitive data** (passwords, encryption keys, PII)
3. **Validate user input** when adding new endpoints
4. **Use parameterized queries** (SQLModel handles this)
5. **Keep dependencies updated** (security patches)
6. **Review authentication** before modifying auth flows
7. **Test encryption** changes carefully (data loss risk)

---

## Resources & References

### Documentation
- **SvelteKit**: https://kit.svelte.dev/docs
- **Svelte 5**: https://svelte.dev/docs/svelte/overview
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLModel**: https://sqlmodel.tiangolo.com/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Key Dependencies
- **simplewebauthn**: https://simplewebauthn.dev/
- **Lucide Icons**: https://lucide.dev/
- **jsPDF**: https://github.com/parallax/jsPDF
- **APScheduler**: https://apscheduler.readthedocs.io/

### Deployment
- **Railway**: https://docs.railway.app/
- **Nixpacks**: https://nixpacks.com/docs

---

## Quick Reference Commands

```bash
# Development
./start.sh                          # Start both frontend and backend
cd frontend && npm run dev          # Frontend only
cd backend && uvicorn main:app --reload  # Backend only

# Building
cd frontend && npm run build        # Build frontend

# Type Checking
cd frontend && npm run check        # Check TypeScript types

# Database
sqlite3 continuum_saas.db           # Open dev database
rm continuum_saas.db                # Reset dev database

# Dependencies
cd frontend && npm install          # Install frontend deps
cd backend && pip install -r requirements.txt  # Install backend deps

# Deployment
git push origin main                # Triggers Railway deployment
```

---

## For AI Assistants: Working on This Codebase

### Before Making Changes
1. **Read relevant files** completely before modifying
2. **Understand the module system** via `registry.json`
3. **Check database models** to understand data structure
4. **Review sync patterns** in `sync.svelte.ts`
5. **Check deployment config** if touching build/start scripts

### When Adding Features
1. **Start with the data model** (backend models)
2. **Create API endpoints** (backend routers)
3. **Build UI components** (frontend components)
4. **Wire up state management** (stores + sync)
5. **Update navigation** (registry.json + layout)
6. **Test locally** before committing

### When Debugging
1. **Check browser console** for frontend errors
2. **Check terminal output** for backend errors
3. **Inspect network tab** for API calls
4. **Review database state** with sqlite3
5. **Check environment variables**

### When Refactoring
1. **Don't break the sync system** (critical for data integrity)
2. **Don't change database models** without migration plan
3. **Don't modify WebAuthn flow** without deep understanding
4. **Don't change deployment config** without testing
5. **Preserve backward compatibility** when possible

### Code Locations for Common Tasks

| Task | Location |
|------|----------|
| Add navigation link | `frontend/src/routes/+layout.svelte` |
| Add module | `frontend/src/lib/data/registry.json` |
| Add database table | `backend/estate_models.py` or `pulse_models.py` |
| Add API endpoint | `backend/routers/` |
| Add store | `frontend/src/lib/stores/` |
| Add service | `frontend/src/lib/services/` |
| Add component | `frontend/src/lib/components/` |
| Configure deployment | `nixpacks.toml` |
| Configure build | `frontend/vite.config.ts` or `svelte.config.js` |

---

## Current Development Focus

Based on recent commits, the team is focused on:
1. **Deployment stabilization** (Railway + Nixpacks)
2. **Database connection reliability** (retry logic, SSL)
3. **Version pinning** (Node 22, Python 3.11)
4. **Health check debugging**

---

## Known Limitations

1. **No formal test suite** - Manual testing only
2. **Single user dev mode** - User ID 1 hardcoded in many places
3. **Simple migrations** - Column additions only, no complex schema changes
4. **No real-time features** - Polling-based updates
5. **Client-side encryption** - Key management is basic
6. **No CDN** - Static files served from backend
7. **No caching layer** - Direct database queries
8. **Outdated README** - Still refers to Next.js (legacy)

---

## Conclusion

This is a well-architected, production-ready dual-stack application with modern tooling. The codebase is organized, follows conventions, and has clear separation of concerns. When working on this project:

- **Respect the sync system** - It's the backbone of data flow
- **Test locally first** - Development environment is reliable
- **Read before writing** - Understanding beats guessing
- **Follow patterns** - Consistency is valuable
- **Ask when uncertain** - Complex systems have nuances

Good luck! 🚀
