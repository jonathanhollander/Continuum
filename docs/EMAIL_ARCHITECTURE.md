# Email System Architecture - Continuum SaaS

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Continuum Email System                        │
│                         v0.8.0                                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      EMAIL TRIGGERS                               │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  User Signup │  │ Magic Link   │  │ Pulse Check  │           │
│  │   (Auth)     │  │  (Auth)      │  │  (Scheduler) │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                  │                  │                   │
│         ▼                  ▼                  ▼                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │        backend/services/email_service.py          │           │
│  │                EmailService Class                 │           │
│  └──────────────┬───────────────────────────────────┘           │
│                 │                                                 │
│    ┌────────────┼────────────┬──────────────┐                   │
│    ▼            ▼            ▼              ▼                    │
│ send_email  send_magic  send_pulse  send_welcome               │
│  (generic)    _link      _alert       _email                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    TEMPLATE RENDERING                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Jinja2 Environment ──> /backend/templates/emails/               │
│                                                                   │
│  ┌───────────────────────────────────────────────────┐          │
│  │  base.html (Parent Template)                       │          │
│  │  ├── header (Continuum branding)                   │          │
│  │  ├── content block (child templates)               │          │
│  │  └── footer (legal, user info)                     │          │
│  └───────────────────────────────────────────────────┘          │
│                              │                                    │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼              │
│  magic_link.html    pulse_tier1-4.html    welcome.html          │
│  (15min token)      (escalation alerts)   (onboarding)          │
│                                                                   │
│  Variables Injected: user_id, recipient_name, portal_url, etc.  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                   PROVIDER SELECTION                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Decision Tree:                                                   │
│                                                                   │
│  1. POSTMARK_API_KEY set?                                        │
│     ├── YES ──> Use Postmark API                                 │
│     └── NO  ──> Check SMTP                                       │
│                                                                   │
│  2. SMTP_ENABLED=true AND SMTP_HOST set?                         │
│     ├── YES ──> Use SMTP (Gmail/SendGrid/etc)                    │
│     └── NO  ──> Fall back to Local Storage                       │
│                                                                   │
│  3. Local Storage (Development Mode)                             │
│     └── Save HTML files to backend/outbox/                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    EMAIL DELIVERY                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   POSTMARK      │  │      SMTP       │  │  LOCAL STORAGE  │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ • API call via  │  │ • smtplib       │  │ • Save to file  │ │
│  │   postmarker    │  │ • Port 587/TLS  │  │ • timestamp     │ │
│  │ • Returns msg ID│  │ • Auth required │  │ • HTML format   │ │
│  │ • Fast delivery │  │ • Slower        │  │ • No actual send│ │
│  │ • Tracking      │  │ • Universal     │  │ • Dev/testing   │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                     │                     │          │
│           └─────────────────────┴─────────────────────┘          │
│                              │                                    │
│                    Auto-fallback on error                        │
│                    Postmark → SMTP → Local                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    EMAIL LOGGING                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Database Table: email_logs                                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Field              │ Purpose                                │ │
│  ├────────────────────┼────────────────────────────────────────┤ │
│  │ id                 │ Primary key                            │ │
│  │ user_id            │ Associated user (optional)             │ │
│  │ recipient_email    │ To address                             │ │
│  │ recipient_name     │ To name                                │ │
│  │ subject            │ Email subject                          │ │
│  │ template_name      │ Template used                          │ │
│  │ status             │ pending/sent/failed/bounced            │ │
│  │ provider           │ postmark/smtp/local                    │ │
│  │ provider_msg_id    │ External tracking ID                   │ │
│  │ error_message      │ Failure reason (if failed)             │ │
│  │ sent_at            │ Delivery timestamp                     │ │
│  │ created_at         │ Record creation                        │ │
│  └────────────────────┴────────────────────────────────────────┘ │
│                                                                   │
│  Indexes: user_id, recipient_email, template_name, status        │
│  Purpose: Audit trail, debugging, compliance, retry logic        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    EMAIL TYPES & FLOWS                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. WELCOME EMAIL                                                 │
│     Trigger: POST /api/auth/signup                                │
│     Template: welcome.html                                        │
│     Variables: dashboard_url, user_id                             │
│     Purpose: Onboard new users                                    │
│                                                                   │
│  2. MAGIC LINK                                                    │
│     Trigger: POST /api/auth/magic-link                            │
│     Template: magic_link.html                                     │
│     Variables: magic_link_url (15min JWT)                         │
│     Purpose: Passwordless authentication                          │
│                                                                   │
│  3. PULSE TIER 1 (Welfare Check)                                  │
│     Trigger: Pulse scheduler (missed soft deadline)               │
│     Template: pulse_escalation_tier1.html                         │
│     Variables: recipient_name, user_name, portal_url              │
│     Purpose: Gentle wellness check                                │
│                                                                   │
│  4. PULSE TIER 2 (Extended Absence)                               │
│     Trigger: Pulse scheduler (+6 hours after tier 1)              │
│     Template: pulse_escalation_tier2.html                         │
│     Variables: + timeline info (last_checkin, expected_checkin)   │
│     Purpose: Request direct contact attempt                       │
│                                                                   │
│  5. PULSE TIER 3 (Medical/Legal Release)                          │
│     Trigger: Pulse scheduler (+12 hours after tier 2)             │
│     Template: pulse_escalation_tier3.html                         │
│     Variables: + critical_documents_available                     │
│     Purpose: Unlock medical directives, entry codes               │
│                                                                   │
│  6. PULSE TIER 4 (Emergency Vault Access)                         │
│     Trigger: Pulse scheduler (+24 hours after tier 3)             │
│     Template: pulse_escalation_tier4.html                         │
│     Variables: + full_vault_access_granted                        │
│     Purpose: Complete estate access for guardians                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    SECURITY FEATURES                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  • Magic links expire after 15 minutes                            │
│  • One-time use tokens (JWT with 'type' claim)                   │
│  • No sensitive data in email body (link to portal only)         │
│  • Email logs don't store full email content                     │
│  • Environment variables for all credentials                     │
│  • Separate keys for dev/staging/prod                            │
│  • Non-blocking sends (don't fail auth on email error)           │
│  • Timing-safe responses (don't leak user existence)             │
│  • HTML sanitization in templates                                │
│  • SPF/DKIM/DMARC support (when using verified domain)           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Error Scenarios:                                                 │
│                                                                   │
│  1. Template Rendering Error                                      │
│     ├── Catch Jinja2 exception                                    │
│     ├── Log error with template name                              │
│     ├── Update email_log status = 'failed'                        │
│     └── Return error response                                     │
│                                                                   │
│  2. Postmark API Error                                            │
│     ├── Catch HTTP/API exception                                  │
│     ├── Log error details                                         │
│     ├── Attempt SMTP fallback (if configured)                     │
│     └── Final fallback to local storage                           │
│                                                                   │
│  3. SMTP Connection Error                                         │
│     ├── Catch smtplib exception                                   │
│     ├── Log error with SMTP host/port                             │
│     ├── Fallback to local storage                                 │
│     └── Update email_log with error_message                       │
│                                                                   │
│  4. Database Logging Error                                        │
│     ├── Catch SQLAlchemy exception                                │
│     ├── Print warning (don't fail email send)                     │
│     └── Continue with email delivery                              │
│                                                                   │
│  All errors logged to console for debugging                       │
│  Non-blocking: Auth/signup succeeds even if email fails          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    MONITORING & METRICS                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Key Metrics to Track:                                            │
│                                                                   │
│  • Email delivery rate (sent / total)                             │
│  • Template usage distribution                                    │
│  • Provider success rate                                          │
│  • Average send time                                              │
│  • Failed email count                                             │
│  • Bounce rate (requires webhook)                                 │
│  • Open rate (requires tracking pixels - not implemented)        │
│                                                                   │
│  SQL Queries:                                                     │
│                                                                   │
│  -- Delivery rate                                                 │
│  SELECT status, COUNT(*) FROM email_logs GROUP BY status;         │
│                                                                   │
│  -- Recent failures                                               │
│  SELECT * FROM email_logs WHERE status='failed'                   │
│    ORDER BY created_at DESC LIMIT 10;                             │
│                                                                   │
│  -- Template usage                                                │
│  SELECT template_name, COUNT(*) as count                          │
│    FROM email_logs GROUP BY template_name;                        │
│                                                                   │
│  -- Success rate by provider                                      │
│  SELECT provider,                                                 │
│    AVG(CASE WHEN status='sent' THEN 1.0 ELSE 0 END) as success    │
│    FROM email_logs GROUP BY provider;                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION MATRIX                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Environment    │ Provider  │ Configuration                       │
│  ───────────────┼───────────┼────────────────────────────────── │
│  Development    │ Local     │ No config needed                    │
│  ───────────────┼───────────┼────────────────────────────────── │
│  Staging        │ Postmark  │ POSTMARK_API_KEY (test server)      │
│  ───────────────┼───────────┼────────────────────────────────── │
│  Production     │ Postmark  │ POSTMARK_API_KEY (prod server)      │
│                 │           │ + Verified sender domain            │
│  ───────────────┼───────────┼────────────────────────────────── │
│  Alternative    │ SMTP      │ SMTP_ENABLED=true                   │
│  (any env)      │           │ + SMTP_HOST, credentials            │
│  ───────────────┼───────────┼────────────────────────────────── │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    TESTING STRATEGY                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Test Script: backend/test_email.py                               │
│                                                                   │
│  Tests Performed:                                                 │
│  ├── Provider detection                                           │
│  ├── Configuration validation                                     │
│  ├── Welcome email template                                       │
│  ├── Magic link template                                          │
│  ├── Pulse tier 1 template                                        │
│  ├── Pulse tier 2 template                                        │
│  ├── Pulse tier 3 template                                        │
│  ├── Pulse tier 4 template                                        │
│  ├── Email log creation                                           │
│  └── Delivery status tracking                                     │
│                                                                   │
│  Manual Testing Checklist:                                        │
│  □ Sign up new user → receives welcome email                     │
│  □ Request magic link → receives email within 1 minute            │
│  □ Magic link works and expires after 15 minutes                 │
│  □ Pulse tier 1 triggers at correct time                          │
│  □ Pulse tiers escalate correctly (1→2→3→4)                       │
│  □ Portal links in emails work correctly                          │
│  □ Email logs populated in database                               │
│  □ Failed sends logged with error messages                        │
│  □ Emails render correctly in Gmail, Outlook, Apple Mail         │
│  □ Mobile rendering works (responsive design)                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE CHARACTERISTICS                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Operation              │ Latency     │ Notes                     │
│  ────────────────────────┼─────────────┼────────────────────────  │
│  Template render        │ <10ms       │ Jinja2 in-memory          │
│  Postmark API call      │ 200-500ms   │ Network dependent         │
│  SMTP send              │ 1-3s        │ Slower than API           │
│  Local file write       │ <5ms        │ Disk I/O                  │
│  Database log write     │ 10-50ms     │ Single INSERT             │
│  Total (Postmark)       │ ~300ms      │ Non-blocking              │
│  Total (SMTP)           │ ~1-3s       │ Non-blocking              │
│  Total (Local)          │ ~15ms       │ Instant                   │
│                                                                   │
│  Optimization:                                                    │
│  • Template caching (Jinja2 auto-caches)                          │
│  • Non-blocking sends (don't wait for delivery)                   │
│  • Connection pooling (future: queue system)                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT NOTES                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Railway Deployment:                                              │
│  1. Add POSTMARK_API_KEY to environment variables                │
│  2. Verify sender domain in Postmark dashboard                   │
│  3. Update POSTMARK_FROM_EMAIL to verified domain                │
│  4. Deploy and test with /api/auth/signup                         │
│                                                                   │
│  Heroku Deployment:                                               │
│  1. heroku config:set POSTMARK_API_KEY=xxx                        │
│  2. Same as Railway for domain verification                       │
│                                                                   │
│  Docker Deployment:                                               │
│  1. Pass environment variables via docker-compose.yml             │
│  2. Or use .env file mounted as volume                            │
│                                                                   │
│  DNS Configuration (Production):                                  │
│  Add these records for your sending domain:                       │
│  • SPF: TXT record with Postmark SPF                              │
│  • DKIM: TXT record with Postmark DKIM key                        │
│  • DMARC: TXT record for email authentication                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

## Architecture Decisions

### Why Postmark?
- Designed for transactional emails
- Excellent deliverability (>99%)
- Simple API, easy integration
- Free tier for development
- Built-in bounce/spam handling
- No vendor lock-in (easy to switch)

### Why Multiple Providers?
- Resilience (automatic fallback)
- Flexibility (choose based on cost/features)
- Development ease (local mode)
- Testing without external dependencies

### Why Template-Based?
- Consistency across all emails
- Easy to update branding
- Separation of logic and presentation
- Reusable components (base.html)
- Professional, tested layouts

### Why Database Logging?
- Audit trail for compliance
- Debugging delivery issues
- Retry failed sends
- Analytics on email performance
- User notification history

## File Organization

```
backend/
├── services/
│   └── email_service.py          # Main email service
├── models/
│   └── email_log.py               # Email logging model
├── templates/
│   └── emails/
│       ├── base.html              # Base template
│       ├── magic_link.html        # Magic link email
│       ├── welcome.html           # Welcome email
│       └── pulse_escalation_tier{1-4}.html  # Pulse alerts
├── routers/
│   └── auth.py                    # Calls email service
├── pulse_logic.py                 # Pulse escalation logic
├── config.py                      # Email configuration
└── test_email.py                  # Test script
```

## API Surface

### EmailService Class

```python
class EmailService:
    def __init__(self)
    def send_email(to_email, recipient_name, subject, template_name,
                   template_context, user_id, db_session) -> Dict
    def send_magic_link(to_email, magic_link_url, db_session) -> Dict
    def send_pulse_alert(to_email, recipient_name, tier_number, user_id,
                         user_name, portal_url, additional_context,
                         db_session) -> Dict
    def send_welcome_email(to_email, user_id, dashboard_url,
                          db_session) -> Dict
```

### Return Format

```python
{
    "status": "sent" | "saved_local" | "failed",
    "provider": "postmark" | "smtp" | "local",
    "message_id": "abc-123-xyz",  # or None
    "error": "error message",      # only if failed
    "file_path": "/path/to/file"   # only if local
}
```

---

**Document Version:** 1.0
**Last Updated:** January 21, 2026
**System Version:** Continuum SaaS v0.8.0
