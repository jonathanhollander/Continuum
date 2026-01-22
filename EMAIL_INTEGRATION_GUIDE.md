# Email Integration Guide - Continuum SaaS

## Overview

The Continuum SaaS email system has been upgraded from mock file storage to actual email delivery. The system now supports:

- **Postmark API** (recommended for production)
- **SMTP** (Gmail, SendGrid, or any SMTP provider)
- **Local file storage** (development/testing fallback)

## Features

### Email Templates
All emails use compassionate, professionally designed HTML templates:
- `magic_link.html` - Passwordless authentication
- `pulse_escalation_tier1.html` - Standard welfare check
- `pulse_escalation_tier2.html` - Extended period escalation
- `pulse_escalation_tier3.html` - Medical/legal release
- `pulse_escalation_tier4.html` - Emergency full vault access
- `welcome.html` - New user onboarding

### Email Logging
All sent emails are tracked in the `email_logs` database table:
- Delivery status tracking
- Provider message IDs
- Error logging for failed sends
- Audit trail for compliance

### Automatic Fallback
The system automatically selects the best available provider:
1. Postmark (if `POSTMARK_API_KEY` is set)
2. SMTP (if `SMTP_ENABLED=true` and credentials provided)
3. Local file storage (saves to `backend/outbox/`)

## Setup Instructions

### Option 1: Postmark (Recommended)

Postmark is designed for transactional emails with excellent deliverability.

1. **Sign up for Postmark**
   - Go to https://postmarkapp.com
   - Create a free account (100 emails/month free)
   - Create a server and get your Server API Token

2. **Configure Environment Variables**
   ```bash
   # In your .env file
   POSTMARK_API_KEY=your-postmark-server-token-here
   POSTMARK_FROM_EMAIL=noreply@continuum.im
   ```

3. **Verify Sender Domain** (Production)
   - In Postmark dashboard, add and verify your sending domain
   - Update `POSTMARK_FROM_EMAIL` to use your verified domain

### Option 2: SMTP (Gmail, SendGrid, etc.)

#### Using Gmail

1. **Enable App Passwords**
   - Go to Google Account Settings → Security
   - Enable 2-Factor Authentication
   - Generate an App Password for "Mail"

2. **Configure Environment Variables**
   ```bash
   SMTP_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password-here
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_FROM_NAME="Continuum Pulse"
   SMTP_USE_TLS=true
   ```

#### Using SendGrid

1. **Get SendGrid API Key**
   - Sign up at https://sendgrid.com
   - Create an API key with "Mail Send" permissions

2. **Configure Environment Variables**
   ```bash
   SMTP_ENABLED=true
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USERNAME=apikey
   SMTP_PASSWORD=your-sendgrid-api-key-here
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   SMTP_FROM_NAME="Continuum Pulse"
   SMTP_USE_TLS=true
   ```

### Option 3: Development Mode (Local Files)

No configuration needed. Emails are automatically saved to `backend/outbox/` if no provider is configured.

## Installation

Install the Postmark client library:

```bash
cd backend
pip install -r requirements.txt
```

Or install just the email dependency:

```bash
pip install postmarker
```

## Testing

### Test Email Sending

Create a test script or use the Python shell:

```python
from backend.services.email_service import email_service
# Get a database session
session = next(get_session())

# Get user ID from email (recommended approach)
from sqlmodel import select
from backend.database import User
user = session.exec(select(User).where(User.email == "test@example.com")).first()
user_id = user.id if user else 1 # Fallback for demo

# Test welcome email
result = email_service.send_welcome_email(
    to_email="test@example.com",
    user_id=user_id,
    dashboard_url="https://your-app.com/dashboard",
    db_session=session
)

print(result)
```

### Check Email Logs

Query the database to see email delivery status:

```python
from sqlmodel import select
from backend.models.email_log import EmailLog
from backend.database import get_session

session = next(get_session())
logs = session.exec(select(EmailLog).order_by(EmailLog.created_at.desc())).all()

for log in logs:
    print(f"{log.template_name} to {log.recipient_email}: {log.status}")
```

### View Local Test Emails

If using local mode, check the `backend/outbox/` directory:

```bash
ls -la backend/outbox/
open backend/outbox/latest-email.html  # macOS
```

## Email Types

### 1. Magic Link (Passwordless Login)
- **Trigger:** User requests passwordless login
- **Template:** `magic_link.html`
- **Contains:** 15-minute expiring login link

### 2. Welcome Email
- **Trigger:** New user signs up
- **Template:** `welcome.html`
- **Contains:** Getting started guide, next steps

### 3. Pulse Alerts (Tier 1-4)
- **Trigger:** Automated by pulse scheduler
- **Templates:** `pulse_escalation_tier{1-4}.html`
- **Contains:**
  - Tier 1: Gentle welfare check
  - Tier 2: Extended absence notice
  - Tier 3: Medical/legal document access
  - Tier 4: Full vault emergency access

## Customization

### Modify Templates

Templates are located in `/backend/templates/emails/`:

1. Edit HTML templates to match your branding
2. Use Jinja2 syntax for dynamic content
3. All templates extend `base.html` for consistent styling
4. Test changes in local mode before deploying

### Add New Email Types

1. Create new template in `/backend/templates/emails/`
2. Add convenience method to `EmailService` class
3. Use the template in your code

Example:

```python
# In backend/services/email_service.py
def send_custom_notification(self, to_email: str, ...):
    return self.send_email(
        to_email=to_email,
        recipient_name="...",
        subject="...",
        template_name="custom_notification",
        template_context={...},
        db_session=session
    )
```

## Production Checklist

- [ ] Set up Postmark account and verify domain
- [ ] Add `POSTMARK_API_KEY` to production environment
- [ ] Configure sender email to use verified domain
- [ ] Test all email types (magic link, pulse alerts, welcome)
- [ ] Monitor email logs table for delivery issues
- [x] Set up email bounce/complaint webhooks (Postmark) - ✅ Implemented
- [ ] Add email rate limiting if needed
- [ ] Configure SPF/DKIM records for your domain
- [ ] Review email templates for branding consistency
- [ ] Test spam score using mail-tester.com

## Bounce and Complaint Handling

The system includes a webhook endpoint to receive bounce and spam complaint notifications from Postmark.

### Webhook Endpoint

- **URL:** `POST /api/emails/webhook/postmark`
- **Purpose:** Updates email log status when emails bounce or receive spam complaints

### Supported Event Types

| Event Type | New Status | Description |
|------------|------------|-------------|
| Bounce | `bounced` | Email delivery permanently or temporarily failed |
| SpamComplaint | `spam_complaint` | Recipient marked email as spam |
| SubscriptionChange | `unsubscribed` | Recipient unsubscribed |

### Setting Up Postmark Webhooks

1. **Log into Postmark Dashboard**
   - Go to https://account.postmarkapp.com

2. **Navigate to Webhooks**
   - Select your server → Settings → Webhooks

3. **Add a New Webhook**
   - **URL:** `https://your-domain.com/api/emails/webhook/postmark`
   - **Events to send:**
     - ✅ Bounce (all types)
     - ✅ Spam Complaint
   - **HTTP Method:** POST
   - **Content-Type:** application/json

4. **Test the Webhook**
   - Click "Test" in Postmark to send a sample payload
   - Check your logs for "Postmark webhook received" messages

### Viewing Bounced Emails

Query bounced emails via the API:

```bash
# Get all bounced emails (admin only)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/emails/bounces
```

Or in the database:

```sql
SELECT * FROM email_logs
WHERE status IN ('bounced', 'spam_complaint', 'unsubscribed')
ORDER BY created_at DESC;
```

### Bounce Types

Postmark distinguishes several bounce types:

- **HardBounce:** Permanent failure (invalid address, domain doesn't exist)
- **SoftBounce:** Temporary failure (mailbox full, server temporarily unavailable)
- **SpamNotification:** ISP spam block
- **Unsubscribe:** Link/header unsubscribe

## Troubleshooting

### Emails Not Sending

1. **Check provider selection:**
   ```python
   from backend.services.email_service import email_service
   print(f"Active provider: {email_service.provider}")
   ```

2. **Check environment variables:**
   ```bash
   echo $POSTMARK_API_KEY
   echo $SMTP_ENABLED
   ```

3. **Check email logs:**
   ```sql
   SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC;
   ```

### Gmail "Less Secure Apps" Error

Gmail no longer supports "Less Secure Apps". You MUST use App Passwords:
1. Enable 2FA on your Google Account
2. Generate an App Password
3. Use the app password in `SMTP_PASSWORD`

### Postmark 422 Error

- Verify your sender email is from a verified domain
- Check that sender signature is active in Postmark dashboard
- Ensure API key has correct permissions

### Template Rendering Errors

- Check Jinja2 template syntax
- Verify all required context variables are provided
- Test template rendering in isolation

## Migration from Old System

The old `backend/email_service.py` (file storage only) has been replaced.

### Changes Made:

1. **File moved:**
   - Old: `/backend/email_service.py`
   - New: `/backend/services/email_service.py`

2. **Import updates:**
   ```python
   # Old
   from backend.email_service import email_service

   # New
   from backend.services.email_service import email_service
   ```

3. **Method signature changes:**
   ```python
   # Old
   email_service.send_email(
       to_email, recipient_name, subject, body, user_id,
       action_url, action_label
   )

   # New
   email_service.send_pulse_alert(
       to_email, recipient_name, tier_number, user_id,
       user_name, portal_url, additional_context, db_session
   )
   ```

### Files Updated:
- `backend/pulse_logic.py` - Updated to use new email service
- `backend/routers/auth.py` - Added magic link and welcome emails
- `backend/database.py` - Added email_logs table
- `backend/config.py` - Enhanced email configuration

## Support

For issues or questions:
- Check the `email_logs` table for delivery errors
- Review console output for diagnostic messages
- Consult Postmark documentation: https://postmarkapp.com/developer
- Review template rendering in local mode first

## Security Notes

- Never commit `.env` files with API keys
- Use environment variables for all credentials
- Postmark API keys start with specific prefixes (don't share)
- Rotate API keys if compromised
- Use separate Postmark servers for dev/staging/prod
- Monitor email logs for suspicious activity
