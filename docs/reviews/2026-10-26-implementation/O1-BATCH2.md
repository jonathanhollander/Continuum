# O1 — Second correction batch

**Last Updated:** 2026-10-26 17:38 EDT

Read-only performance oversight. Application source, tests and configuration were unchanged by this review. This report is left for the orchestrator to commit.

## Result and source cutoffs

**1,000 completed HTTP samples** were measured: 20 sequential samples per workload at each of 20 and 200 records. All stable auth/Pulse/contact workloads met the reporting targets. Five full snapshot/recipient response workloads at 200 records exceeded the **150 ms read p95** target, at **160.579–202.776 ms**. Writes met the **300 ms p95** target. Those five rows prompted canonical **X366**; its response-encoding change and post-change parity/timings belong to that card rather than replacing this baseline.

| Measurement set | Exact frozen `main` commit | Scope |
|---|---|---|
| S — stable handlers | `bd4499233ef6544692333d637ff4e7072fb1d0b8` | Auth signup/passkey start/retry/login options/magic-link receipt, contacts deletion/list, Pulse status/settings/tiers/messages/selected transparency/public guardian view and vault |
| H — handover after X320 merge | `5a21511b549de296a08d66aab4fa34dd7e81cef5` | Expanded export snapshot, regular-recipient and explicit-executor preview/public view, recipient links/notes, cold/warm shared-media membership |

Each set ran from its own `git archive` backend copy, with no `.env` or owner database copied. Full Python source SHA256 maps were taken before and after each set and remained identical. The first-batch profile/root/recovery/discovery endpoints were already measured in **O1-BATCH1** and were not repeated here. **X340 optional unused-media deletion was unmerged at these cutoffs and is outside these tables.** The final release endpoint inventory/timing pass is separate.

## Method and data

- PostgreSQL **18.4**, a new private cluster at `/private/tmp/o1-batch2-7hpcuilq/pg`, Unix socket only, port label 56302, database `continuum_o1`. Fresh Alembic migration completed through `b2e4a6c8d0f1`; no runtime schema startup was run. Runtime: SQLModel 0.0.42, SQLAlchemy 2.0.52, httpx 0.28.1, pinned project virtual environment.
- This private `initdb --no-locale` setup used **C / SQL_ASCII**; all timed fixture text was ASCII. Unicode/collation behavior and production UTF8 timings are outside this batch. The release reviewer and X366 implementer were told to initialize their independent clusters explicitly with UTF8.
- The owner is synthetic user **2**, with a second populated owner **3** and 22/202 initial users, avoiding the special admin user 1. Authenticated calls used a real locally generated JWT. TestClient exercised middleware, real authentication, handlers, SQL, serialization and response bytes. It was never entered as a lifespan context: no scheduler, startup migration or real mail ran.
- S uses 20/200 contacts, check-ins, escalation-history rows, messages, vault notes and credential-option rows **per populated owner**; the four meaningful tier definitions and one settings/root row remain fixed. Contacts deletion has 20 dedicated target contacts, each with 20/200 graph links, removed before the read samples. Auth signup/start samples create their own synthetic users. Pulse alert-history rows exercise the preserved `recorded`/awaiting-history path; provider-accepted/failed classifier correctness was not a timing assertion.
- H populates every collection in X320's **23-model snapshot inventory** with 20/200 rows per owner. Assets have 20/200 rows **per category** (60/600 total). Medical profile, funeral data and advanced-assets storage remain singletons; each advanced history list holds 20/200 items. Executor steps have 20/200 distinct step keys. Letters contain **1,590 ASCII bytes each**; both recipient identities have letters/capsules, with held letters and unreleased capsules present. Default policy is `executors_only`; one recipient has the explicit executor flag and the other does not.
- H also has 20/200 unique synthetic local **68-byte PNG** files per owner, referenced by records and advanced-history entries. It measures membership/authorization and a tiny local file response, not realistic photo/video bandwidth, S3 or image decoding.
- SQLAlchemy `before_cursor_execute` records SQL cursor invocations, statement shapes and executemany parameter-set counts, including authentication queries. COMMIT/pool protocol operations and fixture setup are excluded. **A cursor invocation is not always one logical SQL execution**: the deletion case is explained below.
- Every endpoint/workload has exactly **20 completed samples per size**, without added warm-ups or repeated-until-fast runs. p50 is the median; p95 is the nearest-rank 19th sorted sample. Twenty reserved TestClient socket-peer IPs keep the existing public-route throttles enabled while avoiding measurement of 429 responses; this is not a rate-limit correctness test.
- Real password hashing is included in signup. Mail-producing methods return an explicit unavailable in-memory sentinel; template/provider/mail-file work is excluded. There were **80 sentinel calls in S**, zero in H, and **zero attempted external transports**. WebAuthn option generation and pending-account reuse are included; hardware/signature completion and provider latency are excluded.

## Stable handler timing — cutoff S

Times and cursor counts below read **20-record value → 200-record value**. All completed samples returned HTTP 200.

| Endpoint / workload | p50 ms, 20 → 200 | p95 ms, 20 → 200 | SQL cursor calls, 20 → 200 | Over target? | Source / cause | Smallest fix |
|---|---:|---:|---|---|---|---|
| DELETE /api/contacts/{id} (n graph links) | 17.247 → 25.113 | 31.561 → 39.769 | 6 → 6; logical executions 25 → 205 | No | `contacts.py:120–148`; audit INSERT batches, relationship DELETE uses driver executemany. | Watch: one owner-scoped bulk relationship DELETE, retaining each audit row. |
| GET /api/contacts | 10.211 → 4.397 | 15.584 → 5.077 | 2 → 2 | No | `contacts.py:73–76`; one indexed owner list plus authentication. | None proposed at measured size. |
| GET /api/pulse/status | 12.005 → 13.984 | 21.031 → 20.301 | 8 → 8 | No | `pulse.py:73–165`; batched contacts/messages and fixed clock/history queries. | None proposed. |
| GET /api/pulse/transparency | 19.515 → 17.190 | 35.143 → 56.026 | 18 → 18 | No | `pulse.py:348–390`; chooser list and one selected guardian detail. | None proposed. |
| GET /api/pulse/portal/{token} | 8.308 → 7.933 | 13.706 → 9.963 | 10 → 10 | No | `pulse.py:397–407`; live token lookup and fixed guardian-view queries. | None proposed. |
| GET /api/pulse/portal/{token}/vault | 7.630 → 9.332 | 10.681 → 12.310 | 6 → 6 | No | `pulse.py:411–419`; fixed access/history and owner vault query. | Watch vault owner index; no target breach. |
| POST /api/pulse/settings | 6.174 → 5.953 | 7.532 → 7.469 | 3 → 3 | No | `pulse.py:243–271`; owner settings read/update. | None proposed. |
| PUT /api/pulse/tiers/{id} | 8.033 → 5.075 | 12.624 → 6.708 | 3–4 → 3–4 | No | `pulse.py:664–677`; first sample repeats saved zero; subsequent samples update. | None proposed. |
| GET /api/pulse/messages | 6.475 → 8.770 | 8.508 → 11.148 | 2 → 2 | No | `pulse.py:464–467`; complete owner history, one list query. | Watch response growth; preserve history. |
| POST /api/auth/signup (mail unavailable) | 41.045 → 58.171 | 46.676 → 63.277 | 5 → 5 | No | `auth.py:160–238`; real password hash, account/audit/token persistence; sender unavailable. | None proposed. |
| POST /api/auth/passkey/register/start (new) | 3.813 → 5.782 | 4.848 → 7.827 | 3 → 3 | No | `auth.py:307–351`; user lookup/insert, options, pending challenge. | None proposed. |
| POST /api/auth/passkey/register/start (retry) | 3.574 → 5.753 | 4.451 → 7.417 | 3 → 3 | No | `auth.py:289–351`; pending-owner lock and credential-existence check. | None proposed. |
| POST /api/auth/passkey/login/start | 3.159 → 8.540 | 3.705 → 10.001 | 2 → 2 | No | `auth.py:454–509`; account lookup and credential options list. | Watch credential owner index; no target breach. |
| POST /api/auth/magic-link (existing; mail unavailable) | 3.595 → 6.210 | 3.983 → 8.039 | 3 → 3 | No | `auth.py:604–691`; account lookup/audit and unavailable sender sentinel. | None proposed. |
| POST /api/auth/magic-link (unknown) | 3.009 → 5.092 | 3.289 → 7.703 | 2 → 2 | No | `auth.py:604–691`; account lookup and request audit. | None proposed. |

## Handover and recipient timing — cutoff H

The cold shared-file workload clears only the synthetic membership cache before each sample. The warm workload uses the cache populated by the preceding cold run; token and executor-note policy are still checked fresh. No snapshot/preview request is timed against the pre-X320 implementation.

| Endpoint / workload | p50 ms, 20 → 200 | p95 ms, 20 → 200 | SQL cursor calls, 20 → 200 | Over target? | Source / cause | Smallest fix |
|---|---:|---:|---|---|---|---|
| GET /api/export/snapshot | 19.415 → 144.957 | 46.462 → 175.470 | 26 → 26 | **Yes, at 200** | `export.py:241–277`; complete 23-table handover and JSON HTTP response. | X366: optimize response encoding, preserve complete payload. |
| GET /api/recipient/preview/{id} (regular recipient) | 18.526 → 141.892 | 19.812 → 167.393 | 27 → 27 | **Yes, at 200** | `recipient.py:84–109,230–231`; filtered handover and JSON response. | X366: same response-encoding candidate. |
| GET /api/recipient/preview/{id} (explicit executor) | 18.209 → 132.968 | 19.798 → 160.579 | 27 → 27 | **Yes, at 200** | `recipient.py:84–109,230–231`; includes explicitly shared executor notes. | X366: same response-encoding candidate. |
| GET /api/recipient/view/{token} (regular recipient) | 18.058 → 139.657 | 19.873 → 202.776 | 27 → 27 | **Yes, at 200** | `recipient.py:221–225`; live token, filtered handover, cache membership, JSON response. | X366: same response-encoding candidate. |
| GET /api/recipient/view/{token} (explicit executor) | 19.875 → 135.302 | 21.198 → 163.980 | 27 → 27 | **Yes, at 200** | `recipient.py:221–225`; same path with executor-note membership. | X366: same response-encoding candidate. |
| GET /api/recipient/links | 2.448 → 6.452 | 2.641 → 6.721 | 2 → 2 | No | `recipient.py:235–237`; one owner contacts list. | None proposed. |
| GET /api/recipient/links/{id} | 2.117 → 2.519 | 2.296 → 2.779 | 2 → 2 | No | `recipient.py:241–242`; primary-key contact lookup and authentication. | None proposed. |
| PUT /api/recipient/links/{id} (note) | 2.751 → 3.091 | 3.147 → 3.468 | 4 → 4 | No | `recipient.py:246–259`; owned contact update and refresh. | None proposed. |
| GET /api/media/shared/{token}/{id} (cold membership) | 11.576 → 52.837 | 12.686 → 84.983 | 29 → 29 | No | `recipient.py:156–166`; full membership rebuild, then `media.py:228–246` file read. | None proposed at measured size. |
| GET /api/media/shared/{token}/{id} (warm membership) | 2.821 → 2.891 | 3.213 → 3.215 | 3 → 3 | No | `recipient.py:156–160`; fresh token/policy and cached membership; local file read. | Preserve fresh policy/token checks. |

## Findings and source reasoning

1. **Measured target miss: complete snapshot HTTP responses at 200 records.** The owner snapshot is **2,910,366 bytes**; regular-recipient output is about **2,346,736 bytes**, and executor output about **2,410,630 bytes**. Cursor counts remain 26/27 as rows grow tenfold. The same filtered snapshot used for a cold 68-byte shared-file response has p95 **84.983 ms** with 29 cursor calls, while the public regular-recipient JSON response reaches **202.776 ms** with 27 calls. This points toward full-row assembly plus recursive HTTP JSON processing/output cost; it is an **inference**, not a CPU profile proving one exclusive cause. `export.py:241–277`, `recipient.py:84–109,179–190,221–231`. Root assigned **X366** to evaluate a response-only encoding change with complete body/access parity. Preserve all prose, expanded histories, attachment membership and sharing policy; truncating the handover is not the proposed fix.
2. **Contact cleanup has flat cursor calls but growing logical DELETE work.** Each sample uses six cursor invocations: user lookup, contact lookup, graph-link lookup, one batched audit INSERT, a driver executemany relationship DELETE, and the contact DELETE. That executemany carries **20 → 200** parameter sets, giving **25 → 205 logical statement executions**, despite six cursor events. Local p95 stays **31.561 → 39.769 ms**. This is an **optimization watch item**, not a new functional defect/card, as directed by the orchestrator. A future owner-scoped bulk relationship DELETE could reduce driver work while preserving each per-link audit row and one transaction. `contacts.py:120–148`, `utils/audit.py:15–60,106–126`.
3. **No measured per-contact/per-record SELECT fan-out.** Pulse status batches contact and alert-message history; selected transparency builds detail for one guardian, so query counts stay 8/18 rather than scaling with all contacts. X320 reads each model once, expands the three saved history lists and selects the newest executor row in memory, then matches media in memory. The prefetched profile is passed through the recipient builder, avoiding a second profile query. `pulse.py:73–130,348–390`; `export.py:79–114,241–260`; `recipient.py:84–109`.
4. **Index coverage has small-data watch items.** The migrated schema has user/contact-token indexes on contacts, the user/timestamp check-in index, owner indexes on escalation logs/tiers, user/contact indexes on messages, and a media-owner index. It has **no secondary index** on `pulse_vault.user_id`, `pulse_credentials.user_id` or `contact_relationships.user_id`/edge IDs. PostgreSQL chose sequential scans for the sampled owner vault and credential lookups. Those paths stayed below target at 400 total vault/credential rows, so no new indexing requirement is asserted here. Exact index definitions/plans are retained in `indexes.json`. Model/source references: `pulse_models.py:51–57,165–173`, `estate_models.py:357–364`; actual migrated indexes are the evidence.
5. **List bounds are explicit where missing.** Contacts, Pulse messages, recipient-link lists, vault rows and snapshot section queries use complete `.all()` lists (`contacts.py:73–76`; `pulse.py:464–467`; `recipient.py:235–237`; `export.py:249–259`). Their response/assembly cost grows with owned records even when SQL count is flat. Complete export/recipient membership is intentional. Any later interactive paging or summaries must preserve the full handover path; this review adds no pagination or record-dropping change.

## Client request inspection

These are source observations, not browser timing measurements. The inspected client baseline is `5a21511`; its exact file hashes are retained separately.

- `PulseContactsManager.svelte:53–67` starts `contactSync.sync()` before awaiting tiers. The list and tier reads run in parallel; cached contacts can display while refresh completes.
- `signup/+page.svelte:102–154,179–224` issues registration start after submission, waits for the WebAuthn interaction, then finishes registration and initializes authentication. Those stages depend on the preceding challenge/credential rather than representing an avoidable list-fetch waterfall.
- `RecipientLinkPanel.svelte:87–90,130–145` saves its note on blur or the Save button. Typing updates the local value, rather than issuing one PUT per keystroke. The service serializes captured mutations. Pulse delay/contact controls save on their explicit change/commit handlers (`PulseContactsManager.svelte:70–85`). No per-keystroke sync was identified in these inspected paths.
- `/for/[token]/+page.svelte:13–32` loads one token-scoped snapshot. `RecipientStartPage.svelte:72–107` requests files near the viewport using `IntersectionObserver`, reuses successful bytes and coalesces repeated file requests. The full-record action intentionally asks for all its attachments (`:110–112`).
- The download-copy action waits for existing requested files, refreshes its snapshot, then gathers missing attachments (`RecipientStartPage.svelte:232–247`; `exportService.ts:1093–1107`). This is a source-visible sequential dependency; its user-visible cost was not measured here. Fresh policy checks and file membership must remain intact in any later parallelization.

This batch does **not** establish the ≤1 s module-visible target, browser request counts, rendering/ZIP/PDF time, mobile performance, wide-area transfer latency or concurrent load behavior. Those remain release/browser measurements.

## Evidence, failures and reproducibility

- Approved manual harness: `/private/tmp/continuum-o1-batch2.py` (**T-O1-BATCH2**). It is private, unscheduled and uncommitted.
- S structured measurements/raw samples/SQL/source hashes: `/private/tmp/o1-batch2-7hpcuilq/stable-measurements.json`; output `/private/tmp/continuum-o1-batch2-stable-sequence-fixture-failure.log` contains the first nine completed 20-record rows, retained in the final statistics; remaining output `/private/tmp/continuum-o1-batch2-stable-completion.log`.
- H measurements/raw samples/SQL/source hashes: `/private/tmp/o1-batch2-7hpcuilq/recipient-measurements.json`; complete successful output `/private/tmp/continuum-o1-batch2-recipient-completion.log`.
- Migration/setup: `/private/tmp/o1-batch2-7hpcuilq/migration.log`, `setup.json`, `recipient-setup.json`. Index/plan evidence: `indexes.json`; client identities: `frontend-source-identities.json`.
- Preserved fixture failures: `/private/tmp/continuum-o1-batch2-stable-setup-failure.log` (wrong relationship seed field), `/private/tmp/continuum-o1-batch2-stable-sequence-fixture-failure.log` (manual user IDs left the sequence behind; the first attempted signup returned 500), `/private/tmp/continuum-o1-batch2-recipient-bulk-fixture-failure.log` (bulk ORM VARCHAR cast against historical nullable timestamp column), and `/private/tmp/continuum-o1-batch2-recipient-encoding-fixture-failure.log` (non-ASCII seed prose in the private ASCII database). These fixture paths were corrected, without schema/application edits. The nine already completed timing rows were retained; they were not run again. Recipient failures occurred before any recipient timing rows.
- Independent recount checked all **1,000** completed samples, row counts and the p95 calculation against the saved raw timings. Every completed sample was HTTP 200.

Selected source SHA256 prefixes (full maps are in the structured artifacts):

| File | S | H |
|---|---|---|
| `backend/database.py` | `2ad670f7c583` | `2ad670f7c583` |
| `backend/estate_models.py` | `023ff42b782a` | `023ff42b782a` |
| `backend/routers/auth.py` | `a93fd6723e51` | `a93fd6723e51` |
| `backend/routers/contacts.py` | `e0c923592e33` | `e0c923592e33` |
| `backend/routers/pulse.py` | `4f06b51e5670` | `4f06b51e5670` |
| `backend/pulse_logic.py` | `af14e6bc5072` | `af14e6bc5072` |
| `backend/routers/export.py` | `c1540961e768` | `546f8c3b37c4` |
| `backend/routers/recipient.py` | `247bed9f0241` | `4d54e2c375fe` |
| `backend/routers/media.py` | `37c5256a1057` | `37c5256a1057` |

## Boundaries

These are local sequential TestClient/Unix-socket PostgreSQL measurements, with synthetic data and tiny local files. They do not measure Railway latency, production traffic, contention, S3, live mail/providers, successful hardware WebAuthn completion or production authentication/token handling. No production credentials were inspected. The email admin-resend/provider path and unmerged X340 optional-delete guard are excluded. The complete active frontend endpoint inventory and final production read-only timing table are assigned separately.

Only this report is written in the repository. No application source, configuration, test or script was committed by this oversight. The private PostgreSQL server was stopped after measurement and after the separate X340 proof released its independent database. Synthetic data, frozen source copies and raw evidence remain in the private temporary folder for review. X340 stayed outside the measured source cutoffs; its final release timing is assigned separately.

Post-review date-contract clarification (no source edit): a separate migrated UTF8 PostgreSQL probe confirmed the active property form’s purchaseDate path. The mapper trims returned timestamps to YYYY-MM-DD; create→GET→exact mapper→Chromium native date input→edited PUT→fresh GET retained both dates and one stable row. Pydantic type warnings remain, and this is not a full Svelte-route proof. Evidence: `/private/tmp/continuum-purchase-date-WB18XK/proof.log`. The earlier bulk-seed failure does not demonstrate active date loss.
