# Continuum — Recovery Execution Plan (subagent-run)

**Last Updated:** 2026-10-26 07:10 EST

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
    - **As many X agents as needed** (owner, 2026-10-26: "assign additionaly subagents for X issues as needed"): every X card whose files are free is dispatched at once, each with its own agent.

13. **Final UI/UX pass, Wave U** (owner, 2026-10-26: "at the end of all the fixes have subagents review the ui ux and implment improvements and screenlayout that has been missed previously. Add to plan").
    - **When:** after Waves A–E and X are merged, before R0, so the rehearsal and the release test cover it.
    - **Review:** read-only review agents go through every page in the route inventory at desktop 1440×900. They look for UX and screen-layout problems missed so far: layout, spacing, alignment, hierarchy, empty, loading and error states, navigation and flow, consistency with neighbouring modules, readability and contrast, and tone (`docs/TONE_GUIDE.md`, `docs/UI_CONSISTENCY_STANDARDS.md`). Each finding comes with a screenshot and file:line.
    - **Implement:** each proven finding becomes a U card, coded by its own subagent in its own worktree. The orchestrator approves it by diff review plus before/after screenshots at the same size, then merges it.
    - **Same rules:** desktop only, ponytail, no tests, no feature removal, no gates.

## Test register (decision 11)

Every written test is listed here: approved before it is written, and completed after. There are no other tests.

| ID | File | Approved by / when | What it checks (one thing) | Full justification: why it's needed and why a manual proof isn't enough | How and when it's run | Keep or remove |
|---|---|---|---|---|---|---|
| T-A3 | `scripts/smoke_test.py` (written, card A3, commit eb9aca7; 667 lines, stdlib only) | Orchestrator, 2026-10-26 (approved before writing; confirmed at A3 review) | For each completion-scenario record type, the UI's real payload survives a save and re-fetch, field by field | The review proved that fields silently disappear after a "successful" save (CU-001), and that endpoints reject the UI's payload while model-shaped probes pass (CU-002, CU-009). Waves B and C all change that shared save path. Without one script, every card would re-probe by hand, which is more testing, not less, and inconsistent. It reuses the review's existing `reproduce_api_probes.py` rather than adding new code. Run by hand only; never wired into commit or deploy. | By hand: `python3 scripts/smoke_test.py --base http://localhost:<port>` (`--verbose` for payloads). Once per B or C card that touches the save path, and once in R0. Always exits 0 | Keep until the release pass is green, then decide |

## Progress tracking (decision 9)

| Mark | Meaning | Who sets it |
|---|---|---|
| ☐ | Not started | — |
| ▶ | Dispatched; the agent is working in `.worktrees/<card-id>` | Orchestrator, at dispatch |
| ◐ | The agent reports done; awaiting diff review | Orchestrator, on the agent's report |
| ☑ | Verified: the diff matches the acceptance, merged, worktree cleaned up | Orchestrator, after review and merge |
| ↺ | Reopened: evidence shows the acceptance was unmet or something regressed | Orchestrator, with the evidence |
| ⏸ | Stopped: bigger than the card; the agent's findings are recorded | Orchestrator |

- **Migrations note (B0/B1):** `a7c1b0e3d9f4` adds every model column missing at upgrade time. Production hasn't run it yet, so model fields added before the release are picked up there. A local DB already past it won't get later fields: use a fresh DB for proofs. After the release, new fields need their own migration.
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

**Final UI/UX pass (decision 13):** when Waves A–E and X are all ☑, run U0, then dispatch the U cards in parallel (by owned files), review and merge them as usual, then run O1/O2 on Wave U.

**Rehearsal (end of the coding pass, still local):**
8. **R0:** a validation subagent runs the full completion test (owner context and recipient context) against the merged `main`, built and served locally on synthetic data.
   - It records each step pass or fail, with evidence.
   - Each failure becomes a card and goes through the same loop.
   - This is the last part of finishing the coding pass, not an approval step. Per-card proofs can pass while the merged app fails, and fixing that locally is cheaper than fixing it after deploy.

**Release pass (once):**
9. **Before `railway up`, set the Railway variables X3 requires** (names; new random values generated on the spot, never printed): `ENVIRONMENT=production`, `JWT_SECRET_KEY` (new, ≥32 bytes; logs everyone out once), `SECRET_KEY` (new), `RP_ID=continuum.estate` (production's current value through `RAILWAY_PUBLIC_DOMAIN`, so its 3 passkeys keep working), `ORIGIN=https://continuum.estate`, `FRONTEND_URL=https://continuum.estate`, `API_URL=https://continuum.estate`. `alembic upgrade head` applies B0/B0.1 (additive only). Then run `npm run check` and `npm run build`, then `railway up`. Poll `/api/health` until the new version is live, and confirm the pinned versions with `railway ssh -- /opt/venv/bin/pip freeze`.
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

## Wave A — Stable ground (A0 first, then A1–A3 in parallel) ✅ 2026-10-26

| ID | Card | Agent | Owns | Change | Acceptance |
|---|---|---|---|---|---|
| A0 | Worktree folder | orchestrator | `.gitignore` | Add `.worktrees/`. | `git check-ignore .worktrees/x` matches |
| A1 | Pin the full backend set | `general-purpose` | `backend/requirements.txt`, `nixpacks.toml` | Pin production's full `pip freeze`; keep `python311`. | A fresh 3.11 venv installs, the dev user seeds, login returns 200 |
| A2 | Stale CI line | `general-purpose` | `CLAUDE.md` (Deployment) | "Run `npm run check` and `npm run build` by hand." | One-line diff |
| A4 | Backend starts locally (from A1 findings) | `general-purpose` | `backend/main.py` (the `__main__` block and the static mounts only) | `uvicorn.run("backend.main:app")`; mount `frontend/dist` folders only when they exist | From the repo root, `python -m backend.main` starts with no `frontend/dist`, and login returns 200 |
| A5 | Surrounding bugs from A1/A4 (decision 10) | `general-purpose` | `backend/auth.py`; `seed_dev_user` and the `__main__` block in `backend/main.py` | Seed failures logged with traceback; remove the no-op passlib "fix"; timezone-aware JWT expiry; local reload watches `backend/` only | Fresh DB: seed + login 200; an existing bcrypt-format hash verifies; token `exp` decodes correctly |
| A3 | UI-payload smoke script (written test T-A3; see Test register) | `general-purpose` | `scripts/smoke_test.py` (new) | Reuse `docs/reviews/.../evidence/reproduce_api_probes.py`. Send each store's real payload (after `toSnake`), re-fetch, and diff every field. Cover every completion-scenario record type. | It reproduces CU-001, CU-002, CU-004 and CU-009 as failures, and journal/home-access as passes |

## Wave B — Shared contracts (one at a time: B0 → B1 → B2 → B3 → B4 → B5)

| ID | Card | CU | Agent | Owns | Acceptance (A3 script plus one browser save) |
|---|---|---|---|---|---|
| B0 | Schema drift (from A3, verified on production) | 001 | `database-migration` | One new idempotent Alembic migration (adds only what's missing, checking the live columns first; never drops) | Production (read 2026-10-26, alembic head `817c6b026811`) has **no `custom_attributes` column on any table**, though 13 models declare it and migration `2d53606557e8` claims to add 7. So every generic-API create on those tables fails on a migrated DB. After the migration, on both a fresh Alembic DB and a copy of production's column list (`prod_schema.json`), every model column exists; A3's asset-table creates no longer fail on a missing column. Applied to production only at release, by `alembic upgrade head` (additive only) |
| B0.1 | Production NOT NULL mismatches (from B0) | 001 | `database-migration` | One new idempotent migration after `a7c1b0e3d9f4` | Production `financial_accounts.institution` and `account_type` are NOT NULL while the model is nullable (migration `08fcd9308bab` never took effect there), so inserts without them fail. Relax NOT NULL wherever the live DB is stricter than the model, checking live columns first; never tighten, drop or touch data. Model-NOT-NULL-but-DB-nullable columns are reported, not changed. Proof on a simulated production schema |
| B0.2 | Carry legacy financial rows forward (from B0.1) | 001 | `database-migration` | One migration after `c4e8a2f6b1d7` | Production `financial_accounts` has the legacy shape (`institution`, `account_type`, `account_number_encrypted`, `holder_name`, `balance_estimate`; 3 rows). B0 adds the model's `name`, `type`, `value` etc. empty, so those rows would render blank. Copy legacy values into the new columns **only where the new column is NULL** (e.g. institution→name, account_type→type, balance_estimate→value; holder_name kept as-is). Never overwrite, drop or delete. Proof on a simulated production DB with synthetic legacy rows |
| B1 | Explicit field contracts | 001 | `api-contract-validator` | `frontend/src/lib/services/sync.svelte.ts` (key conversion), the Asset-family mappers in `frontend/src/lib/stores/{financialAssetsStore,propertyStore,digitalAssetsStore,subscriptionStore}.svelte.ts`, field aliases in `backend/estate_models.py` | Every displayed writable field on financial, property and subscription survives create, edit, re-fetch and reload, including 0 and empty values; custom-field keys are preserved. Also (A3): financial "Transfer Instructions" and statement upload persist (`AssetManager.svelte:195-211`, owned for this); `valueHistory` isn't reset on create (`financialAssetsStore.svelte.ts:55`); the digital-asset create sends the required `name` |
| B2 | Category membership | 004 | `fastapi-development` | `backend/routers/estate_data.py`, and an Alembic migration adding a category column if needed | Each of properties, digital assets and generic heirlooms lists only its own rows after create, update and delete; existing mixed rows are reported, and **not migrated on production without an owner yes** |
| B3 | Singleton vs. collection | 006, 011 | `fastapi-development` | `SingletonSyncManager` in `sync.svelte.ts`; `/api/estate/profile` in `backend/main.py`; the `funeral_data` and `advanced_assets` handling in `estate_data.py` | Repeated saves update one record; profile settings merge rather than replace each other; the UI always receives an object. Also (A3): the singleton update strips `id`/`user_id` (`sync.svelte.ts:440-450`); funeral wishes never get `"0"`/`"1"` keys or a double-encoded budget (`funeral/+page.svelte:71-74`, `funeralStore.svelte.ts:61-79`, owned for this) |
| B4 | Truthful save state | 013 | `error-handling-standardization` | Status handling in `sync.svelte.ts`; `frontend/src/lib/stores/activityLog.svelte.ts`; the activity-log model ID default | A forced failure shows one failure message, keeps the draft and offers retry; an activity-log failure never marks a successful save as failed; one success shows one message |
| B5 | Store initialization | 014 | `frontend-state-cleanup` | `registerSync`, `getRegistry` and `syncAll` in `sync.svelte.ts`; the callers in `frontend/src/routes/+layout.svelte` | A direct visit, a reload, and logout/login all show the right records; a second browser context fetches the same estate. Also (B1): the `financial_assets` registry key is registered by the store (with a mapper) or by the page/AssetManager (without), so the wire shape depends on import order — one owner. Also (A3): the property page actually syncs (`propertyStore.sync?.()` is undefined, `property/+page.svelte:58`); the heirlooms page calls init and its update works (`heirlooms/+page.svelte:113`). Also (B3): `advanced_assets` is registered twice (`advancedAssetStore.ts:58` and `advancedAssetStore.svelte.ts:116`) — one owner, and make `betterMapper` (`advancedAssetStore.svelte.ts:86-112`) idempotent like `funeralMapper`; `estate/profile` stores snake-case keys on send so they come back differently named — one convention |

## Wave C — Dependable scenario records (C6 → C2 → then C1, C3, C4, C5, C7, C8, C9 in parallel → C10)

| ID | Card | CU | Owns | Acceptance |
|---|---|---|---|---|
| C6 | Translation stores (first, because callers span screens) | — | `frontend/src/lib/stores/localization.ts`, the `t` export in `conciergeStore.svelte.ts`, and every file that imports either `t` | Settle the two interfaces: keep the callable translator, and rename the dictionary export (e.g. `dict`). Update every caller. Proof: each caller's page renders its text, with no `$t` errors left |
| C2 | Files and media (second, because C1 and C5 depend on it) | 010 | `frontend/src/lib/services/mediaService.ts` (auth key → `continuum_auth_token`), `frontend/src/lib/utils/mediaStorage.ts`, `frontend/src/lib/services/mediaMigration.ts`, `frontend/src/lib/components/FileUploader.svelte`, `backend/routers/media.py` | A PDF, an image, an audio clip and a video upload, then download or play in a second context; local IndexedDB originals are kept until that retrieval succeeds |
| C1 | Documents | 002 | `frontend/src/lib/components/archetypes/DocumentVault.svelte`; the `Document` model in `backend/estate_models.py` plus an Alembic migration for the new metadata columns; the `documents`/`vault_documents` mapping in `estate_data.py` | A real PDF (via C2) *and* a physical-only document, with title, category, witnesses, review date, original location and custom fields; edit, reload and download from a second context |
| C3 | Letter to a named recipient | 008 | `frontend/src/routes/modules/letters/+page.svelte`, `frontend/src/lib/stores/letterStore.svelte.ts`, the `Letter` model plus a migration if fields are missing | Recipient picked from contacts; reopening a draft edits it with no duplicate; the camelCase `triggerDate`, `triggerMilestone`, `isLocked` reach the model (add them to B1's `CAMEL_WIRE_KEYS` in `sync.svelte.ts`, owned for this); full text survives reload. **Release behaviour:** a letter is visible in the recipient view immediately, unless the owner marks it "Hold". A future date or condition is stored and shown, labelled "Automatic delivery isn't available yet". The scheduled feature is kept and labelled, not faked |
| C4 | Journal, ethical will, lessons | 007 | The ethical-will and life-lessons components under `frontend/src/lib/components/`, and `journalStore.svelte.ts` | They save, edit and reload through the existing `JournalEntry` types; no sample text is ever saved automatically |
| C5 | Time capsule | 009 | `frontend/src/routes/modules/time-capsule/+page.svelte`, `frontend/src/lib/stores/timeCapsuleStore.svelte.ts` | Text and video capsules (video via C2) create, edit and reload; the media plays in a second context; the locked/released lists are accurate. Also (A3): `TimeCapsuleMessage.created_at` needs a default (`estate_models.py:376`), since the API refuses it as protected; owned for this |
| C8 | Contacts save and status (from A3) | — | `backend/routers/contacts.py` create/update; `frontend/src/routes/modules/contacts/+page.svelte` status update | Create validates the body (an empty body is a 422, not a 500 from `pulse_contacts.name` NOT NULL, X3 finding) and returns the saved contact with its id (today `{}`: `log_audit` commit expires it, `contacts.py:33-42`); `tier` and notification status persist or are mapped to real `PulseContact` fields (`contacts/+page.svelte:179`) |
| C9 | Home manual ids (from A3) | — | `accessMapper`/`vendorMapper` in `frontend/src/routes/modules/home-manual/+page.svelte` | Server records keep their ids, so they can be edited and removed after reload (`:48`, `:61`) |
| C10 | Debts are liabilities (from A3) | — | The type list in `AssetManager.svelte` (after B1) and the financial totals | A debt type exists and is subtracted, not added to total assets (`AssetManager.svelte:603-619`). Also (B0.2): a type outside the option list (legacy rows, e.g. "Safe Deposit") still shows in the edit select; `testDataFactory.ts:141-146` writes legacy `institution`/`account_type`/`balance_estimate` instead of `name`/`type`/`value` |
| C7 | Verify the rest of the scenario's records | — | **Verify only:** debt (financial), insurance policy, advisor contact, household instruction (home manual), heirloom story, final wishes | Each passes create → every field returned → edit → reload → second context. Failures become C7.x fix cards that own only that module's route and store files |

## Wave D — The handover (D1 → then D2, D3, D4 in parallel)

| ID | Card | CU | Owns | Acceptance |
|---|---|---|---|---|
| D1 | One export snapshot, two outputs | 003 | `frontend/src/lib/services/exportService.ts`, `frontend/src/routes/binder/+page.svelte`, `frontend/src/routes/export/preview/+page.svelte`, and one snapshot builder (new; the backend endpoint `GET /api/export/snapshot` is preferred, so D2 can reuse it) | Both outputs come from one snapshot. Group by Asset `category` (B2), not `type`, for counts and totals. **(a) Readable packet** (print/PDF): every scenario record, full text, correct names. **(b) Download copy** (zip): the packet plus the actual media and document files, with a manifest. **Compare contents, not counts:** record IDs, names, values, full text and attachment files match the screens one for one |
| D2 | Recipient start page and owner preview | 005 | A new route `frontend/src/routes/for/[token]/+page.svelte`; recipient and executor flags on the contacts model plus a migration; owner-issued link endpoints (create and revoke) in `backend/routers/contacts.py` or a new `backend/routers/recipient.py`; a token-scoped read of D1's snapshot and of media files (`backend/routers/media.py`) | In a fresh browser context with **no owner session**, the link loads the correct owner's start page: the note, immediate steps, contacts, original locations, letters (except held ones) and playable media; the recipient can download the D1 copy; the owner's preview renders the same page. A simple link, with no permissions system |
| D3 | Persistent executor steps | 015 | `frontend/src/routes/modules/executor-toolkit/+page.svelte` and a store using the generic data API | Completed steps and notes survive a reload and link to the records each step needs |
| D4 | Honest readiness | 012 | `frontend/src/lib/utils/readiness.ts`, the `estateAudit` source, the vault score in `DocumentVault.svelte` (**after C1 merges**), the financial trend display | An empty state reads "not started"; there are no invented trends (incl. `generateMockHistory` on create, `AssetManager.svelte:~209`); 0% ownership isn't shown as 100% (`:~423`); summary totals match the detail lists |

## Wave E — Polish what was proven (E1 → then E2–E7 in parallel → E8)

| ID | Card | CU | Owns | Acceptance |
|---|---|---|---|---|
| E1 | Navigation: legacy and finance first | 018 | `frontend/src/lib/config/navigation.ts`, the sidebar component, and the dashboard summary links | My Legacy, My Finances, My Instructions and For My Son (preview) are top-level; the dashboard "Accounts" link goes to financial accounts; every existing link is still reachable |
| E2 | Early-preview labels | — | `isPreview` on `NavItem` in `navigation.ts` (after E1), and the catalog item render in `frontend/src/routes/catalog/+page.svelte` | Pulse, QR, scenarios, simulator, analytics, builder and treasure hunt show an "early preview" tag; all links work |
| E3 | Forms | 019 | The shared form and module-header components (`frontend/src/lib/components/modules/*`) | Short headings with clear add/edit actions, optional guidance collapsed, no literal "financial" title bug; same labels in the sidebar and the page |
| E4 | Simulated-feature labels | 020 | `visionService`, `legalService`, the letters voice simulation, the prompt bar's dictation simulation (`AIPromptBar.svelte:122-124`, after X19), and the "Simplify view" action | Every demo or template is labelled before use; no invented facts are inserted; "Simplify view" either works or says it's not available yet |
| E5 | Desktop keyboard basics | 025 (desktop part) | `frontend/src/lib/components/ui/Modal.svelte`, plus unnamed icon buttons in the files E1–E4 don't own | Focus is trapped and returns in dialogs; every control has a name; every journey in the completion test can be done by keyboard at 1440×900 |
| E6 | Park unused stores | — | `frontend/src/lib/stores/{calendarStore,visualMemoryStore,advancedAssetStore}.ts` → `frontend/_archive/` (outside `src/`) | 0 importers before the move; the build passes; `svelte-check` no longer lists them |
| E7 | Remaining type errors in touched files | — | Files changed in Waves B–E that still have svelte-check errors, excluding files another E card owns | Those files show 0 errors; behaviour fixes are noted per file |
| E9 | Grief-support page visuals (O2) | — | `frontend/src/routes/resources/grief-support/+page.svelte` | The city/zip placeholder overlaps "Find support" (`:307`, `:313`); "Bespoke Support", "Sibling Conversations", "Crisis Center" headings are dark on dark (`:379`); breadcrumb reads "Active Module"; a white band below the dark section | Screenshots before and after at 1440×900 show none of these |
| E10 | Broken hero image on contacts (O2) | — | The contacts page hero image reference | The top-right hero image is a broken placeholder on `/modules/contacts`; fix the path or asset (check other modules for the same) | The image renders; same check on neighbouring modules |
| E8 | Branch triage | — | Remote branches | Delete merged branches; list the rest with their unique commits |

## Wave U — Final UI/UX review and improvements (decision 13; after A–E and X, before R0)

| ID | Card | Agent | Owns | Change | Acceptance |
|---|---|---|---|---|---|
| U0 | UI/UX review | Read-only `ui-standards-auditor` and `ui-debugger` agents, split by area (e.g. legacy and letters; finances and estate; family, contacts and recipient; dashboard, navigation, settings and onboarding) | Nothing (report only) | Visit every route at 1440×900 on the merged build. List each UX or layout problem not already fixed by an earlier card, with a screenshot, file:line, the smallest fix, and a severity | A findings list per area; each item becomes a U card |
| U-seed | Export preview fits the screen (X20 finding) | — | `export/preview/+page.svelte:55` | `h-screen` inside the app layout puts ~80px of the PDF frame below the fold at 1440×900 | The frame fits the viewport |
| U1… | One card per proven finding (or per page when findings share a file) | `ui-standards-enforcer` / `general-purpose` | That page's route and component files | The smallest fix that resolves the finding | Before/after screenshots at 1440×900, same size, with the pixel-level change described; nothing removed from the page or navigation |

 (decision 12; parallel track, approved by orchestrator diff review)

| ID | Card | Source | Owns | Change | Acceptance |
|---|---|---|---|---|---|
| X1 | Server-side AI proxy (was F2) | Live OpenRouter key in production JS | New `backend/routers/ai_proxy.py` + its `include_router` line in `backend/main.py`; `frontend/src/lib/services/{aiConciergeService,aiGriefService}.ts`; `OPENROUTER_API_KEY` in `frontend/src/lib/config.ts`; `backend/config.py` (one setting) | The browser calls `/api/ai/...` with the user's JWT; the backend holds the key and calls OpenRouter | `npm run build` output contains no `sk-or-`; the concierge and grief-support pages get an AI reply locally through the proxy (or a clear "AI isn't available" message when no key is set) |
| X2 | Untrack committed databases (was F4) | `backend/continuum.db`, `backend/continuum_saas.db`, `dev.db` tracked in a public repo | `.gitignore`; the git index for those files | `git rm --cached`; ignore `*.db` | `git ls-files` lists no `.db`; the files stay on disk; the local backend still starts |
| X3 | Production settings (was F3) + `_technical` leak (A4 finding 2) | Production reports `environment: development` with the default JWT secret; error responses include `_technical` | `backend/errors.py`; `backend/config.py` (production branch only); the auth-header helper in `frontend/src/lib/api/client.ts` (CSRF header, X1 finding); Railway variables at release (orchestrator) | **First** make every state-changing request send `X-CSRF-Token` from the `csrf_token` cookie (production skips CSRF today only because it thinks it's development; flipping it without this 403s every save); hide `_technical` outside development; list exactly what `ENVIRONMENT=production` changes (RP_ID, ORIGIN, FRONTEND_URL) and fix anything that would break login or passkeys; the orchestrator sets `ENVIRONMENT=production` and a new random `JWT_SECRET_KEY` during the release | Locally with `ENVIRONMENT=production` and the production URLs: login 200, no `_technical` in an error body; after release `/api/health` reports production |
| X4 | Frontend paths depend on the working directory (A4 finding 1) | `frontend/dist` paths in `backend/main.py` are relative | The static-mount and SPA-fallback lines in `backend/main.py` | Resolve from `Path(__file__).resolve().parent.parent` | The server started from `backend/` still serves the SPA when dist exists |
| X5 | Remove the `jh@continuum.estate` bypass (was F5) | Passwordless login to production for anyone | The bypass block in `backend/routers/auth.py`; `CLAUDE.md` dev-login line | Delete the bypass | Dispatched **after** the release browser test (which signs in with it); merged once the owner has signed in once with a real password or passkey, so he is never locked out; then a targeted deploy |
| X7 | Auth error paths (A5 findings) | `get_current_user`/`optional_current_user` accept magic-link tokens as access tokens (`backend/auth.py:73-95`); an unrecognised stored hash makes login 500 not 401 (`auth.py:28`, `routers/auth.py:246`); magic-link verify 500s on a token with no `sub` (`routers/auth.py:625`) | `backend/auth.py`; the token and magic-link-verify handlers in `backend/routers/auth.py` (not the bypass block) | Reject tokens whose `type` isn't an access token; treat unknown hashes as a failed login; 401 for a token with no `sub` | Locally: a magic-link token is refused by a protected endpoint; a user with a non-hash stored value gets 401; a no-`sub` token gets 401; normal login and refresh still work |
| X8 | Naive `datetime.utcnow()` defaults (A5 finding) | 41 uses in 15 backend files; deprecated, and the same family as the SQLModel 0.0.48 crash | Those files — **dispatched after Wave C merges**, because B/C cards own `estate_models.py` and `routers/media.py` | One helper; same naive-UTC values stored, so no migration | `grep utcnow backend` finds only the helper; seed, login and one save per touched model still work |
| X9 | Magic-link and token-subject hardening (X7 findings) | Magic-link tokens are reusable for 15 min; `/magic-link/request` logs an auth success when it only sent an email; `sub` is passed to `session.get` as a string (`backend/auth.py:75`, `:91`); the passkey-login token path (`routers/auth.py:~517`) is unreviewed | `backend/auth.py`; the magic-link request/verify and passkey-login-finish handlers in `backend/routers/auth.py` (not the bypass block) | One-time magic links (a `jti` recorded on first use, smallest storage that works, migration only if needed); log the request as a request; cast `sub` to int safely; review and fix the passkey token path | A magic link works once and is refused the second time; normal login, refresh and passkey paths unchanged |
| X10 | Slow `/api/ai/chat` error path (O1, Wave A) | p50 152 ms, p95 473 ms (max 1000) on the no-key 503 path, while other POSTs are ~9 ms; cause unproven (limiter on an async handler, the 503 path, echo logging); a new `httpx.AsyncClient` per call | `backend/routers/ai_proxy.py` | Find the cause with one targeted timing (echo off); reuse one AsyncClient | p95 ≤ 300 ms on the 503 path |
| X11 | SPA catch-all swallows non-API paths (X4 finding) | `serve_spa` uses `full_path.startswith("api")`, so `/apiary`, `/api-guide` get a JSON 404 instead of the app; a dead `startswith("/")` check after `lstrip` | The `serve_spa` lines in `backend/main.py` | `full_path == "api" or full_path.startswith("api/")`; drop the dead check | `/api-guide` gets the SPA; `/api/nope` still a JSON 404 |
| X12 | Health check and CSRF exemptions (X3 findings) | `/api/health` HEADs the app's own public `FRONTEND_URL` on every call (`backend/main.py:~341`), and the fetch wrapper uses `/api/health` to refresh the CSRF cookie; `is_csrf_exempt` matches exempt paths by prefix (`backend/csrf.py:44-47`); `ALLOWED_HOSTS` is defined but unused (`config.py:107`) | The health handler in `backend/main.py`; `backend/csrf.py` | Health makes no outbound call; exempt paths match exactly (keeping intended sub-paths such as passkey routes explicit); report `ALLOWED_HOSTS` | Health p95 ≤ 50 ms locally; `/api/auth/tokenX` POST without a header gets 403 in production mode; login, refresh, magic link and passkey routes still exempt |
| X13 | Calendar date type mismatch (B0.1 finding) | Production `calendar_events.date` is `timestamp`; the model is a string | The `CalendarEvent` model and the calendar route/store | Read and write work against a timestamp column on PostgreSQL and SQLite; no data change | Create, edit and reload one calendar event locally on a DB with a timestamp `date` column |
| X14 | Legacy auth stubs and CSRF middleware (X12 findings) | `POST /api/auth/register/verify` (`backend/main.py:~372`) returns success without verifying anything; `register/challenge` and a `magic-link` stub (`:365`, `:377`) duplicate real router paths; the CSRF middleware raises `HTTPException` inside `BaseHTTPMiddleware` (`csrf.py:~158`), logging a traceback per refusal | The three stubs in `backend/main.py`; the dispatch in `backend/csrf.py` | Remove stubs that have no caller (grep frontend and backend first; keep any with a caller and make it real or 410); return `JSONResponse(403)` | No caller breaks; the stub paths 404/405 or reach the real router; a CSRF refusal is a clean 403 with no traceback |
| X15 | AI error presentation (O2, from X1) | The prompt bar wraps the "AI help isn't available" notice as `[Draft based on: …]` in a monospace box (`AIPromptBar.svelte:111`, `:229`); the grief companion shows the generic notice instead of its own gentle fallback (`aiGriefService.ts:77-80`; `docs/TONE_GUIDE.md:130-132`); a dead "creative brain" fallback (`AIPromptBar.svelte:114-115`) | `frontend/src/lib/components/concierge/AIPromptBar.svelte`; `frontend/src/lib/services/aiGriefService.ts` | Show the unavailable notice as a plain gentle message (no draft prefix, normal font); the grief chat uses its grief-specific fallback; remove the dead fallback text | Desktop 1440×900 with no key: both pages show the right message; screenshots before and after |
| X16 | Preferences endpoint 500 (O2) | `/api/auth/me/preferences` fails: `'User' object has no attribute 'view_preferences'`; migration `817c6b026811` adds the column but `User` (`backend/database.py`) lacks the field; production has `users.view_preferences` (json) | The `User` model in `backend/database.py`; the preferences handlers in `backend/routers/auth.py` | Add the field matching the column type | GET and PUT preferences 200 and round-trip on a fresh DB and on the simulated production schema |
| X17 | Fonts blocked by CSP (O2) | The Content-Security-Policy `style_src` (`backend/main.py:103`) has no `fonts.googleapis.com` and no `font_src` for `fonts.gstatic.com`, so the app's Google Fonts never load, in production too | The CSP builder in `backend/main.py` | Allow exactly those two hosts | No CSP font errors in the console; the intended fonts render (screenshot before and after) |
| X18 | CSP gaps (X17 findings) | No `base-uri`, `frame-ancestors` or `object-src` (the first two don't fall back to `default-src`), so clickjacking and `<base>` injection aren't covered; `script-src 'unsafe-inline'` (`backend/main.py:102`) | The CSP builder in `backend/main.py` | Add `base-uri 'self'`, `frame-ancestors 'none'`, `object-src 'none'`; report whether SvelteKit's static build can use hashes instead of `'unsafe-inline'` (change it only if the build supports it cleanly) | The app still loads at 1440×900 with no CSP console errors; headers show the new directives |
| X19 | AI failure signal and copy button (X15 findings) | `aiConciergeService.chat` never throws and `AI_UNAVAILABLE` isn't exported, so the prompt bar detects failure by matching text (`aiConciergeService.ts:7`, `:192-197`); `alert("Copied to clipboard!")` and an unawaited clipboard write (`AIPromptBar.svelte:152-154`); the copy button shows on notices; unused `promptPool`/`shufflePrompts` (`:21`, `:27`, `:99-101`) | `aiConciergeService.ts`, `AIPromptBar.svelte` | Return an explicit failure flag; gentle inline "Copied" confirmation, awaited with a failure message; no copy button on notices; remove the dead code | 1440×900: a failure shows the notice with no copy button; copying a draft shows the inline confirmation; no `alert` |
| X20 | PDF preview frame, HEAD requests, inline-script hash (X18 findings) | No `frame-src`, so the export preview's `blob:` PDF iframe (`export/preview/+page.svelte:138`) falls back to `default-src 'self'` and is refused; SPA routes answer HEAD with 405; `script-src 'unsafe-inline'` could become a hash (one 330-byte inline script; SvelteKit `kit.csp` hash mode writes a meta tag) | The CSP builder and `serve_root`/`serve_spa` in `backend/main.py`; `frontend/svelte.config.js` (`kit.csp` only) | `frame-src 'self' blob:`; SPA routes accept HEAD; replace `'unsafe-inline'` in `script-src` with the build's hash (kit.csp hash mode plus a header computed from `dist/index.html` at startup, or the smaller of the two) only if every page still loads | Export preview shows the PDF; `curl -I /dashboard` 200; dashboard, onboarding, concierge-window and export preview load with 0 CSP errors at 1440×900 |
| X21 | Journal and heirloom prompt ideas never show (X19 findings) | `legacy-journal/+page.svelte:256` and `heirlooms/+page.svelte:362` pass `promptPool` to `AIPromptBar`, which never renders it; `detectUserRole` calls `.toLowerCase()` on `unknown` (`aiConciergeService.ts:211`) | `AIPromptBar.svelte`, `aiConciergeService.ts` | Render a few prompts from `promptPool` as clickable suggestions (with a gentle "Show other ideas" shuffle) when it is passed; type the role value | 1440×900: the journal and heirloom pages show pool prompts and clicking one fills the input; the contacts page is unchanged; svelte-check one fewer error |
| X22 | Singleton PUT doesn't encode JSON columns (B3 finding) | `PUT /api/data/{funeral_data,advanced_assets}/{id}` stores objects/lists in JSON text columns without `json.dumps` (`estate_data.py` update_item); no frontend caller today | `update_item` in `backend/routers/estate_data.py` | Encode the same JSON columns POST encodes (shared helper) | curl PUT with an object `wishes` then GET returns it intact |
| X23 | `connect-src` carries `API_URL` (X20 finding) | `backend/main.py` connect-src adds `settings.API_URL` (`http://localhost:8000` by default; `*` if empty, which allows any origin); the app's calls are same-origin | The CSP builder in `backend/main.py` | `connect-src 'self'` only, plus `API_URL` only when it is a different origin from the site | Header shows `connect-src 'self'`; dashboard and AI prompt bar make their calls with 0 CSP violations |
| X24 | Sessions end after 15 minutes (OpenWiki finding; CU-017) | The frontend never stores or uses the refresh token, so the user is logged out when the 15-minute access token expires; `auth.init` clears tokens on a network failure | `frontend/src/lib/stores/auth.ts` (token storage and refresh); the fetch wrapper's 401 handling | Store the refresh token at login; on a 401, refresh once and retry the request; keep tokens on a network failure | An access token forced to expire mid-session refreshes silently and the save goes through; a network failure doesn't log the user out |
| X25 | Guardians can't open the portal link (OpenWiki finding) | Alert emails link to `/portal/{token}` (and `/pulse/portal/...`), but the client login guard only lets `/pulse/respond` and `/pulse/verify` through without a session, so a signed-out guardian lands on `/login` | The public-route list in the client login guard | Add the portal routes the emails actually use (read the email templates) to the public list | Signed out, `/portal/<synthetic token>` renders the portal (or its gentle invalid-link state), not `/login` |
| X26 | Pulse scheduler ignores its settings (OpenWiki finding; CU-023) | `pulse_scheduler.py` runs hourly regardless of `PULSE_SCHEDULER_ENABLED` / `PULSE_CHECK_INTERVAL_MINUTES`; expired safety timers are never acted on | `backend/pulse_scheduler.py` (and the config fields it should read) | Read both settings; act on expired safety timers through the existing escalation logic. No real messages: locally with synthetic data and email sending off | With the scheduler disabled it doesn't start; with a 1-minute interval an expired synthetic timer escalates once, logged, with no real send |
| X27 | Unauthenticated Pulse endpoints (OpenWiki finding) | The Postmark bounce webhook has no secret or signature check; `POST /api/pulse/nudge` takes a contact id with no login | The bounce webhook and the nudge route | Webhook: require a shared secret (Postmark basic auth or a token in the URL, from a new Railway variable; skip the check only when the variable is unset locally); nudge: require login and ownership of the contact | Webhook without the secret 401, with it 200; nudge signed out 401, another user's contact 404 |
| X6 | Rotate the OpenRouter key (was F1) | The key is public in shipped JS | Owner step at openrouter.ai (Claude may not create or copy API keys) | Create a new key, put it in the Railway variable X1 reads, revoke the old one | Done after X1 is live; the old key returns 401 |

---

## Section status (marked by the orchestrator, decision 9)

| Section | Status | Verified on | Notes |
|---|---|---|---|
| Wave A — Stable ground | ✅ | 2026-10-26 | A0–A5 ☑; O1/O2 for Wave A dispatched |
| Wave B — Shared contracts | ☐ | | |
| Wave C — Scenario records | ☐ | | |
| Wave D — Handover | ☐ | | |
| Wave E — Polish | ☐ | | |
| O1 / O2 oversight (all waves) | ☐ | | |
| R0 — Local rehearsal | ☐ | | |
| Release — deploy + full browser test | ☐ | | |
| Wave U — Final UI/UX pass | ☐ | | |
| Wave X — Out-of-build bugs | ▶ | | |

## Card status (marked by the orchestrator, decision 9)

| Card | Status | Commit | Proof verified |
|---|---|---|---|
| A0 | ☑ | 0444175 | `git check-ignore -v .worktrees/x` → `.gitignore:58` |
| A1 | ☑ | 8dd0a90 | 65 pins identical to prod freeze; fresh 3.11 venv: pip check clean, alembic head, dev seed, POST /api/auth/token 200 |
| A4 | ☑ | 020f77c | No frontend/dist: `python -m backend.main` starts, dev seeds, login 200, SPA routes 404 not 500 |
| A2 | ☑ | 8d54a13 | Diff = the Pre-deploy line plus the footer; `.github/` absent |
| A3 | ☑ | eb9aca7 | Ran on an Alembic-built DB: 3 PASS (journal create/edit, home access), 13 FAIL; reproduces CU-001 (subscription, letter), CU-002, CU-009; CU-001/004 for asset tables masked by a missing column (see B0). Ran twice: the first run had a false PASS, fixed |
| A5 | ☑ | 151c77b | Fresh DB: seed + login 200; token exp = configured 15 min; legacy `$2b$` hash verifies (was broken: passlib 1.7.4 + bcrypt 5 raise ValueError) |
| B0 | ☑ | 6f14c65 | Fresh DB, re-run, and simulated production schema: every model column present; second upgrade a no-op; smoke run: 0 "no column named" errors (5 PASS, 12 FAIL left for B1–C10). Also added 6 models missing from `alembic/env.py` |
| B0.1 | ☑ | 480ac85 | Simulated production DB with a row: `institution`, `account_type` now nullable, row intact, NULL insert succeeds; re-run no-op; fresh DB fine. PostgreSQL path is a plain `DROP NOT NULL`, not run locally |
| B0.2 | ☑ | c78a6b5 | Simulated production DB, 3 synthetic legacy rows: name/type/value filled (0 kept as 0), a pre-set name not overwritten, legacy columns unchanged; fresh DB fine. `account_number_encrypted` deliberately not copied |
| B1 | ☑ | 86b9f9d | Smoke run on a fresh DB: financial create/edit, debt, property, subscription, digital asset, heirloom PASS; build passes; svelte-check 288 = baseline, no new errors in its files. Browser save not done (no browser tool): covered by R0 |
| B2 | ☑ | 2407071 | Fresh DB smoke: category membership PASS, 12 PASS / 5 FAIL (the 5 are C1, C3, C5, C8, B3 work). Update/delete membership read, not run. Existing NULL-category rows list under exactly one page by a read-time rule; no backfill (production: 1 row) |
| B3 | ☑ | 962df03 | Smoke on a fresh DB: final wishes PASS, 13 PASS / 4 FAIL (C1, C3, C5, C8 rows). Three funeral saves → 1 row; profile {a:1} then {b:2} → {a:1,b:2}; posting a key as null clears it. svelte-check = baseline; build passes |
| B4 | ▶ | | |
| B5 | ☐ | | |
| C6 | ☐ | | |
| C2 | ☐ | | |
| C1 | ☐ | | |
| C3 | ☐ | | |
| C4 | ☐ | | |
| C5 | ☐ | | |
| C7 | ☐ | | |
| C8 | ☐ | | |
| C9 | ☐ | | |
| C10 | ☐ | | |
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
| E9 | ☐ | | |
| E10 | ☐ | | |
| X1 | ☑ | 4575c17 | Build with fake `sk-or-` key: no `sk-or-`/`openrouter.ai` in dist; `/api/ai/chat` 401 without token, 503 gentle message with no key. Also fixed: duplicate user message, unsanitised history, CSRF header on the AI call |
| X2 | ☑ | 91321f9 | `git ls-files` lists no .db; `*.db` ignored; local copies kept on disk. Old copy in `34780fe` (branch `origin/stash-backup/2026-01-26-34780fe`) holds 1 non-dev user row, empty password. Owner 2026-10-26: bundled to `docs/archive/stash-backup-2026-01-26-34780fe.bundle` (local only, git-ignored, verified), remote branch deleted |
| X3 | ☑ | 70068dd | `ENVIRONMENT=production` locally: health 200 "production"; POST without CSRF header 403, with cookie+header 200; no `_technical`; login 200; fetch wrapper (bundled, node stub) adds the header to same-origin writes only. Also fixed: HTTPS redirect loop behind Railway's proxy (would have broken the deploy), CORS substring match. Release must set the variables below |
| X4 | ☑ | 9e539f4 | Started from `backend/` and from the root: `/`, `/_app/...`, `/modules/x` 200; traversal variants never leak; prefix check replaced by `commonpath` (sibling `dist-other` could pass before) |
| X12 | ☑ | 7392f69 | Production mode: health p95 5.7 ms with no outbound call; `/api/auth/tokenX`, `/api/healthX` 403 (were exempt); token/refresh/magic-link and the real pulse `/respond/{token}`, `/confirm/{token}` routes exempt (the old exempt entry matched no route) |
| X14 | ☑ | 905a2ff | Caller-less `register/challenge` and `register/verify` (the latter returned success without verifying) removed; the `magic-link` stub was shadowed by the real route, which still answers; CSRF refusal is a clean JSON 403 with no traceback |
| X15 | ☑ | f63a12b | 1440×900, no key: the prompt bar shows the gentle notice as plain text (no draft prefix or monospace); the grief chat shows its own fallback. Screenshots in scratchpad/x15 |
| X19 | ☑ | cba8a86 | 1440×900: a failure shows the notice with 0 copy buttons; a stubbed draft copies with inline "Copied."; a refused clipboard shows the gentle line; no dialogs; svelte-check = baseline |
| X21 | ▶ | | |
| X22 | ☑ | e95faf8 | Fresh DB: PUT funeral_data with object `wishes` and list `budget` → GET returns JSON text that parses back to the same values |
| X24 | ▶ | | |
| X25 | ▶ | | |
| X26 | ▶ | | |
| X27 | ▶ | | |
| X16 | ☑ | 10b25d0 | Fresh DB: GET prefs 200 `{}`, PATCH 200, GET returns the saved value (also fixed: PATCH mutated the JSON in place so it never saved). Production column is `json`, model `JSON`: same type; not run on the simulated schema |
| X17 | ☑ | 5b8e66c | Before: 2 CSP errors, 0 font faces; after: no console errors, Inter and EB Garamond loaded; 1440×900 diff 3.02% of pixels, text only (headings now EB Garamond, body Inter) |
| X18 | ☑ | bb6da02 | Header now has `base-uri 'self'; frame-ancestors 'none'; object-src 'none'`; onboarding and concierge-window load at 1440×900 with 0 CSP console lines (the app never frames itself) |
| X20 | ☑ | 9e878ea | `curl -I /dashboard` 200 (was 405); `frame-src 'self' blob:`; `script-src` carries the sha256 of the build's one inline script (computed from `dist/index.html` at startup) instead of `'unsafe-inline'`; dashboard, onboarding, concierge-window, export preview: 0 CSP violations at 1440×900; the PDF shows in the preview. R0 must confirm the page boots on the Railway build |
| X23 | ▶ | | |
| X13 | ☑ | 339d96f | Fresh DB: full date and recurring MM-DD events create, edit, re-fetch. PostgreSQL-only `ALTER ... TYPE VARCHAR USING to_char` not run locally. Also fixed: the page sent `isRecurring`/`wish`/`emailTemplate` the model lacks (silently dropped), and upcoming-events sorting. Migration re-parented onto B2 at merge (single head) |
| X11 | ☑ | 1007f48 | `/api-guide` 200 html; `/api`, `/api/nope` 404 JSON; `/modules/x` 200; traversal no leak |
| X5 | ☐ | | |
| X6 | ☐ (owner) | | |
| X7 | ☑ | 8a5b462 | Fresh DB: login, /me, refresh 200; magic-link token on /me 401; "BYPASS_AUTH" stored value 401 (was 500); sub-less magic link 401 (was 500); valid magic link 200; jh@ bypass 200 |
| X8 | ☐ (after Wave C) | | |
| X9 | ☑ | b95307d | Magic link verifies once (200), second use 401 "already used"; request logged as `magic_link_requested`, not an auth success; `sub:"abc"` 401; login/me/refresh/jh@ 200. Passkey-finish fixes (keep specific 400/401, audit, missing-user 401) read, not run: needs a real WebAuthn assertion — check in the release browser test |
| X10 | ☑ | c2e8ad1 | Echo off: 503 path p50 2.6 ms, p95 4.1 ms; O1's 473 ms was echo-logging overhead. One shared httpx client |
| U0 | ☐ | | |
| O1 — per wave (A–E) | ▶ (A done: login p95 133, /me 4.8, refresh 19.2, ai/chat 503 path 473 → X10) | | |
| O2 — per wave (A–E) | ▶ (A done: X1 pages render the gentle message, no layout break; findings → X15, X16, X17, E9, E10) | | |
| O1 — release table | ☐ | | |
| O2 — release screenshots | ☐ | | |
| R0 | ☐ | | |
| Release | ☐ | | |
