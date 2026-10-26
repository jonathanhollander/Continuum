# Continuum — Recovery Execution Plan (subagent-run)

**Last Updated:** 2026-10-26 03:35 EST

The how and the order for [PROJECT_RECOVERY_PLAN.md](PROJECT_RECOVERY_PLAN.md) (phases A–F).
Issue IDs (CU-0xx) and their evidence are in
[the review](reviews/2026-10-25-features-usability/REVIEW.md). **This file is the only task
board, and it is the live checklist** (decision 9).

---

## Owner decisions (2026-10-26, confirmed)

1. **Product:** a product built from Jonathan's needs for himself and his son. Features are generic ("designated recipient"); the son is the first recipient and the acceptance scenario.
2. **Features and functionality first.** The build (Waves A–E) is features only; security, admin and other out-of-build bugs go to the separate Wave X track (decision 12). Recipient access is the simplest owner-issued link, with no permissions system.
3. **Execution model:**
   - Subagents code **all** cards, Waves A–E.
   - The orchestrator reviews **by diff only**.
   - Then **one deploy of everything**, then a **full browser test of everything**.
   - Defects go round the same loop.
4. **Rules are guidance.** Older rules may be bypassed when that is better for the software; note it in the commit. Merged branches may be deleted. Still kept:
   - no force-push to main;
   - no destructive operations on production data (mixed records need an owner yes);
   - no messages to real people;
   - no spending;
   - the `jh@continuum.estate` bypass stays.
5. **Goal:** at the start of coding, set the session goal "Waves A–E complete", and stay on it until Wave E and the rehearsal are done.
6. **Worktrees:** every coding agent works in its own worktree, at `.worktrees/<card-id>` inside this repo (`AGENTS.md` placement rule; never sibling folders). After merge, remove the worktree and delete its merged branch.
7. **Desktop UI only** for this build: 1280px wide and up, tested at 1440×900. Phone, tablet and other devices come later; mobile defects are not failures now.
8. **Oversight agents:**
   - O1 watches DB and API speed.
   - O2 watches the desktop UI.
   - They report on every wave and at release, and never block.
9. **Mark off as you go.**
   - The orchestrator (the administering session) marks each card off in this file as it completes, and only after verifying it.
   - A card is ☑ only when its agent reported done **and** the orchestrator's diff review confirmed the acceptance.
   - Each wave heading gets ✅ when all its cards are ☑.
   - The plan sections (A–E, O1/O2, R0, Release) are marked the same way.
   - The file is committed with each tick, so its state is always current.

10. **Trust no existing code.** This code was written months ago by less capable agents.
    - **Every subagent reads in full** the files it changes *and* the code around them: the callers and callees of each changed function, the store, mapper, endpoint and model on both sides of each data path, and the components that render the result. It checks all of that for bugs, not just the lines it edits.
    - **Surrounding-code bugs** that affect the card's journey are fixed when they're small and inside the card's path, and listed in the report. Larger ones, or ones in files another card owns, are reported as new cards (so parallel agents don't clash).
    - **The orchestrator's diff review** reads the code around each diff too (callers, callees, both sides of the data path) to catch side effects, without re-running the agent's work.
    - **Never assume something works** because a doc, comment or "COMPLETE" file says so.

11. **Tests: pinpointed, targeted, never endless. The owner prefers no tests.**
    - **Default: write no tests.** No test files, test scripts, fixtures or suites.
    - **Any written test** must be pinpointed at one defect or contract, ponytail-sized, and **approved by the orchestrator before it is written**. The approval carries a full justification: what it checks, why a single manual proof run isn't enough, and when it will be run. It is recorded in the Test register.
    - **After it is written**, its Test register entry is completed with the file, a full explanation of why it was needed, how to run it, and whether to keep or remove it.
    - **Running checks:** each card is verified by **one** targeted run of its proof scenario. No repeated runs until something passes, no whole-suite sweeps, and no re-testing finished cards without new evidence. O1 measures only the endpoints a wave touched. R0 runs once. The release browser test runs once, plus targeted re-checks of fixed defects only.

12. **Out-of-build bugs: a separate subagent track, Wave X** (owner, 2026-10-26: "assign a separate subagent tasked with fixing bugs you feel are outside the build. the subaegnts shouold fix and you approve. Include in loop").
    - **Intake:** every bug found that is outside the build — the former Wave F items, and any surrounding-code finding that isn't fixed on its card's path and isn't a build card — becomes an X card. Nothing is just "logged".
    - **Who fixes:** one dedicated subagent per X card, in its own `.worktrees/X<n>`, with the same brief template, ponytail and test rules.
    - **Who approves:** the orchestrator, by diff review (same as build cards), then merge, clean up, tick.
    - **When:** X cards run in parallel with the build waves whenever their owned files are not owned by a build card in flight. They ship in the same single release.
    - **In the loop:** every loop run advances Wave X as well as the build.

## Test register (decision 11)

Every written test is listed here: approved before it is written, and completed after. There are no other tests.

| ID | File | Approved by / when | What it checks (one thing) | Full justification: why it's needed and why a manual proof isn't enough | How and when it's run | Keep or remove |
|---|---|---|---|---|---|---|
| T-A3 | `scripts/smoke_test.py` (to be written in card A3) | Orchestrator, 2026-10-26 (planned; confirm at A3) | For each completion-scenario record type, the UI's real payload survives a save and re-fetch, field by field | The review proved that fields silently disappear after a "successful" save (CU-001), and that endpoints reject the UI's payload while model-shaped probes pass (CU-002, CU-009). Waves B and C all change that shared save path. Without one script, every card would re-probe by hand, which is more testing, not less, and inconsistent. It reuses the review's existing `reproduce_api_probes.py` rather than adding new code. Run by hand only; never wired into commit or deploy. | By hand: once per B or C card that touches the save path, and once in R0 | Keep until the release pass is green, then decide |

## Progress tracking (decision 9)

| Mark | Meaning | Who sets it |
|---|---|---|
| ☐ | Not started | — |
| ▶ | Dispatched; the agent is working in `.worktrees/<card-id>` | Orchestrator, at dispatch |
| ◐ | The agent reports done; awaiting diff review | Orchestrator, on the agent's report |
| ☑ | Verified: the diff matches the acceptance, merged, worktree cleaned up | Orchestrator, after review and merge |
| ↺ | Reopened: evidence shows the acceptance was unmet or something regressed | Orchestrator, with the evidence |
| ⏸ | Stopped: bigger than the card; the agent's findings are recorded | Orchestrator |

- Every ☑ row records its **commit hash** and **one line of proof** (what was verified).
- A wave heading gets **✅** and a date when every card in it is ☑.
- The **Section status** table below gets the same mark.
- This file is updated and committed **at each change of mark**, with commit messages like `plan: tick B2`, so any session or person can see exactly where the work stands.
- No mark ever moves to ☑ on an agent's word alone.

## Rules (ponytail; guidance, see decision 4)

- **One card, one job.** The smallest change that meets the card's acceptance, then stop.
- **One proof scenario** that covers *every* acceptance condition. A screenshot or an HTTP 200 alone is not proof.
- **Behaviour fixes are allowed** when a type error hides a real bug. Fix it inside the card's files; don't cast it away.
- **Scope stop.** If the job is bigger than the card, report and stop (⏸).
- **New cards** come from proven defects (browser, API or source trace) or from missing required functionality.
- **Reopen a card** (↺) on evidence that its acceptance was unmet, or that it regressed. Never just to re-check.
- **No blockers.** No gates, hooks, CI steps, required checks, locks or approval files.
- **No feature removal.** Code may be moved, forwarded or labelled; every feature stays reachable.
- **Synthetic data only** in tests, in throwaway databases.
- **Desktop only.** Keep DB and API calls fast.
- **Tests (decision 11):** none by default. A written test needs prior orchestrator approval and a Test register entry. Verify with one targeted proof run.

## Orchestration loop

**Coding pass (Waves A–E, no deploys):**
1. Set the session goal (decision 5).
2. For each card:
   - Create its worktree: `git worktree add .worktrees/<card-id> -b card/<card-id> main` (on the latest `main`).
   - Dispatch the agent with that path as its working directory. Run each wave's parallel cards in one message, following the wave order below.
   - Mark the card **▶**.
3. Each agent runs its own local proof scenario on synthetic data and reports its files and proof. Mark the card **◐**.
4. **Review by diff only.** Reject any test file that has no approved Test register entry. Read `git -C .worktrees/<card-id> diff main` against the card: scope, owned files, the acceptance conditions it claims, no feature removed. **Also read the code around each hunk** (callers, callees, both sides of the data path) for side effects and bugs the change exposes (decision 10). Check the agent's surrounding-code findings, and turn the larger ones into cards. Merge if it's good. If not, send it back citing the specific diff lines (the card stays ◐).
5. Commit with the card ID and push. Then:
   - **Clean up:** `git worktree remove .worktrees/<card-id>`, `git branch -d card/<card-id>`, and `git worktree prune` at the end of each wave.
   - **Mark the card ☑** with its commit and proof, and commit this file.
6. **Wave X (decision 12):** on every pass, dispatch any X card whose owned files are free, and review/merge finished ones the same way. Every new out-of-build finding becomes an X card in the same turn.
7. **Oversight:** at the end of each wave, run O1 and O2 in parallel on the wave's merged diff. Their proven findings become cards in the next wave. Then mark the wave heading **✅**.

**Rehearsal (end of the coding pass, still local):**
8. **R0:** a validation subagent runs the full completion test (owner context and recipient context) against the merged `main`, built and served locally on synthetic data.
   - It records each step pass or fail, with evidence.
   - Each failure becomes a card and goes through the same loop.
   - This is the last part of finishing the coding pass, not an approval step. Per-card proofs can pass while the merged app fails, and fixing that locally is cheaper than fixing it after deploy.

**Release pass (once):**
9. Run `npm run check` and `npm run build`, then `railway up`. Poll `/api/health` until the new version is live, and confirm the pinned versions with `railway ssh -- /opt/venv/bin/pip freeze`.
10. **Full browser test on production, desktop 1440×900:**
   - the completion test, in owner and recipient contexts;
   - every module: load, save, edit, reload, second-context retrieval;
   - the binder, the PDF and the download copy.
   - O1 produces the full timing table, and O2 screenshots every page.
11. Each proven defect becomes a card and goes round worktree → code → diff review → merge and clean up → deploy → browser test, until everything is green. Then mark **Release ✅**.

### Oversight agents (decision 8)

Read-only and report-only; they never gate anything. A finding becomes a card only if it was measured or seen. One report per wave, listing only what is new.

**O1 — DB and API speed** (`performance-monitoring` agent)
- **Each wave, from the merged diff:** flag
  - queries inside loops (N+1);
  - queries not filtered on an indexed column (`user_id`, primary key);
  - list endpoints with no limit;
  - page loads that fire requests one after another when they could run in parallel;
  - syncs that fire on every keystroke.
- **Measure:** on a local server with about 200 synthetic records per type, call each touched endpoint 20 times. Report p50 and p95, plus queries per request (SQLAlchemy echo).
- **Targets (reported, not gated):** reads ≤ 150 ms p95, writes ≤ 300 ms p95, query count flat as records grow, module data visible ≤ 1 s after navigation.
- **Release:** the same table for every endpoint the frontend calls, plus the 5 slowest read-only GETs on production.
- **Report columns:** endpoint | p50 | p95 | queries | over target? | cause (file:line) | smallest fix.

**O2 — The UI** (`ui-debugger` agent)
- **Each wave:** for each page the wave touched, take before and after screenshots at 1440×900, same size. Report pixel-level changes:
  - layout shift, overlap, clipping;
  - broken or missing controls;
  - mismatch with neighbouring modules;
  - console errors;
  - wording that clashes with `docs/TONE_GUIDE.md`.
- **Also check:** legacy and finance entry points are easy to find, nothing disappeared from navigation, and empty, loading and failed-save states are clear.
- **Release:** every page in the route inventory at 1440×900, each with a pass/fail note.

### Agent brief template

```
Card <ID> (<CU ids>): <title>. Work ONLY in: /Users/jonathanhollander/AI Code/Continuum/.worktrees/<card-id>
Stack: SvelteKit 5 runes, FastAPI/SQLModel. Read first: the CU entries in docs/reviews/2026-10-25-features-usability/REVIEW.md, and AGENTS.md "Persistence and feature invariants".
You own: <exact file paths, plus a migration if listed>. Edit nothing else. Do not edit docs/RECOVERY_EXECUTION_PLAN.md; the orchestrator marks progress.
Smallest change: <what>.
Acceptance (prove all in one scenario): <conditions>.
Trust no existing code (decision 10): before changing anything, read in full the files you change and the code around them (callers, callees, the store/mapper/endpoint/model on both sides of the data path, the components that render it), and check it all for bugs. Fix small bugs on this card's path and list them. Report bigger ones, or ones in files you don't own, as new-card findings. Don't trust docs, comments or COMPLETE files.
Tests (decision 11): the owner prefers NO tests. Do not write any test file, script or fixture unless the orchestrator approved it beforehand with full justification. If you believe one is essential, stop and ask, giving: what it checks (one thing), why one manual proof run isn't enough, and when it runs. Verify your card with ONE targeted run of its proof scenario. No repeated runs, no suite sweeps, no endless testing.
Ponytail: smallest change, one proof scenario, stop. No gates/hooks/CI. No feature removal. Synthetic data only.
Desktop UI only (1280px+); don't add or change phone/tablet layouts. Keep DB/API calls fast: no queries in loops, filter on indexed columns, no unbounded lists.
If it's bigger than this card, stop and report.
Report: files changed, proof output (the one run), any test written (with its approval reference), surrounding code read (list), surrounding bugs fixed, surrounding bugs reported as new cards, done or stopped (why).
```

---

## Wave A — Stable ground (A0 first, then A1–A3 in parallel)

| ID | Card | Agent | Owns | Change | Acceptance |
|---|---|---|---|---|---|
| A0 | Worktree folder | orchestrator | `.gitignore` | Add `.worktrees/`. | `git check-ignore .worktrees/x` matches |
| A1 | Pin the full backend set | `general-purpose` | `backend/requirements.txt`, `nixpacks.toml` | Pin production's full `pip freeze`; keep `python311`. | A fresh 3.11 venv installs, the dev user seeds, login returns 200 |
| A2 | Stale CI line | `general-purpose` | `CLAUDE.md` (Deployment) | "Run `npm run check` and `npm run build` by hand." | One-line diff |
| A4 | Backend starts locally (from A1 findings) | `general-purpose` | `backend/main.py` (the `__main__` block and the static mounts only) | `uvicorn.run("backend.main:app")`; mount `frontend/dist` folders only when they exist | From the repo root, `python -m backend.main` starts with no `frontend/dist`, and login returns 200 |
| A5 | Surrounding bugs from A1/A4 (decision 10) | `general-purpose` | `backend/auth.py`; `seed_dev_user` and the `__main__` block in `backend/main.py` | Seed failures logged with traceback; remove the no-op passlib "fix"; timezone-aware JWT expiry; local reload watches `backend/` only | Fresh DB: seed + login 200; an existing bcrypt-format hash verifies; token `exp` decodes correctly |
| A3 | UI-payload smoke script (written test T-A3; see Test register) | `general-purpose` | `scripts/smoke_test.py` (new) | Reuse `docs/reviews/.../evidence/reproduce_api_probes.py`. Send each store's real payload (after `toSnake`), re-fetch, and diff every field. Cover every completion-scenario record type. | It reproduces CU-001, CU-002, CU-004 and CU-009 as failures, and journal/home-access as passes |

## Wave B — Shared contracts (one at a time: B1 → B2 → B3 → B4 → B5)

| ID | Card | CU | Agent | Owns | Acceptance (A3 script plus one browser save) |
|---|---|---|---|---|---|
| B1 | Explicit field contracts | 001 | `api-contract-validator` | `frontend/src/lib/services/sync.svelte.ts` (key conversion), the Asset-family mappers in `frontend/src/lib/stores/{financialAssetsStore,propertyStore,digitalAssetsStore,subscriptionStore}.svelte.ts`, field aliases in `backend/estate_models.py` | Every displayed writable field on financial, property and subscription survives create, edit, re-fetch and reload, including 0 and empty values; custom-field keys are preserved |
| B2 | Category membership | 004 | `fastapi-development` | `backend/routers/estate_data.py`, and an Alembic migration adding a category column if needed | Each of properties, digital assets and generic heirlooms lists only its own rows after create, update and delete; existing mixed rows are reported, and **not migrated on production without an owner yes** |
| B3 | Singleton vs. collection | 006, 011 | `fastapi-development` | `SingletonSyncManager` in `sync.svelte.ts`; `/api/estate/profile` in `backend/main.py`; the `funeral_data` and `advanced_assets` handling in `estate_data.py` | Repeated saves update one record; profile settings merge rather than replace each other; the UI always receives an object |
| B4 | Truthful save state | 013 | `error-handling-standardization` | Status handling in `sync.svelte.ts`; `frontend/src/lib/stores/activityLog.svelte.ts`; the activity-log model ID default | A forced failure shows one failure message, keeps the draft and offers retry; an activity-log failure never marks a successful save as failed; one success shows one message |
| B5 | Store initialization | 014 | `frontend-state-cleanup` | `registerSync`, `getRegistry` and `syncAll` in `sync.svelte.ts`; the callers in `frontend/src/routes/+layout.svelte` | A direct visit, a reload, and logout/login all show the right records; a second browser context fetches the same estate |

## Wave C — Dependable scenario records (C6 → C2 → then C1, C3, C4, C5, C7 in parallel)

| ID | Card | CU | Owns | Acceptance |
|---|---|---|---|---|
| C6 | Translation stores (first, because callers span screens) | — | `frontend/src/lib/stores/localization.ts`, the `t` export in `conciergeStore.svelte.ts`, and every file that imports either `t` | Settle the two interfaces: keep the callable translator, and rename the dictionary export (e.g. `dict`). Update every caller. Proof: each caller's page renders its text, with no `$t` errors left |
| C2 | Files and media (second, because C1 and C5 depend on it) | 010 | `frontend/src/lib/services/mediaService.ts` (auth key → `continuum_auth_token`), `frontend/src/lib/utils/mediaStorage.ts`, `frontend/src/lib/services/mediaMigration.ts`, `frontend/src/lib/components/FileUploader.svelte`, `backend/routers/media.py` | A PDF, an image, an audio clip and a video upload, then download or play in a second context; local IndexedDB originals are kept until that retrieval succeeds |
| C1 | Documents | 002 | `frontend/src/lib/components/archetypes/DocumentVault.svelte`; the `Document` model in `backend/estate_models.py` plus an Alembic migration for the new metadata columns; the `documents`/`vault_documents` mapping in `estate_data.py` | A real PDF (via C2) *and* a physical-only document, with title, category, witnesses, review date, original location and custom fields; edit, reload and download from a second context |
| C3 | Letter to a named recipient | 008 | `frontend/src/routes/modules/letters/+page.svelte`, `frontend/src/lib/stores/letterStore.svelte.ts`, the `Letter` model plus a migration if fields are missing | Recipient picked from contacts; reopening a draft edits it with no duplicate; full text survives reload. **Release behaviour:** a letter is visible in the recipient view immediately, unless the owner marks it "Hold". A future date or condition is stored and shown, labelled "Automatic delivery isn't available yet". The scheduled feature is kept and labelled, not faked |
| C4 | Journal, ethical will, lessons | 007 | The ethical-will and life-lessons components under `frontend/src/lib/components/`, and `journalStore.svelte.ts` | They save, edit and reload through the existing `JournalEntry` types; no sample text is ever saved automatically |
| C5 | Time capsule | 009 | `frontend/src/routes/modules/time-capsule/+page.svelte`, `frontend/src/lib/stores/timeCapsuleStore.svelte.ts` | Text and video capsules (video via C2) create, edit and reload; the media plays in a second context; the locked/released lists are accurate |
| C7 | Verify the rest of the scenario's records | — | **Verify only:** debt (financial), insurance policy, advisor contact, household instruction (home manual), heirloom story, final wishes | Each passes create → every field returned → edit → reload → second context. Failures become C7.x fix cards that own only that module's route and store files |

## Wave D — The handover (D1 → then D2, D3, D4 in parallel)

| ID | Card | CU | Owns | Acceptance |
|---|---|---|---|---|
| D1 | One export snapshot, two outputs | 003 | `frontend/src/lib/services/exportService.ts`, `frontend/src/routes/binder/+page.svelte`, `frontend/src/routes/export/preview/+page.svelte`, and one snapshot builder (new; the backend endpoint `GET /api/export/snapshot` is preferred, so D2 can reuse it) | Both outputs come from one snapshot. **(a) Readable packet** (print/PDF): every scenario record, full text, correct names. **(b) Download copy** (zip): the packet plus the actual media and document files, with a manifest. **Compare contents, not counts:** record IDs, names, values, full text and attachment files match the screens one for one |
| D2 | Recipient start page and owner preview | 005 | A new route `frontend/src/routes/for/[token]/+page.svelte`; recipient and executor flags on the contacts model plus a migration; owner-issued link endpoints (create and revoke) in `backend/routers/contacts.py` or a new `backend/routers/recipient.py`; a token-scoped read of D1's snapshot and of media files (`backend/routers/media.py`) | In a fresh browser context with **no owner session**, the link loads the correct owner's start page: the note, immediate steps, contacts, original locations, letters (except held ones) and playable media; the recipient can download the D1 copy; the owner's preview renders the same page. A simple link, with no permissions system |
| D3 | Persistent executor steps | 015 | `frontend/src/routes/modules/executor-toolkit/+page.svelte` and a store using the generic data API | Completed steps and notes survive a reload and link to the records each step needs |
| D4 | Honest readiness | 012 | `frontend/src/lib/utils/readiness.ts`, the `estateAudit` source, the vault score in `DocumentVault.svelte` (**after C1 merges**), the financial trend display | An empty state reads "not started"; there are no invented trends; summary totals match the detail lists |

## Wave E — Polish what was proven (E1 → then E2–E7 in parallel → E8)

| ID | Card | CU | Owns | Acceptance |
|---|---|---|---|---|
| E1 | Navigation: legacy and finance first | 018 | `frontend/src/lib/config/navigation.ts`, the sidebar component, and the dashboard summary links | My Legacy, My Finances, My Instructions and For My Son (preview) are top-level; the dashboard "Accounts" link goes to financial accounts; every existing link is still reachable |
| E2 | Early-preview labels | — | `isPreview` on `NavItem` in `navigation.ts` (after E1), and the catalog item render in `frontend/src/routes/catalog/+page.svelte` | Pulse, QR, scenarios, simulator, analytics, builder and treasure hunt show an "early preview" tag; all links work |
| E3 | Forms | 019 | The shared form and module-header components (`frontend/src/lib/components/modules/*`) | Short headings with clear add/edit actions, optional guidance collapsed, no literal "financial" title bug; same labels in the sidebar and the page |
| E4 | Simulated-feature labels | 020 | `visionService`, `legalService`, the letters voice simulation, and the "Simplify view" action | Every demo or template is labelled before use; no invented facts are inserted; "Simplify view" either works or says it's not available yet |
| E5 | Desktop keyboard basics | 025 (desktop part) | `frontend/src/lib/components/ui/Modal.svelte`, plus unnamed icon buttons in the files E1–E4 don't own | Focus is trapped and returns in dialogs; every control has a name; every journey in the completion test can be done by keyboard at 1440×900 |
| E6 | Park unused stores | — | `frontend/src/lib/stores/{calendarStore,visualMemoryStore,advancedAssetStore}.ts` → `frontend/_archive/` (outside `src/`) | 0 importers before the move; the build passes; `svelte-check` no longer lists them |
| E7 | Remaining type errors in touched files | — | Files changed in Waves B–E that still have svelte-check errors, excluding files another E card owns | Those files show 0 errors; behaviour fixes are noted per file |
| E8 | Branch triage | — | Remote branches | Delete merged branches; list the rest with their unique commits |

## Wave X — Out-of-build bugs (decision 12; parallel track, approved by orchestrator diff review)

| ID | Card | Source | Owns | Change | Acceptance |
|---|---|---|---|---|---|
| X1 | Server-side AI proxy (was F2) | Live OpenRouter key in production JS | New `backend/routers/ai_proxy.py` + its `include_router` line in `backend/main.py`; `frontend/src/lib/services/{aiConciergeService,aiGriefService}.ts`; `OPENROUTER_API_KEY` in `frontend/src/lib/config.ts`; `backend/config.py` (one setting) | The browser calls `/api/ai/...` with the user's JWT; the backend holds the key and calls OpenRouter | `npm run build` output contains no `sk-or-`; the concierge and grief-support pages get an AI reply locally through the proxy (or a clear "AI isn't available" message when no key is set) |
| X2 | Untrack committed databases (was F4) | `backend/continuum.db`, `backend/continuum_saas.db`, `dev.db` tracked in a public repo | `.gitignore`; the git index for those files | `git rm --cached`; ignore `*.db` | `git ls-files` lists no `.db`; the files stay on disk; the local backend still starts |
| X3 | Production settings (was F3) + `_technical` leak (A4 finding 2) | Production reports `environment: development` with the default JWT secret; error responses include `_technical` | `backend/errors.py`; `backend/config.py` (production branch only); Railway variables at release (orchestrator) | Hide `_technical` outside development; list exactly what `ENVIRONMENT=production` changes (RP_ID, ORIGIN, FRONTEND_URL) and fix anything that would break login or passkeys; the orchestrator sets `ENVIRONMENT=production` and a new random `JWT_SECRET_KEY` during the release | Locally with `ENVIRONMENT=production` and the production URLs: login 200, no `_technical` in an error body; after release `/api/health` reports production |
| X4 | Frontend paths depend on the working directory (A4 finding 1) | `frontend/dist` paths in `backend/main.py` are relative | The static-mount and SPA-fallback lines in `backend/main.py` | Resolve from `Path(__file__).resolve().parent.parent` | The server started from `backend/` still serves the SPA when dist exists |
| X5 | Remove the `jh@continuum.estate` bypass (was F5) | Passwordless login to production for anyone | The bypass block in `backend/routers/auth.py`; `CLAUDE.md` dev-login line | Delete the bypass | Dispatched **after** the release browser test (which signs in with it); merged once the owner has signed in once with a real password or passkey, so he is never locked out; then a targeted deploy |
| X6 | Rotate the OpenRouter key (was F1) | The key is public in shipped JS | Owner step at openrouter.ai (Claude may not create or copy API keys) | Create a new key, put it in the Railway variable X1 reads, revoke the old one | Done after X1 is live; the old key returns 401 |

---

## Section status (marked by the orchestrator, decision 9)

| Section | Status | Verified on | Notes |
|---|---|---|---|
| Wave A — Stable ground | ▶ | | |
| Wave B — Shared contracts | ☐ | | |
| Wave C — Scenario records | ☐ | | |
| Wave D — Handover | ☐ | | |
| Wave E — Polish | ☐ | | |
| O1 / O2 oversight (all waves) | ☐ | | |
| R0 — Local rehearsal | ☐ | | |
| Release — deploy + full browser test | ☐ | | |
| Wave X — Out-of-build bugs | ▶ | | |

## Card status (marked by the orchestrator, decision 9)

| Card | Status | Commit | Proof verified |
|---|---|---|---|
| A0 | ☑ | 0444175 | `git check-ignore -v .worktrees/x` → `.gitignore:58` |
| A1 | ☑ | 8dd0a90 | 65 pins identical to prod freeze; fresh 3.11 venv: pip check clean, alembic head, dev seed, POST /api/auth/token 200 |
| A4 | ☑ | 020f77c | No frontend/dist: `python -m backend.main` starts, dev seeds, login 200, SPA routes 404 not 500 |
| A2 | ☑ | 8d54a13 | Diff = the Pre-deploy line plus the footer; `.github/` absent |
| A3 | ▶ | | |
| A5 | ▶ | | |
| B1 | ☐ | | |
| B2 | ☐ | | |
| B3 | ☐ | | |
| B4 | ☐ | | |
| B5 | ☐ | | |
| C6 | ☐ | | |
| C2 | ☐ | | |
| C1 | ☐ | | |
| C3 | ☐ | | |
| C4 | ☐ | | |
| C5 | ☐ | | |
| C7 | ☐ | | |
| D1 | ☐ | | |
| D2 | ☐ | | |
| D3 | ☐ | | |
| D4 | ☐ | | |
| E1 | ☐ | | |
| E2 | ☐ | | |
| E3 | ☐ | | |
| E4 | ☐ | | |
| E5 | ☐ | | |
| E6 | ☐ | | |
| E7 | ☐ | | |
| E8 | ☐ | | |
| X1 | ▶ | | |
| X2 | ▶ | | |
| X3 | ☐ | | |
| X4 | ☐ | | |
| X5 | ☐ | | |
| X6 | ☐ (owner) | | |
| O1 — per wave (A–E) | ☐ | | |
| O2 — per wave (A–E) | ☐ | | |
| O1 — release table | ☐ | | |
| O2 — release screenshots | ☐ | | |
| R0 | ☐ | | |
| Release | ☐ | | |
