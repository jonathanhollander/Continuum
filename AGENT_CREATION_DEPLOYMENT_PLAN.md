# Agent Creation & Deployment Plan
**Date:** 2026-01-21
**Purpose:** Create specialized Claude Code agents for Continuum transformation + deployment

---

## 📋 COMPLETE AGENT ROSTER

### GROUP A: Emotional Tone Transformation Agents (8 agents)
**Source:** Existing specifications in `/agents/` directory

1. **AI Empathy Agent** (P0 - Critical)
2. **Module Header Rewrite Agent** (P0 - Critical)
3. **Context-Aware Messaging Agent** (P0 - Critical)
4. **Empty State Compassion Agent** (P1 - High)
5. **Form Modal Empathy Agent** (P1 - High)
6. **Break & Pacing Agent** (P1 - High)
7. **Grief Support Infrastructure Agent** (P2 - Medium)
8. **Tone Documentation Agent** (P2 - Medium)

### GROUP B: Code Quality & Deployment Agents (3 NEW agents)
**Need to create specifications**

9. **Code Validation Agent** (P0 - Critical) - NEW
   - Check syntax errors before commits
   - Validate TypeScript/Svelte code
   - Run linters (ESLint, Prettier)
   - Catch common mistakes

10. **Railway Deployment Agent** (P0 - Critical) - NEW
    - Deploy to Railway
    - Monitor build process
    - Handle environment variables
    - Verify successful deployment

11. **Deployment Verification Agent** (P0 - Critical) - NEW
    - Test deployed application
    - Verify all routes work
    - Check API endpoints
    - Smoke test critical features

---

## 📁 PROPOSED FOLDER STRUCTURE

```
/continuum-agents/
├── README.md                           # Agent directory overview
├── AGENT_EXECUTION_ORDER.md            # Recommended execution sequence
│
├── /emotional-tone/                    # Group A: Emotional transformation
│   ├── 01-ai-empathy.md
│   ├── 02-module-headers.md
│   ├── 03-context-awareness.md
│   ├── 04-empty-states.md
│   ├── 05-form-modals.md
│   ├── 06-break-pacing.md
│   ├── 07-grief-resources.md
│   └── 08-tone-documentation.md
│
├── /code-quality/                      # Group B: Code validation
│   └── 09-code-validation.md
│
└── /deployment/                        # Group B: Deployment
    ├── 10-railway-deploy.md
    └── 11-deployment-verification.md
```

---

## 🆕 NEW AGENT SPECIFICATIONS

### Agent 9: Code Validation Agent

**Purpose:** Prevent syntax errors and code quality issues before commits

**Responsibilities:**
1. Run TypeScript compiler check (`tsc --noEmit`)
2. Run ESLint on modified files
3. Run Prettier format check
4. Validate Svelte component syntax
5. Check for common mistakes:
   - Unclosed tags
   - Missing imports
   - Unused variables
   - Type errors
   - Incorrect prop usage

**When to Run:** Before EVERY commit by ANY agent

**Tools:**
```bash
# TypeScript validation
cd frontend && npm run check

# ESLint
cd frontend && npm run lint

# Prettier
cd frontend && npm run format:check

# Build test (catches most errors)
cd frontend && npm run build
```

**Outputs:**
- ✅ "Code validation passed - safe to commit"
- ❌ "Syntax errors found - fix before committing"
- List of specific errors with file:line references

**Integration:**
Every agent must call Code Validation Agent before committing changes.

---

### Agent 10: Railway Deployment Agent

**Purpose:** Deploy Continuum to Railway platform

**Responsibilities:**
1. Verify all environment variables set
2. Push to Railway branch
3. Monitor build logs
4. Handle deployment failures
5. Provide deployment URL

**Prerequisites:**
- Railway CLI installed or git-based deployment
- Environment variables configured:
  - `DATABASE_URL`
  - `VITE_OPENROUTER_API_KEY`
  - `VITE_API_URL`
  - Others from `.env.example`

**Deployment Methods:**

**Option A: Git-based (Recommended)**
```bash
# Railway watches specific branch
git push railway main
```

**Option B: Railway CLI**
```bash
railway up
railway status
railway logs
```

**Monitoring:**
- Watch build logs for errors
- Check deployment status
- Verify services start successfully
- Capture deployment URL

**Outputs:**
- ✅ "Deployment successful: https://continuum-production.up.railway.app"
- ❌ "Deployment failed: [error details]"
- Build logs for debugging

---

### Agent 11: Deployment Verification Agent

**Purpose:** Verify deployed application works correctly

**Responsibilities:**
1. Test application loads
2. Verify critical routes accessible
3. Test API endpoints respond
4. Smoke test key features
5. Check for console errors

**Test Checklist:**

**1. Application Loads**
```bash
curl -I https://continuum-production.up.railway.app
# Expect: 200 OK
```

**2. Critical Routes Accessible**
- `/` - Homepage
- `/login` - Login page
- `/dashboard` - Dashboard (may redirect if not authed)
- `/modules/insurance` - Sample module
- `/api/health` - Health check endpoint (if exists)

**3. API Endpoints**
```bash
# Test backend is running
curl https://continuum-production.up.railway.app/api/estate?user_id=1
```

**4. Smoke Tests**
- Open browser to deployment URL
- Check for JavaScript errors in console
- Verify assets load (CSS, images)
- Test one user flow (e.g., view insurance module)

**5. Environment Variables**
- Verify API_URL points to correct backend
- Check OPENROUTER_API_KEY is set (don't log it!)

**Outputs:**
- ✅ "Deployment verified - all systems operational"
- ⚠️ "Deployment successful but issues found: [warnings]"
- ❌ "Deployment verification failed: [errors]"

---

## 🔄 AGENT EXECUTION WORKFLOW

### Standard Workflow for Any Emotional Tone Agent

```
1. Agent reads specification
2. Agent makes code changes
3. Agent calls CODE VALIDATION AGENT
   ├─ If validation fails: Fix errors, retry
   └─ If validation passes: Continue
4. Agent commits changes with detailed message
5. Agent pushes to branch
```

### Deployment Workflow (After All Changes)

```
1. All emotional tone agents complete
2. CODE VALIDATION AGENT runs full validation
   ├─ If fails: Fix all errors
   └─ If passes: Continue
3. RAILWAY DEPLOYMENT AGENT deploys to production
   ├─ If fails: Review logs, fix issues, retry
   └─ If succeeds: Continue
4. DEPLOYMENT VERIFICATION AGENT runs tests
   ├─ If fails: Rollback deployment, fix issues
   └─ If passes: Deployment complete ✅
```

---

## 📊 SUGGESTED EXECUTION PLAN

### PHASE 1: Setup (Day 0)
**Goal:** Create all agent specifications and validation infrastructure

**Tasks:**
1. Create `/continuum-agents/` folder structure
2. Move existing agent specs from `/agents/` to `/continuum-agents/emotional-tone/`
3. Create Code Validation Agent spec
4. Create Railway Deployment Agent spec
5. Create Deployment Verification Agent spec
6. Create `AGENT_EXECUTION_ORDER.md` master guide
7. Test Code Validation Agent manually
8. Commit all agent specs

**Duration:** 2-3 hours

---

### PHASE 2: Emotional Tone Transformation (Week 1-3)
**Goal:** Execute all 8 emotional tone agents with validation

**Week 1: Foundation (P0)**

**Day 1-2: AI Empathy Agent**
1. Agent reads spec
2. Agent rewrites system prompt
3. **CODE VALIDATION AGENT validates**
4. Commit: "feat(ai): transform concierge to empathetic guide"
5. Test AI conversations manually

**Day 3-4: Module Header Rewrite Agent**
1. Agent reads spec
2. Agent transforms 11 module headers
3. **CODE VALIDATION AGENT validates**
4. Commit: "feat(modules): compassionate headers"
5. Visual test all 11 pages

**Day 5: Context-Aware Messaging Agent (Part 1)**
1. Agent creates userContext store
2. Agent creates ContextBanner component
3. **CODE VALIDATION AGENT validates**
4. Commit: "feat(context): add user context detection"

**Week 2: Enhancement (P1)**

**Day 6: Context-Aware Messaging Agent (Part 2)**
1. Agent integrates context detection
2. **CODE VALIDATION AGENT validates**
3. Commit: "feat(context): integrate context-aware messaging"

**Day 7: Empty State Compassion Agent**
1. Agent rewrites empty states
2. **CODE VALIDATION AGENT validates**
3. Commit: "feat(empty-states): add compassionate context"

**Day 8-9: Form Modal Empathy Agent**
1. Agent updates all modals
2. **CODE VALIDATION AGENT validates**
3. Commit: "feat(forms): add compassionate introductions"

**Day 10: Break & Pacing Agent**
1. Agent creates break reminder components
2. **CODE VALIDATION AGENT validates**
3. Commit: "feat(pacing): add break reminder system"

**Week 3: Support & Documentation (P2)**

**Day 11-12: Grief Support Infrastructure Agent**
1. Agent creates resource pages
2. **CODE VALIDATION AGENT validates**
3. Commit: "feat(resources): add grief support pages"

**Day 13: Tone Documentation Agent**
1. Agent creates tone guide
2. No code changes (documentation only)
3. Commit: "docs(tone): add comprehensive tone guide"

**Day 14: Integration Testing**
1. Test all changes together
2. Fix any integration issues
3. **CODE VALIDATION AGENT full validation**

---

### PHASE 3: Deployment (Day 15)
**Goal:** Deploy to Railway and verify

**Morning:**
1. **CODE VALIDATION AGENT** - Full codebase validation
   - Fix any remaining issues
   - Ensure clean build

2. **RAILWAY DEPLOYMENT AGENT** - Deploy to production
   - Push to Railway
   - Monitor build
   - Capture deployment URL

**Afternoon:**
3. **DEPLOYMENT VERIFICATION AGENT** - Verify deployment
   - Run all smoke tests
   - Test critical features
   - Check for errors

4. **If verification passes:**
   - Mark deployment successful
   - Document deployment URL
   - Notify stakeholders

5. **If verification fails:**
   - Review errors
   - Rollback if necessary
   - Fix issues
   - Redeploy

---

## 🎯 AGENT EXECUTION ORDER SUMMARY

```
Setup Phase:
└─ Create all 11 agent specifications

Execution Phase (with validation):
├─ 01. AI Empathy Agent → CODE VALIDATION → Commit
├─ 02. Module Header Rewrite Agent → CODE VALIDATION → Commit
├─ 03. Context-Aware Messaging Agent (Part 1) → CODE VALIDATION → Commit
├─ 04. Context-Aware Messaging Agent (Part 2) → CODE VALIDATION → Commit
├─ 05. Empty State Compassion Agent → CODE VALIDATION → Commit
├─ 06. Form Modal Empathy Agent → CODE VALIDATION → Commit
├─ 07. Break & Pacing Agent → CODE VALIDATION → Commit
├─ 08. Grief Support Infrastructure Agent → CODE VALIDATION → Commit
└─ 09. Tone Documentation Agent → Commit (docs only)

Deployment Phase:
├─ CODE VALIDATION AGENT (full codebase check)
├─ RAILWAY DEPLOYMENT AGENT (deploy)
└─ DEPLOYMENT VERIFICATION AGENT (verify)
```

---

## 🔧 TOOLS NEEDED

### Development Tools
```bash
# Already in package.json (verify):
- TypeScript compiler (tsc)
- ESLint
- Prettier
- Svelte check
- Vite build
```

### Deployment Tools
```bash
# Railway CLI (optional but helpful)
npm install -g @railway/cli
railway login

# Or use git-based deployment (no CLI needed)
```

### Testing Tools
```bash
# For deployment verification
curl
# Browser for manual smoke tests
```

---

## 📝 AGENT SPEC TEMPLATE

Each agent specification will include:

```markdown
# [Agent Name]
**Priority:** P0/P1/P2
**Estimated Time:** X hours/days
**Dependencies:** [List other agents that must run first]

## Objective
[What this agent accomplishes]

## Scope
[Files to create/modify]

## Implementation Steps
1. Step 1
2. Step 2
3. Step 3

## Validation
**Pre-commit checks:**
- [ ] TypeScript compiles
- [ ] ESLint passes
- [ ] Prettier formatted
- [ ] Build succeeds
- [ ] Manual testing complete

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Rollback Plan
[How to undo changes if needed]

## Testing
[How to test changes]

## Commit Message
```
[Detailed commit message template]
```
```

---

## ⚠️ CRITICAL SAFEGUARDS

### 1. Code Validation Before EVERY Commit
No agent commits without Code Validation Agent approval.

### 2. Incremental Commits
Each agent commits independently. Don't batch changes.

### 3. Testing After Each Agent
Manual testing after each agent to catch issues early.

### 4. Deployment Only After All Changes
Don't deploy partially completed work.

### 5. Rollback Plan Ready
Know how to rollback deployment if verification fails.

---

## 📊 PROGRESS TRACKING

Create tracking file: `/continuum-agents/PROGRESS.md`

```markdown
# Agent Execution Progress

## Phase 1: Setup
- [ ] Agent specifications created
- [ ] Folder structure set up
- [ ] Code Validation Agent tested

## Phase 2: Emotional Tone (Week 1-3)
- [ ] AI Empathy Agent
- [ ] Module Header Rewrite Agent
- [ ] Context-Aware Messaging Agent (Part 1)
- [ ] Context-Aware Messaging Agent (Part 2)
- [ ] Empty State Compassion Agent
- [ ] Form Modal Empathy Agent
- [ ] Break & Pacing Agent
- [ ] Grief Support Infrastructure Agent
- [ ] Tone Documentation Agent

## Phase 3: Deployment
- [ ] Full code validation
- [ ] Railway deployment
- [ ] Deployment verification
- [ ] Production launch ✅

## Issues Log
[Track any issues encountered]
```

---

## 🎯 IMMEDIATE NEXT STEPS

**If you approve this plan:**

1. **I will create:**
   - `/continuum-agents/` folder structure
   - All 11 agent specification files (8 existing + 3 new)
   - `AGENT_EXECUTION_ORDER.md`
   - `PROGRESS.md` tracking file

2. **Then you can:**
   - Review all agent specs
   - Approve or request changes
   - Give go-ahead for execution

3. **Execution begins:**
   - Setup Phase (create all specs)
   - Week 1 emotional tone agents
   - Week 2 emotional tone agents
   - Week 3 support & documentation
   - Deployment

---

## 💰 ESTIMATED TIMELINE

**Setup:** 2-3 hours (create all agent specs)
**Week 1:** 5 days (AI Empathy, Headers, Context Part 1)
**Week 2:** 5 days (Context Part 2, Empty States, Forms, Breaks)
**Week 3:** 5 days (Grief Resources, Tone Docs, Integration Testing)
**Deployment:** 1 day (Validation, Deploy, Verify)

**Total:** 16-17 days from start to production deployment

---

## ❓ QUESTIONS FOR YOU

Before I create all the agent specifications:

1. **Railway Setup:**
   - Is Railway already connected to your GitHub repo?
   - Do you have a Railway project created?
   - Should deployment be manual or automatic (on push to main)?

2. **Environment Variables:**
   - Are all env vars already configured in Railway dashboard?
   - Do I need to create a Railway env setup guide?

3. **Deployment Branch:**
   - Deploy from `main` or from `claude/review-codebase-suggestions-NjAZY`?
   - Should I create a `production` branch?

4. **Validation Strictness:**
   - Should Code Validation Agent block commits on warnings or only errors?
   - Should Prettier auto-format or just check?

5. **Agent Execution:**
   - Do you want me to execute all agents immediately after creating specs?
   - Or create specs first, get your approval, then execute?

---

**Ready to proceed with creating all agent specifications in `/continuum-agents/` folder?**

Let me know if you approve this plan or want any changes!
