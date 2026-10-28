# Continuum post-plan punchlist

**Last Updated:** 2026-10-27 23:10 EST

The recovery plan (`RECOVERY_EXECUTION_PLAN.md`) is marked complete. This list holds what is still wrong, missing or unfinished after it, found by six independent read-only reviews of origin/main `c374721` on 2026-10-27, and re-checked against `d88d465` (the six later commits change signup closure and the homepage only). Each item names its evidence. The reviewers' full reports, with "checked and fine" lists and reproduction notes, are in [reviews/2026-10-27-punchlist/](reviews/2026-10-27-punchlist/).

- **Severity:** P1 = wrong behaviour a person hits, or a risk to the core flow. P2 = polish, debt or latent. There are no P0 findings: no data loss in the core flow, no broken handover.
- **Security-track** items are listed separately; security hardening is outside this project phase.
- **IDs** are `PL-n`. Tick `☐` → `☑` with the commit when done.

**Status 2026-10-27 23:10 EST:** D5 done (`/` permanently redirects to `/marketing2`, which now has the Hybrid images with dark app screenshots; the unused name field is gone). D3 done (signed-in pages follow the light/dark setting; public login/signup/marketing/token pages stay dark). Earlier: every PL item and D4, D6, D7 is fixed (merged on main 2026-10-27; see `git log --grep 'PL-'`). Open: D1 caller notes (owner choosing), D2 Resend key and verified sending domain (owner sets `RESEND_API_KEY`; code is ready), D8 key rotation. D7 note: the 10 January remote branches are bundled at `~/Backups/Continuum/january-branches-2026-10-27.bundle`; deleting them from GitHub needs the owner (the auto-mode classifier refused `git push --delete`). PL-32 note: media rows 1–3 (user 39 test uploads) point at files lost before the `/data` volume existed. PL-46: durable backups now in `~/Backups/Continuum/`.

**Since the reviews:** `f9d16c9` ended private mode, and the live site now reports `private_mode:false, signup_enabled:false`. Recipient, guardian-portal and one-click check-in links now reach the app; live, a fake token returns 404 instead of 403. Three findings closed with that change (see the end of this file). Two got worse: `/docs` and `/openapi.json` now return 200 publicly (PL-24).

---

## 1. Owner decisions (no code until decided)

| ID | Decision | Current state (evidence) | Recommendation |
|---|---|---|---|
| ☐ D1 | **Caller notes on the recipient page** (G4 hold) | Every recipient's start page prints each contact's private `notes`, so recipient A reads what the owner wrote about B. `RecipientStartPage.svelte:354`. | Leave notes off the recipient page. It is a one-line change, and the owner can still read them in Contacts. |
| ☐ D2 | **Email provider** | Production has no `POSTMARK_API_KEY` and no `SMTP_*` settings, so every email (Pulse check-ins, guardian alerts, magic links) is saved locally and never sent (`email_service.py:102-109`; `email_logs` holds one `saved_local` row). | Set Postmark before anyone relies on Pulse. Until then, Pulse is unable to reach anyone. |
| ☑ D3 | **Always-dark pages** | The light/dark setting has no effect on 16+ pages: dashboard, /executor, analytics, onboarding, /start, grief support, all Pulse pages and admin. In light theme, Pulse pages show a white header over dark content. Plan rows V1-P1/P2/P6d chose this; no owner sign-off was found. Screenshots: `ui/in-light_dashboard.png`, `ui/in-light_modules_pulse_contacts.png`. | Make them follow the setting, since the mixed header looks broken. |
| ☑ D4 | **Language selector scope** | Choosing Español translates only the dashboard and menus; module pages stay in English. Only 11 components read `dictionary.ts`. | Label the selector "Menus and dashboard language" now; translating the modules is a separate project. |
| ☑ D5 | **Landing page** | `/` links only to /login, and nothing links to `/marketing2`. `/` asks for a name and then discards it (`routes/+page.svelte`). | Keep one landing page and drop the name field. |
| ☑ D6 | **Executor homes** | `/executor` is reachable only from a printed QR pack (`qrStore.ts:61`); `executor-guide` redirects; `executor-hub` and the toolkit remain. Nothing links to `/welcome`. | Keep the dashboard ExecutorHub plus the toolkit, link `/executor` from the hub, and delete `/welcome`. |
| ☑ D7 | **Other open holds**<br>• ProfileSwitcher "Add Family Member" creates a profile on this device only (`ProfileSwitcher.svelte:45-62`)<br>• Important Dates and Calendar are separate pages<br>• Letters U-e and U-f<br>• The financial page offers Property, Vehicle and Digital types (`AssetManager.svelte:76-90`)<br>• Public QR family scan page<br>• `MAX_UPLOAD_SIZE` at 10 MB<br>• 10 unmerged January branches (E8) | All unchanged in code. None has a card. | Earlier recommendations stand: remove "Add Family Member"; merge Important Dates into Calendar; leave U-e and U-f, the QR page and the upload size; delete the January branches. |
| ☐ D8 | **X6**: rotate the old OpenRouter key | Owner-held; `VITE_OPENROUTER_API_KEY` is still in Railway and used as a backend fallback (`ai_settings.py:219`). | Rotate it, then remove the variable (PL-31). |

---

## 2. P1: wrong behaviour people hit

| ID | Area | Finding | Evidence | Smallest fix |
|---|---|---|---|---|
| ☑ PL-1 | Pulse / infra | **App sleeping stops the Pulse scheduler.** The scheduler runs inside the web process; with `sleepApplication: true`, check-ins, escalations and safety timers stop while the app sleeps. | `.railway/railway.ts:64`; deployment 72baac71 slept and woke 14 times on 10-27, logging "Scheduler has been shut down" each time; `pulse_scheduler.py`. Latent today because no `pulse_settings` row is enabled. | Set `sleepApplication: false` on the web service (and on Postgres; see PL-21). |
| ☑ PL-2 | Data sync | **One tab's edit silently undoes another's.** `SyncManager.update` sends the whole cached row, so a tab that has not re-synced writes old values over newer edits to other fields. | `sync.svelte.ts:648` (`{...currentItem, ...updates}`), sent at `:678`; singletons at `:1525`. Reproduced: tab A's vendor-notes edit was lost when tab B changed only the phone (`persist/stale.cjs`). | Send only the keys in `updates`; the server PUTs already merge partial bodies (`estate_data.py:440-451`, `exclude_unset` elsewhere). |
| ☑ PL-3 | Data sync | **Server times read 4–5 h wrong in the US.** `utc_now()` drops the timezone, so JSON times have no `Z` and the browser reads them as local time. The activity log shows "Just now" for hours, and every `created_at` is affected. | `backend/utils/clock.py:10-12`; `activity-log/+page.svelte:104-118`; reproduced: sent `18:46:51Z`, displayed as 22:46Z (`persist/tz.cjs`). Only two portal pages have `parseUtc`. | Serialize naive datetimes with `Z` in one place (a FastAPI JSON encoder), or share `parseUtc` everywhere timestamps are read. |
| ☑ PL-4 | Handover | **Executor-by-role recipients miss the executor notes.** A contact whose role is Executor, or who matches the profile's executor name, is told "You are named as executor" but gets none of the checklist notes. | `recipient.py:78-82` checks only `is_executor`, while `:171-177` also accepts role or name; same split at `:225`. Reproduced: role-Executor recipient got 0 checklist rows. | Use `is_executor(contact, profile)` in `executor_notes_shared` and at `:225`. |
| ☑ PL-5 | Pulse | **Duplicate escalation tiers.** Two first loads of `GET /api/pulse/tiers` at the same moment each create the default tiers. | `pulse.py:644-661` writes on a read; no unique `(user_id, tier_number)` in `pulse_models.py`. 8 parallel loads gave 12 tiers (`be/race.py`). Four frontend callers. | Add the unique constraint (migration) and insert with on-conflict-do-nothing. |
| ☑ PL-6 | Support | **Grief-support local search always fails in production.** `TAVILY_API_KEY` is unset, and a provider rejection returns 500 instead of 503. | `support.py:31-38,68-70`; the variable is absent from Railway. | Set the key, or hide the search when it is unset; return 503 on upstream failure. |
| ☑ PL-7 | Copy | **Negative wording on rendered pages**, against "Positive only truthful wording everywhere": ai-audit, analytics, builders-console, preparation and executor hubs, scenario-mode ("No digital account records found."), simulator, /executor ("does not establish authority"). Some states only: FireDrill, simulator pause, analytics error, FAQ, task guides, affirmations. | `tools/ai-audit/+page.svelte:113`, `analytics/+page.svelte:82`, `builders-console:361`, `ModuleContent.svelte:179`, `scenario-mode:150,339,409`, `simulator:218`, `executor/+page.svelte:263`, `FireDrill.svelte:95,98,126`, `faqs.ts:14,15,34`, `tasks/phase2/3/5`, `affirmations.ts:37,42`. Full list: [ui.md](reviews/2026-10-27-punchlist/ui.md) (source: `ui-neg-strings.txt`). | Rewrite each as a positive true statement, or leave the line out. |
| ☑ PL-8 | Docs | **CLAUDE.md gives the wrong deploy method.** It says `railway up --verbose`; since X141, a push to main deploys from the GitHub source in `.railway/railway.ts`, and deploys run no migrations. | `CLAUDE.md` Deployment section. | Change the line to "push to main deploys; run `alembic upgrade head` against production by hand when a change needs it". |

---

## 3. P2: polish, debt and latent problems

### Handover and Pulse
| ID | Finding | Evidence | Smallest fix |
|---|---|---|---|
| ☑ PL-9 | Time capsules print the internal "Recipient contact id: 2" in the binder, packet.html, packet.pdf and the recipient's full record. | `exportService.ts:505`: the capsule `consumed` list lacks `recipient_contact_id` (letters have it at `:482`). | Add it to that list. |
| ☑ PL-10 | A past-dated capsule shows "Opened" on the recipient page, but its Status is blank in the binder and PDF. | `exportService.ts:501` vs `recipient.py:70-75`. | Use the `capsule_released` rule for Status. |
| ☑ PL-11 | Opening the medical page writes an empty profile row (`organ_donor=false`), which then appears in every later snapshot.json. Parallel first loads return 500 (unique constraint). | `medical.py:29-37`; `be/race.py`: 4 of 8 failed. | Return unsaved defaults on GET, as `/api/pulse/settings` does. |
| ☑ PL-12 | Guardian emails and the portal say "Last check-in" for the moment Pulse was switched on, when the owner never checked in. | `pulse.py:264-267`. | Say "Check-ins began" when the method is `pulse_enabled`. |
| ☑ PL-13 | Contact cards repeat role and relation ("Friend · Friend"). | `ho/out/for-theo.png`. | Show the relation only when it differs from the role. |
| ☑ PL-14 | Pulse inputs accept nonsense: negative safety-timer minutes (already expired, so guardians are alerted on the next pass), `delay_hours=-5`, `notification_method="pigeon"`. | `be/prodcheck2.py`, `prodcheck3.py`; the UI slider is 5–120. | `Query(ge=1, le=1440)`, plus enum and range checks. |
| ☑ PL-15 | A failed Pulse heartbeat toggle shows a generic "We're here to help" toast that never says what stayed unchanged. | `ui/fail2-_modules_pulse_settings.png`. | Name the setting in the message. |

### Data and backend
| ID | Finding | Evidence | Smallest fix |
|---|---|---|---|
| ☑ PL-16 | "Your draft is kept" is untrue. After a failed save, the typed values vanish on "Maybe later" or reload. A failed create is held only in memory. CLAUDE.md says creates are optimistic; they wait for the server. | `sync.svelte.ts:593,600,766,1043,1572`; `persist/behaviour.cjs` step 3. | Store the failed draft in localStorage for Try Again, or change the wording and CLAUDE.md. |
| ☑ PL-17 | These requests return 500: integers ≥ 2^63 (29 bodies), `safety/start?minutes=99999999999`, `history?limit=1e20`, non-boolean `overwhelm_muted`, an estate profile over 100 KB, and `transparent_data:null`. | `be/fuzz1.jsonl`, `dev.log` (OverflowError ×29). | Add bounds and type checks; 413 for oversized bodies. |
| ☑ PL-18 | `PUT /api/data/*` skips validation, so a type mismatch returns 400 "try again" and retrying can never succeed (POST returns 422 for the same body). | `estate_data.py:440-465`; 20+ types in `dev.log`. | Validate updates and return 422. |
| ☑ PL-19 | 422, 405, 429 and some 403 errors come back in other shapes than `{error:{message}}`, so the frontend shows its generic line instead of the per-status message. | `errorHandler.ts:34-43`; `main.py:279`; `be/prodcheck3.py`. | Add handlers that emit the standard shape. |
| ☑ PL-20 | `POST /api/estate` replaces the whole saved estate blob, which erases the profile. Its only caller (`syncService.ts`) is dead code. | `main.py:411-419`; reproduced locally. | Delete the route and `syncService.ts`. |
| ☑ PL-21 | Postgres also sleeps. If both services wake together, the passkey challenge store falls back to in-memory for the rest of that process's life. | Log 11:44:08 "Falling back to in-memory"; `challenge_store.py:252-257` has no retry. | Turn off Postgres sleep (with PL-1), or init the store lazily with a retry. |
| ☑ PL-22 | Every boot changes the schema outside Alembic: `create_all`, ad-hoc ALTERs, and an unconditional `ALTER users public_key DROP NOT NULL`. The passkey challenge table is created the same way and is never purged. | `database.py:111-112,130-225`; `challenge_store.py:127-159,206-231`. | Run `migrate_db()`/`create_all` on SQLite only; purge expired challenges on write. |
| ☑ PL-23 | Schema drift. Production has 6 booleans nullable that the models mark NOT NULL, plus a stray `calendar_events.recurrence` column. A fresh migration chain makes `assets.purchaseDate` TIMESTAMP, adds a dead `financial_accounts.customAttributes`, and leaves `is_closed` nullable. `alembic check` is non-empty on both SQLite and Postgres. | Production `information_schema` diff; `versions/14d9f7ed9ba1…py:25`, `f343b5ae2de8…py:45,49`. | One migration, guarded by an inspector check so it is a no-op where already right. |
| ☑ PL-24 | `DEBUG` is unset on Railway and defaults to True. Production logs at DEBUG level (httpcore noise dominates), and **since private mode ended, `/docs` and `/openapi.json` are public (live 200)**. | `config.py:31`; live curl 2026-10-27 15:20 EST. | Set `DEBUG=false` in `.railway/railway.ts` variables, or default it to False in production. |
| ☑ PL-25 | Unbounded lists: `activity_log` (all of it returned and cached in localStorage), `pulse/messages`, and old `refresh_tokens` rows. | `estate_data.py:265-280`, `activityLog.svelte.ts`, `pulse.py:463`. | Add limits and a purge of expired tokens. |
| ☑ PL-26 | `alembic heads`, `history` and `check` crash without PYTHONPATH, because a migration imports app code. | `versions/b2e4a6c8d0f1…py:8`. | `prepend_sys_path = ..` in `alembic.ini`. |
| ☑ PL-27 | The Postmark bounce webhook returns 403 in production (CSRF), even though it has its own secret. Live: 403. | `csrf.py:39-61`; `email.py:328`. | Exempt it from CSRF. Needed only once D2 is set. |
| ☑ PL-28 | SMTP has no timeout, so it can hang a request or a scheduler run. A `/` in a contact email crashes the local outbox save. The outbox writes to the container's temporary disk, not the `/data` volume. | `email_service.py:279,314-321`. | Set a timeout, clean the filename, and point `OUTBOX_DIR` at `/data`. |
| ☑ PL-29 | Each hourly CSRF cookie renewal calls the full `/api/health` (a database query and a disk write). `HEAD /api/health` now returns 404. | `hooks.client.ts:64-71`; live `curl -I`. | Call `/api/csrf-token`; allow HEAD on health. |
| ☑ PL-30 | Dead code: `EstateItemCreate`/`Update`, 14 unused exception classes, three unused audit helpers (so export and recipient views are not audited), the `/api/data` validators (`estate_data.py:39-107`), the Pulse webauthn and `/api/emails` routes, `/api/data` aliases that duplicate dedicated routers with weaker rules, five stray scripts and a tracked `.db.backup`. | [backend.md](reviews/2026-10-27-punchlist/backend.md) #16–17; [persistence.md](reviews/2026-10-27-punchlist/persistence.md) #6. | Remove them (the Pulse webauthn route also closes PL-S2). |
| ☑ PL-31 | Unused settings in Railway (`ENCRYPTION_KEY`, `SECRET_KEY`, `AWS_*` with `S3_ENABLED=false`, and `VITE_OPENROUTER_API_KEY` after D8). 7+ unused fields in `config.py`. | Railway variable names; `config.py`. | Remove them. |
| ☑ PL-32 | Two orphaned media rows (`media_files` 4 and 5, user 39) are attached to no memory. The volume shows 792 MB used while the DB references 45 kB of files. | Production `SELECT`s; `railway volume list`. | Inspect `/data/uploads` with `railway ssh`; remove unreferenced files and rows. |

### UI
| ID | Finding | Evidence | Smallest fix |
|---|---|---|---|
| ☑ PL-33 | The dashboard search icon is hidden behind the input's background. | `ui/dash-search-crop.png`; `dashboard/+page.svelte:577-585`. | Add `z-10` to the icon. |
| ☑ PL-34 | The breadcrumb reads "Active Module" on preparation-hub, executor-hub, funeral traditions and the unknown-module page. | `ui/in-light_modules_executor-hub.png`. | Map those paths to their titles. |
| ☑ PL-35 | The AI Concierge panel always says "Active Assistant", even while chat returns 503. On Pet Care its context chip said "Continuum Dashboard". | `ConciergePanel.svelte:351`; `conciergeEngine.ts:64`. | Tie the label to AI availability; update the context on route change. |
| ☑ PL-36 | Admin "User Activity Log" is titled "Real-time session interactions" but shows only the admin's own browser session. Admin copy is negative ("does not verify", "No points … yet"). | `UserActivityLog.svelte:22-23`; `admin/readiness/+page.svelte:31-35,136`; `admin/health:71`. | Retitle and rewrite. |
| ☑ PL-37 | "Return to Home" on `/pulse/verify/[token]` is hard-coded to `https://continuum.estate`. | `pulse/verify/[token]/+page.svelte:96`. | `href="/"`. |
| ☑ PL-38 | The favicon request returns index.html; there is no `static/favicon.ico`. Uvicorn startup lines show as level "error" in Railway. | `curl /favicon.ico`; Railway logs. | Add the icon; send uvicorn logs to stdout. |
| ☑ PL-39 | Server error copy: the 500 says "our team knows" though no alerting exists; email routes say "not found" / "Not authorized"; the signup warning says "(development mode)" in production. | `errors.py:358-366`, `email.py:139,155,178`, `admin.py:10`, `auth.py:209`. | Rewrite in positive, true wording. |

### Docs and repo hygiene
| ID | Finding | Evidence | Smallest fix |
|---|---|---|---|
| ☑ PL-40 | Plan decision 4 still says the jh@ bypass stays, but X5 removed it. The plan says "only X6 remains owner-held" while D1–D7 are open. Six ☑ rows note open limits that no card owns (X323, X351, X390, X373, X336, X142). E11 cites `9c5f634`, which is not on main (the same patch is `fb33152`). | `RECOVERY_EXECUTION_PLAN.md:47,896,913,934,963,976,991,1087`. | Edit those lines and point the plan at this punchlist. |
| ☑ PL-41 | CLAUDE.md: no root README exists; it names `PROJECT_RECOVERY_PLAN.md` as current; it says "No Automated Tests" though `backend/tests/` exists. AGENTS.md has three false statements: asset aliases "without filtering", the scheduler "ignores PULSE_SCHEDULER_ENABLED", and admin/infra "deferred". | `CLAUDE.md`; `AGENTS.md:11,63,96`. | Edit those lines. |
| ☑ PL-42 | OpenWiki still documents `railway.toml` and `railway up`. | `openwiki/operations/development-and-deployment.md:94,99`. | Regenerate it and fix the deploy line. |
| ☑ PL-43 | `ORCHESTRATOR_HANDOFF.md` contradicts itself (X364/X141 deferred at lines 57 and 63, complete at lines 18–19). `CARD_BRIEF.md` hard-codes one session's scratchpad paths. | Those files. | Delete the stale paragraphs; use placeholders. |
| ☑ PL-44 | Tracked junk: `frontend/live/undefined-*.png` (9 proof screenshots), `frontend/build.log` (285 KB), 5 unused heirloom placeholder PNGs (3.8 MB), 10 `backend/outbox` emails containing old sign-in links. | `git ls-files`. | `git rm` them and add the paths to `.gitignore`. |
| ☑ PL-45 | Decision 6 says to delete merged branches, while AGENTS.md:117 says to keep them. 98 merged local branches and 2 stashes remain. | `git branch`. | Pick one rule. |
| ☑ PL-46 | The only recorded production backups are in `/private/tmp`, which macOS clears on reboot. | `ORCHESTRATOR_HANDOFF.md:45`. | Move a fresh `pg_dump` to durable storage. |
| ☑ PL-47 | `checkSuites: true` in `.railway/railway.ts` would make any future CI check gate deploys. It does nothing today because there are no workflows. | `railway.ts:54`. | Note it in CLAUDE.md, or set it to false. |
| ☐ PL-48 | Production-only schema drift that changes no data: some columns are `text` where models say `varchar`, 20 `user_id`/name indexes the models declare are missing, a few server defaults linger, and the `webauthn_challenges` table lives outside the models. `alembic check` against production lists them (2026-10-27 16:50 EST, after `b2d4f6a8c0e2`). | Production `alembic check`. | One autogenerated migration reviewed line by line, or accept as is. The indexes are the only part with a user effect (speed at scale). |

---

## 4. Security-track (recorded, out of this phase)

| ID | Finding | Evidence |
|---|---|---|
| ☑ PL-S1 | `seed_dev_user` runs in production. Today the existing row has no password, so `dev123` gets 401; if that row were removed, the next boot would recreate it with `dev123`. | `main.py:57-58,189-211`. |
| ☑ PL-S2 | Any signed-in user can delete and re-register another user's passkey through the unused Pulse webauthn finish route; credential IDs are exposed by `passkey/login/start`. Matters now that signups and private mode are off only if another account exists. | `pulse.py:720-733`; `auth.py:480-513`. |
| ☑ PL-S3 | Guardians see the owner's Pulse messages at all times, though the `contact_reach` docstring says escalation reach opens them. | `pulse_logic.py:569-571` vs `:636-637`. |
| ☑ PL-S4 | Grief-support search needs no sign-in; uploads are read fully into memory before the size check and trust the client's file type; `/api/data` has no body-size or field limits (validators dead, PL-30); the vault is stored as plain text; passkey login logs emails and credential lists. | `support.py:22`, `media.py:111-129`, `pulse.py:503`, `auth.py:488-517`. |
| ☑ PL-S5 | Contact updates write no audit row (create and delete do). Export and recipient views are not audited. | `contacts.py:105-116`. |
| ☑ PL-S6 | No `X-Content-Type-Options: nosniff` and no `Permissions-Policy` header. | `curl -I` on public pages. |

---

## Closed since the reviews (no work)

- **Private mode blocked recipient, guardian-portal and one-click check-in links** (production #3, backend #2): resolved by `f9d16c9`; live returns 404 for a fake token.
- **`HEAD /api/health` returned 403:** now 404 (folded into PL-29).
- **The Postmark webhook was also blocked by private mode:** the CSRF block remains (PL-27).

## Verified working (do not re-check without new evidence)

- **Handover, end to end on synthetic data:**
  - Each recipient sees only their own letters; held letters and unreleased capsules stay out.
  - Shared-file links close immediately.
  - The binder, PDF and four download copies agree value for value, and files are byte-identical to the uploads.
  - Pulse escalates through tiers 1–4, opens the vault tier by tier, and a check-in closes it.
- **Data sync:**
  - Every module store round-trips every field into a second session.
  - Rollback and Try Again work; deletes reach other sessions; five quick updates end at the last value; the shared load notice appears once.
- **Backend:** 1,258 bad and edge-case requests returned 2xx or 4xx apart from PL-6 and PL-17. Production mode enforces CSRF, CORS, secure cookies and HSTS; ownership checks hold apart from PL-S2.
- **UI:** no console errors, failed requests, overflow or endless spinners on any route in either theme. Forced-500 saves show the failed state and save exactly once on Try Again.
- **Production:**
  - The live code matches main; the Alembic head matches; all 48 tables exist; no dangling references; no tracebacks across 6 deployments.
  - Uploads are on the `/data` volume; health is 200; public pages answer in 0.16–0.38 s.
- **Plan:** all 591 card rows are ☑ except X6; every cited commit is on main except E11's.

## Could not verify

- Copy inside every closed modal and wizard step.
- Dead buttons on about 59 routes.
- The AI-on path; no provider is configured locally.
- Real passkey ceremonies.
- Postgres-only behaviour of the race findings.
- What fills the 792 MB volume (needs `railway ssh`).
- Cold-start latency.
- The tier-4 default contacts on the Escalation page.
- The all-clear email, which needs a real provider (D2).

## Side effects of the review

- 2 fake-credential sign-in attempts against production at about 18:40 UTC (2 `auth_password_failed` audit rows).
- 1 grief-support search sent to Tavily with a key from the reviewer's shell; Tavily rejected it (401), so nothing was charged.
- Everything else was local or read-only.
