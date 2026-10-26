# Phase 1 - Critical Infrastructure (P0)
**Priority:** P0 - Critical (Start Immediately)
**Total Issues:** 5
**Total Time:** 44 hours

---

## Issue #1: Add authentication guards to all protected routes

**Title:** `P0: Add authentication guards to all protected routes`

**Labels:** `P0-critical`, `authentication`, `security`

**Estimated Time:** 8 hours

**Agent:** `authentication-architect` (see `.claude/agents/authentication-architect.md`)

**Skill:** `fix-auth` (see `.claude/skills/fix-auth.md`)

**Dependencies:** None (can start immediately)

### Description

Add route guards to all protected pages that redirect unauthenticated users to the login page. Currently, users can access protected routes without authentication, which is a critical security issue.

### Files to Create

1. `/frontend/src/routes/dashboard/+page.ts`
2. `/frontend/src/routes/modules/+layout.ts` (protects ALL module routes)
3. `/frontend/src/routes/settings/+page.ts`
4. `/frontend/src/routes/binder/+page.ts`

### Implementation Pattern

Each route guard should follow this pattern:

```typescript
import { auth } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export async function load() {
    const authState = get(auth);
    if (!authState.user) {
        throw redirect(307, '/login');
    }
    return {};
}
```

### Files to Modify

Update these components to show loading/error states:

1. `/frontend/src/routes/+layout.svelte` - Add auth state checks
2. All protected pages - Add loading states during auth init

**Loading State Pattern:**
```svelte
{#if $auth.loading}
    <div>Authenticating...</div>
{:else if !$auth.user}
    <div>Please login</div>
{:else}
    <!-- Protected content -->
{/if}
```

### Success Criteria

- [ ] Protected routes redirect unauthenticated users to /login
- [ ] Token persists across page refreshes
- [ ] Loading state shown during auth initialization
- [ ] User-friendly error messages displayed
- [ ] 401 responses trigger automatic logout
- [ ] All module routes protected via /modules/+layout.ts
- [ ] Dashboard, settings, binder routes protected

### Testing Checklist

- [ ] Navigate to /dashboard without login → redirects to /login
- [ ] Login → automatically redirected to original destination
- [ ] Refresh protected page → stays on page (token persists)
- [ ] Logout → redirects to login
- [ ] Token expires → automatic logout and redirect

### Reference Documentation

- `AUTHENTICATION_IMPLEMENTATION.md` - Complete auth guide
- `REMAINING_AUTH_WORK.md` - Specific guard implementation details
- `.claude/agents/authentication-architect.md` - Agent instructions
- `.claude/skills/fix-auth.md` - Skill workflow

### Getting Started

```bash
# Create feature branch
git checkout -b fix/auth-guards

# Use authentication-architect agent
# The agent will:
# 1. Create all route guard files
# 2. Add loading states
# 3. Test all protected routes
# 4. Commit changes

# After completion, create PR and link to this issue
```

---

## Issue #2: Create missing backend models for complete data persistence

**Title:** `P0: Create missing backend models (family, insurance, medical, pets)`

**Labels:** `P0-critical`, `data-persistence`

**Estimated Time:** 16 hours

**Agent:** `data-persistence-unifier` (see `.claude/agents/data-persistence-unifier.md`)

**Skill:** `fix-data` (see `.claude/skills/fix-data.md`)

**Dependencies:** None (can start immediately)

### Description

Create backend database models and CRUD endpoints for modules that currently only store data in localStorage. This is critical for data durability and multi-device access.

### Backend Models to Create

1. `/backend/models/family_models.py` - Family member schemas
2. `/backend/models/insurance_models.py` - Insurance policy schemas
3. `/backend/models/medical_models.py` - Medical directive schemas
4. `/backend/models/pet_models.py` - Pet information schemas
5. `/backend/models/funeral_models.py` - Funeral plan schemas (if needed)

### Backend Endpoints to Add

Extend `/backend/routers/estate_data.py`:

1. Add new models to `MODEL_MAP` dictionary
2. Create database migrations for new tables
3. Test CRUD operations for each model

**Pattern:**
```python
from backend.models.family_models import FamilyMember

MODEL_MAP = {
    # ... existing models ...
    "family_members": FamilyMember,
    "insurance_policies": InsurancePolicy,
    "medical_directives": MedicalDirective,
    "pets": Pet,
}
```

### Frontend Stores to Refactor

Convert these stores to use SyncManager:

1. `/frontend/src/lib/stores/familyStore.ts` → `familyStore.svelte.ts`
2. `/frontend/src/lib/stores/insuranceStore.ts` → `insuranceStore.svelte.ts`
3. `/frontend/src/lib/stores/medicalStore.ts` → `medicalStore.svelte.ts`
4. `/frontend/src/lib/stores/petStore.ts` → `petStore.svelte.ts`
5. `/frontend/src/lib/stores/funeralStore.ts` → `funeralStore.svelte.ts`

**Pattern:**
```typescript
import { registerSync } from '$lib/services/sync.svelte';

interface FamilyMember {
    id: number | string;
    name: string;
    relationship: string;
    // ... other fields
}

export const familySync = registerSync<FamilyMember>(
    'family_members',    // localStorage key
    'family_members',    // backend endpoint
    (item) => ({ ...item }) // mapper function
);
```

### Implement SyncManager.update() Method

Add missing `update()` method in `/frontend/src/lib/services/sync.svelte.ts`:

```typescript
async update(id: number | string, updates: Partial<T>) {
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');

    const updated = { ...item, ...updates };
    await apiPut(`/api/data/${backendKey}/${id}`, mapper(updated));

    // Update local state
    const index = items.findIndex(i => i.id === id);
    items[index] = updated;
    saveLocal();
}
```

### Success Criteria

- [ ] All backend models created with proper schemas
- [ ] All models added to MODEL_MAP in estate_data.py
- [ ] Database migrations run successfully
- [ ] All frontend stores use SyncManager pattern
- [ ] SyncManager has full CRUD (create, read, update, delete)
- [ ] Data persists to PostgreSQL database
- [ ] Data survives browser cache clear
- [ ] Data accessible across devices

### Testing Checklist

- [ ] Create family member → saved to database
- [ ] Edit family member → updates in database
- [ ] Delete family member → removed from database
- [ ] Clear browser cache → data still available after login
- [ ] Login from different device → data syncs correctly
- [ ] Repeat for insurance, medical, pets

### Reference Documentation

- `DATA_PERSISTENCE_STATUS.md` - Current persistence status
- `COMPREHENSIVE_TASK_LIST.md` - Section 1.2
- `.claude/agents/data-persistence-unifier.md` - Agent instructions
- `.claude/skills/fix-data.md` - Skill workflow

### Getting Started

```bash
# Create feature branch
git checkout -b fix/complete-data-persistence

# Use data-persistence-unifier agent
# The agent will:
# 1. Create all backend models
# 2. Add to MODEL_MAP
# 3. Create migrations
# 4. Refactor frontend stores
# 5. Test all CRUD operations
# 6. Commit changes

# After completion, create PR and link to this issue
```

---

## Issue #3: Build media upload infrastructure

**Title:** `P0: Build media upload infrastructure to replace IndexedDB`

**Labels:** `P0-critical`, `media`, `data-persistence`

**Estimated Time:** 12 hours

**Agent:** `media-upload-infrastructure` (see `.claude/agents/media-upload-infrastructure.md`)

**Dependencies:** None (can start immediately)

### Description

Build backend media upload/download system to replace IndexedDB-only storage. Currently, media files (photos, documents) are only stored in browser IndexedDB and lost when cache is cleared.

### Backend Implementation

#### 1. Create Media Router

Create `/backend/routers/media.py`:

```python
from fastapi import APIRouter, UploadFile, File, Depends
from backend.security import get_current_user

router = APIRouter(prefix="/api/media", tags=["media"])

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    module: str = None,
    user: User = Depends(get_current_user)
):
    # Save file to storage
    # Create metadata record
    # Return media_id and URL
    pass

@router.get("/{media_id}")
async def get_media(media_id: int, user: User = Depends(get_current_user)):
    # Verify ownership
    # Return file
    pass

@router.delete("/{media_id}")
async def delete_media(media_id: int, user: User = Depends(get_current_user)):
    # Verify ownership
    # Delete file and metadata
    pass
```

#### 2. Create Media Model

Create `/backend/models/media.py`:

```python
from sqlmodel import SQLModel, Field

class Media(SQLModel, table=True):
    __tablename__ = "media"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    filename: str
    original_filename: str
    mime_type: str
    size_bytes: int
    module: str  # "heirlooms", "property", "visual_memory"
    storage_path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

#### 3. Storage Adapter

Create `/backend/storage/local.py` for development:

```python
class LocalStorage:
    def __init__(self, base_path="./uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)

    def save(self, file_data: bytes, filename: str) -> str:
        path = self.base_path / filename
        path.write_bytes(file_data)
        return str(path)

    def get(self, path: str) -> bytes:
        return Path(path).read_bytes()

    def delete(self, path: str):
        Path(path).unlink()
```

For production, create `/backend/storage/s3.py` (optional).

### Frontend Implementation

#### 1. Create MediaUploader Component

Create `/frontend/src/lib/components/MediaUploader.svelte`:

```svelte
<script lang="ts">
    import { apiPost } from '$lib/api/client';

    let uploading = false;
    let progress = 0;
    let error = '';

    async function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        uploading = true;
        error = '';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', module);

        try {
            const result = await apiPost('/api/media/upload', formData, {
                onUploadProgress: (e) => {
                    progress = (e.loaded / e.total) * 100;
                }
            });

            onUpload(result);
        } catch (e) {
            error = e.message;
        } finally {
            uploading = false;
        }
    }
</script>

<div class="uploader">
    <input type="file" on:change={handleFileSelect} accept="image/*,application/pdf" />

    {#if uploading}
        <progress value={progress} max="100">{progress}%</progress>
    {/if}

    {#if error}
        <div class="error">{error}</div>
    {/if}
</div>
```

#### 2. Update Stores to Use Backend Media

Update these stores:

1. `/frontend/src/lib/stores/heirloomStore.svelte.ts`
2. `/frontend/src/lib/stores/visualMemoryStore.ts`
3. `/frontend/src/lib/stores/propertyStore.ts`

**Pattern:**
```typescript
// Instead of saving to IndexedDB:
const blob = await file.arrayBuffer();
await db.media.add({ blob, filename });

// Save to backend:
const formData = new FormData();
formData.append('file', file);
const result = await apiPost('/api/media/upload', formData);
const media_id = result.id;
```

#### 3. Migration Script

Create `/frontend/src/lib/services/mediaMigration.ts`:

```typescript
export async function migrateIndexedDBMedia() {
    // 1. Get all media from IndexedDB
    // 2. Upload each to backend
    // 3. Update references in stores
    // 4. Delete from IndexedDB
}
```

### Success Criteria

- [ ] Backend media upload endpoint works
- [ ] Backend media download endpoint works
- [ ] Files saved to local storage (dev) or S3 (prod)
- [ ] Media metadata saved to database
- [ ] Frontend MediaUploader component works
- [ ] Upload progress shown to users
- [ ] Error handling works gracefully
- [ ] All stores use backend media instead of IndexedDB
- [ ] Migration script successfully moves existing media
- [ ] Media accessible across devices
- [ ] Lazy loading implemented for images

### Testing Checklist

- [ ] Upload photo in Heirlooms → saved to backend
- [ ] View photo → loads from backend
- [ ] Delete photo → removed from backend
- [ ] Clear browser cache → photo still accessible
- [ ] Login from different device → photo accessible
- [ ] Upload large file → progress bar works
- [ ] Upload invalid file type → error message shown
- [ ] Network error during upload → user notified

### Reference Documentation

- `MEDIA_UPLOAD_GUIDE.md` (if exists)
- `COMPREHENSIVE_TASK_LIST.md` - Section 1.3
- `.claude/agents/media-upload-infrastructure.md` - Agent instructions

### Getting Started

```bash
# Create feature branch
git checkout -b fix/media-upload-infrastructure

# Use media-upload-infrastructure agent
# The agent will:
# 1. Create backend media router and model
# 2. Implement storage adapter
# 3. Create MediaUploader component
# 4. Update stores to use backend
# 5. Create migration script
# 6. Test all functionality
# 7. Commit changes

# After completion, create PR and link to this issue
```

---

## Issue #4: Configure email service for production

**Title:** `P0: Configure Postmark for production email delivery`

**Labels:** `P0-critical`, `email`, `deployment`

**Estimated Time:** 4 hours

**Agent:** `email-integration` (see `.claude/agents/email-integration.md`)

**Dependencies:** None (can start in parallel)

### Description

Configure Postmark for production email delivery. Currently, the email service is built but uses local file storage in development. Production needs real email delivery.

### Tasks

#### 1. Set Up Postmark Account

1. Sign up at https://postmarkapp.com/
2. Verify sender domain
3. Get API key
4. Add to Railway environment variables

#### 2. Configure Railway Environment Variables

Add these to Railway project:

```bash
EMAIL_PROVIDER=postmark
POSTMARK_API_KEY=your_api_key_here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Continuum
```

#### 3. Test Email Delivery

Run backend test script:

```bash
cd backend
python test_email.py
```

Verify:
- Welcome email sends successfully
- Magic link email sends successfully
- Pulse escalation emails send successfully
- Email logs saved to database

#### 4. Configure Email Templates

Verify all 7 templates work in production:

1. `welcome.html` - Welcome email
2. `magic_link.html` - Magic link authentication
3. `pulse_escalation_tier1.html` - Tier 1 alert
4. `pulse_escalation_tier2.html` - Tier 2 alert
5. `pulse_escalation_tier3.html` - Tier 3 alert
6. `pulse_escalation_tier4.html` - Tier 4 alert
7. `base.html` - Email layout

#### 5. Add Email Queue (Optional but Recommended)

For reliability, implement background job queue:

```bash
pip install celery redis
```

Create `/backend/tasks/email_tasks.py`:

```python
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task(retry=3, retry_delay=60)
def send_email_async(to: str, template: str, context: dict):
    email_service.send(to, template, context)
```

### Success Criteria

- [ ] Postmark account created and domain verified
- [ ] API key added to Railway environment
- [ ] Test emails send successfully in production
- [ ] All 7 email templates work
- [ ] Email logs saved to database
- [ ] Failed emails logged with error messages
- [ ] Email queue (optional) implemented and tested

### Testing Checklist

- [ ] Signup → welcome email received
- [ ] Forgot password → magic link received
- [ ] Pulse check-in missed → tier 1 email received
- [ ] Email delivered within 30 seconds
- [ ] Email logs visible in admin panel
- [ ] Test failed delivery → error logged

### Reference Documentation

- `EMAIL_INTEGRATION_GUIDE.md` - Setup instructions
- `EMAIL_ARCHITECTURE.md` - System architecture
- `.claude/agents/email-integration.md` - Agent instructions

### Getting Started

```bash
# This task doesn't require code changes if email service already built
# Mainly configuration and testing

# Use email-integration agent to:
# 1. Verify email service code is complete
# 2. Set up Postmark account
# 3. Configure Railway environment
# 4. Test all email templates
# 5. Document any issues

# Update IMPLEMENTATION_COMPLETE.md with production status
```

---

## Issue #5: Fix AI empathy in system prompt [CRITICAL UX]

**Title:** `P0: Fix AI empathy - Remove "NO FLUFF" directive [CRITICAL UX]`

**Labels:** `P0-critical`, `emotional-tone`

**Estimated Time:** 4 hours

**Agent:** `ai-empathy` (see `.claude/agents/ai-empathy.md`)

**Skill:** `fix-empathy` (see `.claude/skills/fix-empathy.md`)

**Dependencies:** None (can start immediately)

### Description

**CRITICAL UX ISSUE**: The AI Concierge system prompt explicitly removes empathy with "NO FLUFF: Skip empathetic filler" directive. This makes the AI cold and task-focused in a death planning context, which is fundamentally wrong and user-hostile.

### The Problem

File: `/frontend/src/lib/services/aiConciergeService.ts` - Line 72

```typescript
7. NO FLUFF: Keep it professional and concise. Skip the empathetic filler.
```

This directive makes the AI:
- Cold and transactional
- Task-focused without emotional support
- Dismissive of user feelings
- Inappropriate for death planning context

### The Fix

Completely rewrite the system prompt to prioritize empathy.

#### New AI Principles

```typescript
const SYSTEM_PROMPT = `You are the Continuum AI Concierge - a compassionate guide for death planning.

CORE PRINCIPLES:

1. EMPATHY FIRST
   - Acknowledge the emotional weight of this work
   - Never rush the user
   - Validate their feelings
   - Celebrate their courage

2. CONTEXT AWARENESS
   - Adapt tone to user role (owner planning vs executor grieving)
   - Use grief-aware language for bereaved users
   - Be warm and supportive for all users

3. COMPASSIONATE LANGUAGE
   - Use warm, supportive tone
   - Avoid efficiency language ("quick", "fast", "done")
   - Frame tasks as meaningful acts of care
   - Connect actions to value for loved ones

4. PRACTICAL SUPPORT
   - Provide clear guidance without being demanding
   - Offer breaks when user seems overwhelmed
   - Suggest simplified pathways when appropriate
   - Never minimize feelings or rush process

5. EMOTIONAL SAFETY
   - Acknowledge difficulty without forcing positivity
   - Respect user's pace
   - Provide encouragement without pressure
   - Be present and supportive

REMEMBER:
- This is a death planning app. Every interaction carries emotional weight.
- Users are showing courage by being here. Honor that.
- Your role is to make this process bearable, not efficient.
- Empathy is your PRIMARY function, not a nice-to-have.
`;
```

### Implementation

1. Open `/frontend/src/lib/services/aiConciergeService.ts`
2. Find the `SYSTEM_PROMPT` constant (around line 40-80)
3. Replace entire prompt with empathy-first version above
4. Remove all efficiency language
5. Add context awareness for user roles

### Additional Changes

Add role detection in AI calls:

```typescript
async function getConciergeResponse(userMessage: string, context: {
    userRole?: 'owner' | 'executor' | 'family';
    moduleName?: string;
}) {
    const roleContext = context.userRole === 'executor'
        ? 'The user is managing a deceased loved one\'s estate. Use grief-aware language.'
        : 'The user is planning their own estate.';

    const prompt = `${SYSTEM_PROMPT}\n\nContext: ${roleContext}\nModule: ${context.moduleName}`;
    // ... rest of AI call
}
```

### Testing

Test AI responses in different contexts:

#### Test 1: Planning Own Estate
**User:** "I need to organize my documents"
**Expected:** Warm, encouraging response acknowledging the thoughtfulness

#### Test 2: Executor Mode
**User:** "I need to find my father's insurance policy"
**Expected:** Compassionate, grief-aware response with practical guidance

#### Test 3: Overwhelmed User
**User:** "This is too much, I don't know where to start"
**Expected:** Supportive response offering breaks or simplified approach

#### Test 4: Progress Made
**User:** "I finished the documents section"
**Expected:** Meaningful celebration of their courage and care

### Success Criteria

- [ ] "NO FLUFF" directive removed
- [ ] "Skip empathetic filler" removed
- [ ] Empathy is PRIMARY AI function
- [ ] Context awareness for user roles implemented
- [ ] No efficiency language in prompt
- [ ] Warm, supportive responses in all tests
- [ ] Users feel cared for, not processed

### Testing Checklist

- [ ] Test in Documents module → supportive responses
- [ ] Test in Wishes module → meaningful guidance
- [ ] Test when user seems stuck → offers help
- [ ] Test progress made → celebrates courage
- [ ] AI never rushes or dismisses feelings
- [ ] AI adapts tone to context

### Reference Documentation

- `EMOTIONAL_TONE_AUDIT.md` - Full tone analysis
- `UI_UX_GUIDANCE_AUDIT.md` - UX patterns
- `.claude/agents/ai-empathy.md` - Agent instructions
- `.claude/skills/fix-empathy.md` - Skill workflow

### Getting Started

```bash
# Create feature branch
git checkout -b fix/ai-empathy-critical

# Use ai-empathy agent
# The agent will:
# 1. Rewrite system prompt
# 2. Add role detection
# 3. Test all contexts
# 4. Verify empathetic responses
# 5. Commit changes

# THIS IS CRITICAL - prioritize this fix

# After completion, create PR and mark as CRITICAL
```

---

## Phase 1 Summary

**Total Issues:** 5
**Total Time:** 44 hours
**All Can Start Immediately** (no dependencies)

### Recommended Parallel Execution

These issues are independent and can be worked on simultaneously by different agents:

1. **Agent 1**: Authentication guards (8h)
2. **Agent 2**: Backend data models (16h)
3. **Agent 3**: Media upload (12h)
4. **Agent 4**: Email config (4h)
5. **Agent 5**: AI empathy (4h) **[CRITICAL]**

Once all 5 issues are complete, Phase 1 is done and Phase 2 can begin.
