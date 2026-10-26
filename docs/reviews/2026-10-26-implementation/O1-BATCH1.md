# O1 — First correction batch

**Last Updated:** 2026-10-26 16:14 EDT

**Measured source commit:** `5ce6db3bc0f2d1f34df1dfad248f9c6f7dfccf44` (`main`). Scope: merged X312 profile persistence/recovery, X358 migration compatibility and X351 missing-provider support discovery. Read-only oversight; no application changes, deployment or new gates.

## Result

All measured endpoints remained within the reporting targets: **150 ms p95 for reads, 300 ms p95 for writes**. SQL statement counts were constant as the synthetic dataset grew from 20 to 200. No new performance defect was established.

## Measurement method

- A new private PostgreSQL 18 cluster used a temporary Unix socket; no owner or production database was inspected. Fresh Alembic upgrade completed through `b2e4a6c8d0f1` using the merged X358 historical migration fix.
- Two dataset sizes: **20 users/estate roots**, then **200 users/estate roots**. At each size, the measured owner also had that many synthetic JSON records in the profile and that many preserved-original recovery rows. Other users had independent small profiles.
- Exactly **20 sequential HTTP samples per endpoint per size**, **200 measured requests total**, through FastAPI TestClient without lifespan startup. Requests exercised real authentication, handlers, SQL and JSON serialization. No scheduler or mail was started.
- Each measured write changed a single profile key, forcing a real save. Measurements of `/api/estate` used an existing root; first-creation concurrency was already covered by the focused X312 proof and was not rerun as a latency benchmark.
- SQLAlchemy `before_cursor_execute` counted SQL statements, including the authenticated-user lookup. Transaction control such as COMMIT is not counted as a cursor statement. Seeding, migration and setup statements were excluded.
- p50 is the median; p95 is the nearest-rank 19th sorted sample out of 20. No extra warm-up or repeated-until-passing runs were added.
- Discovery was measured only with its provider deliberately unavailable. An external HTTP client guard would reject an attempted provider call; all requests returned the expected 503 with zero SQL and no search results.

## Timing and query table

Times are milliseconds. Query counts below were identical for every sample in their row.

| Endpoint | Dataset | Status | p50 | p95 | SQL queries/request | Over target? | Source / cause |
|---|---:|---:|---:|---:|---:|---|---|
| GET `/api/estate` | 20 | 200 | 4.120 | 11.510 | 4 | No | `main.py:399–404`; authentication, account lock, root lookup, refresh |
| GET `/api/estate` | 200 | 200 | 3.576 | 4.344 | 4 | No | Same fixed statement path |
| GET `/api/estate/profile` | 20 | 200 | 2.763 | 4.867 | 2 | No | `main.py:416–421`; authentication and owner-filtered root lookup |
| GET `/api/estate/profile` | 200 | 200 | 3.610 | 4.179 | 2 | No | Same fixed statement path |
| POST `/api/estate/profile` | 20 | 200 | 3.683 | 5.006 | 4 | No | `main.py:428–434`; authentication, account lock, latest root lookup, update |
| POST `/api/estate/profile` | 200 | 200 | 6.656 | 12.179 | 4 | No | Full profile JSON serialization/write grows with stored content; statement count stays fixed |
| GET `/api/estate/recovery` | 20 | 200 | 3.765 | 4.091 | 3 | No | `estate_persistence.py:42–74`; authentication, root lookup, one recovery-row query |
| GET `/api/estate/recovery` | 200 | 200 | 13.482 | 27.891 | 3 | No | More original content is decoded/serialized; no per-copy query |
| GET `/api/support/discovery?location=ExampleCity` | 20 | 503 expected | 1.515 | 2.180 | 0 | No | `support.py:30–38`; immediate unavailable response |
| GET `/api/support/discovery?location=ExampleCity` | 200 | 503 expected | 1.916 | 2.486 | 0 | No | Same path; no DB or provider access |

## Source observations

- **No application N+1 in the touched reads:** recovery executes one query for all of this owner's copies, then compares/serializes them in memory (`estate_persistence.py:48–74`). Root/profile lookups filter by indexed user ID; account locking uses the User primary key. Recovery copies have a user-ID index.
- **Write count is fixed:** a profile save performs `SELECT UPDATE SELECT UPDATE`, including authentication. The account lock precedes the latest-root read and uses `populate_existing=True` (`estate_persistence.py:150–181`); it is not a loop of one query per profile key.
- **GET `/api/estate` intentionally obtains a write lock:** its fixed shape is `SELECT UPDATE SELECT SELECT`. Thus its four statements are not four read queries. This preserves X312's transaction-safe get/create path; no target breach was measured. This is an explicit cost of the current locking path, not a newly proven defect.
- **Recovery response size grows with preserved content:** 11,513 bytes at 20 copies and 115,133 bytes at 200. Profile GET grew from 1,580 to 15,360 bytes. Keeping complete originals is intentional; current measurements do not justify dropping content or adding a new pagination requirement.
- **X358's optional-table inspection permits a complete fresh PostgreSQL migration chain:** the previous missing-table/aborted-transaction defect did not recur in this run. Migration duration was outside this endpoint timing scope.

## Evidence and identity

Complete output: `/private/tmp/continuum-o1-batch1.log`.

Structured measurements, SQL shapes, response sizes and complete SHA256 identities: `/private/tmp/o1-batch1-ni__7cw9/measurements.json`.

These backend files were hashed immediately before and after measurement and remained byte-identical:

| File | SHA256 prefix |
|---|---|
| `backend/database.py` | `2ad670f7c583` |
| `backend/main.py` | `f935274b74bf` |
| `backend/estate_persistence.py` | `fc3aec70a827` |
| `backend/routers/support.py` | `a7c9a8382cc8` |
| `backend/alembic/versions/2d53606557e8_add_global_custom_fields_support.py` | `1050a26690d6` |
| `backend/alembic/versions/b2e4a6c8d0f1_estate_singleton_and_recovery_copies.py` | `96849fb93665` |

The temporary PostgreSQL server was stopped after measurement. Only this report was written in the repository; no test/script files or fixtures were added.

## Limits

These are local TestClient/Unix-socket PostgreSQL timings, not Railway network or production latency measurements. Samples were sequential, so they do not characterize lock wait under heavy concurrent traffic; the earlier X312 concurrency proof covers correctness separately. Provider-enabled external discovery, browser rendering, other modules and unrelated endpoint latency were outside this first-batch scope. No source change or plan update is proposed by this oversight.
