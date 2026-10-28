---
type: system
title: Email and AI Services
description: How email provider outcomes, local preparation and delivery logs work, and how the AI settings resolver prepares privacy-adapted structured requests for Bifrost or legacy OpenRouter transport.
tags: [email, postmark, smtp, ai, openrouter, concierge]
sources:
  - id: openwiki-source-1db86b4a3dc9202a94647927
    resource: repo://backend/ai_request.py
  - id: openwiki-source-5072d596934f6cd571c694a7
    resource: repo://backend/ai_settings.py
  - id: openwiki-source-314918004efbd61a5bc91270
    resource: repo://backend/models/email_log.py
  - id: openwiki-source-979f5b4378c5897fac1b376c
    resource: repo://backend/routers/ai_proxy.py
  - id: openwiki-source-b30fddbc96be8b549c582fb9
    resource: repo://backend/routers/ai_settings.py
  - id: openwiki-source-87e34973b454e314a77585fc
    resource: repo://backend/routers/email.py
  - id: openwiki-source-de03ad0dd149f44f65efb94c
    resource: repo://backend/routers/support.py
  - id: openwiki-source-cecb71b0d8255209b43b4d24
    resource: repo://backend/services/email_service.py
  - id: openwiki-source-4b608508499cb9bfc26bf4fc
    resource: repo://backend/templates/emails/magic_link.html
  - id: openwiki-source-7c0defb8a919d5dd87d71d6f
    resource: repo://backend/templates/emails/pulse_escalation_tier1.html
  - id: openwiki-source-e420cc0231ed6f8a9a1aca68
    resource: repo://backend/templates/emails/welcome.html
  - id: openwiki-source-eaa8cee541477f60aa5e209e
    resource: repo://frontend/src/lib/services/aiCapabilities.ts
  - id: openwiki-source-17706240e8ad2d6632263f60
    resource: repo://frontend/src/lib/services/aiConciergeService.ts
  - id: openwiki-source-ad50b7e2c2f89430d17b9018
    resource: repo://frontend/src/lib/stores/conciergeEngine.ts
generated: { by: "claude-code", at: "2026-10-28T04:26:57.052Z" }
verified:
  - by: openwiki/0.4.3
    at: 2026-10-28T04:26:57.052Z
---

# Email and AI Services

## Email service

`backend/services/email_service.py` defines `EmailService` and a module-level `email_service` instance used by auth and Pulse.

**Provider choice** happens once at startup:

1. `resend` when `RESEND_API_KEY` is set (the production provider): an `httpx` POST to the Resend API from `SMTP_FROM_NAME <SMTP_FROM_EMAIL>` with a 15-second timeout,
2. otherwise `postmark` when `POSTMARK_API_KEY` is set (using the `postmarker` client),
3. otherwise `smtp` when `SMTP_ENABLED` and `SMTP_HOST` are set (15-second connection timeout),
4. otherwise `local`, which writes each email as an HTML file in `OUTBOX_DIR` (`backend/outbox`, or `/data/outbox` on the Railway volume) named from the timestamp, subject and recipient with unsafe filename characters replaced.

A non-2xx Resend response raises, so that send is logged as `failed` with no fallback. If a Postmark send raises, that message falls back to SMTP (when enabled) or the local outbox. If the Postmark library cannot be imported, the provider switches the same way for the whole process. Check the `provider` column in `email_logs` to see what actually happened.

**Sending** — `send_email(payload, db_session)` renders `templates/emails/{template_name}.html` with Jinja2 (autoescaping on), creates a `pending` `EmailLog` row when a session is passed, sends through the provider, then updates the row with the actual provider/status/message ID or error. `saved_local` means preparation on disk; `provider_accepted` means the provider accepted the send, not that a person read it. Only provider acceptance populates `sent_at`. A template error returns a failed result without sending. Convenience wrappers:

| Wrapper | Template |
|---|---|
| `send_magic_link` | `magic_link.html` |
| `send_pulse_alert` | `pulse_escalation_tier1`…`tier4.html` |
| `send_welcome_email` | `welcome.html` |

All templates extend `base.html`.

**Email log** — `backend/models/email_log.py` (`email_logs` table) stores user, recipient, subject, template, status (`pending`, `sent`, `failed`, `bounced`, `spam_complaint`, `unsubscribed`), provider, provider message id, error and timestamps.

**Router** — `backend/routers/email.py` under `/api/emails`:

- `GET /status` and `GET /status/{id}` — delivery status for the caller's emails; an admin may pass `user_id` to see another user's.
- `POST /resend/{id}` — resend a logged email. The saved `User.is_admin` designation controls administrator access. A sign-in link must be requested fresh; the resend endpoint does not replay a stale magic token.
- `POST /webhook/postmark` — Postmark bounce/spam/unsubscribe webhook (hidden from the schema). It maps the `RecordType` to a log status. When `POSTMARK_WEBHOOK_SECRET` is configured the handler requires it as the basic-auth password or token query value; without configuration it warns and accepts requests.
- `GET /bounces` — bounced and complained emails.

`EMAIL_MAX_RETRIES` and `EMAIL_RETRY_DELAY_SECONDS` exist in settings, but the send path does not read them; there is no automatic retry.

## AI concierge

The concierge panel in the app shell is driven by `frontend/src/lib/stores/conciergeEngine.ts`, which tracks the current route (`setContext`), the open/closed state and message history, and calls `aiConciergeService.chat(...)` from `sendMessage`.

`frontend/src/lib/services/aiConciergeService.ts` sends a structured writing job, purpose/variant, input slots and sourced conversation history. A request-local redaction session masks sensitive text across inputs/history and keeps its restoration map in the browser. Response restoration belongs to that same request; delayed responses check session ownership before altering the active draft or inspection state. Model proposals remain reviewable before replacing the author's words.

## Shared configuration and request preparation

`backend/ai_request.py` defines validated input slots, history, configuration fields, limits and request assembly. `backend/ai_settings.py` resolves shipped shared → purpose → variant defaults and saved shared → purpose → variant overrides. Model choice, additional context, role/emotional instructions, templates, history rules and UI prompt assets are part of the effective configuration, with per-field source attribution. Runtime `/api/ai/config` returns resolved UI assets so consumers use configured prompts instead of silently reverting to hard-coded copies. Saved prompt-asset patches recursively validate the placeholders declared for each asset, including strings nested inside maps/lists; this patch validation does not revalidate every shipped asset on runtime reads. Runtime rendering recognizes spaced placeholder names and digit-containing names, preserving unknown placeholders instead of inventing values.

Input slots include the current field's label (`field_label`), its exact visible question (`field_question`) and earlier answers serialized with their questions (`question_answers`), so a model sees what was asked rather than treating answers as bare facts. The configuration has an `application_name` field (1–128 visible ASCII characters, no surrounding spaces or templates); the prepared request reports it, and the transport sends it as the `User-Agent` header to Bifrost, and as both `User-Agent` and `X-Title` to legacy OpenRouter. The shipped `DEFAULT_MODEL` in `backend/ai_capabilities.py` is `fireworks/accounts/fireworks/models/deepseek-v4p1-flash`, and `funeral` is a module variant.

On the frontend, `aiCapabilities.ts` tracks a per-purpose/variant load state (`idle`, `loading`, `ready`, `error`) in `aiConfigStates`. A configuration read is accepted only if the session, configuration epoch and pending request are still current; invalidation keeps the last loaded UI assets while the next read settles.

The administrator surface at `/admin/ai-settings` uses `/api/ai/admin/settings` to save/reset scope overrides and `/api/ai/admin/preview` to inspect preparation. Preview and actual send both call `prepare_request`; editing a saved scope validates affected descendants before commit. Database errors leave changes retryable and roll back the transaction. The last prepared/attempted request metadata is exposed only to administrators and stays bound to their active session.

`POST /api/ai/chat` requires authentication and allows 30/minute. It accepts the structured contract, rejects exceeded input limits with 413 while preserving conversation/draft, and refuses an unavailable configuration with 503. It sends exactly the prepared request through `BIFROST_BASE_URL` plus `BIFROST_VIRTUAL_KEY`, or the legacy OpenRouter transport only for an `openrouter/` model when no Bifrost key is set. Provider credentials stay server-side. The shared HTTP client has a 45-second timeout and does not follow redirects. Provider/network/envelope failures return the gentle unavailable response; configuration preview alone does not call a model.

The concierge retains per-account conversation state and immutable writing-job snapshots. It filters history to that job, excludes status messages from model history and ignores a result if the account, conversation or active writing job changed while waiting. This preserves the original brief and prevents an older reply from replacing newer writing work.

`/api/support/discovery` is a separate Tavily-backed search that now requires a signed-in user and caps `location` at 200 and `category` at 100 characters. `GET /api/support/discovery/available` tells the page whether a `TAVILY_API_KEY` is configured, so the search is shown only when it can answer. Missing `TAVILY_API_KEY` returns 503, and a provider failure also returns 503 rather than mock local practitioners.

## Related pages

- [Pulse Welfare Check-ins](/openwiki/systems/pulse-welfare.md)
- [Authentication](/openwiki/systems/authentication.md)
- [Development, Configuration and Deployment](/openwiki/operations/development-and-deployment.md)
