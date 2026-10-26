---
type: system
title: Email and AI Services
description: How Continuum sends email (Postmark, SMTP or a local outbox), renders Jinja templates, records delivery in email_logs and handles Postmark bounce webhooks, and how the AI concierge reaches OpenRouter through the server-side /api/ai/chat proxy with client-side redaction.
tags: [email, postmark, smtp, ai, openrouter, concierge]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-314918004efbd61a5bc91270
    resource: repo://backend/models/email_log.py
  - id: openwiki-source-979f5b4378c5897fac1b376c
    resource: repo://backend/routers/ai_proxy.py
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
  - id: openwiki-source-79cd44ea11c40597832d7dd7
    resource: repo://frontend/src/lib/api/client.ts
  - id: openwiki-source-17706240e8ad2d6632263f60
    resource: repo://frontend/src/lib/services/aiConciergeService.ts
  - id: openwiki-source-ad50b7e2c2f89430d17b9018
    resource: repo://frontend/src/lib/stores/conciergeEngine.ts
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Email and AI Services

## Email service

`backend/services/email_service.py` defines `EmailService` and a module-level `email_service` instance used by auth and Pulse.

**Provider choice** happens once at startup:

1. `postmark` when `POSTMARK_API_KEY` is set (using the `postmarker` client),
2. otherwise `smtp` when `SMTP_ENABLED` and `SMTP_HOST` are set,
3. otherwise `local`, which writes each email as an HTML file in `OUTBOX_DIR` (`backend/outbox`) named from the timestamp, subject and recipient.

If a Postmark send raises, that message falls back to SMTP (when enabled) or the local outbox. If the Postmark library cannot be imported, the provider switches the same way for the whole process. Check the `provider` column in `email_logs` to see what actually happened.

**Sending** — `send_email(payload, db_session)` renders `templates/emails/{template_name}.html` with Jinja2 (autoescaping on), creates a `pending` `EmailLog` row when a session is passed, sends through the provider, then updates the row to `sent` or `failed` with the provider message id or error. A template error returns a failed result without sending. Convenience wrappers:

| Wrapper | Template |
|---|---|
| `send_magic_link` | `magic_link.html` |
| `send_pulse_alert` | `pulse_escalation_tier1`…`tier4.html` |
| `send_welcome_email` | `welcome.html` |

All templates extend `base.html`.

**Email log** — `backend/models/email_log.py` (`email_logs` table) stores user, recipient, subject, template, status (`pending`, `sent`, `failed`, `bounced`, `spam_complaint`, `unsubscribed`), provider, provider message id, error and timestamps.

**Router** — `backend/routers/email.py` under `/api/emails`:

- `GET /status` and `GET /status/{id}` — delivery status for the caller's emails; an admin may pass `user_id` to see another user's.
- `POST /resend/{id}` — resend a logged email. The admin check is a placeholder: user id 1 is treated as admin.
- `POST /webhook/postmark` — Postmark bounce/spam/unsubscribe webhook (hidden from the schema). It maps the `RecordType` to a log status. The handler has no shared-secret or signature check.
- `GET /bounces` — bounced and complained emails.

`EMAIL_MAX_RETRIES` and `EMAIL_RETRY_DELAY_SECONDS` exist in settings, but the send path does not read them; there is no automatic retry.

## AI concierge

The concierge panel in the app shell is driven by `frontend/src/lib/stores/conciergeEngine.ts`, which tracks the current route (`setContext`), the open/closed state and message history, and calls `aiConciergeService.chat(...)` from `sendMessage`.

`frontend/src/lib/services/aiConciergeService.ts`:

- **Redacts before sending** — `sanitizeInput` masks SSN-shaped numbers, 8–17-digit account numbers, email addresses and phone numbers in the user's text before it leaves the browser.
- Builds a system prompt from the user's role, current module and emotional state (including the overwhelm detector's state).
- Calls `callAiProxy`, which POSTs `{ model, messages }` to `/api/ai/chat` through the authenticated `apiFetch` in `src/lib/api/client.ts`, and returns `choices[0].message.content`. Any failure becomes one gentle "AI help isn't available right now" message.

`backend/routers/ai_proxy.py` (`POST /api/ai/chat`) keeps the provider key on the server:

- Requires a logged-in user and is limited to 30 requests per minute.
- Accepts 1–30 messages of up to 20,000 characters each, optional `temperature` (0–2) and `max_tokens` (≤ 4000).
- Allows only the model `google/gemini-2.0-flash-001`; anything else is a 400.
- Forwards to OpenRouter with `OPENROUTER_API_KEY` (or the legacy `VITE_OPENROUTER_API_KEY`) through one shared `httpx` client (45 s timeout), and returns OpenRouter's JSON unchanged.
- A missing key, network error, non-200 reply or non-JSON body all become a 503 with the same compassionate message.

`/api/support` (`backend/routers/support.py`) is a separate support-discovery search backed by the Tavily search API; without `TAVILY_API_KEY` it returns mock results.

## Related pages

- [Pulse Welfare Check-ins](/openwiki/systems/pulse-welfare.md)
- [Authentication](/openwiki/systems/authentication.md)
- [Development, Configuration and Deployment](/openwiki/operations/development-and-deployment.md)
