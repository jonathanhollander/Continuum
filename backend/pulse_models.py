from typing import Optional
from datetime import datetime
from backend.utils.clock import utc_now
from sqlalchemy import Index
from sqlmodel import Field, SQLModel

class PulseSettings(SQLModel, table=True):
    __tablename__ = "pulse_settings"
    user_id: int = Field(primary_key=True, foreign_key="users.id")
    enabled: bool = Field(default=False)
    frequency_days: int = Field(default=2)
    grace_period_hours: int = Field(default=24)
    custom_message: Optional[str] = Field(default=None)
    elderly_mode: bool = Field(default=False)
    notify_contacts_on_checkin: bool = Field(default=False)
    send_weekly_summary: bool = Field(default=False)
    checkin_token: Optional[str] = Field(default=None) # Permanent magic link token
    
    # New Compelling Features
    ghost_mode_until: Optional[datetime] = Field(default=None)
    pet_protocol_enabled: bool = Field(default=False)
    pet_details: Optional[str] = Field(default=None)
    safety_timer_active_until: Optional[datetime] = Field(default=None)
    
    # Ecosystem Integration
    legacy_heartbeat_enabled: bool = Field(default=False)
    medical_safe_pass_enabled: bool = Field(default=True)
    
    # Privacy & Fallback
    location_vault_enabled: bool = Field(default=False)
    last_known_location_lat: Optional[float] = Field(default=None)
    last_known_location_lon: Optional[float] = Field(default=None)
    last_known_location_time: Optional[datetime] = Field(default=None)

    # Biometric Integrations
    biometric_extension_enabled: bool = Field(default=False)
    biometric_extension_hours: int = Field(default=24) # Default 24h extension

    model_config = {
        "json_schema_extra": {
            "example": {
                "enabled": True,
                "frequency_days": 2,
                "grace_period_hours": 24,
                "custom_message": "Thinking of you. Please check in when you can.",
                "pet_protocol_enabled": True
            }
        }
    }

class PulseVault(SQLModel, table=True):
    __tablename__ = "pulse_vault"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    name: str 
    encrypted_content: bytes  # Not actually encrypted: plain UTF-8 text (encryption is out of scope)
    unlock_condition: str # "tier_4_escalation"

class PulseCheckin(SQLModel, table=True):
    __tablename__ = "pulse_checkins"
    # Status, portal and the scheduler read "this user's latest check-in" (migration e2a7c9d4b1f3)
    __table_args__ = (Index("ix_pulse_checkins_user_id_timestamp", "user_id", "timestamp"),)
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    timestamp: datetime = Field(default_factory=utc_now)
    method: str # "manual", "biometric", "email_link"
    
    # Rich Logging
    note: Optional[str] = Field(default=None)
    audio_url: Optional[str] = Field(default=None)
    wellness_rating: Optional[int] = Field(default=None)

class PulseEscalationLog(SQLModel, table=True):
    __tablename__ = "pulse_escalation_log"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    tier_number: int
    triggered_at: datetime = Field(default_factory=utc_now)
    medical_safe_pass_triggered: bool = Field(default=False)
class PulseEscalationTier(SQLModel, table=True):
    __tablename__ = "pulse_escalation_tiers"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    tier_number: int # 1, 2, 3, 4
    delay_hours: int = Field(default=6)
    notification_method: str = Field(default="email") # 'email', 'sms', 'both'

class PulseContact(SQLModel, table=True):
    __tablename__ = "pulse_contacts"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Global Contact Fields
    name: str
    role: str = Field(default="Family") # Family, Friend, Medical, Legal, Other
    relation: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    avatar: Optional[str] = Field(default=None)

    # Estate Networking Flags
    is_executor: bool = Field(default=False)
    is_beneficiary: bool = Field(default=False)
    is_emergency_contact: bool = Field(default=False)

    # Custom fields support
    custom_attributes: Optional[str] = Field(default="{}")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Sarah Connor",
                "role": "Family",
                "relation": "Sister",
                "email": "sarah@example.com",
                "is_executor": True
            }
        }
    }

    # Pulse Specific (Optional - only if they are a Guardian)
    tier_id: Optional[int] = Field(default=None, foreign_key="pulse_escalation_tiers.id")
    priority: int = Field(default=1)
    portal_token: Optional[str] = Field(default=None, index=True)
    portal_token_expires: Optional[datetime] = Field(default=None)
    can_view_history: bool = Field(default=True)
    
    # Per-Contact Fidelity Updates
    individual_delay_hours: Optional[int] = Field(default=None) # Overrides Tier delay
    notify_on_safety_timer: bool = Field(default=True) # If this contact is part of the "Safety Timer" reach-out

    # Contacts-page call list (who to tell, in what order, and how far along). Separate from
    # tier_id: tier_id enrolls the contact in Pulse escalation alerts (pulse_logic).
    call_tier: Optional[str] = Field(default=None) # "1_Immediate", "2_SameDay", "3_Service", "4_DNR"
    notification_status: Optional[str] = Field(default=None) # "Pending", "Called", "LeftMsg", "Notified", "Unreachable"

    # Recipient start page (card D2): the owner marks this person as a recipient, may leave them a
    # note, and issues one link. recipient_token is the link's secret (32 random bytes); clearing it
    # closes the link. These are owner-only: the contacts API never accepts them from the client.
    is_recipient: bool = Field(default=False)
    recipient_note: Optional[str] = Field(default=None)
    recipient_token: Optional[str] = Field(default=None, index=True)
    recipient_token_created_at: Optional[datetime] = Field(default=None)

class PulseSafetyTimer(SQLModel, table=True):
    __tablename__ = "pulse_safety_timers"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    started_at: datetime = Field(default_factory=utc_now)
    expires_at: datetime
    purpose: Optional[str] = Field(default="Walking home") # e.g. "Walking home", "Home alone"
    is_active: bool = Field(default=True)

class PulseMessage(SQLModel, table=True):
    __tablename__ = "pulse_messages"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    contact_id: int = Field(foreign_key="pulse_contacts.id", index=True)
    direction: str # 'user_to_contact' or 'contact_to_user'
    message: str
    sent_at: datetime = Field(default_factory=utc_now)
    read_at: Optional[datetime] = Field(default=None)

class PulseCredential(SQLModel, table=True):
    __tablename__ = "pulse_credentials"
    id: Optional[str] = Field(default=None, primary_key=True)  # Credential ID (base64url)
    user_id: int = Field(foreign_key="users.id")
    public_key: str  # COSE Key (base64url)
    sign_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=utc_now)
    transports: Optional[str] = Field(default=None)  # JSON list: ["internal"], ["hybrid"], etc.
    aaguid: Optional[str] = Field(default=None)  # Authenticator type identifier (Google, Apple, etc.)
    # Known AAGUIDs:
    # - Apple iCloud Keychain: fbfc3007-154e-4ecc-8c0b-6e020557d7bd
    # - Google Password Manager: ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4
    # - Chrome on Mac: adce0002-35bc-c60a-648b-0b25f1f05503
