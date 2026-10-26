# Continuum — Project Recovery Plan

**Last Updated:** 2026-10-26 00:22 EST

**Execution:** task cards for each phase are in [RECOVERY_EXECUTION_PLAN.md](RECOVERY_EXECUTION_PLAN.md).

**Scope:** Features and the user's experience come first. Security, admin, CI and
infrastructure hardening are listed in Phase 6 and wait until the core features work.
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
| Backend on production's library versions | Starts, login works, and **every module's data loads (GET 200)**. | Local server pinned to production's `pip freeze`, then every frontend sync endpoint called |
| Backend on the *latest* library versions | **Login and sign-up crash** with `Datetime values must have timezone information`. `requirements.txt` uses `>=`, so the next redeploy installs these versions. | Same test on a fresh install (SQLModel 0.0.48 / SQLAlchemy 2.1.6; production has 0.0.42 / 2.0.52) |
| Important Documents (a "What Matters Most" module) | **Broken.** `DocumentVault.svelte` syncs to `/api/data/vault_documents`. The generic `/api/data/{type}` route catches that path first and returns `400 Invalid type: vault_documents`. Documents never reach the server. | Local API call; same root cause as `INVESTIGATION_REPORT_LEGAL_DOCUMENTS.md` (2026-01-26), which was diagnosed but never fixed |
| Modules | 31 module routes, 74 pages in total, 60 store files, 187 Svelte components | `find` |
| Planning documents | 63 Markdown files at the repo root, about 20 of them titled "Complete" | `ls *.md` |
| Unmerged work | 15 remote branches, 4 of them `stash-backup/*` | `git branch -r` |
| Open GitHub issues | 26 | `gh issue list` |

What was **not** measured: a click-through of each page in a real browser. Browser
automation was refused in this session ("Claude Code is running in don't ask mode"),
so Phase 1 starts with that click-through.

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

### 2.5 Deploy problems took a third of the effort
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

## 3. The plan

Order: protect what works → find out what works → fix the core user journey → widen it
outward. Each phase ends with something a user can see working.

### Phase 0 — Stop the ground moving (half a day)

**R0.1 Pin backend dependencies to the versions production runs now.**
Replace `>=` in `backend/requirements.txt` with the exact versions from production's
`pip freeze` (captured this session: FastAPI 0.141.1, SQLModel 0.0.42,
SQLAlchemy 2.0.52, Pydantic 2.13.5, and others).
*Why:* this is a feature fix, not a security one. With the current file, the next deploy
breaks login and sign-up for every user (reproduced above). Pinning makes production and
every developer machine run identical code. Upgrading later becomes a deliberate step,
not an accident.

**R0.2 Make this document the single plan, and archive the rest.**
The old plan and report files move to `docs/archive/` (done in this commit). Status lives
in one table: the Feature Status table in Phase 1.
*Why:* cause 2.4. When nine lists disagree, the effect is the same as having none. They
are archived, not deleted, so the history stays searchable.

**R0.3 Correct the stale instruction in `CLAUDE.md`** that says to wait for GitHub
Actions. It should say "run `npm run check` and `npm run build` yourself before you
deploy."
*Why:* cause 2.6. An instruction pointing at a check that does not exist trains every
session to skip checks. This is a manual step, not a gate; nothing gets blocked.

### Phase 1 — Find out what actually works (1–2 days)

**R1.1 Click through every core journey in a browser, and record pass or fail in one
table.**
The journeys: sign up → onboarding → dashboard → add, edit, reload and remove one item in
each of the seven "What Matters Most" modules (Financial Security, Protection & Insurance,
People Who Matter, Important Documents, Health & Care, Home & Keys, Wellness Check-in).
Each item is checked twice: once after a page reload, and once in a second browser to
prove the data came back from the server.
*Why:* cause 2.1. Only a real save → reload → other-device test shows whether a user's
data is safe, and that is the promise of this product. API tests passed for most modules
here, but they cannot catch a button that never sends the request.

**R1.2 Keep a Feature Status table at the bottom of this file** with columns Module |
Loads | Saves | Survives reload | Second device | Last checked. A module is "done" only
when every column passes, with the date it was checked.
*Why:* this replaces the "Implementation Complete" documents with something anyone can
re-check in a minute.

### Phase 2 — Make the core journey solid (about 1 week)

**R2.1 Fix Important Documents saving.**
Choose one of two fixes:
- point `DocumentVault` at the working `documents` endpoint, or
- add `vault_documents` to `MODEL_MAP` in `backend/routers/estate_data.py` (a one-line
  alias, the same pattern already used for `future_letters`).

Then retire the second document path (R5.2).
*Why:* this is one of the seven core modules, and right now it silently does not save.
For a user organising a will or trust, that is the worst possible failure: the screen
looks saved, but nothing is stored. The fix is small and was diagnosed nine months ago.

**R2.2 Pick one first-run flow and route every entry point to it.**
Keep `/onboarding`, the newest (PR #43). Point `/start` and `/welcome` at it, and leave
their code in place.
*Why:* cause 2.8. Today, where a new user lands depends on which link they clicked, and
each flow writes different store keys. One path means one thing to test and one first
impression. No feature is lost, because the old pages stay reachable.

**R2.3 Clear the type errors in the files the core journey touches first.**
The errors cluster in `lib/components/concierge` (33), `lib/components/onboarding` (26),
`lib/components/modules` (13), `dashboard` (10), `heirlooms` (11), `property` (10),
`pets` (10) and the root layout (9). The most common single error, `'$t' is of type
'unknown'` (78 times), is one typing fix in the translation store.
*Why:* in a Svelte 5 app, many of these errors are exactly the "button does nothing" and
"`.update` is not a function" bugs that `BUG_FIX_TASK_LIST.md` chased one at a time.
Fixing the `$t` type alone removes about a quarter of all errors. This is a manual
cleanup, not a new build gate.

**R2.4 Make save failures visible to the user.**
In `SyncManager`, when the server rejects a save, show the gentle notification that
already exists ("We couldn't save that just now…") and keep the item marked "not yet
saved". Do not show it as saved.
*Why:* the Document Vault bug went unseen because optimistic updates hide server
rejections. For end-of-life records, a quiet failure is worse than a visible one. This
uses the existing `errorHandler` and `notificationStore`, so it adds no new system.

**R2.5 Write `scripts/smoke_test.py`**: log in, then create, read and delete one item per
core endpoint, and print a pass/fail table. Run it by hand before each deploy.
*Why:* it gives the API-level half of R1.1 in 10 seconds, so problems like the Document
Vault one show up the same day. It is a script you choose to run; it is **not** wired into
deploys or commits.

### Phase 3 — The "When You're Ready" and "Life & Legacy" modules (1–2 weeks)

**R3.1 Run the same Phase 1 test on Subscriptions, Pet Care, Property, Digital Accounts,
Letters, Heirlooms, Life Journal, Visual Memories, Time Capsule, Timeline, Final Wishes and
Family Tree.** Fix them in order of how often a real user would reach them: navigation
order first.
*Why:* these are the next-most-visible pages. With the core solid, every fix here is
user-visible improvement rather than more surface area.

**R3.2 Finish media upload for Visual Memories, Time Capsule and Heirlooms.**
`mediaStorage.ts`, `mediaMigration.ts` and `indexedDB.ts` still keep files in the
browser.
*Why:* photos and recorded messages that live only in IndexedDB are lost when the
browser's storage is cleared, or when the user switches devices. For a legacy product,
those are the irreplaceable items.

### Phase 4 — Extras: keep them, label them honestly (2–3 days, then ongoing)

**R4.1 Keep Treasure Hunt, Builder Tools, Future Scenarios, Practice Run, QR Codes,
Insights, Complete Record and Event Calendar.** Until each one passes the Phase 1 test,
show it only under "Explore All Features" with a small "early preview" label. Remove the
label module by module as each passes.
*Why:* this keeps every feature, as instructed. It also stops unverified pages from being
a new user's first impression. The navigation already has an "Extras" group, so this
needs a flag, not a redesign.

**R4.2 Hold new modules and new marketing pages until Phase 3 is green.**
*Why:* cause 2.2. Each new module adds untested pages faster than they get fixed.
Pausing is cheaper than adding and then repairing.

### Phase 5 — Remove duplicates without losing features (2–3 days)

**R5.1 Move the three unused store files** (`calendarStore.ts`, `visualMemoryStore.ts`,
`advancedAssetStore.ts`) into `frontend/src/lib/stores/_archive/`.
*Why:* nothing imports them, but they register the same sync keys against different
endpoints. That is a trap: the next person to import one by mistake gets diverging data.
Moving them keeps the code without leaving the trap. (Confirm before moving; this plan
does not do it.)

**R5.2 Settle on one document system and one heirloom API.** Have the other path forward
to it.
*Why:* duplicate paths split fixes (cause 2.8). Forwarding keeps old links and data
working.

**R5.3 Triage the 15 remote branches.** For each one: merged already (squash), or work to
cherry-pick? Then delete the merged ones under the git standing authorisation.
`feature/phase-3-persistence` (22 commits ahead) and `stash-backup/2026-01-26-34780fe`
(20 ahead) come first.
*Why:* feature work may be sitting there unseen. Until they are triaged, nobody knows
whether a "missing" feature was ever built.

**R5.4 Merge the four agent folders into `.claude/agents/` only**, and move the
`.agent/` (Antigravity) copies to the archive if you no longer use Antigravity.
*Why:* cause 2.3. The same agent has up to four diverging definitions. One copy is easier
to keep accurate.

### Phase 6 — After the features: security, admin, operations

Listed so nothing is lost. Do not start these before Phase 3.

- **Rotate the OpenRouter key and move AI calls server-side (one item that should not
  wait).** `VITE_OPENROUTER_API_KEY` is compiled into the public JavaScript on
  continuum.estate (confirmed in `chunks/C5_VTep5.js`). Anyone can copy it and run up
  charges on your OpenRouter account. Rotating it takes minutes in the OpenRouter
  dashboard. Moving the calls server-side is a feature change for the AI Concierge.
- Set `ENVIRONMENT=production`, `JWT_SECRET_KEY`, `SECRET_KEY`, `FRONTEND_URL`, `RP_ID`
  and `ORIGIN` on Railway. Production currently reports `"environment":"development"`, and
  the repo with the default JWT secret is public.
- The `jh@continuum.estate` login bypass: left alone, as `MASTER_TODO.md` records your
  instruction, until you ask for it to be removed.
- SQLite `.db` files committed to a public repo (`dev.db`, `backend/continuum*.db*`).
- The remaining `MASTER_TODO.md` security, testing and polish items, and GitHub Issues
  #10 and #20–#38.

---

## 4. How to measure that the project is back on track

1. The Feature Status table shows all seven core modules passing on four checks, with
   dates.
2. `npm run check` stays below its last recorded count on every change, and trends toward
   zero.
3. One plan (this file), one onboarding path, one document system.
4. A redeploy changes nothing unexpected (pinned dependencies).

---

## 5. Documentation move (done with this plan)

All project Markdown now lives in `/docs`:
- `docs/` holds current reference guides.
- `docs/archive/` holds dated reports, completed or obsolete plans, and old task lists.
- `docs/agent-specs/` holds the former `agents/` and `continuum-agents/` folders.

References in agent and command files were updated to the new paths.

**Left in place on purpose**, because tools load these by their exact path:
- `CLAUDE.md`: Claude Code reads project instructions only from the repo root.
- `.claude/**` and `.agent/**`: agent, skill and command definitions that the tools load
  from those folders. Moving them would turn the agents off.
- Markdown inside `node_modules/`: third-party package files, not project docs.

---

## Feature Status (fill in during Phase 1)

| Module | Loads | Saves | Survives reload | Second device | Last checked |
|---|---|---|---|---|---|
| Dashboard | | n/a | n/a | n/a | |
| Financial Security | | | | | |
| Protection & Insurance | | | | | |
| People Who Matter | | | | | |
| Important Documents | | ❌ API 400 | | | 2026-10-25 (API) |
| Health & Care | | | | | |
| Home & Keys | | | | | |
| Wellness Check-in | | | | | |
| Onboarding | | | | | |
