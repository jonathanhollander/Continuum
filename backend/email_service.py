import os
from datetime import datetime
from jinja2 import Template

OUTBOX_DIR = "backend/outbox"

class LocalEmailService:
    def __init__(self):
        if not os.path.exists(OUTBOX_DIR):
            os.makedirs(OUTBOX_DIR)
            
        # Basic HTML Template
        self.template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: sans-serif; background: #f0fdfa; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .header { background: #0f172a; padding: 20px; text-align: center; }
                .header h1 { color: #14b8a6; margin: 0; font-family: serif; }
                .content { padding: 30px; color: #334155; line-height: 1.6; }
                .btn { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
                .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Continuum Pulse</h1>
                </div>
                <div class="content">
                    <h2>{{ subject }}</h2>
                    <p>Dear {{ recipient_name }},</p>
                    <p>{{ body_text }}</p>
                    
                    {% if action_url %}
                    <div style="text-align: center;">
                        <a href="{{ action_url }}" class="btn">{{ action_label }}</a>
                    </div>
                    {% endif %}
                </div>
                <div class="footer">
                    This is an automated message from the Digital Guardian system regarding User {{ user_id }}.
                </div>
            </div>
        </body>
        </html>
        """

    def send_email(self, to_email: str, recipient_name: str, subject: str, body: str, user_id: int, action_url: str = None, action_label: str = "View Status"):
        """
        Generates an HTML email and saves it to the outbox directory for inspection.
        """
        t = Template(self.template)
        html_content = t.render(
            subject=subject,
            recipient_name=recipient_name,
            body_text=body,
            user_id=user_id,
            action_url=action_url,
            action_label=action_label
        )
        
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        safe_subject = subject.replace(" ", "_").lower()[:30]
        filename = f"{timestamp}_{safe_subject}_{to_email}.html"
        filepath = os.path.join(OUTBOX_DIR, filename)
        
        with open(filepath, "w") as f:
            f.write(html_content)
            
        print(f"📧 [EMAIL_SENT] Saved to {filepath}")
        return filepath

# Singleton instance
email_service = LocalEmailService()
