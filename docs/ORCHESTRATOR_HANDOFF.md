# Orchestrator Handoff — RECOVERY_EXECUTION_PLAN

**Last Updated:** 2026-10-26 14:50 EST

This document is for an agent taking over as orchestrator of `docs/RECOVERY_EXECUTION_PLAN.md` (the plan, the only task board). Read this file, then the plan's "Owner decisions", "Orchestration loop", "Section status" and "Card status" sections. Source code and git win over anything written here.

---

## 1. Where things stand (2026-10-26 14:50 EST)

**Done (✅ in Section status):** Waves A, B, C, D, E, U, G, T, V; O1/O2 for every wave and for the release; R0; **Release** (browser test `docs/reviews/2026-10-26-release/BROWSER-TEST.md`; its defects X292 uploads → Railway volume, X293 Full Record edit, X294 timeline heading all fixed and verified live).

**Only Wave X remains open.** Everything is merged and pushed; local main = origin/main.

> **LOOPS PAUSED by the owner (2026-10-26 14:50 EST): "pause all loops until i tell you to start them again".** The 10-minute plan-completion cron (`522facdb`) was deleted. Do **not** create a new loop/cron until the owner says to start again. The loop prompt to recreate it (CronCreate, every 10 minutes) is in §9.

| Card | State | What finishes it |
|---|---|---|
| **X302** | ☑ verified live: passkey sign-in start 500 → 200; owner then signed in with a passkey (audit `auth_passkey` continuum@sincuerda.com 18:36 UTC). | — |
| **X5** | ☑ merged `0e5e34c` after the owner's passkey sign-in. Bypass removed (backend login, login-page magic-link branch, `backend/verify_auth.py`, CLAUDE.md line). Deploy of `0e5e34c` was in progress at handoff. | Confirm live: wait for `SUCCESS 0e5e34c` (§5), then `curl -s -X POST https://continuum.estate/api/auth/token -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=jh%40continuum.estate&password=x' -o /dev/null -w "%{http_code}"` → 401. Record the result in the X5 row. |
| **X301** | ▶ agent dispatched (worktree `.worktrees/X301`, branch `card/X301`, port 35777): remove the smoke test's jh@ fallback (`scripts/smoke_test.py:434`), `git rm --cached backend/logs/continuum.log.1`, `backend/logs/` in .gitignore. | When `git log main..card/X301` shows a commit: review the diff, merge, remove worktree/branch, tick, push. If no commit and the previous session is gone, re-dispatch into the same worktree. |
| **X6** | Owner | Owner rotates the OpenRouter key. Report only. |
| **X141** | Owner | Owner runs `railway config apply` (plan row has the CLI workaround). Branch `card/X141` 1955d51 not merged. |
| **X154** | Owner decision | Recommend yes (plan row). |

**Live sign-in for proofs is gone** (X5). The `$S/pw/*live.mjs` scripts and `rllib.mjs` sign in as jh@ with password `x` and now get 401. Live verification needs a test account the owner provides; do not create credentials yourself. Read-only checks (`curl` on public endpoints, `railway logs`, DB `SELECT`s via the Postgres service's `DATABASE_PUBLIC_URL`) still work.

**When X301 is ☑:** mark Wave X ✅ (owner items reported, not waited on), verify against `git log` and live `/api/health` (`environment: production`), and send the owner the final report with the open owner items (§8).

## 2. Agents in flight

- X301 (see above). Nothing else.

## 3. Production facts learned this session

- `ENVIRONMENT=production` is set (release step 9): CSRF enforced, Postgres challenge store (X302), new JWT/SECRET keys.
- Uploads: Railway volume `continuum-volume` at `/data`, `UPLOAD_DIR=/data/uploads`, `S3_ENABLED=false` (owner chose the volume, X292). The S3 keys in Railway (`AWS_ACCESS_KEY_ID` "R1ST…") are not valid AWS keys; leave S3 off. Media ids 1–3 from the browser test point at files lost before the fix.
- Backups: `$S/backups/continuum-prod-pre-release-v18.dump`, `$S/backups/continuum-prod-pre-volume.dump` (pg_dump 18 against Postgres 17).
- Live proof helpers: `$S/pw/rllib.mjs` (sign-in + context), `$S/pw/x292vol.mjs up|check` (upload survives redeploy), `$S/pw/x277live.mjs` (20× vault GET). Writes must go through the page (`page.evaluate(fetch…)`), since hooks.client adds the CSRF header.
- `railway logs` (no flags) prints recent logs; `--deployment` printed nothing useful.

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
- Uploads live on the Railway volume `continuum-volume` at `/data` (`UPLOAD_DIR=/data/uploads`, `S3_ENABLED=false`, X292). Live upload proof: `$S/pw/x292vol.mjs up|check`.
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

## 9. Loop prompt (paused — recreate only when the owner says to start again)

CronCreate, every 10 minutes, recurring, with this prompt verbatim:

```
Plan-completion loop (owner request 2026-10-26). You are the orchestrator for docs/RECOVERY_EXECUTION_PLAN.md in /Users/jonathanhollander/AI Code/Continuum. Goal: Waves A–E complete, Wave X (out-of-build bugs, decision 12) complete, Wave U (final UI/UX review + improvements, decision 13, after A–E and X), O1/O2 per wave, R0, then Release — fastest correct route, no added gates or stoppages, ponytail style, follow the plan's Orchestration loop and owner decisions exactly.
1. Read the Card status and Section status tables in the plan.
2. If every row (A–E, X cards, U0 and U cards, O1/O2 per wave, O1/O2 release, R0, Release) is ☑ and every section ✅ (X6 is an owner step: report it rather than wait on it): verify that against git log and the live site's /api/health, then delete this cron job (CronList → CronDelete) and report completion. Stop.
3. Otherwise advance ALL tracks: review the diffs (git diff main...card/<id>) of any agent that reported done and isn't reviewed yet; merge, clean up the worktree and branch, and tick the card; then dispatch the next build cards the wave order allows, any Wave X card whose owned files are not owned by a card in flight (as many X agents as needed), and — once A–E and X are all ☑ — U0 then the U cards. Each card gets its own .worktrees/<card-id> worktree and the brief template. Turn every new finding from agent reports into a card in the same turn (build path → the owning B–E card or a new one; out-of-build → X; UI/UX polish → E or U). Don't redispatch a card that's already ▶ and still running. Don't re-check finished cards without new evidence.
4. If nothing can advance because agents are still running, do nothing and end the turn silently.
```
