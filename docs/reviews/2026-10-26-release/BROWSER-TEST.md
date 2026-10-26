# Release step 10 — Production browser test

**Last Updated:** 2026-10-26 13:40 EST

https://continuum.estate, 1440×900, run 2026-10-26 ~12:40–13:20 EDT, signed in as the jh@ test owner. Evidence: `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/release/` (owner.json, edit.json, recip.json, recip-after-redeploys.json, outputs.json, sweep.json, screenshots, binder/PDF/zip); scripts `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/pw/rl*.mjs`. No email sent (addresses release-*@sincuerda.com; no step sends mail). Pulse not enabled; one check-in.

## Step 1 — Completion test

| # | Step | Result |
|---|---|---|
| 1–12 | Owner adds advisor, son (executor), checking account, debt, insurance, will PDF + original's location, water shut-off, 4,564-char letter, lesson, photo, video, heirloom | PASS (all 200) |
| 13 | Account edit: forced 500 then Try Again | PASS — draft kept, notice + Try Again, server value updated after retry |
| 14 | Letter edit (P.S.) | PASS — one row, full text equal |
| 15 | Reload all modules | PASS |
| 16 | Owner preview equals recipient page | PASS |
| 17–20 | Recipient (fresh context) sees note, first steps, advisor phone + "first call", executor step, will location | PASS |
| 21 | Recipient reads full letter | PASS — 4,647/4,647 chars identical |
| 22 | Recipient plays media | PASS at 12:46; **FAIL at 13:05** after redeploys — /api/media/{1,2,3}/download 404 → **X292** |

## Step 2 — Every sidebar module (load → save → edit → reload → second fresh-login context)

All modules PASS for data. Exceptions:
- Visual Memories, The Red Binder, /for/<token>: console 404s on media downloads → **X292**.
- Your Full Record: save works; rows offer only Remove, no edit → **X293**.
- Life Timeline: edit modal heading reads "New Life Event" → **X294**.

Every other page: 0 console errors.

## Step 3 — Binder, PDF, download copy

PASS (before redeploys): 34 values and the full edited letter appear in all six outputs (on-screen binder, binder printed to PDF, app PDF, recipient record, zip packet.html, zip packet.pdf); zip files byte-identical to uploads (sha256). X275 transfer instructions confirmed live.

## Cause of the media failure (X292)

Production log: `Failed to initialize S3 storage: Invalid endpoint:`. Railway `AWS_ENDPOINT_URL` is set but empty while `S3_ENABLED=true`; `backend/utils/file_storage.py:92` passes the empty string to boto3, init fails, `HybridStorage` falls back to the container's local disk, which has no volume — every deploy wipes uploads. The three test uploads are gone; their DB rows remain.
