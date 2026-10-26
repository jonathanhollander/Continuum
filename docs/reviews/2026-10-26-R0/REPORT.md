# R0 — Local completion rehearsal

**Last Updated:** 2026-10-26 12:31 EST

One run against main 17e17b7, built with `VITE_API_URL= npm run build`, served on :35747 from a fresh throwaway SQLite database (`alembic upgrade head`), synthetic data, Chrome via playwright-core at 1440×900, dev user. SMTP and Postmark unset; outbox empty, no send in the server log. Evidence: `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/r0/`; scripts `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/pw/r0*.mjs`.

**Result: 22 of 23 steps pass.** One real app failure (step 23) → card X275; the smoke script is out of date → card X276.

| # | Step | Result | Evidence | For a fail: what happened, where |
|---|---|---|---|---|
| T-A3 | `scripts/smoke_test.py` | 13 PASS, 4 FAIL (script out of date) | r0/smoke.txt | vault_documents posts to a collection the UI no longer writes (DocumentVault uses `/api/data/documents`); time_capsule keeps protected `created_at` (app strips it, `sync.svelte.ts:384,513`); letter uses retired `future_letters` and old keys; advisor sends `tier` (app maps to `call_tier`, `familyStore.svelte.ts:66-84`). → X276 |
| 1–12 | Owner adds advisor, son (executor), checking account (all fields), debt, insurance, PDF will with original's location, water shut-off, 4,564-char letter to the son, lesson, photo, video, heirloom story | PASS | r0/owner-*.png, r0/api-after-add.json | |
| 13 | Edit account with the first PUT forced to 500, then Try Again | PASS | r0/edit-account-failure.png, r0/edit.json | Draft kept, notice with Try Again; server kept 12,345.67 after the failure and 13,000.50 after Try Again |
| 14 | Edit the letter (add a P.S.) | PASS | r0/edit-letter_edit.png | One letter, full edited text |
| 15 | Reload all modules | PASS | r0/reload_modules_*.png | |
| 16 | Owner preview of the recipient view | PASS | r0/recip-owner_preview.png | Text identical to the recipient's page |
| 17–20 | Recipient (separate context) finds note, first steps, advisor with phone and "First call", will's location | PASS | r0/recip-recipient_finds.png, r0/recipient-main.txt | |
| 21 | Recipient reads the full letter | PASS | r0/recipient-letter.txt | 4,642 of 4,642 characters |
| 22 | Recipient plays the media | PASS | r0/recip-media.png | Photo 200×150; video played |
| 23 | Screen, binder and PDF agree | **FAIL (1 field)** | r0/outputs.json, r0/binder.txt, r0/packet.pdf, r0/packet.txt, r0/binder-print.pdf | 33 of 34 values and the full letter agree in all four outputs. Account "Transfer Instructions" shows on the asset card (`AssetManager.svelte:1066-1069`) but is missing from the binder, both PDFs and the recipient record: `exportService.ts:224-225` marks `closureNotes` consumed and `:239` prints it only for closed accounts. → X275 |
| — | Console and page errors | PASS | r0/*.json | Only the two expected lines from the forced 500 |
| — | No real email sent | PASS | r0/server.log | |
