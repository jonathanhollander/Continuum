# Complete Agent Roster - All 25 Agents
**Date:** 2026-01-21
**Total Agents:** 25

---

## 📊 AGENT GROUPS OVERVIEW

### GROUP A: Technical Infrastructure (14 agents)
**Source:** AGENT_SUGGESTIONS.md
**Priority:** P0-P3 (Technical debt, authentication, data persistence)

### GROUP B: Emotional Tone Transformation (8 agents)
**Source:** Existing specs in /agents/
**Priority:** P0-P2 (Emotional intelligence for death planning)

### GROUP C: Code Quality & Deployment (3 agents)
**Source:** NEW - Created for this plan
**Priority:** P0 (Validation and deployment)

---

## GROUP A: TECHNICAL INFRASTRUCTURE AGENTS (14)

### 1. Authentication Architect Agent
**Priority:** P0 - CRITICAL
**Time:** 3 days
**Impact:** Fixes 30+ files with hardcoded user_id=1

**Scope:**
- Replace hardcoded USER_ID = 1 throughout codebase
- Implement JWT backend (token generation, validation, refresh)
- Add auth service frontend with token storage
- Secure all endpoints with JWT validation

**Files:** 30+ frontend modules, backend main.py, security.py

---

### 2. Data Persistence Unifier Agent
**Priority:** P0 - CRITICAL
**Time:** 3 days
**Impact:** Fixes 11 modules missing backend persistence

**Scope:**
- Create missing backend models (family, insurance, medical, pets, funeral, time capsules)
- Add backend CRUD endpoints for all modules
- Convert localStorage-only stores to backend-synced stores
- Implement SyncManager.update() method

**Files:** Backend models, estate_data.py, 11 frontend stores

---

### 3. Media Upload Infrastructure Agent
**Priority:** P0 - CRITICAL
**Time:** 2 days
**Impact:** Fixes 4 modules with IndexedDB-only media

**Scope:**
- Create backend media upload/download endpoints
- Implement S3 or local file storage
- Migrate IndexedDB blobs to backend
- Update heirlooms, visual memories, properties, time capsule stores

**Files:** New backend/routers/media.py, 4 frontend stores

---

### 4. Email Integration Agent
**Priority:** P0 - CRITICAL
**Time:** 1 day
**Impact:** Fix email notifications (currently just save to files)

**Scope:**
- Replace mock email service with SendGrid or Postmark
- Implement email templates (Jinja2)
- Add email queue and retry logic
- Test magic links, pulse notifications, executor alerts

**Files:** backend/email_service.py, create templates directory

---

### 5. Configuration Management Agent
**Priority:** P1 - HIGH
**Time:** 1 day
**Impact:** Fixes 60+ hardcoded localhost URLs

**Scope:**
- Create backend config.py with pydantic BaseSettings
- Create frontend .env with VITE_API_URL
- Replace all http://localhost:8000 references
- Create .env.example documentation

**Files:** 60+ files with hardcoded URLs, new config.py

---

### 6. WebAuthn Quick Fix Agent
**Priority:** P0 - CRITICAL (Quick Win)
**Time:** 5 minutes
**Impact:** Fixes broken biometric authentication

**Scope:**
- Add missing import: `import { startRegistration } from '@simplewebauthn/browser'`
- Test WebAuthn flow

**Files:** frontend/src/routes/modules/pulse/settings/+page.svelte:1

---

### 7. Pulse Scheduler Tuner Agent
**Priority:** P0 - CRITICAL (Quick Win)
**Time:** 2 minutes
**Impact:** Prevents database overload

**Scope:**
- Change pulse_scheduler.py from minutes=1 to hours=1
- Add configurable interval via env var

**Files:** backend/pulse_scheduler.py:19

---

### 8. Error Handling Standardization Agent
**Priority:** P1 - HIGH
**Time:** 2 days
**Impact:** Improves reliability across app

**Scope:**
- Replace bare except: with specific exceptions
- Add custom exception classes
- Create error notification component frontend
- Add retry logic for failed syncs
- Log errors with context

**Files:** All backend endpoints, new frontend error components

---

### 9. API Response Standardization Agent
**Priority:** P2 - MEDIUM
**Time:** 1 day
**Impact:** Better developer experience

**Scope:**
- Standardize response format: {success, data, error}
- Convert query param messages to JSON bodies
- Add pagination support
- Add API versioning (/api/v1/)

**Files:** All backend endpoints, all frontend API calls

---

### 10. Sync Conflict Resolution Agent
**Priority:** P2 - MEDIUM
**Time:** 2 days
**Impact:** Prevents data loss from offline editing

**Scope:**
- Add updated_at timestamps to all models
- Implement conflict detection
- Create conflict resolution modal
- Add smart merge strategies
- Implement offline queue

**Files:** All models, new frontend conflict resolver component

---

### 11. Database Migration Agent
**Priority:** P1 - HIGH
**Time:** 1 day
**Impact:** Safe schema evolution

**Scope:**
- Set up Alembic for migrations
- Create migrations for all new tables
- Create data migration scripts (localStorage → DB)
- Test rollback procedures

**Files:** New backend/alembic/ directory, migration scripts

---

### 12. Testing Infrastructure Agent
**Priority:** P2 - MEDIUM
**Time:** 4 days
**Impact:** Code quality & confidence

**Scope:**
- Set up pytest for backend (80% coverage goal)
- Set up Vitest for frontend (60% coverage goal)
- Set up Playwright for E2E tests
- Add GitHub Actions CI/CD

**Files:** New test directories, .github/workflows/test.yml

---

### 13. Performance Optimization Agent
**Priority:** P3 - LOW
**Time:** 2 days
**Impact:** Better UX

**Scope:**
- Lazy load modules
- Implement virtual scrolling for long lists
- Add database indexes
- Implement caching (Redis)
- Add pagination
- Optimize bundle size

**Files:** Various frontend/backend performance tweaks

---

### 14. Security Hardening Agent
**Priority:** P1 - HIGH
**Time:** 2 days
**Impact:** Production readiness

**Scope:**
- Implement JWT with httpOnly cookies
- Add CSRF protection
- Restrict CORS to production domain
- Add rate limiting
- Add security headers
- Implement audit logging

**Files:** backend/main.py, security.py, all endpoints

---

## GROUP B: EMOTIONAL TONE TRANSFORMATION AGENTS (8)

### 15. AI Empathy Agent
**Priority:** P0 - CRITICAL
**Time:** 1 day

**Scope:**
- Rewrite AI system prompt completely
- Remove "NO FLUFF: Skip empathetic filler"
- Add "EMPATHY FIRST: Data second"
- Add context awareness for owner/executor/terminal
- Add guardrails

**Files:** frontend/src/lib/services/aiConciergeService.ts

---

### 16. Module Header Rewrite Agent
**Priority:** P0 - CRITICAL
**Time:** 2 days

**Scope:**
- Transform all 11 module headers
- Insurance: "Policies" → "Protecting Your Loved Ones"
- Medical: "Safety Net" → "Your Voice at the End of Life"
- Add "Why This Matters" to all empty states

**Files:** 11 module pages

---

### 17. Context-Aware Messaging Agent
**Priority:** P0 - CRITICAL
**Time:** 2 days

**Scope:**
- Create userContext store (owner/executor/family detection)
- Create ContextBanner component
- Integrate context-aware greetings
- Add grief banner for recent executors

**Files:** New stores, components, dashboard, all modules

---

### 18. Empty State Compassion Agent
**Priority:** P1 - HIGH
**Time:** 1 day

**Scope:**
- Add "Why This Matters" sections to all empty states
- Add "What to Add First" guidance
- Connect each to emotional meaning

**Files:** 11 module pages

---

### 19. Form Modal Empathy Agent
**Priority:** P1 - HIGH
**Time:** 2 days

**Scope:**
- Add compassionate introductions to all modals
- Add field-level tooltips
- Add "why we ask this" context
- Reframe button labels

**Files:** 8+ modal forms

---

### 20. Break & Pacing Agent
**Priority:** P1 - HIGH
**Time:** 1 day

**Scope:**
- Create BreakReminder component (30-min detection)
- Create NoRushBanner component
- Integrate with heavy modules

**Files:** New components, dashboard, medical, funeral, letters

---

### 21. Grief Support Infrastructure Agent
**Priority:** P2 - MEDIUM
**Time:** 2 days

**Scope:**
- Create grief support resources page
- Create family conversation guides
- Create terminal diagnosis resources
- Link throughout app

**Files:** New resource pages, links in executor toolkit, medical, AI

---

### 22. Tone Documentation Agent
**Priority:** P2 - MEDIUM
**Time:** 1 day

**Scope:**
- Create comprehensive tone guide
- Document emotional principles
- Create copy templates
- Add linting rules

**Files:** New docs/TONE_GUIDE.md

---

## GROUP C: CODE QUALITY & DEPLOYMENT AGENTS (3)

### 23. Code Validation Agent
**Priority:** P0 - CRITICAL
**Time:** Setup only (used by all agents)

**Scope:**
- Run TypeScript compiler check
- Run ESLint
- Run Prettier format check
- Validate Svelte syntax
- Run build test
- Called by EVERY agent before commit

**Files:** None (validation script)

---

### 24. Railway Deployment Agent
**Priority:** P0 - CRITICAL
**Time:** 1 day

**Scope:**
- Deploy to Railway
- Monitor build logs
- Handle deployment failures
- Provide deployment URL

**Files:** None (deployment script)

---

### 25. Deployment Verification Agent
**Priority:** P0 - CRITICAL
**Time:** 1 day

**Scope:**
- Test application loads
- Verify critical routes accessible
- Test API endpoints
- Smoke test key features
- Check for console errors

**Files:** None (testing script)

---

## 📁 PROPOSED FOLDER STRUCTURE

```
/continuum-agents/
├── README.md                              # Overview of all 25 agents
├── AGENT_EXECUTION_ORDER.md               # Recommended execution sequence
├── PROGRESS.md                            # Track completion
│
├── /technical-infrastructure/             # Group A: 14 agents
│   ├── 01-authentication-architect.md
│   ├── 02-data-persistence-unifier.md
│   ├── 03-media-upload-infrastructure.md
│   ├── 04-email-integration.md
│   ├── 05-configuration-management.md
│   ├── 06-webauthn-quick-fix.md
│   ├── 07-pulse-scheduler-tuner.md
│   ├── 08-error-handling-standardization.md
│   ├── 09-api-response-standardization.md
│   ├── 10-sync-conflict-resolution.md
│   ├── 11-database-migration.md
│   ├── 12-testing-infrastructure.md
│   ├── 13-performance-optimization.md
│   └── 14-security-hardening.md
│
├── /emotional-tone/                       # Group B: 8 agents
│   ├── 15-ai-empathy.md
│   ├── 16-module-headers.md
│   ├── 17-context-awareness.md
│   ├── 18-empty-states.md
│   ├── 19-form-modals.md
│   ├── 20-break-pacing.md
│   ├── 21-grief-resources.md
│   └── 22-tone-documentation.md
│
└── /deployment/                           # Group C: 3 agents
    ├── 23-code-validation.md
    ├── 24-railway-deployment.md
    └── 25-deployment-verification.md
```

---

## 🎯 RECOMMENDED EXECUTION ORDER

### PHASE 1: Quick Wins & Critical Fixes (Week 1)
**5 days**

**Day 1: Immediate Fixes**
1. WebAuthn Quick Fix Agent (5 min)
2. Pulse Scheduler Tuner Agent (2 min)
3. Configuration Management Agent (1 day)

**Day 2-3: Authentication**
4. Authentication Architect Agent (2 days)

**Day 4-5: Email & Validation Setup**
5. Email Integration Agent (1 day)
6. Code Validation Agent - Setup (validate all future agents)

---

### PHASE 2: Data Layer Foundation (Week 2)
**5 days**

**Day 6-8: Data Persistence**
7. Data Persistence Unifier Agent (3 days)

**Day 9-10: Media & Migrations**
8. Media Upload Infrastructure Agent (2 days)
9. Database Migration Agent (can run in parallel)

---

### PHASE 3: Emotional Tone Transformation (Week 3)
**5 days**

**Day 11-12: Core Tone**
10. AI Empathy Agent (1 day)
11. Module Header Rewrite Agent (1 day)

**Day 13-15: Context & Guidance**
12. Context-Aware Messaging Agent (2 days)
13. Empty State Compassion Agent (1 day)

---

### PHASE 4: Emotional Enrichment (Week 4)
**5 days**

**Day 16-17: Forms & Pacing**
14. Form Modal Empathy Agent (2 days)
15. Break & Pacing Agent (1 day)

**Day 18-20: Support & Documentation**
16. Grief Support Infrastructure Agent (2 days)
17. Tone Documentation Agent (1 day)

---

### PHASE 5: Infrastructure Improvements (Week 5)
**5 days**

**Day 21-22: API & Sync**
18. API Response Standardization Agent (1 day)
19. Sync Conflict Resolution Agent (2 days)

**Day 23-25: Error Handling & Security**
20. Error Handling Standardization Agent (2 days)
21. Security Hardening Agent (start - 1 day)

---

### PHASE 6: Testing & Optimization (Week 6)
**5 days**

**Day 26-28: Testing**
22. Testing Infrastructure Agent (3 days)

**Day 29-30: Performance & Final Security**
23. Performance Optimization Agent (1 day)
24. Security Hardening Agent (finish - 1 day)

---

### PHASE 7: Deployment (Week 7 - Day 1)
**1 day**

**Morning:**
- Code Validation Agent - Full codebase validation
- Fix any remaining issues

**Afternoon:**
25. Railway Deployment Agent
26. Deployment Verification Agent

---

## 📊 TIMELINE SUMMARY

| Phase | Duration | Agents | Priority |
|-------|----------|--------|----------|
| Phase 1: Quick Wins | 5 days | 6 agents | P0 Critical |
| Phase 2: Data Layer | 5 days | 3 agents | P0 Critical |
| Phase 3: Emotional Tone Core | 5 days | 4 agents | P0 Critical |
| Phase 4: Emotional Enrichment | 5 days | 4 agents | P1-P2 |
| Phase 5: Infrastructure | 5 days | 4 agents | P1-P2 |
| Phase 6: Testing & Optimization | 5 days | 2 agents | P2-P3 |
| Phase 7: Deployment | 1 day | 2 agents | P0 |
| **TOTAL** | **31 days** | **25 agents** | **Mixed** |

---

## 🎯 ALTERNATIVE: PARALLEL EXECUTION

If multiple agents can work simultaneously:

### Critical Path (Must be sequential)
1. Configuration Management → Authentication → Data Persistence → Deployment
2. AI Empathy → Module Headers → Context Awareness
3. Code Validation (runs with every agent)

### Can Run in Parallel
- Email Integration (parallel with Auth)
- Media Upload (parallel with Data Persistence)
- WebAuthn Fix (parallel with anything)
- Pulse Scheduler (parallel with anything)
- Error Handling (parallel with Data Persistence)
- All Emotional Tone agents after AI Empathy is done
- Testing Infrastructure (parallel with Phase 5)
- Performance Optimization (parallel with Testing)

**Optimized Timeline:** 15-20 days with parallel execution

---

## 💰 EFFORT ESTIMATE

### By Priority:
- **P0 (Critical):** 19 days (13 agents)
- **P1 (High):** 9 days (7 agents)
- **P2 (Medium):** 8 days (4 agents)
- **P3 (Low):** 2 days (1 agent)

### By Group:
- **Group A (Technical):** 19 days
- **Group B (Emotional):** 10 days
- **Group C (Deployment):** 2 days

---

## ⚠️ DEPENDENCIES

### Must Complete First:
- **Code Validation Agent** before any other agent commits
- **Configuration Management** before Authentication
- **Authentication** before Data Persistence
- **Data Persistence** before Media Upload
- **Database Migration** after Data Persistence models created
- **AI Empathy** before other emotional tone agents
- **All agents** before Deployment

### Can Work Independently:
- WebAuthn Quick Fix
- Pulse Scheduler Tuner
- Email Integration (after Config Management)
- Testing Infrastructure
- Performance Optimization
- Tone Documentation

---

## 📝 NEXT STEPS

**If you approve this complete roster:**

1. **I will create 25 agent specification files** in `/continuum-agents/` folder
   - Each with detailed implementation instructions
   - Each with validation requirements
   - Each with testing procedures
   - Each with rollback plans

2. **I will create master documents:**
   - `/continuum-agents/README.md` - Overview
   - `/continuum-agents/AGENT_EXECUTION_ORDER.md` - Detailed sequencing
   - `/continuum-agents/PROGRESS.md` - Tracking template

3. **Then you can:**
   - Review all 25 agent specs
   - Approve execution order
   - Give go-ahead to begin

4. **Execution begins:**
   - Week 1: Quick wins + Auth
   - Week 2: Data layer
   - Week 3-4: Emotional tone
   - Week 5-6: Infrastructure + testing
   - Week 7: Deploy

---

## ❓ QUESTIONS BEFORE PROCEEDING

1. **Execution Strategy:**
   - Sequential (31 days) or Parallel (15-20 days)?
   - Which agents should I prioritize first?

2. **Railway Setup:**
   - Already connected to GitHub?
   - Environment variables configured?
   - Deploy from which branch?

3. **Quick Wins:**
   - Should I start with 5-minute fixes immediately?
   - WebAuthn + Pulse Scheduler can be done today

4. **Code Validation:**
   - Block on warnings or only errors?
   - Auto-format with Prettier or just check?

5. **Approval:**
   - Create all 25 specs first for review?
   - Or create and execute immediately?

---

**Ready to create all 25 agent specifications?**

Let me know your preferences and I'll proceed!
