from typing import Optional
from datetime import datetime
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

class PulseVault(SQLModel, table=True):
    __tablename__ = "pulse_vault"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    name: str 
    encrypted_content: bytes
    unlock_condition: str # "tier_4_escalation"

class PulseCheckin(SQLModel, table=True):
    __tablename__ = "pulse_checkins"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    method: str # "manual", "biometric", "email_link"
    
    # Rich Logging
    note: Optional[str] = Field(default=None)
    audio_url: Optional[str] = Field(default=None)
    wellness_rating: Optional[int] = Field(default=None)

class PulseEscalationLog(SQLModel, table=True):
    __tablename__ = "pulse_escalation_log"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    tier_number: int
    triggered_at: datetime = Field(default_factory=datetime.utcnow)
    medical_safe_pass_triggered: bool = Field(default=False)
class PulseEscalationTier(SQLModel, table=True):
    __tablename__ = "pulse_escalation_tiers"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    tier_number: int # 1, 2, 3, 4
    delay_hours: int = Field(default=6)
    notification_method: str = Field(default="email") # 'email', 'sms', 'both'

class PulseContact(SQLModel, table=True):
    __tablename__ = "pulse_contacts"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    
    # Global Contact Fields
    name: str
    role: str = Field(default="Family") # Family, Friend, Medical, Legal, Other
    relation: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    avatar: Optional[str] = Field(default=None)

    # Pulse Specific (Optional - only if they are a Guardian)
    tier_id: Optional[int] = Field(default=None, foreign_key="pulse_escalation_tiers.id")
    priority: int = Field(default=1)
    portal_token: Optional[str] = Field(default=None)
    portal_token_expires: Optional[datetime] = Field(default=None)
    can_view_history: bool = Field(default=True)
    
    # Per-Contact Fidelity Updates
    individual_delay_hours: Optional[int] = Field(default=None) # Overrides Tier delay
    notify_on_safety_timer: bool = Field(default=True) # If this contact is part of the "Safety Timer" reach-out

class PulseSafetyTimer(SQLModel, table=True):
    __tablename__ = "pulse_safety_timers"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    started_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    purpose: Optional[str] = Field(default="Walking home") # e.g. "Walking home", "Home alone"
    is_active: bool = Field(default=True)

class PulseMessage(SQLModel, table=True):
    __tablename__ = "pulse_messages"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    contact_id: int = Field(foreign_key="pulse_contacts.id")
    direction: str # 'user_to_contact' or 'contact_to_user'
    message: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = Field(default=None)

class PulseCredential(SQLModel, table=True):
    __tablename__ = "pulse_credentials"
    id: Optional[str] = Field(default=None, primary_key=True)  # Credential ID (base64url)
    user_id: int = Field(foreign_key="users.id")
    public_key: str  # COSE Key (base64url)
    sign_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    transports: Optional[str] = Field(default=None) # JSON list string
