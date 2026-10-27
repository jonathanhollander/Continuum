# Signup-only closure correction — 2026-10-27

The owner clarified that only new signups must be blocked. X380/X381's earlier owner-only private-preview interpretation exceeded that scope and is superseded. Public website access and existing-account sign-in must work.

`SIGNUP_ENABLED=false` independently refuses password signup and both passkey registration endpoints before validation, database writes or challenge creation. It defaults to false. The public access-status response reports registration separately from website access. The signup route shows “New signups are currently closed,” with sign-in and website links. Normal authentication and per-account authorization remain in place.

Production correction: set `SIGNUP_ENABLED=false`, deploy the independent closure, then remove `PRIVATE_ACCESS_USER_ID`. The Railway source preserves the new setting rather than the obsolete production owner-only restriction. No account or owner records are changed.

Verification: `backend/tests/test_signup_closure.py` passes four focused checks against the actual application/middleware/auth routes, with a disposable database and startup disabled. It covers public access-status and SPA routes, all three registration endpoints including trailing slashes, unchanged user membership/no outbox, two existing accounts signing in and reloading `/me`, refresh rotation, and independent explicit opt-in/private-mode behavior. Frontend check: zero errors/warnings; build passes.

Desktop/phone and live acceptance are pending until the correction is deployed. All test users are synthetic; no real-account login, email or owner-data mutation is needed.
