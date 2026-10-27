---
type: system
title: Pulse Welfare Check-ins
description: How configured Pulse scheduling, owner check-ins, guardian pauses, tier and safety-timer outcomes, portal sharing and companion transparency views work together.
tags: [pulse, scheduler, escalation, guardians, email]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-27T00:48:46.078Z
sources:
  - id: openwiki-source-2cb07ade85d43d677f359e23
    resource: repo://backend/pulse_logic.py
  - id: openwiki-source-f223caf470b1dba5c60511ed
    resource: repo://backend/pulse_models.py
  - id: openwiki-source-1270c66626a24b8b83c84fce
    resource: repo://backend/pulse_scheduler.py
  - id: openwiki-source-f44fbf3f39ebd25900fff308
    resource: repo://backend/routers/pulse.py
  - id: openwiki-source-0771a3e5596e195038b62a2d
    resource: repo://frontend/src/lib/stores/pulse.svelte.ts
  - id: openwiki-source-a8a830617ab03d4b55d49d9a
    resource: repo://frontend/src/routes/%2Blayout.svelte
generated: { by: "codex", at: "2026-10-27T00:48:46.078Z" }
---

# Pulse Welfare Check-ins

Pulse is Continuum's "are you OK?" system. A user turns it on and checks in regularly. If a check-in is overdue past a grace period, Pulse escalates through up to four tiers of guardian contacts by email; each tier can see more in the guardian portal.

Key files: `backend/pulse_models.py`, `backend/pulse_scheduler.py`, `backend/pulse_logic.py`, `backend/routers/pulse.py`, `frontend/src/lib/stores/pulse.svelte.ts`, and the routes under `frontend/src/routes/modules/pulse`, `routes/pulse` and `routes/portal`.

## Data model

| Model (table) | Purpose |
|---|---|
| `PulseSettings` (`pulse_settings`, one per user) | `enabled`, `frequency_days` (default 2), `grace_period_hours` (24), `checkin_token` (permanent one-click link token), plus feature flags such as ghost mode, pet protocol, safety timer, location vault and biometric extension |
| `PulseCheckin` (`pulse_checkins`) | Each check-in with `timestamp` and `method` (`manual`, `magic_link`, `guardian_snooze`, `guardian_confirmation`, …) |
| `PulseEscalationTier` (`pulse_escalation_tiers`) | Per-user tiers 1–4 with `delay_hours` and `notification_method` |
| `PulseContact` (`pulse_contacts`) | Guardians and general contacts: name, role, email, phone, executor/beneficiary flags, `tier_id`, `portal_token` |
| `PulseEscalationLog` (`pulse_escalation_log`) | One row each time a tier fires |
| `PulseMessage`, `PulseSafetyTimer`, `PulseVault`, `PulseCredential` | Guardian messages, short safety timers, vault items with an unlock condition, and WebAuthn credentials (used by [Authentication](/openwiki/systems/authentication.md)) |

`pulse_contacts` also backs the general Contacts module through `/api/contacts`, so Pulse guardians and address-book contacts are the same rows.

## Scheduler and escalation rules

`start_scheduler()` runs during app lifespan only when `PULSE_SCHEDULER_ENABLED` is true. Its interval is `max(1, PULSE_CHECK_INTERVAL_MINUTES)` (default 15 minutes), with coalescing and one job instance. Each tick checks welfare escalation and expired safety timers. API probes should isolate database, uploads and outbox and avoid lifespan startup unless scheduled work is deliberately replaced.

For each enabled user, the owner's own last check-in starts the outage. The soft deadline adds `frequency_days`; the hard deadline also adds `grace_period_hours`. Owner reminder emails begin after the soft deadline, before guardian escalation. After the hard deadline the configured delay for tier 1 is measured from that deadline and each later tier's delay from the previous reached stage. Missing tier definitions or reaching tier 4 stop progression.

Ghost Mode pauses alerts/retries/advances. Guardian snooze or confirmation pauses new alerts for one frequency-plus-grace window but never changes the owner's own check-in clock, reached-tier history or other guardians' access. Acknowledgement records a note, not a check-in. An actual owner check-in resets the outage and sends an all-clear to previously alerted guardians.

Tier membership uses the shared effective-tier helper, covering contact tier settings consistently across scheduler and interface. Contacts with an individual wait follow that wait separately. `trigger_escalation` commits the reached stage before sends, then records each contact's provider-accepted, saved-local or failed outcome. Failed sends retry independently of stage progression, up to three attempts. Provider acceptance does not prove delivery or that anyone read the alert.

The same tick processes expired active safety timers for opted-in contacts. Failed timer sends can retry up to three attempts; completed/capped timers close and receive a tier-0 bookkeeping row. Tier-0 timers and negative reminder markers are not welfare escalation tiers. Per-user failures roll back and log without stopping other users.

## API (`/api/pulse`)

Authenticated:

- `POST /checkin` (5/minute) — record a manual check-in (`method`, `note` as query parameters).
- `GET /status` — `not_configured`, `disabled`, or `active`/`grace` with the last check-in and next expected time.
- `GET /settings` — returns defaults without a write when no row exists; saving creates settings and the check-in token. `POST /settings` (10/minute) — partial update.
- `GET /history`, `GET|POST|PUT|DELETE /contacts` (creating a contact generates its `portal_token`), `GET /messages`, `POST /messages`.
- `GET /tiers` — creates default tiers on first read (tier 1: 0 h, email; tiers 2–4: 6, 12 and 24 h, email+SMS); `PUT /tiers/{id}`.
- `GET|POST|PUT|DELETE /vault` — vault items for the logged-in user.
- `POST /safety/start|cancel`, `GET /safety/status` — safety timers. The scheduler processes expired active timers and records attempt outcomes.

Public, token-based (guardian respond/confirm/nudge POSTs are CSRF-exempt; the owner verify POST uses the normal CSRF header supplied by the client hook):

- `GET /verify/{token}` — read-only readiness for the owner's one-click link; `POST /verify/{token}` records the check-in. Opening an email link or scanner prefetch never checks the owner in.
- `GET /portal/{token}` — guardian view: user name, active/grace status, last check-in, and `show_sensitive` once the latest escalation tier is at or above the guardian's tier.
- `POST /respond/{token}?action=snooze` — guardian snooze, recorded as a check-in.
- `POST /confirm/{token}` — guardian confirms the user is OK, recorded as a check-in.
- `POST /nudge/{token}` — records a guardian nudge after validating the unexpired portal token.

Guardian check-in methods are excluded from `owner_last_checkin`. Their pause leaves owner timing and outage history intact. Public portal/vault reads validate token expiry and apply the same current-outage sharing rules as the owner's preview.

## Frontend

`frontend/src/lib/stores/pulse.svelte.ts` registers singleton managers for `pulse/status` and `pulse/settings` (see [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)) and exposes `pulseStore.checkin(note)`, which posts the check-in and refreshes status. The Pulse module lives at `/modules/pulse` with sub-pages for vault, transparency, messages, history, contacts, escalation and settings.

Public pages:

- `/pulse/verify/[token]` calls the one-click check-in.
- `/pulse/respond/[token]` loads the portal view and posts snooze/acknowledge.
- `/portal/[token]` (the link in alert emails) and `/pulse/portal/[token]` show the guardian portal, nudge and confirm. The token-authorized `/api/pulse/portal/{token}/vault` read returns only notes allowed by the sharing switch, current reach and note tier.

The root layout explicitly exempts `/portal/` and `/pulse/portal/` routes as well as respond/verify pages, so a guardian can use the token without owner sign-in. The Pulse transparency/status surfaces show reached stages separately from named contact email outcomes, including source message rows, attempts and retry availability. Reading a portal does not by itself send a message or record a check-in.

## Related pages

- [Authentication](/openwiki/systems/authentication.md)
- [Email and AI Services](/openwiki/systems/email-and-ai.md)
- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
