# Continuum — Recovery Execution Plan (subagent-run)

**Last Updated:** 2026-10-26 00:20 EST

Turns [PROJECT_RECOVERY_PLAN.md](PROJECT_RECOVERY_PLAN.md) into task cards that subagents
carry out while the main session orchestrates. The *why* for each item lives in the
recovery plan (its R-numbers are cited on each card). This file is the *how* and the
*order*.

---

## Rules every card follows

**Ponytail style.** One pinpointed task per agent. Make the smallest change that solves
it, show one proof, and stop. No refactors on the side, no cosmetic padding, no second
pass.

**No blockers.**
- Nothing in this plan adds a gate, hook, CI step, required test, lint failure, lock or
  approval file.
- Checks (`npm run check`, `npm run build`, `scripts/smoke_test.py`) are things agents and
  the orchestrator *run*. They are never wired into commit, push or deploy.

**No feature removal.** Code may be moved, forwarded or labelled. Modules and features
stay reachable.

**No list growth.** A new card is added only when a test proves a defect, or when the owner
asks for one. A finished card is not reopened for another look.

**Scope stop.** If the job is bigger than the card says, the agent stops and reports what
it found. It does not expand the scope.

---

## Orchestration loop (main session)

For each wave:

1. **Dispatch** all cards in the wave in one message. Cards that change code run with
   `isolation: "worktree"`. Read-only and test cards run in the main tree.
2. **Receive** each agent's report: files changed, the one proof, and done or stopped.
3. **Spot-check** the proof the agent gave. Do not re-run the agent's whole job.
4. **Merge** the worktrees, run `npm run check` and `npm run build` once, then commit and
   push.
5. **Deploy** with `railway up`, poll `/api/health` until the new version reports, and do
   one live check of what the wave changed.
6. **Tick** the cards in this file and update the Feature Status table in the recovery
   plan. Go to the next wave.

Git, deploy and production reads fall under the standing authorisations in the global
`CLAUDE.md`. The only steps that pause for the owner are marked **OWNER**.

### Agent brief template (paste this into every Agent call)

```
Task <ID>: <title>. Repo: /Users/jonathanhollander/AI Code/Continuum (SvelteKit 5 runes + FastAPI/SQLModel).
Goal: <one sentence>.
You own only these files: <list>. Do not edit anything else.
Smallest change: <what to do>.
Proof (exactly one): <proof>.
Rules: ponytail. Smallest change, one proof, stop. Do not add any gate, hook, CI step, or required check.
Do not remove features. If the job is bigger than this card, stop and report what you found.
Dev login: jh@continuum.estate. Compassionate wording rules: docs/TONE_GUIDE.md.
Report back: files changed, the proof output, done or stopped (and why).
```

---

## Wave 0 — Stop the ground moving (2 agents, in parallel)

| ID | Card | Agent | Owns | Smallest change | Proof | Ref |
|---|---|---|---|---|---|---|
| T0.1 | Pin backend dependencies | `general-purpose` | `backend/requirements.txt` | Replace each `>=` with `==` at the version production runs (`railway ssh -- /opt/venv/bin/pip freeze`). Pin only the packages already listed. | A fresh Python 3.11 venv installs from the file, and `POST /api/auth/token` with the dev login returns 200 on a local server | R0.1 |
| T0.2 | Fix the stale deploy note | `general-purpose` | `CLAUDE.md` (Deployment section only) | Replace "Wait for GitHub Actions…" with "Run `npm run check` and `npm run build` before deploying (manual, not a gate)." | `git diff` shows only that line changed | R0.3 |

After the wave: deploy, then confirm on production that `/api/health` is healthy and dev
login works.

## Wave 1 — Find out what actually works (2 agents, in parallel)

| ID | Card | Agent | Owns | Smallest change | Proof | Ref |
|---|---|---|---|---|---|---|
| T1.1 | Click through the core journeys | `chrome-devtools-debugger` | Feature Status table in `docs/PROJECT_RECOVERY_PLAN.md` (writes results only, no code) | Against a local app: sign up, onboarding, dashboard, then add, reload, edit and remove one item in each of the 7 core modules, then reopen in a second isolated browser context. Record Pass or Fail in each cell, plus the console error or failing request for each Fail. | The filled table, with one screenshot path per Fail | R1.1, R1.2 |
| T1.2 | Smoke test script | `general-purpose` | `scripts/smoke_test.py` (new) | Log in, then create, read and delete one valid item per core endpoint, using the field names from `backend/estate_models.py`. Print a pass/fail table. Run by hand only. | Script output against a local server | R2.5 |

After the wave: write **one fix card per proven Fail** into Wave 2b, and nothing else.
Important Documents is already proven (T2.1).

> T1.1 needs browser tools. Last session they were refused because the session ran in
> "don't ask" mode. Run this wave in auto mode, or allow `mcp__chrome-devtools__*` and
> `mcp__claude-in-chrome__*` in `.claude/settings.local.json`.

## Wave 2a — Fix the core journey (up to 5 agents, in parallel, each in its own worktree)

File ownership does not overlap, so these can run side by side.

| ID | Card | Agent | Owns | Smallest change | Proof | Ref |
|---|---|---|---|---|---|---|
| T2.1 | Important Documents saves | `fastapi-development` | `backend/routers/estate_data.py` (`MODEL_MAP`), `frontend/src/lib/components/archetypes/DocumentVault.svelte` (`registerSync` call only) | Add `"vault_documents": Document` to `MODEL_MAP`. The Vault sends `name`, `type`, `date` and `location`, but `Document` requires `title` and `category`, so map `name`→`title` and `type`→`category` in the Vault's sync mapper. | Create a document in the UI, reload, and it is still there; `GET /api/data/vault_documents` returns it | R2.1 |
| T2.2 | One first-run flow | `general-purpose` | `frontend/src/routes/start/+page.svelte`, `frontend/src/routes/welcome/+page.svelte`, and the `goto` calls in `frontend/src/routes/+layout.svelte` that send users to `/start` | Send first-run users to `/onboarding`. Leave the `/start` and `/welcome` page code in place, with a link back to `/onboarding`. | A fresh sign-up lands on `/onboarding`, and so do direct visits to `/start` and `/welcome` | R2.2 |
| T2.3a | Fix the `$t` typing | `type-safety-enforcer` | `frontend/src/lib/stores/localization.ts`, `frontend/src/lib/stores/conciergeStore.svelte.ts` (the `t` export only) | Give the `t` derived stores an explicit translator function type, so `$t(...)` is no longer `unknown`. | `npm run check` error count drops by about 78 (record before and after) | R2.3 |
| T2.3b | Type errors in onboarding and the dashboard | `type-safety-enforcer` | `frontend/src/lib/components/onboarding/**`, `frontend/src/routes/dashboard/+page.svelte` | Fix only the errors svelte-check reports in these files. Make no behaviour change. | svelte-check shows 0 errors in the owned files | R2.3 |
| T2.4 | Show save failures | `error-handling-standardization` | `frontend/src/lib/services/sync.svelte.ts` (including its 3 `technicalDetails` type errors) | When the server rejects a save, keep the item marked as not saved, and show the existing gentle notification through `notificationStore`. | Point a store at an invalid endpoint, save, and the gentle message appears while the item shows "not yet saved" | R2.4 |

## Wave 2b — Fixes for the failures Wave 1 proved (one agent per Fail, up to 8 at a time)

Each card follows the brief template. It owns only the files of that one module and its
store, and its proof is that the T1.1 row for that module turns to Pass.

| ID | Card | Status |
|---|---|---|
| — | *Written after Wave 1, one row per proven Fail* | |

## Wave 3 — Second-tier modules (1 test agent, then fix agents)

| ID | Card | Agent | Owns | Smallest change | Proof | Ref |
|---|---|---|---|---|---|---|
| T3.1 | Click through the second-tier modules | `chrome-devtools-debugger` | Feature Status table (adds rows) | Run the T1.1 method on Subscriptions, Pet Care, Property, Digital Accounts, Letters, Heirlooms, Life Journal, Visual Memories, Time Capsule, Timeline, Final Wishes and Family Tree. | The filled rows | R3.1 |
| T3.2 | Fix each proven Fail | per module | That module and its store | Same pattern as Wave 2b. | Its row turns to Pass | R3.1 |
| T3.3 | Store media on the server | `media-upload-infrastructure` | `frontend/src/lib/utils/mediaStorage.ts`, `frontend/src/lib/services/mediaMigration.ts`, and the time-capsule page's IndexedDB call | Send uploads to the existing `/api/media` router instead of IndexedDB. Keep the read fallback for files already stored in IndexedDB. | Upload a photo, open it in a second browser context, and it displays | R3.2 |

## Wave 4 — Label the extras (1 agent)

| ID | Card | Agent | Owns | Smallest change | Proof | Ref |
|---|---|---|---|---|---|---|
| T4.1 | "Early preview" label | `general-purpose` | `frontend/src/lib/config/navigation.ts`, and the item rendering in `frontend/src/routes/catalog/+page.svelte` | Add `isPreview?: boolean` to `NavItem`. Set it on the 8 Extras/Tools items that have not passed testing, and render a small "early preview" tag. Every link stays in place. | Screenshot of the Extras group with the tags, with all links still working | R4.1 |

R4.2 (no new modules until Wave 3 is green) is a scheduling choice for the orchestrator.
It is not a check, and nothing enforces it.

## Wave 5 — Remove duplicates without losing features (up to 4 agents, in parallel)

| ID | Card | Agent | Owns | Smallest change | Proof | Ref |
|---|---|---|---|---|---|---|
| T5.1 | Park the unused stores | `general-purpose` | `frontend/src/lib/stores/{calendarStore,visualMemoryStore,advancedAssetStore}.ts` | `git mv` them to `frontend/src/lib/stores/_archive/`. Moved, not deleted. | `grep` shows 0 importers, and the build passes | R5.1 |
| T5.2 | One path each for documents and heirlooms | `fastapi-development` | `backend/routers/documents.py`, `backend/routers/heirlooms.py` | Turn the duplicate routers into thin forwards to the `/api/data/*` handler, so old URLs still work. | The old and new URLs return the same items | R5.2 |
| T5.3 | Branch triage | `general-purpose` (read-only, then git) | Remote branches | For each of the 15 branches, check whether its changes are already in `main`. Delete the merged ones (standing git authorisation). List the rest, with their unique commits. | The report table, plus `git branch -r` after deletion | R5.3 |
| T5.4 | One agent folder | `general-purpose` | `.claude/agents/`, `.agent/` | Where `.agent/agents/X.md` differs from `.claude/agents/X.md`, keep the `.claude` copy as canonical. **OWNER:** asked once whether Antigravity is still in use before `.agent/` moves to `docs/archive/`. | A diff report | R5.4 |

## Wave 6 — Security and admin (only after Wave 3 is green)

| ID | Card | Agent | Smallest change | Proof |
|---|---|---|---|---|
| T6.1 | **OWNER:** rotate the OpenRouter key in its dashboard | — | — | The old key is revoked |
| T6.2 | Move AI calls server-side | `fastapi-development` | Add a `/api/ai/chat` proxy that uses the server-side key. `aiConciergeService.ts` and `aiGriefService.ts` call the proxy. Remove `VITE_OPENROUTER_API_KEY` from the build. | `grep sk-or-` across the live JS returns nothing, and the concierge still answers |
| T6.3 | Production environment variables | orchestrator | Set `ENVIRONMENT`, `JWT_SECRET_KEY`, `SECRET_KEY`, `FRONTEND_URL`, `RP_ID` and `ORIGIN` on Railway. Note: a new JWT secret signs every user out once. | `/api/health` reports `"environment":"production"` |
| T6.4 | Untrack the SQLite files | `general-purpose` | `git rm --cached` the `.db` files and add them to `.gitignore`. The local files stay. | `git ls-files` shows no `.db` files |
| T6.5 | `jh@continuum.estate` bypass | — | Not touched until the owner asks | — |
| T6.6 | Remaining `MASTER_TODO.md` and Issues #10, #20–#38 | per item | One card each, written when Wave 6 starts | — |

---

## Size and cost

| Wave | Agents | Runs after |
|---|---|---|
| 0 | 2 | — |
| 1 | 2 | Wave 0 deployed |
| 2a | 5 | Wave 1 (T2.1 and T2.3a can start with Wave 1) |
| 2b | 1 per proven Fail | Wave 1 |
| 3 | 1 test agent, then fixes, then 1 media agent | Wave 2 deployed |
| 4 | 1 | Wave 3 test results |
| 5 | 4 | Any time after Wave 2 |
| 6 | 3 agents, plus orchestrator and owner steps | Wave 3 green |

No wave goes over 8 agents. One wave is done when every card in it has proof and is
deployed.

## Card status

| ID | Status | Proof / commit |
|---|---|---|
| T0.1 | ☐ | |
| T0.2 | ☐ | |
| T1.1 | ☐ | |
| T1.2 | ☐ | |
| T2.1 | ☐ | |
| T2.2 | ☐ | |
| T2.3a | ☐ | |
| T2.3b | ☐ | |
| T2.4 | ☐ | |
| T3.1 | ☐ | |
| T3.3 | ☐ | |
| T4.1 | ☐ | |
| T5.1 | ☐ | |
| T5.2 | ☐ | |
| T5.3 | ☐ | |
| T5.4 | ☐ | |
| T6.1–T6.6 | ☐ | |
