# Quick Issue Creation Guide

Since GitHub CLI has permission issues, use this guide to quickly create all issues via GitHub's web interface.

## Step 1: Create Labels (5 minutes)

Go to: https://github.com/jonathanhollander/Continuum/labels

Click "New label" and create these (or run `./CREATE_LABELS.sh` if you fix permissions):

**Priority Labels:**
- `P0-critical` (red #d73a4a)
- `P1-high` (red #ff6b6b)
- `P2-testing` (orange #ffa500)
- `P3-polish` (yellow #ffeb3b)

**Category Labels:** authentication, data-persistence, media, email, emotional-tone, configuration, security, monitoring, testing, documentation, deployment, integration, backend, frontend, e2e, offline, performance, automation, api, type-safety

## Step 2: Create Issues

Go to: https://github.com/jonathanhollander/Continuum/issues/new

For each issue template below:
1. Copy the title
2. Copy the body
3. Add the labels listed
4. Click "Submit new issue"

---

## Phase 1 - Critical (5 issues)

### Issue #1
**Title:** `P0: Add authentication guards to protected routes (redirect to login)`

**Labels:** P0-critical, authentication

**Body:**
```
Add route guards to all protected pages that redirect unauthenticated users to login.

**Agent:** authentication-architect
**Skill:** fix-auth
**Time:** 8 hours

**Files to Create:**
- /frontend/src/routes/dashboard/+page.ts
- /frontend/src/routes/modules/+layout.ts
- /frontend/src/routes/settings/+page.ts
- /frontend/src/routes/binder/+page.ts

**Success Criteria:**
- [ ] All protected routes have guards
- [ ] Unauthenticated users redirect to /login
- [ ] After login, redirect back to original destination
- [ ] No hardcoded USER_ID anywhere

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md
```

### Issue #2
**Title:** `P0: Create backend models and sync for family, insurance, medical, pets`

**Labels:** P0-critical, data-persistence, backend

**Body:**
```
Create SQLModel models and frontend stores for remaining modules using SyncManager pattern.

**Agent:** data-persistence-unifier
**Skill:** fix-data
**Time:** 16 hours

**Models to Create:**
- backend/models/family_models.py
- backend/models/insurance_models.py
- backend/models/medical_models.py
- backend/models/pet_models.py
- backend/models/funeral_models.py

**Stores to Refactor:**
- frontend/src/lib/stores/familyStore.svelte.ts
- frontend/src/lib/stores/insuranceStore.svelte.ts
- frontend/src/lib/stores/medicalStore.svelte.ts
- frontend/src/lib/stores/petStore.svelte.ts
- frontend/src/lib/stores/funeralStore.svelte.ts

**Success Criteria:**
- [ ] All models created with proper relationships
- [ ] All stores use SyncManager pattern
- [ ] Data persists to database
- [ ] Data accessible across devices

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md
```

### Issue #3
**Title:** `P0: Build media upload infrastructure (replace IndexedDB with backend)`

**Labels:** P0-critical, media, backend, frontend

**Body:**
```
Replace IndexedDB file storage with proper backend file upload system.

**Agent:** media-upload-infrastructure
**Time:** 12 hours

**Backend:**
- Create backend/routers/media.py
- Create backend/models/media.py
- Set up file storage (local + S3-compatible)

**Frontend:**
- Create MediaUploader.svelte component
- Update all modules using file uploads
- Create migration path from IndexedDB

**Success Criteria:**
- [ ] Files upload to backend
- [ ] Files persist across devices
- [ ] Media accessible via URL
- [ ] IndexedDB migration complete

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md
```

### Issue #4
**Title:** `P0: Configure email service for production (Postmark)`

**Labels:** P0-critical, email

**Body:**
```
Set up production email service with Postmark for Railway deployment.

**Agent:** email-integration
**Time:** 4 hours

**Tasks:**
- Get Postmark API key
- Set Railway environment variables
- Test email sending in production
- Verify templates render correctly

**Railway Variables:**
- EMAIL_PROVIDER=postmark
- POSTMARK_API_KEY=your_key
- EMAIL_FROM_ADDRESS=noreply@yourdomain.com

**Success Criteria:**
- [ ] Emails send successfully in production
- [ ] All templates tested
- [ ] Delivery tracking works
- [ ] Bounce handling configured

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md
```

### Issue #5
**Title:** `P0: [CRITICAL] Fix AI empathy - remove "NO FLUFF" directive`

**Labels:** P0-critical, emotional-tone, frontend

**Body:**
```
🚨 CRITICAL UX ISSUE: The AI Concierge system prompt says "NO FLUFF: Skip empathetic filler" which is fundamentally wrong for death planning context.

**Agent:** ai-empathy
**Skill:** fix-empathy
**Time:** 4 hours

**File:** /frontend/src/lib/services/aiConciergeService.ts (line 72)

**Current Problem:**
```
7. NO FLUFF: Keep it professional and concise. Skip the empathetic filler.
```

**Fix:** Rewrite entire system prompt to prioritize empathy, compassion, and emotional support.

**Success Criteria:**
- [ ] System prompt emphasizes empathy first
- [ ] Acknowledges emotional difficulty
- [ ] Uses warm, supportive tone
- [ ] No efficiency/task-focused language
- [ ] Tested with real scenarios

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md
```

---

## Phase 2 - High Priority (13 issues)

Copy templates from `PHASE_2_P1_HIGH.md` for issues #6-18:
- Issue #6: Configuration management (8h)
- Issue #7: Alembic migrations (8h)
- Issue #8: Error handling (12h)
- Issue #9: Security hardening (12h)
- Issue #10: Frontend state cleanup (8h)
- Issue #11: Module headers (6h)
- Issue #12: Progress celebration (4h)
- Issue #13: Button language (4h)
- Issue #14: Empty states (4h)
- Issue #15: Context-aware messaging (8h)
- Issue #16: Grief-aware executor mode (12h)
- Issue #17: Overwhelm detection (8h)
- Issue #18: Logging system (8h)

---

## Phase 3 - Testing (11 issues)

Copy templates from `PHASE_3_P2_TESTING.md` for issues #19-30 (90 hours total)

---

## Phase 4 - Polish (7 issues)

Copy templates from `PHASE_4_P3_POLISH.md` for issues #31-37 (56 hours total)

---

## Faster Alternative: Bulk Import

If you want to create all issues at once:

1. **Option A:** Run `./CREATE_LABELS.sh` then copy/paste issue text from each phase file
2. **Option B:** Use GitHub's Projects feature to import from CSV (not yet implemented)
3. **Option C:** Fix GitHub CLI permissions and run automated script

## After Creating Issues

1. Create GitHub Project board: https://github.com/jonathanhollander/Continuum/projects
2. Add all issues to project
3. Organize by phase
4. Start with Phase 1 (P0) issues
5. Use agents specified in each issue
