# Continuum — Recovery Execution Plan (subagent-run)

**Last Updated:** 2026-10-26 01:10 EST

The how and the order for [PROJECT_RECOVERY_PLAN.md](PROJECT_RECOVERY_PLAN.md) (phases A–F).
Issue IDs (CU-0xx) and their evidence are in
[the review](reviews/2026-10-25-features-usability/REVIEW.md). This is the only task board.

---

## Owner decisions (2026-10-26, confirmed)

1. **Product:** Continuum is a product built from Jonathan's needs for himself and his son. Features are generic ("designated recipient"), and the son is the first recipient and the acceptance scenario.
2. **This upgrade is features and functionality only.** Security and admin (Wave F) are out of scope. Recipient access uses the simplest owner-issued link; there is no permissions system.
3. **Execution model:** subagents code **all** cards, Waves A through E. The orchestrator reviews **by diff only**. Then **one deploy of everything**, then a **full browser test of everything**. Defects found go round the same code → diff review → deploy → browser test loop.
4. **Rules are guidance.** Every older rule (archived plans, agent specs, the UI standards doc, `AGENTS.md`, `CLAUDE.md` conventions, and the rules below) may be bypassed when that is better for the software. Say so in the commit message. Merged branches may be deleted. Still kept: no force-push to main, no destructive operations on production data (the existing mixed records need an owner yes), no messages to real people, no spending, and the `jh@continuum.estate` bypass stays.
5. **Goal:** at the start of coding, set a session goal of "Waves A–E complete", and do not stop or switch focus until Wave E is done.
6. **Worktrees:** every coding agent works in its own worktree, so agents don't clash. After a card merges, remove its worktree and delete its merged branch.

## Rules (ponytail; guidance, see decision 4)

- **One card, one job.** Make the smallest change that meets the card's acceptance, then stop.
- **One proof scenario.** It covers *every* acceptance condition on the card. A screenshot
  or an HTTP 200 alone is not proof.
- **Behaviour fixes allowed when needed.** If a type error hides a real bug, fix the bug
  inside the card's files. Do not cast it away.
- **Scope stop.** If the job is bigger than the card, report what you found and stop.
- **New cards** come from proven defects (browser, API or source trace) or from missing
  required functionality.
- **Reopen a card** when evidence shows its acceptance was not met, or something
  regressed. Do not reopen it just to re-check.
- **No blockers.** No gates, hooks, CI steps, required checks, locks or approval files.
  Checks are run by hand.
- **No feature removal.** Code may be moved, forwarded or labelled, but every feature stays
  reachable.
- **No fake data in the owner's records.** Tests use synthetic data in throwaway
  databases.

## Orchestration loop (owner decisions 3 and 6)

**Coding pass (Waves A to E, no deploys in between):**
1. Set the session goal "Waves A–E complete" (decision 5).
2. Dispatch each wave in one message. **Every coding agent gets `isolation: "worktree"`.** Waves run in order (A, B in sequence, C, D, E), because later cards build on earlier ones.
3. Each agent runs its own local proof scenario against synthetic data, and reports the files it changed.
4. **Review by diff only:** read each worktree's `git diff` against its card. Check the scope, the owned files, the acceptance conditions it claims, and that no feature was removed. Do not re-run the agent's work. Merge if it's good. If not, send it back with the specific diff lines.
5. Commit each merged card with its card ID, push, then **clean up**: `git worktree remove` that worktree and delete its merged branch. Run `git worktree prune` at the end of each wave.

**Release pass (once, after Wave E):**
6. Run `npm run check` and `npm run build` once, then deploy everything with `railway up`, and poll `/api/health` until the new version is live.
7. **Full browser test:** the whole completion test (owner and recipient contexts), then every module on load, save, edit, reload and second-context retrieval, the binder and the PDF. Record the results in the completion-test table and the card status table.
8. Each proven defect becomes a card. Run it through the same loop (worktree → code → diff review → merge and clean up → deploy → browser test) until everything is green.

### Agent brief template

```
Card <ID> (<CU ids>): <title>. Repo /Users/jonathanhollander/AI Code/Continuum (SvelteKit 5 runes, FastAPI/SQLModel).
Read first: the CU entries in docs/reviews/2026-10-25-features-usability/REVIEW.md, and AGENTS.md "Persistence and feature invariants".
You own: <files>. Edit nothing else.
Smallest change: <what>.
Acceptance (prove all in one scenario): <conditions>.
Ponytail: smallest change, one proof scenario, stop. No gates/hooks/CI. No feature removal.
Synthetic data only. If it's bigger than this card, stop and report.
Report: files changed, proof output, done or stopped (why).
```

---

## Wave A — Stable ground (3 agents, parallel)

| ID | Card | Agent | Owns | Change | Acceptance |
|---|---|---|---|---|---|
| A1 | Pin the full backend set | `general-purpose` | `backend/requirements.txt`, `nixpacks.toml` | Pin exactly production's `pip freeze` (all resolved packages). Keep `python311`. | A fresh 3.11 venv installs; the dev user seeds; login returns 200 (production versions are checked in the release pass) |
| A2 | Stale CI line | `general-purpose` | `CLAUDE.md` (Deployment) | Replace "wait for GitHub Actions" with "run `npm run check` and `npm run build` by hand". | One-line diff |
| A3 | UI-payload smoke script | `general-purpose` | `scripts/smoke_test.py` (new), reusing `docs/reviews/.../evidence/reproduce_api_probes.py` | For each core record type, send the exact payload its store sends (after `toSnake`), re-fetch, and diff every field. Run by hand. | Its output reproduces CU-001, CU-002, CU-004 and CU-009 as failures, and journal/home-access as passes |

## Wave B — Shared contracts (one owner per area, run in sequence, B1 first)

These touch shared files, so they run in sequence, not in parallel.

| ID | Card | CU | Agent | Owns | Acceptance (all in the A3 script plus one browser save) |
|---|---|---|---|---|---|
| B1 | Explicit field contracts | 001 | `api-contract-validator` | `lib/services/sync.svelte.ts` (conversion), the Asset-family mappers, `backend/estate_models.py` (field aliases only) | Every displayed writable field on financial, property and subscription survives create, edit, re-fetch and reload, including 0 and empty values; custom-field keys are preserved |
| B2 | Category membership | 004 | `fastapi-development` | `backend/routers/estate_data.py` | Properties, digital assets and generic heirlooms each list only their own rows after create, update and delete; existing mixed rows are reported first and **not migrated without the owner's go-ahead** |
| B3 | Singleton vs. collection | 006, 011 | `fastapi-development` | `SingletonSyncManager` in `sync.svelte.ts`, `/api/estate/profile`, the funeral and advanced-asset endpoints | Repeated saves update one record; profile settings merge rather than replace each other; the UI always receives an object |
| B4 | Truthful save state | 013 | `error-handling-standardization` | `sync.svelte.ts` status, `activityLog.svelte.ts`, the wrappers that close forms before the save finishes | A forced failure shows one failure message, keeps the draft, and offers retry; an activity-log failure never marks a successful save as failed; one success shows one message |
| B5 | Store initialization | 014 | `frontend-state-cleanup` | The `registerSync` registry, the `syncAll` callers | Visiting a module directly, reloading, or logging out and back in shows the right records; a second browser context fetches the same estate |

## Wave C — Dependable scenario records (parallel after B; one agent per row)

| ID | Card | CU | Owns | Acceptance |
|---|---|---|---|---|
| C1 | Documents | 002 | `DocumentVault.svelte`, the `documents` endpoint | Save a real PDF *and* a physical-only document, with title, category, witnesses, review date, original location and custom fields; edit, reload and download it from a second context |
| C2 | Files and media | 010 | `mediaService.ts` (auth key `continuum_auth_token`), `mediaStorage.ts`, `mediaMigration.ts`, `FileUploader`, the media router | A PDF, an image, an audio clip and a video upload, then download or play in a second context; local originals are kept until that retrieval succeeds |
| C3 | Letter to a named recipient | 008 | the letters route and `letterStore` | Pick the recipient from contacts; reopening a draft edits it with no duplicate; the full text and release fields survive a reload |
| C4 | Journal, ethical will, lessons | 007 | the ethical-will and lessons components | They use the existing `JournalEntry` types; no sample text is ever saved automatically |
| C5 | Time capsule | 009 | the time-capsule route and store | Text and video capsules create, edit and reload; the media plays in a second context (depends on C2) |
| C6 | Translation stores | — | `localization.ts`, `conciergeStore.svelte.ts` | Settle the two `t` interfaces (one is a translator function, the other a dictionary) and update each caller. Proof: the callers render, not a lower error count |

## Wave D — The handover (D1, then D2–D4 in parallel)

| ID | Card | CU | Owns | Acceptance |
|---|---|---|---|---|
| D1 | One export snapshot | 003 | `exportService.ts`, `/binder`, `/export/preview` | The binder and PDF both read one snapshot covering all the scenario records, with full text, correct names and an attachment manifest; their counts match the screens |
| D2 | Recipient start page and owner preview | 005 | a new route for the recipient view, plus recipient/executor flags on contacts | A named recipient opens the owner-issued link (simplest token link, reusing the portal token mechanism, independent of Pulse escalation, with no permissions system) in a separate context and finds the note, steps, contacts, original locations, letters and media; the owner's preview shows the same page |
| D3 | Persistent executor steps | 015 | executor-toolkit | Completed steps and notes survive a reload and link to the records each step needs |
| D4 | Honest readiness | 012 | `readiness.ts`, `estateAudit`, the vault score, the financial trend | An empty state reads "not started"; no invented trends; summary totals match the detail lists |

## Wave E — Polish what was proven (parallel)

E1 navigation, legacy and finance first (CU-018) · E2 forms (CU-019) · E3 simulated-feature
labels (CU-020) · E4 early-preview labels on Pulse, QR, scenarios, analytics and builder
(nav flag) · E5 park unused stores **outside `src/`** (`frontend/_archive/`) after
confirming they have 0 importers · E6 remaining type errors in the touched files · E7
phone and keyboard pass (CU-025) · E8 branch triage (delete merged branches under the
standing git rule; list the rest).

## Wave F — Security and admin: OUT OF SCOPE for this upgrade (owner decision 2)

Listed so nothing is lost: F1 rotate the OpenRouter key (an owner step, recommended anyway) · F2 server-side AI proxy · F3 production environment variables · F4 untrack the `.db` files · F5 the bypass, only when asked.

---

## Card status

| Card | Status | Proof / commit |
|---|---|---|
| A1 | ☐ | |
| A2 | ☐ | |
| A3 | ☐ | |
| B1–B5 | ☐ | |
| C1–C6 | ☐ | |
| D1–D4 | ☐ | |
| E1–E8 | ☐ | |
| Release: deploy + full browser test | ☐ | |
| F1–F5 | out of scope | |
