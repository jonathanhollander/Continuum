# O1 — Release speed table

**Last Updated:** 2026-10-26 13:20 EST

Local server (throwaway SQLite, 200 synthetic records per type, limiter off for timing, 20 calls each after one warm-up) plus the 5 slowest read-only GETs on production (signed in as the test owner). Raw numbers and scripts: `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/o1rel/`.

## Local reads (200 records per type)

- Every list read: p50 2–9 ms, p95 under 15 ms apart from single GC-like outliers (40–52 ms); **2 queries per read, flat from 10 to 200 records** (user lookup at `backend/auth.py:99` + one `SELECT … WHERE user_id`).
- Singletons and auth reads: 1–2 ms p95.
- `/api/export/snapshot`: p50 99.5, p95 145.8 ms on a 1.07 MB response; 24 queries (one per table) at both sizes — cost is payload size. Under the 150 ms target.

## Local writes

All POST/PUT/DELETE/PATCH under 10 ms p95 (target 300). Writes run 5–8 queries where 2–3 would do (`backend/routers/estate_data.py`: commit → refresh → audit commit → refresh) → card X278.

## Production (5 slowest read-only GETs, 20 calls)

| Endpoint | p50 ms | p95 ms | Size |
|---|---|---|---|
| /api/export/snapshot | 121 | 174 | 11 KB |
| /api/data/insurance_policies | 72 | 108 | 568 B |
| /api/data/digital_assets | 68 | 122 | 2 B |
| /api/pulse/safety/status | 71 | 115 | 4 B |
| /api/data/activity_log | 70 | 91 | 1.8 KB |

Network floor from the test machine is ~60 ms (`/api/health` p50 69 ms), so ranks 2–5 are network; the snapshot's 174 ms p95 includes that floor (watch item, no card).

## Findings

1. **Rate limits refuse normal use** (limiter on, 20 calls): GET `/api/pulse/vault` 10/min (`pulse.py:436`; same on production: 10 × 200, 10 × 429), POST `/api/pulse/settings` 10/min (`pulse.py:180`), POST/PUT `/api/medical/profile` 10/min (`medical.py:41`). Quick saves through SingletonSyncManager can hit them → card X277. `/api/pulse/checkin` 5/min left as is.
2. Write query count (above) → card X278.
3. Module data visible ≤ 1 s after navigation: server side 2–10 ms local, 60–120 ms production; localStorage-first rendering; not measured in a browser here (the release browser test and O2 cover page loads).
