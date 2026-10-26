---
type: system
title: Pulse Welfare Check-ins
description: How the Pulse wellness check-in system works — its settings, contacts, tiers and log models, the hourly scheduler and deadline/escalation rules, guardian email alerts and portal tokens, the public check-in and guardian endpoints, and the frontend Pulse store and pages.
tags: [pulse, scheduler, escalation, guardians, email]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-82a325da453da1db06378e6d
    resource: repo://backend/config.py
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
  - id: openwiki-source-20eed2e04047c6add1e8cfba
    resource: repo://frontend/src/routes/portal/%5Btoken%5D/%2Bpage.svelte
  - id: openwiki-source-c2775d4b5d728c13ffc15dcb
    resource: repo://frontend/src/routes/pulse/portal/%5Btoken%5D/%2Bpage.svelte
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
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

`start_scheduler()` runs at app startup and adds an APScheduler `BackgroundScheduler` job that calls `check_and_escalate_all` **every hour** in the web process. The `PULSE_SCHEDULER_ENABLED` and `PULSE_CHECK_INTERVAL_MINUTES` settings exist but the scheduler does not read them.

For each user with Pulse enabled, `process_user_pulse`:

1. Takes the latest check-in time (or the earliest possible time if there is none).
2. Computes the **soft deadline** = last check-in + `frequency_days`, and the **hard deadline** = soft deadline + `grace_period_hours`.
3. Before the soft deadline: nothing. Between the two: grace period, only logged (the nudge to the user is a TODO).
4. After the hard deadline: finds the highest tier already logged since the last check-in. If none, tier 1 fires immediately. Otherwise the next tier fires once its own `delay_hours` have passed since the previous tier's log entry. It stops after tier 4, or at the first tier number that has no definition.

A new check-in of any kind resets the cycle, because only log rows newer than the last check-in count.

`trigger_escalation` writes a `PulseEscalationLog` row and emails every contact whose `tier_id` is that tier's id. `send_notification` sends the `pulse_escalation_tier{N}` template through the email service (see [Email and AI Services](/openwiki/systems/email-and-ai.md)) with a link to `/portal/{portal_token}`, adds last-check-in details from tier 2 upward, and records a `PulseMessage`. Contacts without a tier are never alerted.

Errors for one user are logged and do not stop the others.

## API (`/api/pulse`)

Authenticated:

- `POST /checkin` (5/minute) — record a manual check-in (`method`, `note` as query parameters).
- `GET /status` — `not_configured`, `disabled`, or `active`/`grace` with the last check-in and next expected time.
- `GET /settings` — creates default settings and a `checkin_token` on first read. `POST /settings` (10/minute) — partial update.
- `GET /history`, `GET|POST|PUT|DELETE /contacts` (creating a contact generates its `portal_token`), `GET /messages`, `POST /messages`.
- `GET /tiers` — creates default tiers on first read (tier 1: 0 h, email; tiers 2–4: 6, 12 and 24 h, email+SMS); `PUT /tiers/{id}`.
- `GET|POST|PUT|DELETE /vault` — vault items for the logged-in user.
- `POST /safety/start|cancel`, `GET /safety/status` — safety timers. The scheduler does not act on expired timers.

Public, token-based (CSRF-exempt by prefix where they are POSTs):

- `GET /verify/{token}` — the user's one-click check-in using `checkin_token`.
- `GET /portal/{token}` — guardian view: user name, active/grace status, last check-in, and `show_sensitive` once the latest escalation tier is at or above the guardian's tier.
- `POST /respond/{token}?action=snooze` — guardian snooze, recorded as a check-in.
- `POST /confirm/{token}` — guardian confirms the user is OK, recorded as a check-in.
- `POST /nudge?contact_id=` — sends a nudge message; it takes a contact id rather than a token and has no auth dependency.

Because guardian snooze and confirm create `PulseCheckin` rows, they reset escalation just like the user's own check-in.

## Frontend

`frontend/src/lib/stores/pulse.svelte.ts` registers singleton managers for `pulse/status` and `pulse/settings` (see [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)) and exposes `pulseStore.checkin(note)`, which posts the check-in and refreshes status. The Pulse module lives at `/modules/pulse` with sub-pages for vault, transparency, messages, history, contacts, escalation and settings.

Public pages:

- `/pulse/verify/[token]` calls the one-click check-in.
- `/pulse/respond/[token]` loads the portal view and posts snooze/acknowledge.
- `/portal/[token]` (the link in alert emails) and `/pulse/portal/[token]` show the guardian portal, nudge and confirm. `/pulse/portal` also requests `/api/pulse/vault`, which needs a logged-in user.

The root layout's login guard lets only `/pulse/respond*` and `/pulse/verify*` through without a session. `/portal/...` and `/pulse/portal/...` are not on that list, so a guardian who is not signed in is redirected to `/login` (see [Routes, Modules and Navigation](/openwiki/frontend/routes-and-navigation.md)).

## Related pages

- [Authentication](/openwiki/systems/authentication.md)
- [Email and AI Services](/openwiki/systems/email-and-ai.md)
- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
