# Continuum — Project Recovery Plan

**Last Updated:** 2026-10-26 01:55 EST

**Revised 2026-10-26** after the features/usability review (`docs/reviews/2026-10-25-features-usability/REVIEW.md`): the order is now built around the handover, not the existing navigation.

**Execution:** task cards for each phase are in [RECOVERY_EXECUTION_PLAN.md](RECOVERY_EXECUTION_PLAN.md).

**Scope:** Features and the user's experience come first. Security, admin, CI and
infrastructure hardening are listed in Phase F and wait until the handover works.
**Ground rule:** No module or feature is deleted. Where something is unfinished, it is
labelled or moved lower in the navigation, never removed.

---

## 1. Where the project actually stands (measured 2026-10-25)

| Check | Result | How it was measured |
|---|---|---|
| Commit activity | 119 commits from 2026-01-10 to 2026-01-26, then one housekeeping commit on 2026-09-05. Nothing since. | `git log --date=short` |
| Production site | Up. `/api/health` reports database, storage and scheduler healthy. | `curl https://continuum.estate/api/health` |
| Frontend build | **Passes** (`vite build`). | `npm run build` |
| Frontend type-check | **288 errors, 268 warnings in 112 files.** The saved baseline (`frontend/svelte_check_baseline.txt`) was 245 errors, so it got **worse** while work continued. | `npm run check` |
| Backend on production's library versions | Starts and login works. GET returned 200 for 31 of the 32 sync endpoints the frontend uses. `vault_documents` returned 400. A 200 here means the data *loads*; it does not mean fields survive a save (see the review's CU-001). | Local server pinned to production's `pip freeze`, then every frontend sync endpoint called |
| Backend on the *latest* library versions | **Login and sign-up crash** with `Datetime values must have timezone information`. `requirements.txt` uses `>=`, so the next redeploy installs these versions. | Same test on a fresh install (SQLModel 0.0.48 / SQLAlchemy 2.1.6; production has 0.0.42 / 2.0.52) |
| Important Documents (a "What Matters Most" module) | **Broken.** `DocumentVault.svelte` syncs to `/api/data/vault_documents`. The generic `/api/data/{type}` route catches that path first and returns `400 Invalid type: vault_documents`. Documents never reach the server. | Local API call; same root cause as `INVESTIGATION_REPORT_LEGAL_DOCUMENTS.md` (2026-01-26), which was diagnosed but never fixed |
| Modules | 31 module routes, 74 pages in total, 60 store files, 187 Svelte components | `find` |
| Planning documents | 63 Markdown files at the repo root, about 20 of them titled "Complete" | `ls *.md` |
| Unmerged work | 15 remote branches, 4 of them `stash-backup/*` | `git branch -r` |
| Open GitHub issues | 26 | `gh issue list` |

What was **not** measured in this first pass: a browser click-through. Browser automation
was refused in that session ("Claude Code is running in don't ask mode"). Afterwards, the
separate features/usability review
(`docs/reviews/2026-10-25-features-usability/REVIEW.md`) ran a local browser walkthrough.
It covered login, onboarding, contacts, financial entry, dashboard, binder and documents,
plus 29 isolated API probes. Its findings (CU-001–CU-025) drive Phases B–E. Pages it did
not exercise are covered by the full browser test in the release pass.

---

## 2. Why the project went off track

Each cause below has evidence from the repo. They are listed by how much they hurt the
user-facing product.

### 2.1 Work was marked "complete" without being checked against the running app
- `DATA_PERSISTENCE_STATUS.md` (2026-01-21) says "✅ COMPLETE … 100% of user data" is saved to
  the backend. Three days later, `COMPREHENSIVE_SITE_TEST_REPORT.md` (2026-01-24) found
  **17 of 27 pages with critical issues**.
- `AUDIT_SUMMARY.md` says GitHub Issue #14 was "prematurely closed".
- `EXECUTOR_MODE_IMPLEMENTATION.md` and `OVERWHELM_DETECTION_IMPLEMENTATION.md` say
  "Implementation Complete", but Issues #17 and #18 for those features are still open.
- The Document Vault bug was investigated, written up and turned into a task list
  (`TASK_LIST_LEGAL_DOCUMENTS.md`), and then left unfixed.

**Effect:** nobody can tell from the docs which features work. That is the main reason the
project feels lost.

### 2.2 The scope grew before the core worked
Within about 16 days the app grew to 31 modules, a treasure hunt, a builder console, a
scenario simulator, an AI concierge, a grief sanctuary, executor mode, QR codes, and **two
marketing sites in 6 languages** (`/` and `/marketing2`, built 2026-01-25). On 2026-01-26,
Important Documents still could not save. Each new module adds pages that nobody re-tests,
so the share of verified features kept falling.

### 2.3 Work about the work pushed out work on the product
- About 180 agent and skill definition files spread over four folders (`.agent/` 91,
  `.claude/` 45, `continuum-agents/` 43, `agents/` 4), plus `AGENT_SUGGESTIONS.md`,
  `COMPLETE_AGENT_ROSTER.md`, `MISSING_AGENTS_ANALYSIS.md` and
  `AGENT_CREATION_DEPLOYMENT_PLAN.md`.
- `UI_CONSISTENCY_STANDARDS.md` alone is 2,866 lines, and `UI_IMPLEMENTATION_PLAN.md`
  is another 1,146.
- Python scripts in `github_issues/` to create, claim and complete issues.

None of this changes what a user sees, and it used the same days the features needed.

### 2.4 Too many plans, and no single owner
At least nine competing to-do sources: `MASTER_TODO.md`, `TASK_BOARD.md` (which links to a
plan stored outside the repo, in a Gemini/Antigravity "brain" folder),
`COMPREHENSIVE_TASK_LIST.md`, `IMPLEMENTATION_PLAN.md`, `UI_IMPLEMENTATION_PLAN.md`,
`UX_IMPROVEMENT_PLAN.md`, `BUG_FIX_TASK_LIST.md`, `FIX_CHECKLIST.md`, and 26 GitHub
issues. Several agents (Antigravity, Claude web sessions, local sessions) worked in
parallel branches. The result is 15 remote branches and 4 "stash-backup" branches with
work no one has triaged.

### 2.5 Deploy problems caused heavy churn
40 of 119 commit messages are about deploy, build, Railway, nixpacks, SSL or the health
check. Railway's history shows two failed deploys on 2026-01-26, and then nothing until
2026-09-05.

### 2.6 Warning signs were ignored
- Type errors went from 245 (the saved baseline) to 288.
- `CLAUDE.md` says "wait for GitHub Actions (lint, build, type-check)", but the repo has no
  `.github/workflows`. The check it describes does not exist, so nothing was checking.

### 2.7 The environment drifted and nobody noticed
Backend dependencies are unpinned (`>=`). Production happens to run older versions that
work. A fresh install, which any redeploy does, breaks login. This explains part of the
"it worked yesterday" churn in January.

### 2.8 Duplicate paths for the same job
- **Three first-run flows:** `/onboarding`, `/start` and `/welcome`, plus two onboarding
  stores (`onboardingFlowStore`, `onboardingStore_legacy`) next to `onboardingStore`.
- **Two document systems:** `documentStore` → `/api/data/documents`, and `DocumentVault` →
  `/api/data/vault_documents`.
- **Two heirloom APIs:** `/api/heirlooms` and `/api/data/heirlooms`.
- **Duplicate store files:** `calendarStore.ts`, `visualMemoryStore.ts` and
  `advancedAssetStore.ts`. Nothing imports any of them; the app uses the `.svelte.ts`
  versions.

Each duplicate splits the fixes: a bug fixed in one copy is still present in the other.

---

## 3. The target: what "back on track" means

**Completion test (decisive):** the recipient can use what the owner prepared without the
owner there to explain it.

Run it as one fixed scenario with fake data. It is taken from the review at
`docs/reviews/2026-10-25-features-usability/REVIEW.md`:
- **Records:** one checking account with ownership and identifying details, one debt, one
  insurance policy, one PDF will with the original's location, one advisor contact, one
  household instruction, one full letter to the son, one story or lesson, one photo, one
  video, and one heirloom story.
- **Owner:** adds all of these, edits the account and the letter, hits a controlled save
  failure and retries, reloads, and previews the recipient view.
- **Recipient:** in a separate browser context, finds the starting note, the immediate
  steps, the advisor and the original's location, reads the full letter, and plays the
  media.
- **Outputs:** the screen, the binder and the PDF agree on records, values and full text.

**Acceptance for any record type:** create → every entered field returned → edit → reload
→ fetched again independently → present in the recipient view and the export. Where they
apply, also check failed-save behaviour and attachments. A screenshot or a 200 response on
its own is not acceptance.

**Owner decision (2026-10-26): a product built from Jonathan's own needs for himself and his son.** Features are generic: the recipient view is built for *a person the owner names*. The son is the first recipient and the acceptance scenario. Recipient and executor are separate flags on a contact.

## 4. The plan (order changed after the 2026-10-25 review)

Issue IDs (CU-0xx) refer to the review's issue register.

**Phase A — Stable ground.**
- Pin the backend to production's full resolved set (`pip freeze`) plus Python 3.11.
  *Why:* pinning only the direct dependencies still lets the indirect ones drift.
- Fix the stale CI line in `CLAUDE.md`.
- Write a smoke script that sends **the payload the UI actually sends** and compares the
  fields that come back. *Why:* model-shaped payloads miss exactly the frontend/backend
  mismatches the review found (CU-001).

**Phase B — Shared contracts first, one owner per area.**
- Field-name conversion and serialization (CU-001).
- Collection vs. singleton responses (CU-006, CU-011).
- Category membership for Asset rows (CU-004).
- Save-state truth and activity-log isolation (CU-013).
- Store initialization (CU-014).

*Why:* these are shared code. Parallel per-module agents would each invent their own
workaround for the same defect.

**Phase C — Dependable records for the scenario.**
- Financial accounts with every field.
- Documents with a real PDF and metadata (CU-002).
- Letters as stable, editable drafts to a named recipient (CU-008).
- Journal, ethical will and lessons (CU-007).
- One file path for PDF, image, audio and video (CU-010).
- Time capsule (CU-009) and final wishes (CU-011).

*Why:* these are the records the completion test uses. Legacy is core from the start, not
deferred to a later phase as the first draft of this plan had it.

**Phase D — The handover.**
- One export snapshot that both the binder and the PDF read from (CU-003).
- The recipient start page, plus an owner preview of the same page (CU-005).
- Persistent executor steps (CU-015).
- Honest readiness numbers: no "100% protected" on an empty vault (CU-012).

*Why:* without this, every module can pass and the handover still fails.

**Phase E — Polish what was proven.**
- Navigation that puts legacy and finances first (CU-018).
- Form simplicity (CU-019).
- Labels on simulated features (CU-020).
- Early-preview labels on the extras.
- Duplicate cleanup.
- The remaining type errors.
- Desktop keyboard usability (the desktop part of CU-025). **This build is desktop-only (owner decision 2026-10-26); phone, tablet and other devices come in a later build.**

**Phase F — Security, admin and operations. Out of scope for this upgrade (owner decision: features and functionality only).** Listed so nothing is lost:
- **Rotate the exposed OpenRouter key now.** It's an owner step in the dashboard and takes
  minutes.
- Server-side AI calls.
- Production environment variables.
- Untrack the committed `.db` files.
- The bypass, only when asked.

**Not a phase:** Pulse, QR, scenarios, analytics and builder tools stay reachable, with
early-preview labels. They no longer decide when the project counts as "usable".

**Execution (owner decision 2026-10-26):** subagents code every phase, A through E, each in its own worktree, which is removed after merge. The orchestrator reviews by diff only. Then one deploy of everything, then a full browser test of everything, including the completion test. Defects loop back through the same steps. Two read-only oversight agents report on every wave: O1 for DB and API speed, O2 for the desktop UI. They never block. The coding session's goal is "A–E complete". Older rules are guidance and may be bypassed when that is better for the software (see the execution plan, owner decisions).

Durations are not estimated until Phase B has scoped the shared defects.

## 5. Documentation move (done 2026-10-25)

All project Markdown is in `/docs`:
- current guides in `docs/`;
- history in `docs/archive/`;
- old agent specs in `docs/agent-specs/`.

`CLAUDE.md`, `.claude/` and `.agent/` stay where they are, because tools load them by path.

## Completion test status

| Step | Status | Evidence |
|---|---|---|
| Account with all fields round-trips | ❌ CU-001 | review api-probes.json |
| PDF will with original location saves | ❌ CU-002 | 400 `vault_documents` |
| Letter to son, edited, no duplicate | ❌ CU-008 | review source trace |
| Photo and video retrievable from a second context | ❌ CU-010 | review source trace |
| Controlled save failure keeps the draft and offers retry | ❌ CU-013 | review browser screenshot |
| Owner preview of the recipient view | ❌ CU-005 | not built |
| Recipient finds note, steps, advisor and original | ❌ CU-005 | not built |
| Screen, binder and PDF agree | ❌ CU-003 | binder omits accounts |
