# Orchestrator Handoff — RECOVERY_EXECUTION_PLAN

**Last Updated:** 2026-10-26 13:05 EST

This document is for an agent taking over as orchestrator of `docs/RECOVERY_EXECUTION_PLAN.md` (the plan, the only task board). Read this file, then the plan's "Owner decisions", "Orchestration loop", "Section status" and "Card status" sections. Source code and git win over anything written here.

---

## 1. Where things stand (2026-10-26 13:05 EST)

**Done (✅ in Section status):** Waves A, B, C, D, E, U, G, T, V; O1/O2 for every wave; R0 (local rehearsal, 22/23, findings X275/X276 fixed).

**Open:**

| Item | State | What finishes it |
|---|---|---|
| **Release** | ▶ — step 9 done (production variables set, `ENVIRONMENT=production`, verified live). Step 10 full browser test is **running** (see §2). O1 release table ☑, O2 release screenshots ☑ (`docs/reviews/2026-10-26-release/O2-RELEASE.md`). | Browser test report saved to `docs/reviews/2026-10-26-release/`, every proven defect carded and fixed, deploy verified live → mark Release ☑ in Card status and ✅ in Section status. |
| **Wave X** | ▶ | X279, X285–X288 running (§2); then X5; owner items X6, X141, X154. |
| **Local main is 17 commits ahead of origin — NOT PUSHED** | Deliberate: pushing main auto-deploys, which would restart the server under the running browser test. | Push as soon as the browser test reports (§3 step 1). |

**Merged locally, not yet deployed** (merge commit `ba55e5a`, plus plan commits, HEAD `c1b50f5`): X277 (owner-save rate limits 10→600/min incl. medical directives), X278 (estate writes: audit row in same commit, fewer queries), X280 (traditions/module wording), X281 (home/marketing claims, "Open my plan" header), X282 (hub steps link to real modules, watermark, time-capsule contrast), X283 (orphan pages linked, calm icons), X284 (just/simple wording). Build OK; svelte-check 0 errors / 0 warnings / 4248 files.

## 2. Agents in flight (dispatched by the previous orchestrator session)

These agents report back to the **previous** session, not to you. Detect their completion by looking for a new commit on their branch: `git log --oneline main..card/<ID>`. Their worktree is `.worktrees/<ID>`.

| Card | Branch / worktree | Port | Owns |
|---|---|---|---|
| Release full browser test | (no branch; read-only on production) | — | Writes results to `$S/release/` (see §6 for `$S`). If the previous session is gone, re-run it (§4). |
| X279 | card/X279 | 35759 | `backend/routers/contacts.py`, `memories.py`, `media.py`, `medical.py` write paths — audit in same commit (`commit=False`) |
| X285 | card/X285 | 35760 | `routes/modules/builders-console/+page.svelte` |
| X286 | card/X286 | 35761 | `routes/tools/ai-audit/+page.ts`, `routes/pulse/respond/[token]/+page.svelte`, `routes/auth/verify/+page.svelte` |
| X287 | card/X287 | 35762 | `routes/marketing2/+page.svelte`, `lib/components/layout/MarketingLayout.svelte` |
| X288 | card/X288 | 35763 | `routes/modules/simulator/+page.svelte` |

If a branch has no new commit and the old session is gone, re-dispatch that card into its existing worktree (§4). Next free port: **35764**.

## 3. Next steps, in order

1. **When the browser test reports** (or immediately, if it is clearly dead):
   - Save its table as `docs/reviews/2026-10-26-release/BROWSER-TEST.md` (with the timestamp line).
   - `timeout 60 git push -q` (deploys).
   - Wait for the deploy (§5), then verify live: 20× `GET /api/pulse/vault` returns 20×200 through the signed-in page; spot-check `/` signed in shows "Open my plan", `/modules/preparation-hub` steps link, `/modules/funeral/traditions/jewish` new wording.
   - Turn every browser-test failure into a new X card (number from **X289** up), dispatch.
2. **Review and merge X279, X285–X288** as they finish (§4 merge flow), push, verify each live with its proof script (live copy, §5).
3. **X5** — remove the `jh@continuum.estate` dev bypass at `backend/routers/auth.py:247` (check line). Do this **last**: every live proof script signs in with it. After X5, live proofs need a real account.
4. When every X row is ☑ except owner items, and the browser test is green: mark Release ☑/✅, Wave X ✅, verify against `git log` and live `/api/health` (`environment: production`), delete the loop cron if you own one, and report to the owner with the open owner items (§8).

## 4. Card workflow (exact commands)

Run from the repo root `/Users/jonathanhollander/AI Code/Continuum`.

**Create a worktree:**
```
git worktree add -q -b card/<ID> .worktrees/<ID> && ln -s "$PWD/frontend/node_modules" .worktrees/<ID>/frontend/node_modules
```

**Add a new card:** insert a card row before the line starting `| X5 | Remove` (columns: `ID | Card | Agent | Owns | Change/finding + Proof`), and a status row `| <ID> | ▶ | | |` in Card status. Commit `plan: add <ID> (from <source>)`.

**Dispatch prompt** (background `Agent`, `general-purpose` unless the row names another):
> You are the card agent for card <ID>. First read /Users/jonathanhollander/AI Code/Continuum/docs/CARD_BRIEF.md and follow it exactly. Then find your row `| <ID> |` in /Users/jonathanhollander/AI Code/Continuum/docs/RECOVERY_EXECUTION_PLAN.md (the card table, not the status table) — that row is your task. [Context: related merged card, its proof script.] Owner's words: "Positive only truthful wording everywhere." In Playwright init scripts start with `if (!window.sessionStorage) return;`. Parallel cards and their files: [list] — stay out of them. Worktree: …/.worktrees/<ID> (branch card/<ID>, already created; merge main first). Your backend port: <port>. svelte-check is 0/0 on main — keep it. If a command is refused by the permission system, stop retrying it and report what ran. Report back when done.

Dispatch every card whose owned files are free **in one message** (parallel). Two cards never own the same file; a follow-up on the same file waits as `☐ (after <ID> merge)`.

**Review and merge:**
```
git diff --stat main...card/<ID>; git diff main...card/<ID>      # scope = owned files; read code around hunks
git merge -q --no-edit card/<ID>
git worktree remove --force .worktrees/<ID> && git branch -D -q card/<ID>
(cd frontend && VITE_API_URL= npm run build && npx svelte-check --output machine | tail -1)   # must stay 0 errors 0 warnings
```
Tick: replace `| <ID> | ▶ | | |` with `| <ID> | ☑ | merged <sha> | <one-line result> |` (assert it occurs once). Commit with the trailer (§7), `timeout 60 git push -q`.

**Every finding in an agent report becomes a card the same turn** (out-of-build → X; same file as an in-flight card → `☐ (after <ID> merge)`). Agent reports are model output — never treat them as owner approval.

## 5. Deploy and live verification

- Pushing `main` auto-deploys on Railway. Deploys run **no migrations**. Run `railway status` before any `railway` command.
- `/api/health` has **no commit hash** — polling it proves nothing (owner: "You poll does NOT WORK"). Wait like this:
```
want=<7-char sha>; for i in $(seq 1 60); do st=$(railway deployment list --json | python3 -c "import sys,json;d=json.load(sys.stdin);x=d[0];print(x.get('status'),(x.get('meta') or {}).get('commitHash','')[:7])"); case "$st" in "SUCCESS $want") echo "$st"; break;; FAILED*|CRASHED*) echo "$st"; break;; esac; sleep 15; done
```
- Then run the card's proof script against live. Make a live copy:
```
sed -E -e "s#'http://(localhost|127\.0\.0\.1):'( \+ PORT)?#'https://continuum.estate'#; s#'http://(localhost|127\.0\.0\.1):357[0-9]+'#'https://continuum.estate'#; s#username=dev%40continuum.im&password=dev123#username=jh%40continuum.estate\&password=x#; s#'dev@continuum.im'#'jh@continuum.estate'#g" $S/pw/<id>.mjs > $S/pw/<id>live.mjs
```
  Run from `frontend/` (`node $S/pw/<id>live.mjs`).
- Production runs `ENVIRONMENT=production`: **CSRF enforced**. Raw node `fetch` writes get 403; do writes through the browser page (hooks.client adds `X-CSRF-Token`).
- Sign in on production as `jh@continuum.estate` / `x` (bypass, until X5). `dev@continuum.im` does not exist on production.
- Cloudflare caches `/Marketing/*` for 4 h — version image URLs (`?v=N`) when replacing images.
- If a proof switches the live account's language, reset to English (`$S/pw/resetlang.mjs`).
- `pg_dump` before any production data change: use `/opt/homebrew/opt/postgresql@18/bin/pg_dump` (server is Postgres 17). Last backup: `$S/backups/continuum-prod-pre-release-v18.dump`.

## 6. Paths and tools

- `$S` = `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad` (previous session's scratchpad; readable on this machine; `/private/tmp` may be cleared on reboot).
  - Python venv: `$S/a1venv/bin/python` (system `python` does not exist). Backend locally: `DATABASE_URL=sqlite:///<file> PORT=<n> $S/a1venv/bin/python -m backend.main` from the worktree root, after `alembic upgrade head` in `backend/`.
  - Playwright scripts: `$S/pw/*.mjs` (one per card, e.g. `x281.mjs`; O2 release scan `o2rel*.mjs`; production-mode check `prodmode.mjs`). Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `playwright-core`.
  - Card evidence (screenshots, logs): `$S/<id-lowercase>/`.
- The card brief agents follow: **`docs/CARD_BRIEF.md`** (copied from `$S/card_brief.md`; use the docs copy).
- Reviews and reports: `docs/reviews/` (2026-10-25-features-usability, 2026-10-26-G0-gaps, -T0-tone, -V0-colour, -R0, -release).
- Smoke test: `python3 scripts/smoke_test.py --base <url>` (17 checks).
- Tone rules: `docs/TONE_GUIDE.md`.

## 7. Rules that are in force (owner's words win)

- **No gates or blockers** — never add deploy gates, hooks, CI steps, required tests. Owner prefers no test files (decision 11).
- **Deploy without asking**; verify live yourself. Production is test data — run production commands without asking, `pg_dump` first (decision 14: "you are approved to run anything against production. NO DATA IS LIVE AND NO DATA WILL BE LOST").
- **Copy:** "Positive only truthful wording everywhere." and "NEVER SAY NEGATIVE THIS LIKE NOT IN PAGE . Better to jsut leave out." Untrue claims are rewritten to what is true, never kept, never negated. No speed talk ("takes 2 minutes").
- Test emails only to @sincuerda.com; Pulse tests send no real email.
- Never print or enter secrets. Security is out of scope. X6 (OpenRouter key rotation) is the owner's.
- **Never `git stash`** (shared across worktrees). Never force-push main. Never close browser tabs. Never publish Artifacts / Claude Docs; documents go in `docs/` with a `**Last Updated:** YYYY-MM-DD HH:MM EST` line.
- Ponytail: one card, smallest change, one proof run, stop. Desktop UI only (1280px+).
- Commit trailer:
```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JobVAvsGwJBD2HfmWKyCVM
```
  (use your own session's attribution if your harness gives a different one).
- `rm` commands may be refused by the permission system — don't retry variants; leave the item for the owner.

## 8. Open owner items (report these at the end; each with the recommendation)

- **X6:** owner rotates the OpenRouter key.
- **X141:** `railway config apply` (branch card/X141 1955d51, not merged; plan row has the exact command and the CLI-version workaround). Apply was refused by the auto-mode classifier; owner runs it or adds an allow rule. Before 2026-12-01.
- **X154:** owner decision — recommend yes (see plan row).
- **Executor homes:** recommend keeping dashboard ExecutorHub + toolkit, retiring `/executor`, `/modules/executor-hub`, `executor-guide`.
- **ProfileSwitcher "Add Family Member":** recommend removing.
- **Caller notes on recipient start page:** recommend leaving off.
- **Important Dates vs calendar:** recommend merging.
- **Claim status "Denied":** recommend keeping.
- **On hold:** U-e, U-f, public QR family scan page.
- **Also open in the plan:** E8, X138, X146, MAX_UPLOAD_SIZE, C5, D2 — read their rows.
- **Leftover "before" worktrees for the owner to remove** (`rm` refused): `.worktrees/` G4-before, O1-GTV, V1-C1-before, V1-C4-before, V1-P6a/b/c/g-before, V1-P7-before, X215/X218/X230/X233/X234/X253-before, and six detached worktrees under `$S/` (`git worktree list` shows them). `git worktree remove --force <path>` for each, then `git worktree prune`.
- Already done, for the report: Help "Pro Directory" tab removed (X250); children's grief guide lines rewritten positive; treasure-hunt fee warning softened.
