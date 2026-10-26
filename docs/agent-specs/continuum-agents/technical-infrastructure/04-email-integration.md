# Agent 04: Email Integration
**Priority:** P1 - HIGH
**Estimated Time:** 3-4 hours
**Dependencies:** 05-configuration-management
**Category:** Technical Infrastructure

---

## OBJECTIVE

Replace mock email service (saves to files) with actual SMTP email sending.

**Current Issues:**
- Email service saves HTML to `backend/outbox/` directory instead of sending
- Pulse escalation alerts don't actually notify guardians
- Magic link emails don't send
- Welcome emails don't send
- No production email configuration

**Expected Outcome:**
- Actual email sending via SendGrid, Gmail SMTP, or AWS SES
- Compassionate email templates appropriate for death planning
- Email logging and delivery tracking
- Configurable SMTP settings via environment variables
- Pulse notifications, magic links, and welcome emails working

---

## FILES TO MODIFY

### Backend Files:
1. `/backend/services/email_service.py` - Rewrite with actual SMTP
2. `/backend/config.py` - Add email configuration
3. `/backend/templates/emails/` - Create email templates

### Email Templates (Create):
4. `/backend/templates/emails/pulse_alert.html` - Guardian alert
5. `/backend/templates/emails/magic_link.html` - Magic link login
6. `/backend/templates/emails/welcome.html` - Welcome email
7. `/backend/templates/emails/base.html` - Base template
8. `/backend/templates/emails/pulse_missed.html` - Missed check-in
9. `/backend/templates/emails/pulse_response.html` - Guardian response confirmation

---

## IMPLEMENTATION

### Step 1: Add Email Configuration

**File:** `/backend/config.py`

**Add email settings:**

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # ... existing settings ...

    # Email Configuration
    SMTP_HOST: str = "smtp.sendgrid.net"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey"  # For SendGrid
    SMTP_PASSWORD: str  # SendGrid API key or SMTP password
    SMTP_FROM_EMAIL: str = "notifications@continuum.estate"
    SMTP_FROM_NAME: str = "Continuum Estate Planning"
    SMTP_USE_TLS: bool = True

    # Email Provider (sendgrid, gmail, ses, smtp)
    EMAIL_PROVIDER: str = "sendgrid"

    # SendGrid specific
    SENDGRID_API_KEY: Optional[str] = None

    # AWS SES specific
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

---

### Step 2: Rewrite Email Service

**File:** `/backend/services/email_service.py`

**Replace with actual SMTP implementation:**

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from backend.config import settings
import logging

logger = logging.getLogger(__name__)

# Setup Jinja2 for email templates
template_dir = Path(__file__).parent.parent / 'templates' / 'emails'
jinja_env = Environment(loader=FileSystemLoader(template_dir))

class EmailService:
    """
    Compassionate email service for Continuum estate planning platform.

    Emails are sent with care and empathy, appropriate for the sensitive
    nature of death planning and guardian notifications.
    """

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_USE_TLS

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_text: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """
        Send email via SMTP

        Returns: True if sent successfully, False otherwise
        """

        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email

            if reply_to:
                message['Reply-To'] = reply_to

            # Add plain text version (fallback)
            if plain_text:
                part1 = MIMEText(plain_text, 'plain')
                message.attach(part1)

            # Add HTML version
            part2 = MIMEText(html_content, 'html')
            message.attach(part2)

            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()

                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

            logger.info(f"✓ Email sent to {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"✗ Failed to send email to {to_email}: {str(e)}")
            return False

    def send_pulse_alert(
        self,
        guardian_email: str,
        guardian_name: str,
        owner_name: str,
        tier_name: str,
        portal_link: str,
        missed_checkins: int
    ) -> bool:
        """
        Send compassionate pulse alert to guardian

        This is a sensitive notification - the guardian is learning
        their loved one may be in danger.
        """

        template = jinja_env.get_template('pulse_alert.html')

        html_content = template.render(
            guardian_name=guardian_name,
            owner_name=owner_name,
            tier_name=tier_name,
            portal_link=portal_link,
            missed_checkins=missed_checkins
        )

        subject = f"Wellness Check: {owner_name} hasn't checked in"

        return self.send_email(
            to_email=guardian_email,
            subject=subject,
            html_content=html_content
        )

    def send_magic_link(
        self,
        to_email: str,
        magic_link: str,
        full_name: str
    ) -> bool:
        """
        Send magic link for passwordless login

        Compassionate messaging for users who may be grieving or stressed.
        """

        template = jinja_env.get_template('magic_link.html')

        html_content = template.render(
            full_name=full_name,
            magic_link=magic_link
        )

        subject = "Your secure login link for Continuum"

        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )

    def send_welcome_email(
        self,
        to_email: str,
        full_name: str
    ) -> bool:
        """
        Send welcome email to new user

        Sets compassionate tone for estate planning journey.
        """

        template = jinja_env.get_template('welcome.html')

        html_content = template.render(
            full_name=full_name
        )

        subject = "Welcome to Continuum - You're Taking Care of Your Loved Ones"

        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )

    def send_guardian_response_confirmation(
        self,
        guardian_email: str,
        guardian_name: str,
        owner_name: str,
        response_type: str  # safe, concerned, emergency
    ) -> bool:
        """
        Confirm guardian's response was received

        Reassures guardian their action was recorded.
        """

        template = jinja_env.get_template('pulse_response.html')

        html_content = template.render(
            guardian_name=guardian_name,
            owner_name=owner_name,
            response_type=response_type
        )

        subject = f"Response recorded for {owner_name}"

        return self.send_email(
            to_email=guardian_email,
            subject=subject,
            html_content=html_content
        )

# Singleton instance
email_service = EmailService()
```

---

### Step 3: Create Email Templates

**File:** `/backend/templates/emails/base.html`

**Base template with compassionate styling:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        h1 {
            color: #1f2937;
            font-size: 24px;
            margin: 20px 0;
        }
        .content {
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .urgent {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Continuum</div>
        </div>

        {% block content %}{% endblock %}

        <div class="footer">
            <p>This is an automated message from Continuum Estate Planning.</p>
            <p>We're here to help you care for your loved ones.</p>
            <p>If you have questions, please contact support@continuum.estate</p>
        </div>
    </div>
</body>
</html>
```

---

**File:** `/backend/templates/emails/pulse_alert.html`

**Compassionate guardian alert:**

```html
{% extends "base.html" %}

{% block content %}
<div class="urgent">
    <h1>Wellness Check: {{owner_name}} Needs Your Attention</h1>
</div>

<div class="content">
    <p>Hello {{guardian_name}},</p>

    <p>This is an important message about {{owner_name}}'s safety.</p>

    <p><strong>{{owner_name}} has missed {{missed_checkins}} wellness check-in(s)</strong> and has asked that you be notified as part of their <strong>{{tier_name}}</strong> safety network.</p>

    <p><strong>What This Means:</strong></p>
    <ul>
        <li>This could be nothing - they may simply be busy or traveling</li>
        <li>Or it could indicate they need help</li>
        <li>Your response helps determine the appropriate next steps</li>
    </ul>

    <p><strong>What You Should Do:</strong></p>
    <ol>
        <li>Try reaching {{owner_name}} directly (call, text, or visit)</li>
        <li>Use the secure portal below to let us know what you find</li>
        <li>If you can't reach them and are concerned, contact local authorities</li>
    </ol>

    <a href="{{portal_link}}" class="button">Access Secure Guardian Portal</a>

    <p><strong>Remember:</strong> Your role as a guardian is an act of love. {{owner_name}} trusts you to help in this situation.</p>

    <p>Thank you for being part of {{owner_name}}'s safety network.</p>

    <p>With care,<br>The Continuum Team</p>
</div>
{% endblock %}
```

---

**File:** `/backend/templates/emails/magic_link.html`

**Compassionate magic link login:**

```html
{% extends "base.html" %}

{% block content %}
<h1>Your Secure Login Link</h1>

<div class="content">
    <p>Hello {{full_name}},</p>

    <p>You requested a secure login link to access your Continuum account.</p>

    <a href="{{magic_link}}" class="button">Sign In to Your Account</a>

    <p><strong>This link expires in 15 minutes</strong> for security reasons.</p>

    <p>If you didn't request this, you can safely ignore this email.</p>

    <p><strong>Having trouble?</strong> Copy and paste this link into your browser:</p>
    <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
        {{magic_link}}
    </p>

    <p>We're here to support you through your estate planning journey.</p>

    <p>With care,<br>The Continuum Team</p>
</div>
{% endblock %}
```

---

**File:** `/backend/templates/emails/welcome.html`

**Compassionate welcome email:**

```html
{% extends "base.html" %}

{% block content %}
<h1>Welcome to Continuum, {{full_name}}</h1>

<div class="content">
    <p>Thank you for taking this important step.</p>

    <p>Estate planning takes courage. You're thinking ahead so your loved ones have clarity during a difficult time. That's an act of love.</p>

    <p><strong>What you've just created:</strong></p>
    <ul>
        <li>A secure space to document your wishes</li>
        <li>Peace of mind for your family</li>
        <li>A safety network to watch over you</li>
        <li>A legacy that protects the people you care about</li>
    </ul>

    <p><strong>Getting Started:</strong></p>
    <ol>
        <li>Add your Circle of Trust (who should be notified if something happens)</li>
        <li>Set up Pulse Safety (wellness check-ins for peace of mind)</li>
        <li>Document your important information at your own pace</li>
    </ol>

    <p>There's no rush. Take your time. Many people work on their estate plan over weeks or months.</p>

    <p><strong>We're here for you:</strong></p>
    <ul>
        <li>Our AI Concierge guides you compassionately</li>
        <li>Support team available at support@continuum.estate</li>
        <li>Grief resources if you're facing a diagnosis</li>
    </ul>

    <p>You're not alone in this. We're here to help you care for your loved ones.</p>

    <p>With care and respect,<br>The Continuum Team</p>
</div>
{% endblock %}
```

---

### Step 4: Update Email Service Usage

**File:** `/backend/routers/pulse.py`

**Replace file-based email with actual sending:**

```python
from backend.services.email_service import email_service

# In pulse escalation handler
def send_guardian_alert(guardian, owner, tier):
    """Send pulse alert to guardian"""

    portal_link = generate_portal_link(guardian.id, tier.id)

    success = email_service.send_pulse_alert(
        guardian_email=guardian.email,
        guardian_name=guardian.full_name,
        owner_name=owner.full_name,
        tier_name=tier.name,
        portal_link=portal_link,
        missed_checkins=get_missed_checkin_count(owner.id)
    )

    if success:
        logger.info(f"✓ Pulse alert sent to {guardian.email}")
    else:
        logger.error(f"✗ Failed to send pulse alert to {guardian.email}")

    return success
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Test email service
cd backend
python -m pytest tests/test_email_service.py

# Test SMTP connection
python -c "from services.email_service import email_service; print('✓ Email service initialized')"

# Test template rendering
python -c "from jinja2 import Environment, FileSystemLoader; env = Environment(loader=FileSystemLoader('templates/emails')); t = env.get_template('welcome.html'); print('✓ Templates valid')"

# Validate configuration
python -c "from config import settings; print(f'SMTP: {settings.SMTP_HOST}:{settings.SMTP_PORT}')"
```

---

## SUCCESS CRITERIA

- [ ] Email service rewritten with actual SMTP sending
- [ ] SendGrid/Gmail/SES support
- [ ] Configuration via environment variables
- [ ] Compassionate email templates created
- [ ] Pulse alerts send to guardians
- [ ] Magic link emails send
- [ ] Welcome emails send
- [ ] Email logging implemented
- [ ] Error handling for failed sends
- [ ] Templates use Jinja2 rendering
- [ ] HTML and plain text versions
- [ ] Email delivery confirmation

---

## TESTING

### Manual Testing:

1. **SendGrid Test:**
   ```bash
   export SMTP_PASSWORD="your-sendgrid-api-key"
   export SMTP_FROM_EMAIL="test@continuum.estate"
   python -c "from backend.services.email_service import email_service; email_service.send_welcome_email('your-email@example.com', 'Test User')"
   ```

2. **Pulse Alert Test:**
   - Trigger pulse escalation
   - Verify guardian receives email
   - Check email formatting
   - Verify portal link works

3. **Magic Link Test:**
   - Request magic link login
   - Verify email received
   - Click link, verify login works

### Automated Testing:

```python
# backend/tests/test_email_service.py
import pytest
from unittest.mock import patch, MagicMock
from backend.services.email_service import EmailService

def test_send_email_success():
    with patch('smtplib.SMTP') as mock_smtp:
        service = EmailService()
        result = service.send_email(
            to_email='test@example.com',
            subject='Test',
            html_content='<p>Test</p>'
        )
        assert result == True
        mock_smtp.return_value.__enter__.return_value.send_message.assert_called_once()

def test_send_pulse_alert():
    with patch.object(EmailService, 'send_email', return_value=True) as mock_send:
        service = EmailService()
        result = service.send_pulse_alert(
            guardian_email='guardian@example.com',
            guardian_name='John Doe',
            owner_name='Jane Doe',
            tier_name='Tier 1',
            portal_link='https://example.com/portal/abc123',
            missed_checkins=2
        )
        assert result == True
        assert mock_send.called

def test_email_template_rendering():
    from jinja2 import Environment, FileSystemLoader
    env = Environment(loader=FileSystemLoader('backend/templates/emails'))
    template = env.get_template('welcome.html')
    html = template.render(full_name='Test User')
    assert 'Test User' in html
    assert 'Welcome to Continuum' in html
```

---

## ROLLBACK

### If Issues Occur:

```bash
# Revert to file-based email
git checkout HEAD -- backend/services/email_service.py
git checkout HEAD -- backend/config.py
rm -rf backend/templates/emails/

# Remove email templates
git checkout HEAD -- backend/routers/pulse.py
```

---

## COMMIT MESSAGE

```
feat(email): implement SMTP email sending with compassionate templates

Replace mock email service (saves to files) with actual SMTP sending.

Issues Fixed:
- Email service saved HTML to outbox/ instead of sending
- Pulse escalation alerts never reached guardians
- Magic link emails never sent
- Welcome emails never sent
- No production email configuration

Implementation:

Backend Email Service:
- backend/services/email_service.py: Complete rewrite
  - SMTP sending via SendGrid, Gmail, or AWS SES
  - Configurable via environment variables
  - Jinja2 template rendering
  - HTML and plain text versions
  - Error handling and logging

Email Templates:
- backend/templates/emails/base.html: Base template with branding
- backend/templates/emails/pulse_alert.html: Guardian wellness alert
  - Compassionate urgent messaging
  - Clear action steps
  - Emphasizes trust and care
- backend/templates/emails/magic_link.html: Secure login link
- backend/templates/emails/welcome.html: New user welcome
  - Validates courage to plan
  - Explains value proposition
  - No rush, supportive tone
- backend/templates/emails/pulse_response.html: Guardian confirmation

Configuration:
- backend/config.py: Email settings
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
  - SMTP_FROM_EMAIL, SMTP_FROM_NAME
  - Support for multiple providers

Features:
- send_pulse_alert(): Notify guardians of missed check-ins
- send_magic_link(): Passwordless authentication
- send_welcome_email(): Onboard new users
- send_guardian_response_confirmation(): Confirm guardian action

Emotional Tone:
- All templates written with compassion and empathy
- Acknowledges difficulty of death planning
- Supportive language throughout
- Clear action steps without being cold
- Respectful of user's emotional state

Security:
- TLS/SSL encryption
- Credentials via environment variables
- Magic links expire in 15 minutes
- No sensitive data in email bodies

Testing:
- Unit tests for email sending
- Template rendering tests
- SMTP connection validation
- Manual testing with real email providers

Impact:
- CRITICAL: Pulse safety system now functional
- Guardians actually receive alerts
- Magic link authentication works
- Professional onboarding experience
- Production-ready email system

Future Enhancements:
- Email delivery tracking
- Bounce handling
- Unsubscribe management
- Email analytics
- A/B testing templates

Closes: Email sending functionality
Ref: CODEBASE_REVIEW_REPORT.md issue #5
```

---

## NOTES

- This is CRITICAL for Pulse safety system to work
- Test with real email provider before production deploy
- SendGrid recommended for reliability and deliverability
- Consider:
  - Email rate limiting (prevent spam)
  - Bounce handling (invalid addresses)
  - Unsubscribe links (legal requirement)
  - Email analytics (open rates, click rates)
  - Retry logic for failed sends
  - Queue system for high volume

### Email Provider Setup:

**SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Gmail:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Not regular password!
```

**AWS SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

### Legal Requirements:
- Add unsubscribe link to all marketing emails
- Include physical address in footer
- CAN-SPAM compliance for US
- GDPR compliance for EU users
- Keep email logs for audit trail

---

**READY TO EXECUTE**

Claude: Read this specification and execute after configuration management is implemented.
