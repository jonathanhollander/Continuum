# O1 supplement — configurable AI context and complete request assembly

Recorded **2026-10-26 20:48 EDT**. Manual recorder registration: **T-O1-AI-CONTEXT**, scoped to X374–X376. Application source was read-only; this report is the sole repository deliverable.

## Result and remaining limitation

All **320 timed requests returned HTTP 200** and passed their untimed response/membership assertions: the approved original 14 workloads × 20 samples, followed by exactly two affected settings-save workloads × 20 samples after the supplied-asset validator merged. Original results remain preserved; completed unaffected workloads were not repeated.

SQL cursor counts remained flat: **two per read/preview/chat request, four per save/reset**, including actual persisted-user authorization. All final workload p95 values were below the requested **150 ms local target except the final 45-scope shared settings save: 218.758 ms**. That row is a measured target miss, not a passing 150 ms result. Its p50 was 70.636 ms; the three slowest samples were 153.395, 218.758, and 408.485 ms. No profile attributes those pauses to a particular component, and this supplement makes no speculative performance fix or rerun. The 218.758 ms p95 is below the broader 300 ms write target, but that does not erase the stricter supplement miss.

Complete short/long context, ordered history, current-draft provenance, all supplied input values, all 33 UI assets, and their 77 declared consumer pairs agreed with the corresponding preview/response and saved fixture assertions. Actual provider latency, model context-window acceptance, generated writing quality, browser rendering, and live gateway behavior were outside this measurement.

## Frozen source and follow-up boundary

| Cut | Commit | Backend Git tree | Used for |
| --- | --- | --- | --- |
| A | `1903e156d5f3b65351139212b8a7d75eee2dc537` | `319e9c4b0ac784c96f4ff1758b4019d7f49faaaa` | Original 280 requests; final results for the 12 unaffected workloads |
| B | `20fc89a1215cccf42626e5dd46b558a810b41af8` | `db4e8fa10a7968e51cf28e9dc3868993b9a95c7e` | Final 40 requests; superseding the two shared PUT workloads only |

Tracked backend snapshots each contained 95 Python/INI/default-JSON files, fingerprinted before and after measurement. The only differing file between A and B was `backend/ai_request.py`: the write-patch path now recursively validates supplied UI-asset string leaves against their declared placeholders. The assembler, runtime reads, preview, and chat paths were unchanged. Therefore the original 12 unaffected rows remain source-qualified to A; they are not presented as fresh measurements at B. Both shared PUT fixtures supplied all 33 assets, so both were remeasured at B as root directed. No invalid-asset correctness matrix was repeated here; that focused validation was separate implementation evidence.

`backend/ai_request.py` SHA-256:

- A: `814eb52d67f4241ad4822bdda35925b12cf6d833b537ef30a0aab19a7d62a653`
- B: `da6e62ce3f0ab6615ca1bd35e74c2aa4b4e358e9e28dbbeedf8e2e4403a7375d`

## Final workload measurements

Every row below contains **20 sequential samples**. Times are milliseconds; p50 is the median and p95 is nearest-rank sample 19 of 20. SQL is the minimum–maximum number of SQLAlchemy cursor executions during the actual HTTP request, excluding fixture preparation and assertion reads. Response size is exact bytes for every sample in that row.

| Workload | Cut | Local p50 | Local p95 | Wall p95 | SQL | Response bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Selected settings GET, 20 saved scopes | A | 11.810 | 19.794 | 19.794 | 2–2 | 286004 |
| Shared settings PUT, 20 saved scopes | B | 62.137 | 69.611 | 69.611 | 4–4 | 312608 |
| Shared settings reset, 20 saved scopes | A | 51.291 | 58.637 | 58.637 | 4–4 | 268141 |
| Runtime config GET, 20 saved scopes | A | 6.199 | 6.598 | 6.598 | 2–2 | 58528 |
| Selected settings GET, all 45 scopes | A | 12.928 | 13.644 | 13.644 | 2–2 | 490215 |
| Shared settings PUT, all 45 scopes | B | 70.636 | **218.758** | **218.758** | 4–4 | 516819 |
| Shared settings reset, all 45 scopes | A | 57.280 | 65.900 | 65.900 | 4–4 | 472452 |
| Runtime config GET, all 45 scopes | A | 7.174 | 33.512 | 33.512 | 2–2 | 58528 |
| Admin preview, short context | A | 6.802 | 7.320 | 7.320 | 2–2 | 35054 |
| Admin preview, long context | A | 7.960 | 8.709 | 8.709 | 2–2 | 155697 |
| Ordinary-user structured chat, short context | A | 6.804 | 10.903 | 11.015 | 2–2 | 186 |
| Ordinary-user structured chat, long context | A | 7.653 | 9.609 | 9.805 | 2–2 | 186 |
| Admin structured chat, short context | A | 7.359 | 8.697 | 8.801 | 2–2 | 35290 |
| Admin structured chat, long context | A | 8.248 | 8.966 | 9.155 | 2–2 | 155933 |

Paths: selected settings `GET /api/ai/admin/settings?purpose=writer.rewrite_text&variant=letter`; shared save `PUT /api/ai/admin/settings`; shared reset `POST /api/ai/admin/settings/reset`; runtime `GET /api/ai/config?purpose=writer.rewrite_text&variant=letter`; preview `POST /api/ai/admin/preview`; chat `POST /api/ai/chat`.

Preserved, superseded A results for the two PUT rows: 20 scopes **71.996/99.186 ms p50/p95**; 45 scopes **70.124/83.935 ms**. These were not discarded or averaged with B. The differing timing distributions do not establish the validator's isolated cost because these are separate local runs without component profiling.

For chat only, `local_ms = wall_ms − measured fake-handler CPU time` was calculated for each sample before computing percentiles. The fake handler parsed/captured the request and built an HTTP response, with no simulated sleep or external call. Its p95 CPU times were 0.115/0.215 ms for ordinary short/long and 0.109/0.189 ms for admin short/long. No provider time was subtracted from other rows.

## Fixtures and semantic checks

- **Actual bounded setting inventory:** 20 scopes and the full 45 allowed shared/purpose/variant scopes, not 200 invented settings. Each stored scope had 7987 characters of additional context containing Unicode and an end marker. The 20-scope fixture included shared, `writer.rewrite_text` base, and selected `letter` variant. Exact configured-scope set membership, per-scope model/context values, selected saved/effective/default/inherited configuration, all 33 asset values, and the complete descriptor/77-consumer registry were checked. Runtime response assets/configuration were checked against the intended inheritance. Null model overrides, temperature zero, and unlimited-history null survived the JSON configuration path.
- **Shared save/reset:** each timed save changed a marker, then the response and actual PostgreSQL shared row were checked for exact full context/configuration and `updated_by=2`. Untimed preparation restored reset fixtures so every timed reset performed the intended operation. The shared write path also builds the bounded runtime combinations before returning. A separate untimed selected-variant save/read/reset proved the selected patch (`temperature=0.25`, `max_tokens=777`), source attribution, and restoration of inherited global temperature zero.
- **Short versus long requests:** `writer.rewrite_text/letter` supplied all 15 input slots. Short input had two history turns, a 500-character current draft labelled `edited`, and 26384 assembled characters. Long input had **26 ordered history turns**, a **40000-character** current draft labelled `proposed`, and 85108 assembled characters. The first-history fact and all last markers survived. The long fixture included the full 2000-character job brief, two 1000-character notes, three 900-character facts, actual synthetic recipient/title/type/context/job/role/emotion values, and warmth `0.0`.
- **Independent content agreement:** assembled messages were compared with independently constructed expected system/context/task text and every original history entry in order, including user/model/app source values. `included_inputs` retained each supplied slot and each history member; `omitted_inputs` was empty. Character counts, 200000-character configured limit, unlimited-history null, `max_tokens=321`, and temperature zero agreed. No silent ten-turn slicing or current-draft truncation appeared in either fixture.
- **Preview versus transmitted body:** every one of 80 mock gateway chat calls matched the corresponding prepared preview request by canonical semantic JSON equality/hash, including all messages, options, and order. All 20 timed previews per fixture matched the expected prepared object. Ordinary responses matched the fake gateway result without app-added `continuum_request`; admin responses added exactly the prepared metadata plus `attempt_status=completed`. The synthetic private gateway key was absent from API results.
- **Actual authorization:** signed JWT subject 2 resolved the persisted `is_admin=True` user; subject 3 resolved a persisted ordinary user. No dependency override supplied admin authority. Untimed ordinary-user selected-settings/preview calls returned 403. This is a narrow workload authorization check, not a new security audit.

## Isolation, method, and retained evidence

The recorder reused the approved manual patterns from `/private/tmp/continuum-o1-release-current.py` through inline Python only. No authored test/script file or CI job was added. Source was frozen from Git into private snapshots. Tests used the pinned disposable Python virtual environment, PostgreSQL **18.4 / UTF8**, migrated synthetic schema through `e0f2a4c6b8d0`, and a private Unix socket on port 56306 with TCP disabled. PostgreSQL proves JSON/Unicode storage here; this was not SQLite timing.

`TestClient` ran without its lifespan context. No startup/scheduler ran. Fixture setup, response comparisons, PostgreSQL readback, and JSON checkpoints were outside request timers. Fresh in-process clients used reserved documentation IPs and synthetic CSRF values. The database, uploads directory, outbox, JWT secret, and gateway key were all disposable synthetic fixtures. HTTP transports, socket connection helpers, and email entry points had reject sentinels; **zero real transport/mail attempts** were recorded. The only 80 gateway invocations were the in-process fake handler in the original chat rows. No owner environment file, existing database, live credential, provider, or ClaimsChat session was accessed.

Every successful sample was checkpointed with raw time/status/bytes and normalized SQL shapes; any failure would have been retained before stopping. There were no failed HTTP or semantic samples in either run. Source fingerprints were unchanged during each run. **The private PostgreSQL server was stopped after the final 40 requests**, and its `postmaster.pid` absence was verified. No app server was started. Evidence remains private, outside Git, without database contents in this report:

`/private/tmp/continuum-o1-ai-context-rGt9eK/`

| Evidence | SHA-256 |
| --- | --- |
| `measurements.json` — all original 280 raw samples, SQL, source fingerprints, complete synthetic preview/input proof | `95de13ea40fc5b7adf0a219e3f82b44dba252fde73cceb29350762c560b9e9e7` |
| `put-followup-measurements.json` — all final 40 raw samples, per-save membership/readback assertions, final source fingerprints | `8d95bac4e323c13d339c4d2981fb50a98d3b2397c66bda5cacc032c358130512` |
| `context-proof.log` — complete original run output | `c29b9f4f442c024262e7ddbff489cecf448bcbf3276b3c96baa638607bae00c1` |
| `put-followup-proof.log` — complete final PUT run output | `a22e9412c829f88e09f60bb89c06c59868aedde48c4fb71b1c606a27fd5efde2` |

This is a local, sequential, in-process API supplement, not a production network, concurrent-load, browser, or paid-model benchmark. It does not repeat the earlier O1 endpoint/catalogue/users matrices, the implementation's functional matrices, build/type checks, or UI proof. The full 45-scope save's 150 ms p95 miss remains reported for root disposition. No application, task-board, schema, provider configuration, or performance code was changed by this supplement.
