# Phase 2 - High Priority Foundation (P1)
**Priority:** P1 - High (Complete within 2 weeks after Phase 1)
**Total Issues:** 13
**Total Time:** 94 hours

---

## Issue #6: Configuration management - Remove all hardcoded URLs

**Title:** `P1: Centralize configuration and remove hardcoded URLs (60+ files)`

**Labels:** `P1-high`, `configuration`

**Estimated Time:** 8 hours

**Agent:** `configuration-management` (see `.claude/agents/configuration-management.md`)

**Skill:** `config-setup` (see `.claude/skills/config-setup.md`)

**Dependencies:** None

### Description

Replace all hardcoded values (URLs, secrets, configuration) with environment-based configuration. Currently 60+ files have hardcoded `http://localhost:8000`.

### Backend Configuration

Create `/backend/config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    # Email
    EMAIL_PROVIDER: str = "local"
    POSTMARK_API_KEY: str | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None

    # WebAuthn
    RP_ID: str = "localhost"
    RP_NAME: str = "Continuum"
    ORIGIN: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
```

Update `/backend/main.py` to use config:

```python
from backend.config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    # ...
)
```

### Frontend Configuration

Create `.env`:

```bash
VITE_API_URL=http://localhost:8000
```

Create `/frontend/src/lib/config.ts`:

```typescript
export const config = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
};
```

Update `/frontend/src/lib/api/client.ts`:

```typescript
import { config } from '$lib/config';

const API_BASE_URL = config.apiUrl;
```

### Files to Update

Replace `http://localhost:8000` in these files (30+ files):

- All files in `/frontend/src/routes/modules/`
- All files in `/frontend/src/lib/stores/`
- `/frontend/src/lib/services/sync.svelte.ts`
- Any other files with hardcoded URLs

### Environment Files

Create:
- `.env.example` - Template with all variables documented
- `.env.development` - Local development config
- `.env.production` - Production config template

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### Railway Configuration

Document required Railway environment variables in `DEPLOYMENT_CONFIG.md`:

```markdown
## Required Environment Variables

### Backend
- DATABASE_URL
- JWT_SECRET
- ALLOWED_ORIGINS
- EMAIL_PROVIDER
- POSTMARK_API_KEY
- RP_ID
- RP_NAME
- ORIGIN

### Frontend
- VITE_API_URL
```

### Success Criteria

- [ ] No hardcoded URLs in codebase
- [ ] All config from environment variables
- [ ] Different configs for dev/staging/production
- [ ] .env.example documents all required variables
- [ ] Backend uses pydantic Settings
- [ ] Frontend uses import.meta.env
- [ ] Railway deployment documented

### Testing

- [ ] Run locally with .env.development → works
- [ ] Change API URL in .env → frontend uses new URL
- [ ] Missing env var → clear error message
- [ ] Deploy to Railway → uses production config

---

## Issue #7: Set up Alembic for database migrations

**Title:** `P1: Set up Alembic for proper database migration management`

**Labels:** `P1-high`, `data-persistence`

**Estimated Time:** 8 hours

**Agent:** `database-migration` (see `.claude/agents/database-migration.md`)

**Dependencies:** Issue #2 (backend models must exist first)

### Description

Set up Alembic for proper database schema versioning and migrations. Currently, schema changes are manual and not versioned.

### Setup Alembic

```bash
cd backend
pip install alembic
alembic init alembic
```

Configure `alembic.ini`:

```ini
sqlalchemy.url = driver://user:pass@localhost/dbname
# Will be overridden by env.py to use DATABASE_URL
```

Update `alembic/env.py`:

```python
from backend.config import settings
from backend.database import Base
from backend.models import *  # Import all models

config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)
target_metadata = Base.metadata
```

### Create Initial Migration

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### Create Migrations for New Tables

```bash
# After adding family, insurance, medical, pets models
alembic revision --autogenerate -m "add family insurance medical pets tables"
alembic upgrade head
```

### Migration Best Practices

Document in `/backend/MIGRATIONS.md`:

```markdown
## Running Migrations

### Development
alembic upgrade head

### Production
# Migrations run automatically on Railway deployment

### Creating New Migration
1. Add/modify models
2. alembic revision --autogenerate -m "description"
3. Review generated migration
4. Test upgrade and downgrade
5. Commit migration file

### Rollback
alembic downgrade -1  # Back one version
alembic downgrade <revision>  # Back to specific version
```

### Data Migration Scripts

For migrating existing data, create `/backend/migrations/data/`:

- `001_migrate_local_storage.py` - Migrate localStorage data
- `002_migrate_indexeddb_media.py` - Migrate IndexedDB media

### Success Criteria

- [ ] Alembic properly configured
- [ ] Initial migration created from current schema
- [ ] New table migrations generated
- [ ] Rollback tested and working
- [ ] Data migration scripts created
- [ ] Documentation complete
- [ ] Migrations run automatically on Railway

### Testing

- [ ] Fresh database → migrations create all tables
- [ ] Existing database → migrations update schema
- [ ] Rollback → reverts changes successfully
- [ ] Data migration → preserves all user data

---

## Issue #8: Standardize error handling across frontend and backend

**Title:** `P1: Standardize error handling with user-friendly messages`

**Labels:** `P1-high`, `monitoring`

**Estimated Time:** 12 hours

**Agent:** `error-handling-standardization` (see `.claude/agents/error-handling-standardization.md`)

**Dependencies:** None

### Description

Add comprehensive error handling across frontend and backend with user-friendly messages instead of technical jargon.

### Backend Error Handling

Create `/backend/exceptions.py`:

```python
class ContinuumException(Exception):
    """Base exception for Continuum errors"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code

class AuthenticationError(ContinuumException):
    def __init__(self, message="Authentication failed"):
        super().__init__(message, 401)

class AuthorizationError(ContinuumException):
    def __init__(self, message="Not authorized"):
        super().__init__(message, 403)

class NotFoundError(ContinuumException):
    def __init__(self, message="Resource not found"):
        super().__init__(message, 404)

class ValidationError(ContinuumException):
    def __init__(self, message="Invalid data"):
        super().__init__(message, 400)
```

Add exception handler in `/backend/main.py`:

```python
@app.exception_handler(ContinuumException)
async def continuum_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "success": False}
    )
```

Replace bare `except:` with specific exceptions:

```python
# Before
try:
    # code
except:
    pass

# After
try:
    # code
except AuthenticationError:
    raise
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise ContinuumException("Something went wrong. Please try again.")
```

### Frontend Error Handling

Create `/frontend/src/lib/components/ErrorNotification.svelte`:

```svelte
<script lang="ts">
    export let error: string = '';
    export let onDismiss: () => void;
</script>

{#if error}
    <div class="error-notification">
        <p>{error}</p>
        <button on:click={onDismiss}>Dismiss</button>
    </div>
{/if}
```

Create `/frontend/src/lib/components/SyncStatus.svelte`:

```svelte
<script lang="ts">
    export let status: 'idle' | 'syncing' | 'synced' | 'error';
    export let error: string = '';
</script>

<div class="sync-status {status}">
    {#if status === 'syncing'}
        Saving...
    {:else if status === 'synced'}
        ✓ Saved
    {:else if status === 'error'}
        ⚠ {error} <button on:click={onRetry}>Retry</button>
    {/if}
</div>
```

Update all API calls to handle errors:

```typescript
try {
    const result = await apiPost('/api/endpoint', data);
    showSuccess('Saved successfully');
} catch (error) {
    showError(error.message || 'Something went wrong. Please try again.');
}
```

### Sync Error Feedback

Update `/frontend/src/lib/services/sync.svelte.ts`:

```typescript
class SyncManager {
    status = $state<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    error = $state<string>('');

    async create(item: T) {
        this.status = 'syncing';
        this.error = '';

        try {
            const result = await apiPost(`/api/data/${backendKey}`, mapper(item));
            this.status = 'synced';
            return result;
        } catch (e) {
            this.status = 'error';
            this.error = e.message;

            // Queue for retry
            this.queueForRetry('create', item);

            throw e;
        }
    }

    private async retryFailed() {
        // Retry all queued operations
    }
}
```

### Success Criteria

- [ ] No bare except clauses in backend
- [ ] All API errors have user-friendly messages
- [ ] Failed requests queued for automatic retry
- [ ] Errors logged with full context
- [ ] User can manually retry failed operations
- [ ] Sync status visible in UI (syncing/synced/error)
- [ ] Error notifications dismissable

### Testing

- [ ] Trigger auth error → user sees "Please log in again"
- [ ] Network error → user sees "Connection lost. Retrying..."
- [ ] Validation error → user sees specific field errors
- [ ] Server error → user sees "Something went wrong. We've been notified."
- [ ] Failed sync → auto-retries 3 times, then shows manual retry button

---

## Issue #9: Security hardening for production

**Title:** `P1: Security hardening - CORS, rate limiting, HTTPS, CSRF`

**Labels:** `P1-high`, `security`

**Estimated Time:** 12 hours

**Agent:** `security-scanner` (see `.claude/agents/security-scanner.md`)

**Dependencies:** Issue #6 (configuration management)

### Description

Implement security best practices before production launch: proper CORS, rate limiting, HTTPS enforcement, CSRF protection, and input validation.

### 1. Restrict CORS to Production Domain

Update `/backend/main.py`:

```python
from backend.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Not ["*"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

In Railway, set:
```bash
ALLOWED_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]
```

### 2. Add Rate Limiting

```bash
pip install slowapi
```

Add to `/backend/main.py`:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to auth endpoints
@router.post("/signup")
@limiter.limit("5/hour")  # Max 5 signups per hour per IP
async def signup(request: Request, ...):
    pass

@router.post("/token")
@limiter.limit("10/hour")  # Max 10 login attempts per hour
async def login(request: Request, ...):
    pass
```

### 3. Add Security Headers

```bash
pip install secure
```

Add middleware:

```python
from secure import Secure

secure_headers = Secure()

@app.middleware("http")
async def set_secure_headers(request: Request, call_next):
    response = await call_next(request)
    secure_headers.framework.fastapi(response)
    return response
```

This adds:
- `Strict-Transport-Security` (HTTPS only)
- `X-Frame-Options` (prevent clickjacking)
- `X-Content-Type-Options` (prevent MIME sniffing)
- `X-XSS-Protection`
- `Content-Security-Policy`

### 4. Enforce HTTPS in Production

Update `/backend/main.py`:

```python
if settings.ENVIRONMENT == "production":
    @app.middleware("http")
    async def enforce_https(request: Request, call_next):
        if request.url.scheme != "https":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url, status_code=301)
        return await call_next(request)
```

### 5. CSRF Protection

For cookie-based auth (if implemented):

```bash
pip install fastapi-csrf-protect
```

### 6. Input Validation

Ensure all endpoints use Pydantic models:

```python
# Before
@router.post("/endpoint")
async def endpoint(data: dict):
    # No validation

# After
from pydantic import BaseModel, validator

class EndpointRequest(BaseModel):
    field: str

    @validator('field')
    def validate_field(cls, v):
        if len(v) > 255:
            raise ValueError('Too long')
        return v

@router.post("/endpoint")
async def endpoint(data: EndpointRequest):
    # Validated
```

### 7. Secrets Management

Verify:
- [ ] No secrets in git history (`git log -S "password" --all`)
- [ ] All secrets in environment variables
- [ ] `.env` in `.gitignore`
- [ ] Different secrets for dev/staging/production

Create secret rotation documentation.

### 8. Audit Logging

Add audit log for sensitive operations:

```python
from backend.models.audit_log import AuditLog

@router.delete("/data/{id}")
async def delete_data(id: int, user: User = Depends(get_current_user)):
    AuditLog.create(
        user_id=user.id,
        action="delete",
        resource="data",
        resource_id=id,
        ip_address=request.client.host
    )
    # ... delete operation
```

### Success Criteria

- [ ] CORS restricted to production domain only
- [ ] Rate limiting on auth endpoints
- [ ] Security headers added
- [ ] HTTPS enforced in production
- [ ] All endpoints use Pydantic validation
- [ ] No secrets in code or git history
- [ ] Audit logging for sensitive operations
- [ ] OWASP Top 10 vulnerabilities addressed

### Testing

- [ ] Run security scan (OWASP ZAP or similar)
- [ ] Try SQL injection → blocked
- [ ] Try XSS → blocked
- [ ] Exceed rate limit → 429 response
- [ ] HTTP request in production → redirects to HTTPS
- [ ] Invalid input → validation error
- [ ] Audit log created for delete operations

---

## Issue #10: Frontend state cleanup and standardization

**Title:** `P1: Consolidate frontend state management with consistent patterns`

**Labels:** `P1-high`, `emotional-tone`

**Estimated Time:** 8 hours

**Agent:** `frontend-state-cleanup` (see `.claude/agents/frontend-state-cleanup.md`)

**Dependencies:** Issue #2 (backend models)

### Description

Consolidate state management across frontend to use consistent Svelte 5 patterns and eliminate duplicate state.

### Tasks

1. Standardize all stores to use SyncManager or SingletonSyncManager
2. Eliminate duplicate state across components
3. Ensure all stores use Svelte 5 runes ($state, $derived, $effect)
4. Create single source of truth for each data type

### Pattern

All data stores should follow this pattern:

```typescript
// /frontend/src/lib/stores/exampleStore.svelte.ts
import { registerSync } from '$lib/services/sync.svelte';

interface Example {
    id: number | string;
    name: string;
    // ...
}

const mapper = (item: Example) => {
    const payload = { ...item };
    delete payload.id; // Backend generates ID
    return payload;
};

export const exampleSync = registerSync<Example>(
    'examples',      // localStorage key
    'examples',      // backend endpoint
    mapper
);

// Usage in components:
// import { exampleSync } from '$lib/stores/exampleStore.svelte';
// const items = exampleSync.items;  // reactive
// await exampleSync.create({ name: 'Test' });
```

### Stores to Refactor

Ensure these use consistent patterns:

1. `/frontend/src/lib/stores/familyStore.svelte.ts`
2. `/frontend/src/lib/stores/insuranceStore.svelte.ts`
3. `/frontend/src/lib/stores/medicalStore.svelte.ts`
4. `/frontend/src/lib/stores/petStore.svelte.ts`
5. `/frontend/src/lib/stores/funeralStore.svelte.ts`
6. `/frontend/src/lib/stores/timeCapsuleStore.svelte.ts`
7. `/frontend/src/lib/stores/timelineStore.svelte.ts`

### Eliminate Duplicate State

Find and fix:
- Components keeping local state that duplicates store state
- Multiple stores managing the same data
- Prop drilling that should use stores

### Success Criteria

- [ ] All stores use SyncManager pattern
- [ ] No duplicate state across components
- [ ] All stores use Svelte 5 runes
- [ ] Single source of truth for each data type
- [ ] State management is predictable
- [ ] No prop drilling for global state

### Testing

- [ ] Update data in one component → reflects in all components
- [ ] No console warnings about reactivity
- [ ] State persists correctly across page navigation
- [ ] No race conditions or stale data

---

## Issues #11-18: Emotional Tone Improvements

(Issues for module headers, progress celebration, button language, empty states, context-aware messaging, grief-aware executor mode, overwhelm detection - see separate section below)

---

## Issue #11: Rewrite module headers with emotional context

**Title:** `P1: Rewrite all module headers to be emotionally appropriate`

**Labels:** `P1-high`, `emotional-tone`

**Estimated Time:** 6 hours

**Agent:** `module-header-rewrite` (see `.claude/agents/module-header-rewrite.md`)

**Dependencies:** None

### Description

Rewrite all module header descriptions to explain WHY each section matters and provide emotional support.

### Modules to Update

1. Documents module
2. Contacts module
3. Wishes module
4. Inventory module
5. Medical module
6. Pets module
7. Funeral module
8. Heirlooms module
9. Insurance module
10. Family Hub module
11. All other modules

### Pattern

**Before (procedural):**
```
<h1>Documents</h1>
<p>Upload and organize important documents</p>
```

**After (meaningful):**
```
<h1>The Documents Vault</h1>
<p>The most important gift you can give: making sure your loved ones can find everything they need. Every document you save here is one less thing they'll have to search for during an already difficult time.</p>
```

### Guidelines

- Explain WHY this matters (value to loved ones)
- Acknowledge emotional difficulty where appropriate
- Provide encouragement
- Use warm, supportive tone
- Connect to meaning, not just tasks

### Success Criteria

- [ ] All modules have supportive headers
- [ ] Each explains why it matters
- [ ] Emotional difficulty acknowledged where appropriate
- [ ] Encouragement provided
- [ ] No procedural/task-only language

---

---

## Issue #12: Add meaningful progress celebration

**Title:** `P1: Replace generic "Saved" with meaningful progress affirmations`

**Labels:** `P1-high`, `emotional-tone`

**Estimated Time:** 4 hours

**Agent:** `progress-celebration` (see `.claude/agents/progress-celebration.md`)

**Dependencies:** None

### Description

Replace generic success messages like "Saved" with meaningful affirmations that acknowledge the emotional courage behind the work.

### Current Problem

```svelte
<!-- Generic, task-focused -->
<div>✓ Saved</div>
<div>Success</div>
<div>Item added</div>
```

### New Approach

```svelte
<!-- Meaningful, courage-acknowledging -->
<div class="affirmation">
    <p>✨ You're giving your loved ones a gift</p>
    <p class="secondary">This information is safely saved</p>
</div>

<div class="affirmation">
    <p>💙 This took courage</p>
    <p class="secondary">Your family will be grateful you did this</p>
</div>

<div class="affirmation">
    <p>🌟 One more piece in place</p>
    <p class="secondary">You're making this easier for the people you love</p>
</div>
```

### Affirmation Library

Create `/frontend/src/lib/data/affirmations.ts`:

```typescript
export const affirmations = {
    general: [
        { primary: "You're giving your loved ones a gift", secondary: "This information is safely saved" },
        { primary: "This took courage", secondary: "Your family will be grateful you did this" },
        { primary: "One more piece in place", secondary: "You're making this easier for the people you love" },
    ],

    documents: [
        { primary: "This will save your family so much searching", secondary: "Document saved securely" },
        { primary: "You're preventing confusion when it matters most", secondary: "Document saved" },
    ],

    wishes: [
        { primary: "You're giving your voice to a moment when you can't speak", secondary: "Wishes saved" },
        { primary: "This is one of the most loving things you can do", secondary: "Your wishes are recorded" },
    ],

    contacts: [
        { primary: "You're creating a safety net", secondary: "Contact saved" },
        { primary: "Your family won't have to search for these numbers", secondary: "Contact information saved" },
    ],

    medical: [
        { primary: "This might save your life one day", secondary: "Medical information saved" },
        { primary: "You're giving crucial information to the people who'll need it", secondary: "Saved securely" },
    ],
};
```

### Component

Create `/frontend/src/lib/components/Affirmation.svelte`:

```svelte
<script lang="ts">
    import { affirmations } from '$lib/data/affirmations';
    import { fade } from 'svelte/transition';

    export let module: keyof typeof affirmations = 'general';
    export let show = false;

    let affirmation = affirmations[module][Math.floor(Math.random() * affirmations[module].length)];

    $effect(() => {
        if (show) {
            affirmation = affirmations[module][Math.floor(Math.random() * affirmations[module].length)];
            setTimeout(() => show = false, 4000);
        }
    });
</script>

{#if show}
    <div class="affirmation" transition:fade>
        <p class="primary">{affirmation.primary}</p>
        <p class="secondary">{affirmation.secondary}</p>
    </div>
{/if}

<style>
    .affirmation {
        background: var(--success-light);
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }

    .primary {
        font-weight: 500;
        color: var(--success-dark);
    }

    .secondary {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-top: 0.25rem;
    }
</style>
```

### Usage

```svelte
<script>
    import Affirmation from '$lib/components/Affirmation.svelte';

    let showAffirmation = false;

    async function saveData() {
        await api.save(data);
        showAffirmation = true;
    }
</script>

<Affirmation module="documents" bind:show={showAffirmation} />
```

### Success Criteria

- [ ] Affirmation library created with module-specific messages
- [ ] Component created for displaying affirmations
- [ ] All save operations show meaningful affirmations
- [ ] Messages rotate randomly within module
- [ ] Auto-dismiss after 4 seconds
- [ ] No generic "Saved" messages remain

### Testing

- [ ] Save document → see courage-acknowledging message
- [ ] Multiple saves → different messages shown
- [ ] Each module has appropriate affirmations
- [ ] Messages feel supportive, not condescending
- [ ] Auto-dismiss works

---

## Issue #13: Audit and replace button language

**Title:** `P1: Replace demanding button text with compassionate, invitational language`

**Labels:** `P1-high`, `emotional-tone`

**Estimated Time:** 4 hours

**Agent:** `button-language-audit` (see `.claude/agents/button-language-audit.md`)

**Dependencies:** None

### Description

Replace demanding imperative verbs on buttons with gentle, invitational language.

### Pattern

**Before (demanding):**
- "Submit"
- "Delete"
- "Add"
- "Complete"
- "Finish"

**After (invitational):**
- "Save This"
- "Remove" or "Let this go"
- "Add if you'd like"
- "Mark as done"
- "I'm done for now"

### Button Replacements

```svelte
<!-- Documents -->
<button>Upload document</button> → <button>Add a document</button>
<button>Delete</button> → <button>Remove this</button>

<!-- Wishes -->
<button>Submit wishes</button> → <button>Save my wishes</button>
<button>Add wish</button> → <button>Add another wish</button>

<!-- Contacts -->
<button>Add contact</button> → <button>Add someone</button>
<button>Delete contact</button> → <button>Remove this person</button>

<!-- Pulse -->
<button>Send pulse</button> → <button>Check in</button>
<button>Escalate</button> → <button>Send a stronger check-in</button>

<!-- General -->
<button>Complete</button> → <button>I'm done</button>
<button>Finish</button> → <button>All set</button>
<button>Cancel</button> → <button>Not right now</button>
<button>Close</button> → <button>Go back</button>
```

### Destructive Actions

For destructive actions, add confirmation and gentle language:

```svelte
<!-- Before -->
<button on:click={deleteItem}>Delete</button>

<!-- After -->
<button on:click={confirmRemove}>Remove this</button>

{#if showConfirm}
    <div class="confirm-dialog">
        <p>Are you sure you want to remove this?</p>
        <p class="secondary">You can always add it back later.</p>
        <button on:click={handleRemove}>Yes, remove it</button>
        <button on:click={() => showConfirm = false}>Keep it</button>
    </div>
{/if}
```

### Scan for Remaining Imperative Verbs

```bash
# Find buttons with demanding language
grep -r "<button" frontend/src --include="*.svelte" | grep -E "(Submit|Delete|Add|Complete|Finish|Upload|Remove|Send)"
```

### Success Criteria

- [ ] No "Submit" buttons
- [ ] No "Delete" (use "Remove" or "Let this go")
- [ ] Destructive actions have gentle confirmation
- [ ] All buttons feel invitational, not demanding
- [ ] Cancel/close buttons offer gentle alternatives

### Testing

- [ ] Review all buttons in each module
- [ ] No demanding language remains
- [ ] Destructive actions confirmed gently
- [ ] Language feels respectful of difficulty

---

## Issue #14: Redesign empty states with encouragement

**Title:** `P1: Replace "No items yet" with encouraging, meaningful empty states`

**Labels:** `P1-high`, `emotional-tone`

**Estimated Time:** 4 hours

**Agent:** `empty-state-compassion` (see `.claude/agents/empty-state-compassion.md`)

**Dependencies:** None

### Description

Replace generic "No items yet" with encouraging empty states that explain value and invite action without pressure.

### Current Problem

```svelte
<!-- Generic, homework-like -->
{#if items.length === 0}
    <p>No items yet. Click "Add" to get started.</p>
{/if}
```

### New Approach

```svelte
<!-- Meaningful, encouraging -->
{#if items.length === 0}
    <div class="empty-state">
        <h3>This is where you'll keep track of your important contacts</h3>
        <p>Having this information in one place means your family won't have to search for phone numbers and email addresses when they need them most.</p>
        <p class="encouragement">You don't have to do this all at once. Start with whoever comes to mind.</p>
        <button>Add someone</button>
    </div>
{/if}
```

### Empty States by Module

**Documents:**
```svelte
<div class="empty-state">
    <h3>This is your document vault</h3>
    <p>Store copies or information about important documents: wills, insurance policies, property deeds, account numbers.</p>
    <p class="encouragement">Start with whatever feels easiest. You can always come back and add more later.</p>
    <button>Add a document</button>
</div>
```

**Wishes:**
```svelte
<div class="empty-state">
    <h3>Your wishes matter</h3>
    <p>This is where you can record how you want things handled - medical decisions, funeral preferences, or anything else important to you.</p>
    <p class="encouragement">These conversations aren't easy. Take your time.</p>
    <button>Add a wish</button>
</div>
```

**Contacts:**
```svelte
<div class="empty-state">
    <h3>Build your network of support</h3>
    <p>Family, friends, lawyers, doctors, accountants - anyone your loved ones might need to reach. Having these contacts together saves hours of searching.</p>
    <p class="encouragement">You don't need everyone at once. Add who you can think of now.</p>
    <button>Add someone</button>
</div>
```

**Inventory:**
```svelte
<div class="empty-state">
    <h3>What matters to you?</h3>
    <p>This isn't about making a list. It's about making sure the things you care about end up with the people you want to have them.</p>
    <p class="encouragement">Don't worry about being complete. Just start with what comes to mind.</p>
    <button>Add an item</button>
</div>
```

**Medical:**
```svelte
<div class="empty-state">
    <h3>Your medical information hub</h3>
    <p>Medications, allergies, conditions, advance directives - all the medical information that might be crucial in an emergency.</p>
    <p class="encouragement">This information could save your life. And having it recorded means one less thing to remember in a crisis.</p>
    <button>Add medical info</button>
</div>
```

### Component

Create `/frontend/src/lib/components/EmptyState.svelte`:

```svelte
<script lang="ts">
    export let title: string;
    export let description: string;
    export let encouragement: string;
    export let actionLabel: string;
    export let onAction: () => void;
</script>

<div class="empty-state">
    <h3>{title}</h3>
    <p class="description">{description}</p>
    <p class="encouragement">{encouragement}</p>
    <button on:click={onAction}>{actionLabel}</button>
</div>

<style>
    .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        max-width: 600px;
        margin: 2rem auto;
    }

    h3 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        color: var(--text-primary);
    }

    .description {
        font-size: 1rem;
        line-height: 1.6;
        color: var(--text-secondary);
        margin-bottom: 1rem;
    }

    .encouragement {
        font-style: italic;
        color: var(--primary);
        margin-bottom: 1.5rem;
    }

    button {
        background: var(--primary);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-size: 1rem;
    }
</style>
```

### Success Criteria

- [ ] All modules have meaningful empty states
- [ ] Each explains WHY the section matters
- [ ] Encouragement provided (no pressure)
- [ ] Action button uses invitational language
- [ ] No "No items yet" messages remain

### Testing

- [ ] View each module with no data
- [ ] Empty state is encouraging, not guilt-inducing
- [ ] Value proposition is clear
- [ ] Language feels supportive

---

## Issue #15: Context-aware messaging based on user role

**Title:** `P1: Adapt language based on user role (planner vs executor vs bereaved)`

**Labels:** `P1-high`, `emotional-tone`

**Estimated Time:** 8 hours

**Agent:** `context-aware-messaging` (see `.claude/agents/context-aware-messaging.md`)

**Dependencies:** None

### Description

Implement context-aware messaging that adapts language based on user role: someone planning their own estate, an executor handling affairs, or a bereaved family member.

### User Roles

```typescript
// /frontend/src/lib/types/user.ts
export type UserRole = 'planner' | 'executor' | 'bereaved' | 'guardian';

export interface UserContext {
    role: UserRole;
    relationToDeceased?: string;  // For executors/bereaved
    emotionalState?: 'stable' | 'overwhelmed' | 'grieving';
}
```

### Role Detection

Add to user model:

```typescript
// /frontend/src/lib/stores/auth.ts
interface User {
    id: number;
    email: string;
    role: UserRole;
    context: UserContext;
}
```

During onboarding, ask:

```svelte
<div class="role-selection">
    <h2>How can Continuum help you?</h2>

    <button on:click={() => selectRole('planner')}>
        <h3>I'm planning ahead</h3>
        <p>I want to organize my own information</p>
    </button>

    <button on:click={() => selectRole('executor')}>
        <h3>I'm handling someone's estate</h3>
        <p>I'm an executor or representative</p>
    </button>

    <button on:click={() => selectRole('bereaved')}>
        <h3>I've lost someone</h3>
        <p>I'm looking for information about a loved one</p>
    </button>
</div>
```

### Messaging Component

Create `/frontend/src/lib/components/ContextualMessage.svelte`:

```svelte
<script lang="ts">
    import { auth } from '$lib/stores/auth';

    export let messages: {
        planner: string;
        executor: string;
        bereaved: string;
    };

    $: user = auth.user;
    $: role = user?.role || 'planner';
    $: message = messages[role];
</script>

<p class="contextual-message">{message}</p>
```

### Usage Examples

**Dashboard Welcome:**

```svelte
<ContextualMessage messages={{
    planner: "Welcome back. You're giving your loved ones a gift by doing this work.",
    executor: "We're here to help you handle these affairs with as little stress as possible.",
    bereaved: "We're so sorry for your loss. Take your time - there's no rush."
}} />
```

**Module Headers:**

```svelte
<!-- Documents module -->
<ContextualMessage messages={{
    planner: "Store your important documents so your family can find them when they need to.",
    executor: "This is where the account holder stored important documents you might need.",
    bereaved: "Your loved one may have stored important documents here that you'll need."
}} />
```

**Progress Messages:**

```svelte
<ContextualMessage messages={{
    planner: "You're making this easier for the people you love.",
    executor: "One more task complete. You're doing great.",
    bereaved: "Take your time. There's no rush with any of this."
}} />
```

### Language Guidelines by Role

**Planner (someone planning ahead):**
- Use "you" and "your family"
- Emphasize gift they're giving
- Encourage without pressure
- Future-focused

**Executor (handling affairs):**
- Use "task" language
- Acknowledge difficulty
- Provide clear next steps
- Practical tone with support

**Bereaved (recently lost someone):**
- Slowest pace
- Most gentle language
- No task pressure
- Acknowledge grief explicitly
- Offer to skip/delay anything

### Success Criteria

- [ ] User role captured during onboarding
- [ ] All major UI text adapts to role
- [ ] Language appropriate for each context
- [ ] Easy to understand current user role
- [ ] User can change role if needed

### Testing

- [ ] Sign up as planner → see planning language
- [ ] Sign up as executor → see task-focused language
- [ ] Sign up as bereaved → see grief-aware language
- [ ] Switch roles → language updates throughout app

---

## Issue #16: Create grief-aware executor mode

**Title:** `P1: Build specialized "Executor Mode" for bereaved users handling affairs`

**Labels:** `P1-high`, `emotional-tone`

**Estimated Time:** 12 hours

**Agent:** `grief-aware-executor` (see `.claude/agents/grief-aware-executor.md`)

**Dependencies:** Issue #15 (context-aware messaging)

### Description

Create a specialized mode for executors and bereaved family members with simplified workflows, grief-aware language, and bereavement support.

### Executor Mode Features

1. **Simplified View** - Hide non-essential features
2. **Grief-Aware Language** - Different tone throughout
3. **Pause/Resume** - Easy to step away and come back
4. **Support Resources** - Links to grief counseling
5. **Time Pressure Relief** - No urgency language

### Activate Executor Mode

During onboarding or anytime:

```svelte
<!-- /frontend/src/routes/dashboard/+page.svelte -->
{#if user.role === 'executor' || user.role === 'bereaved'}
    <div class="executor-mode-banner">
        <p>Executor Mode is active</p>
        <p class="secondary">This interface is simplified to help you focus on what matters most.</p>
        <button on:click={toggleMode}>Switch to full interface</button>
    </div>
{/if}
```

### Language Changes in Executor Mode

**Dashboard:**
```svelte
<!-- Planner Mode -->
<h1>Your Dashboard</h1>
<p>Here's what you're working on</p>

<!-- Executor Mode -->
<h1>Estate Administration</h1>
<p>Take your time with these tasks. There's no rush.</p>
```

**Task Lists:**
```svelte
<!-- Planner Mode -->
<h2>Your To-Do List</h2>

<!-- Executor Mode -->
<h2>Things to handle (when you're ready)</h2>
```

**Module Access:**
```svelte
<!-- Planner Mode: All modules visible -->

<!-- Executor Mode: Simplified to essentials -->
- Documents (view only)
- Contacts (to notify)
- Funeral preferences (if recorded)
- Financial accounts (to close)

<!-- Hidden in executor mode -->
- Inventory (not relevant now)
- Wishes (already happened)
- Pulse (not applicable)
```

### Pause/Resume Feature

```svelte
<!-- Prominent pause button -->
<button class="pause-button" on:click={pauseSession}>
    <span>Take a break</span>
    <p class="secondary">Come back whenever you're ready</p>
</button>

{#if paused}
    <div class="paused-state">
        <h2>You're taking a break</h2>
        <p>Everything is saved. Come back when you're ready.</p>
        <button on:click={resumeSession}>Resume</button>
    </div>
{/if}
```

### Support Resources

```svelte
<!-- Always visible in executor mode -->
<div class="support-panel">
    <h3>You're not alone</h3>
    <ul>
        <li><a href="/resources/grief-support">Grief support resources</a></li>
        <li><a href="/resources/executor-guide">Executor's guide</a></li>
        <li><a href="/resources/common-tasks">Common tasks checklist</a></li>
        <li><a href="tel:988">Crisis support: 988</a></li>
    </ul>
</div>
```

### Simplified Workflow

Create `/frontend/src/routes/executor/+page.svelte`:

```svelte
<script lang="ts">
    const essentialTasks = [
        {
            title: "Notify contacts",
            description: "Let people know what happened",
            module: "contacts",
            optional: false
        },
        {
            title: "Review documents",
            description: "Find will, insurance, accounts",
            module: "documents",
            optional: false
        },
        {
            title: "Funeral arrangements",
            description: "If recorded here",
            module: "funeral",
            optional: true
        }
    ];
</script>

<div class="executor-dashboard">
    <h1>Essential Tasks</h1>
    <p class="support">Take these one at a time. There's no right order.</p>

    {#each essentialTasks as task}
        <div class="task-card">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            {#if task.optional}
                <span class="optional-badge">Optional</span>
            {/if}
            <a href="/modules/{task.module}">View details</a>
        </div>
    {/each}

    <div class="support-reminder">
        <p>Need help? <a href="/resources/grief-support">Support resources</a></p>
    </div>
</div>
```

### Success Criteria

- [ ] Executor mode can be activated
- [ ] Language changes throughout app when active
- [ ] Non-essential features hidden
- [ ] Pause/resume works correctly
- [ ] Support resources always visible
- [ ] No urgency or time pressure language
- [ ] Easy to switch back to full mode

### Testing

- [ ] Activate executor mode → interface simplifies
- [ ] Language is grief-aware throughout
- [ ] Pause session → can resume later
- [ ] Support resources accessible
- [ ] No task pressure or urgency

---

## Issue #17: Implement overwhelm detection and intervention

**Title:** `P1: Detect when users are overwhelmed and offer support/breaks`

**Labels:** `P1-high`, `emotional-tone`

**Estimated Time:** 8 hours

**Agent:** `overwhelm-detection` (see `.claude/agents/overwhelm-detection.md`)

**Dependencies:** None

### Description

Detect behavioral signals of overwhelm and proactively offer breaks, simplified pathways, or support resources.

### Overwhelm Signals

Track these behaviors:

```typescript
// /frontend/src/lib/services/overwhelmDetection.ts
interface OverwhelmSignals {
    // Behavioral signals
    rapidPageSwitching: boolean;      // 5+ pages in 2 minutes
    backButtonSpam: boolean;          // Back button 3+ times quickly
    inactivityAfterError: boolean;    // 2+ min idle after error
    abandonedForms: number;           // Started but didn't save

    // Session signals
    longSession: boolean;             // 30+ minutes continuous
    multipleDeleteActions: boolean;   // Deleted 3+ items

    // Timing
    lastBreakOffered: Date;
    breaksDeclined: number;
}

class OverwhelmDetector {
    private signals = $state<OverwhelmSignals>({
        rapidPageSwitching: false,
        backButtonSpam: false,
        inactivityAfterError: false,
        abandonedForms: 0,
        longSession: false,
        multipleDeleteActions: false,
        lastBreakOffered: new Date(),
        breaksDeclined: 0
    });

    checkForOverwhelm(): boolean {
        // If 2+ signals are true, user might be overwhelmed
        const signalCount = Object.values(this.signals)
            .filter(v => typeof v === 'boolean' && v === true)
            .length;

        return signalCount >= 2;
    }

    offerBreak() {
        // Show break offer modal
    }
}
```

### Break Offer Modal

```svelte
<!-- /frontend/src/lib/components/BreakOffer.svelte -->
<script lang="ts">
    import { fade } from 'svelte/transition';

    export let show = false;
    export let onTakeBreak: () => void;
    export let onContinue: () => void;
</script>

{#if show}
    <div class="modal-overlay" transition:fade>
        <div class="break-modal">
            <h2>You've been at this for a while</h2>
            <p>This work is emotionally heavy. It's completely normal to need breaks.</p>

            <div class="options">
                <button on:click={onTakeBreak} class="primary">
                    Take a break
                </button>

                <button on:click={onContinue} class="secondary">
                    Keep going for now
                </button>
            </div>

            <p class="reassurance">Everything is saved. You can come back anytime.</p>
        </div>
    </div>
{/if}
```

### Simplified Pathway Offer

When detecting overwhelm on complex forms:

```svelte
<div class="simplification-offer">
    <p>This section has a lot of fields. Want to just capture the basics for now?</p>

    <button on:click={switchToSimplified}>
        Show me the essentials
    </button>

    <button on:click={continueDetailed}>
        I'll fill it all out
    </button>
</div>
```

### Support Resource Offer

```svelte
<div class="support-offer">
    <h3>Need some support?</h3>
    <p>Death planning brings up a lot of emotions. It might help to talk to someone.</p>

    <ul>
        <li><a href="/resources/therapist-directory">Find a therapist</a></li>
        <li><a href="/resources/support-groups">Support groups</a></li>
        <li><a href="tel:988">Crisis support: 988</a></li>
    </ul>

    <button on:click={dismissOffer}>Not right now</button>
</div>
```

### Integration

Add to `/frontend/src/routes/+layout.svelte`:

```svelte
<script lang="ts">
    import { OverwhelmDetector } from '$lib/services/overwhelmDetection';
    import BreakOffer from '$lib/components/BreakOffer.svelte';

    const detector = new OverwhelmDetector();
    let showBreakOffer = false;

    // Check every 2 minutes
    setInterval(() => {
        if (detector.checkForOverwhelm()) {
            showBreakOffer = true;
        }
    }, 120000);

    function takeBreak() {
        // Save current state
        // Show break screen
        showBreakOffer = false;
    }

    function continueWorking() {
        detector.signals.breaksDeclined++;
        showBreakOffer = false;
    }
</script>

<BreakOffer
    bind:show={showBreakOffer}
    onTakeBreak={takeBreak}
    onContinue={continueWorking}
/>
```

### Success Criteria

- [ ] Overwhelm signals tracked
- [ ] Break offers appear when appropriate
- [ ] Simplified pathway offered on complex forms
- [ ] Support resources offered
- [ ] User can decline without guilt
- [ ] Break state saved for resume
- [ ] Not too frequent (max 1 offer per 15 min)

### Testing

- [ ] Rapidly switch pages → break offered
- [ ] Long session (30+ min) → break offered
- [ ] Multiple errors → support offered
- [ ] Decline break → doesn't nag
- [ ] Accept break → can resume easily

---

## Issue #18: Replace print statements with proper logging

**Title:** `P1: Implement structured logging with proper levels and rotation`

**Labels:** `P1-high`, `monitoring`

**Estimated Time:** 8 hours

**Agent:** `logging-system` (see `.claude/agents/logging-system.md`)

**Dependencies:** None

### Description

Replace all `print()` statements with proper structured logging using Python's logging module with appropriate levels, formatting, and log rotation.

### Backend Logging Setup

Create `/backend/utils/logger.py`:

```python
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler

def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """
    Create a configured logger instance

    Args:
        name: Logger name (usually __name__)
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)

    # File handler with rotation
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    file_handler = RotatingFileHandler(
        log_dir / "continuum.log",
        maxBytes=10_000_000,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger
```

### Usage

Replace all `print()` with appropriate log levels:

```python
# Before
print("User logged in")
print(f"Error: {e}")
print(f"Debug info: {data}")

# After
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)

logger.info("User logged in", extra={"user_id": user.id})
logger.error(f"Authentication failed: {e}", exc_info=True)
logger.debug(f"Request data: {data}")
```

### Log Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARNING**: Warning messages (deprecated features, potential issues)
- **ERROR**: Error messages (recoverable)
- **CRITICAL**: Critical errors (system failure)

### Structured Logging

For important events, use structured logging:

```python
logger.info(
    "Data synced to backend",
    extra={
        "user_id": user.id,
        "endpoint": endpoint,
        "item_count": len(items),
        "duration_ms": duration
    }
)
```

### Frontend Logging

Create `/frontend/src/lib/utils/logger.ts`:

```typescript
enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

class Logger {
    private level: LogLevel;

    constructor(level: LogLevel = LogLevel.INFO) {
        this.level = level;
    }

    debug(message: string, context?: any) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[DEBUG] ${message}`, context);
        }
    }

    info(message: string, context?: any) {
        if (this.level <= LogLevel.INFO) {
            console.info(`[INFO] ${message}`, context);
        }
    }

    warn(message: string, context?: any) {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[WARN] ${message}`, context);
        }
    }

    error(message: string, error?: Error, context?: any) {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, error, context);
        }
    }
}

export const logger = new Logger(
    import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO
);
```

Usage:

```typescript
import { logger } from '$lib/utils/logger';

// Replace console.log
logger.debug('Component mounted', { componentName: 'Dashboard' });
logger.info('Data synced', { count: items.length });
logger.error('Sync failed', error, { endpoint });
```

### Files to Update

Find and replace:
```bash
# Backend
grep -r "print(" backend/ --include="*.py" | wc -l

# Frontend
grep -r "console.log" frontend/src --include="*.ts" --include="*.svelte" | wc -l
```

### Log Rotation

Logs rotate automatically:
- Max size: 10MB per file
- Keep 5 backup files
- Total max: 50MB of logs

### Sensitive Data

Never log:
- Passwords
- JWT tokens
- API keys
- Full credit card numbers
- SSN or similar

```python
# Bad
logger.info(f"User logged in with password: {password}")

# Good
logger.info("User logged in", extra={"user_id": user.id})
```

### Success Criteria

- [ ] Logger utility created for backend
- [ ] Logger utility created for frontend
- [ ] All print() replaced with logger calls
- [ ] All console.log replaced with logger calls
- [ ] Appropriate log levels used
- [ ] Structured logging for important events
- [ ] Log rotation configured
- [ ] No sensitive data logged

### Testing

- [ ] Run backend → logs appear in console and file
- [ ] Trigger error → logged with stack trace
- [ ] Check logs/ directory → rotation working
- [ ] Production mode → only INFO and above logged
- [ ] No passwords or secrets in logs

---

**Total Phase 2:** 13 issues, 94 hours

**Next:** See `PHASE_3_P2_TESTING.md` for testing and quality issues
