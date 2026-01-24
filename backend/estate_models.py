from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

# --- CUSTOM FIELDS SCHEMA ---
class UserCustomFieldDefinition(SQLModel, table=True):
    """Defines a custom field available for a specific entity type."""
    __tablename__ = "user_custom_field_definitions"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    entity_type: str = Field(index=True) # e.g. "asset", "music", "pet"
    name: str 
    field_type: str = "text" # text, date, number, boolean, select
    options: Optional[str] = None # JSON string for select options
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- ASSETS & FINANCE ---
class Asset(SQLModel, table=True):
    """Generic model for physical, digital, or financial assets."""
    __tablename__ = "assets"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str = Field(index=True)
    type: str = Field(default="other", index=True) # real_estate, vehicle, financial, digital, physical
    status: Optional[str] = Field(default="active", index=True) # Added for compatibility
    ownershipDetails: Optional[str] = None # Added for compatibility
    documents: Optional[str] = None # Added for compatibility
    notes: Optional[str] = None
    
    # Property Specific
    custom_attributes: Optional[str] = Field(default="{}")
    valuation: Optional[float] = None
    location: Optional[str] = None
    purchaseDate: Optional[datetime] = None
    maintenanceSchedule: Optional[str] = None # JSON string
    thumbnail: Optional[str] = None

    beneficiary_id: Optional[int] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Main Residence",
                "type": "real_estate",
                "valuation": 450000.0,
                "status": "active",
                "notes": "Title deed is in the blue safe."
            }
        }
    }
    
    # Heirloom & Digital Asset compatibility
    recipient: Optional[str] = None
    story: Optional[str] = None
    platform: Optional[str] = None
    username: Optional[str] = None
    instructions: Optional[str] = None
    priority: Optional[str] = None
    image: Optional[str] = None
    is_closed: bool = Field(default=False)
    closure_date: Optional[str] = None

# --- HEIRLOOMS ---
class Heirloom(SQLModel, table=True):
    """Model for physical heirlooms with sentimental or financial value."""
    __tablename__ = "heirlooms"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str = Field(index=True)
    recipient: Optional[str] = Field(default=None, index=True)
    story: Optional[str] = None
    image: Optional[str] = None
    value: Optional[str] = None # Keeping as string to match legacy frontend 'valuation' mix-up, or maybe float? Plan said value (optional).
    location: Optional[str] = None
    custom_attributes: Optional[str] = Field(default="{}")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FinancialAccount(SQLModel, table=True):
    """Model for bank accounts, investments, or credit lines."""
    __tablename__ = "financial_accounts"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    institution: Optional[str] = None  # Made optional for frontend compatibility
    account_type: Optional[str] = None  # Made optional, frontend sends 'type'
    account_number_encrypted: Optional[str] = None # We might want to encrypt this
    holder_name: Optional[str] = None
    balance_estimate: Optional[float] = None
    custom_attributes: Optional[str] = Field(default="{}")
    # Frontend compatibility fields (AssetManager sends these)
    name: Optional[str] = None  # Frontend sends this instead of institution
    type: Optional[str] = None  # Frontend sends this instead of account_type
    value: Optional[float] = None  # Frontend sends this instead of balance_estimate
    location: Optional[str] = None
    accountNumber: Optional[str] = None
    ownershipPercentage: Optional[float] = None
    beneficiaries: Optional[str] = None
    notes: Optional[str] = None
    loginUrl: Optional[str] = None
    beneficiaryEmail: Optional[str] = None
    image: Optional[str] = None
    is_closed: bool = Field(default=False)
    closure_date: Optional[str] = None
    valueHistory: Optional[str] = None  # JSON string of array
    closureNotes: Optional[str] = None
    customAttributes: Optional[str] = None  # Alias for custom_attributes (camelCase)

# --- HOME MANUAL ---
class Vendor(SQLModel, table=True):
    """Model for service providers and trusted vendors (e.g., plumber, lawyer)."""
    __tablename__ = "vendors"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str
    category: str # plumber, electrician, etc
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None

class HomeAccess(SQLModel, table=True):
    """Model for location-based access codes (e.g., wifi, front door, safe)."""
    __tablename__ = "home_access"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    location: str # Front Door, Wifi, Safe
    code_encrypted: str # "1234" (should ideally be encrypted)
    instructions: Optional[str] = None

class Utility(SQLModel, table=True):
    """Model for utility service providers (e.g., water, gas, electricity)."""
    __tablename__ = "utilities"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    provider: str
    service_type: str # water, electric, gas
    location: Optional[str] = None # Added for frontend compatibility
    account_number: Optional[str] = None
    support_phone: Optional[str] = None

# --- LEGAL & DOCUMENTS ---
class Document(SQLModel, table=True):
    """Model for important digitized or physical documents (e.g., wills, deeds)."""
    __tablename__ = "documents"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str
    name: Optional[str] = None # Added for compatibility
    category: str # will, trust, deed, insurance
    file_path: Optional[str] = None # Path to file on disk/blob
    location_physical: Optional[str] = None # "Blue binder in study"
    is_digitized: bool = False
    status: Optional[str] = "verified" # Added for compatibility
    location: Optional[str] = None # Added for compatibility
    notes: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Last Will and Testament",
                "category": "legal",
                "location_physical": "Safe deposit box at First National Bank",
                "is_digitized": True
            }
        }
    }

# --- LEGACY & WISDOM ---
class Letter(SQLModel, table=True):
    """Model for legacy letters intended for specific recipients after a trigger event."""
    __tablename__ = "letters"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    recipient_name: Optional[str] = None # Or link to Contact
    title: str
    content: str # content or encrypted content
    release_condition: str = "death" # death, specific_date
    status: str = "draft" # draft, final
    # Frontend-compatible fields for SyncManager
    date: Optional[str] = None  # Date letter was created
    type: Optional[str] = "transactional"  # "emotional" or "transactional"
    triggerDate: Optional[str] = None  # Specific date for release
    triggerMilestone: Optional[str] = None  # Milestone trigger (grad, wedding, etc.)
    isLocked: Optional[bool] = False  # Whether letter is locked until trigger
    custom_attributes: Optional[str] = Field(default="{}")

class JournalEntry(SQLModel, table=True):
    """Model for personal reflections, life lessons, or journal entries."""
    __tablename__ = "journal_entries"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    type: str = "reflection" # reflection, life_lesson, ethical_will
    title: Optional[str] = None
    content: str
    tags: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- LOGISTICS ---
class Subscription(SQLModel, table=True):
    """Model for recurring digital or physical subscriptions."""
    __tablename__ = "subscriptions"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str
    cost: Optional[float] = None
    frequency: str = "monthly"
    cycle: Optional[str] = "monthly" # Added for compatibility
    difficulty: Optional[str] = None # Added for compatibility
    paymentMethod: Optional[str] = None # Added for compatibility
    renewal_date: Optional[datetime] = None
    auto_renew: bool = True
    custom_attributes: Optional[str] = Field(default="{}")
    # Frontend compatibility fields
    cancellationInstructions: Optional[str] = None
    nextBilling: Optional[str] = None
    loginUrl: Optional[str] = None
    notes: Optional[str] = None

class CalendarEvent(SQLModel, table=True):
    """Model for important dates, birthdays, or recurring maintenance rituals."""
    __tablename__ = "calendar_events"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str
    date: str # "YYYY-MM-DD" or "MM-DD"
    type: str = "event" # birthday, tax, maintenance, ritual
    description: Optional[str] = None
    ritual_instructions: Optional[str] = None
    recurring: bool = False
    custom_attributes: Optional[str] = Field(default="{}")
    tags: Optional[str] = None

# --- INSURANCE ---
class InsurancePolicy(SQLModel, table=True):
    """Model for insurance coverage (e.g., life, health, auto)."""
    __tablename__ = "insurance_policies"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    policy_name: str
    insurance_type: str  # Life, Health, Auto, Home, Disability, Other
    insurer: str
    policy_number: Optional[str] = None
    premium_amount: Optional[float] = 0.0
    premium_frequency: Optional[str] = "Monthly" # Monthly, Quarterly, Annually
    beneficiaries: Optional[str] = None
    agent_name: Optional[str] = None
    agent_contact: Optional[str] = None
    claims_procedure: Optional[str] = None
    custom_attributes: Optional[str] = Field(default="{}")
    policy_documents: Optional[str] = None
    status: str = "Active" # Active, Inactive, Pending
    expiration_date: Optional[datetime] = None
    notes: Optional[str] = None

# --- MEDICAL ---
class MedicalProfile(SQLModel, table=True):
    """Model for core medical information, allergies, and blood type."""
    __tablename__ = "medical_profiles"
    user_id: int = Field(primary_key=True, foreign_key="users.id")
    organ_donor: bool = Field(default=False)
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    custom_attributes: Optional[str] = Field(default="{}")

class MedicalDirective(SQLModel, table=True):
    """Model for legal medical instructions (e.g., living will, proxy)."""
    __tablename__ = "medical_directives"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    type: str # healthcare_proxy, living_will, dnr, palliative_care, other
    title: str
    location_of_original: Optional[str] = None
    primary_contact: Optional[str] = None
    contact_phone: Optional[str] = None
    summary: Optional[str] = None

# --- PETS ---
class Pet(SQLModel, table=True):
    """Model for ensuring the care and continuity of beloved animal companions."""
    __tablename__ = "pets"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str
    type: str # dog, cat, bird, other
    breed: Optional[str] = None
    guardian: Optional[str] = None
    vet_name: Optional[str] = None
    vet_phone: Optional[str] = None
    food_instructions: Optional[str] = None
    medical_needs: Optional[str] = None
    microchip_number: Optional[str] = None
    custom_attributes: Optional[str] = Field(default="{}")
    notes: Optional[str] = None

# --- FAMILY & MEMORIES ---
class FamilyMemory(SQLModel, table=True):
    """Model for preserving family stories, recipes, and quotes."""
    __tablename__ = "family_memories"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    type: str # photo, recipe, quote
    title: str
    date: Optional[str] = None
    image: Optional[str] = None
    desc: Optional[str] = None
    text: Optional[str] = None
    author: Optional[str] = None
    is_favorite: bool = Field(default=False)

class VisualMemory(SQLModel, table=True):
    """Model for media-based memories like photos and videos."""
    __tablename__ = "visual_memories"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    url: str 
    name: str
    date: Optional[str] = None
    type: str # photo, video
    tags: Optional[str] = None
    is_favorite: bool = Field(default=False)
    description: Optional[str] = None
    size: Optional[int] = None

class ExternalArchive(SQLModel, table=True):
    """Model for links to external cloud storage or physical archives."""
    __tablename__ = "external_archives"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    platform: str
    access_url: Optional[str] = None
    location_details: str
    icon: Optional[str] = None

# --- FAMILY NETWORK ---
class ContactRelationship(SQLModel, table=True):
    """Model for defining relationships between people in the circle of trust."""
    __tablename__ = "contact_relationships"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    source_id: str # Can be 'owner' or a Contact UUID/ID
    target_id: str
    type: str # parent_of, spouse_of, sibling_of, professional_to

# --- TIMELINE ---
class LifeEvent(SQLModel, table=True):
    """Model for items in the user's life timeline."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    year: int
    label: str
    description: Optional[str] = None
    date: Optional[str] = None
    type: str  # milestone, education, work, relationship, future, accomplishment
    category: Optional[str] = None
    reflection: Optional[str] = None
    is_highlight: bool = Field(default=False)
    impact: Optional[str] = None
    assigned_contact_id: Optional[str] = None
    custom_attributes: Optional[str] = Field(default="{}")

# --- TIME CAPSULE ---
class TimeCapsuleMessage(SQLModel, table=True):
    """Model for scheduled future messages or milestone-triggered recordings."""
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str
    recipient: str
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    media_id: Optional[str] = None
    content_preview: str
    trigger_type: str  # date, milestone
    trigger_value: str
    is_released: bool = Field(default=False)
    created_at: str
    custom_attributes: Optional[str] = Field(default="{}")

# --- FUNERAL ---
class FuneralData(SQLModel, table=True):
    """Model for funeral wishes and budget planning."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
    wishes: str = Field(default="{}") # JSON of FuneralWishes
    budget: str = Field(default="[]") # JSON of List[FuneralBudgetItem]
    custom_attributes: Optional[str] = Field(default="{}")

# --- ADVANCED ASSETS ---
class AdvancedAssetData(SQLModel, table=True):
    """Model for complex asset details like maintenance logs and claims."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
    transactions: str = Field(default="[]") # JSON of List[AssetTransaction]
    maintenance: str = Field(default="[]") # JSON of List[MaintenanceLog]
    claims: str = Field(default="[]") # JSON of List[InsuranceClaim]

