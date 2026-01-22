from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

# --- ASSETS & FINANCE ---
class Asset(SQLModel, table=True):
    __tablename__ = "assets"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    name: str
    type: str = "other" # real_estate, vehicle, financial, digital, physical
    valuation: Optional[float] = None # Added for compatibility
    status: Optional[str] = "active" # Added for compatibility
    ownershipDetails: Optional[str] = None # Added for compatibility
    documents: Optional[str] = None # Added for compatibility
    notes: Optional[str] = None
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
    __tablename__ = "heirlooms"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    name: str
    recipient: Optional[str] = None
    story: Optional[str] = None
    image: Optional[str] = None
    value: Optional[str] = None # Keeping as string to match legacy frontend 'valuation' mix-up, or maybe float? Plan said value (optional).
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FinancialAccount(SQLModel, table=True):
    __tablename__ = "financial_accounts"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    institution: str
    account_type: str # checking, savings, investment, credit
    account_number_encrypted: Optional[str] = None # We might want to encrypt this
    holder_name: Optional[str] = None
    balance_estimate: Optional[float] = None

# --- HOME MANUAL ---
class Vendor(SQLModel, table=True):
    __tablename__ = "vendors"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    name: str
    category: str # plumber, electrician, etc
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None

class HomeAccess(SQLModel, table=True):
    __tablename__ = "home_access"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    location: str # Front Door, Wifi, Safe
    code_encrypted: str # "1234" (should ideally be encrypted)
    instructions: Optional[str] = None

class Utility(SQLModel, table=True):
    __tablename__ = "utilities"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    provider: str
    service_type: str # water, electric, gas
    location: Optional[str] = None # Added for frontend compatibility
    account_number: Optional[str] = None
    support_phone: Optional[str] = None

# --- LEGAL & DOCUMENTS ---
class Document(SQLModel, table=True):
    __tablename__ = "documents"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
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
    __tablename__ = "letters"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    recipient_name: Optional[str] = None # Or link to Contact
    title: str
    content: str # content or encrypted content
    release_condition: str = "death" # death, specific_date
    status: str = "draft" # draft, final

class JournalEntry(SQLModel, table=True):
    __tablename__ = "journal_entries"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    type: str = "reflection" # reflection, life_lesson, ethical_will
    title: Optional[str] = None
    content: str
    tags: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- LOGISTICS ---
class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    name: str
    cost: Optional[float] = None
    frequency: str = "monthly"
    cycle: Optional[str] = "monthly" # Added for compatibility
    difficulty: Optional[str] = None # Added for compatibility
    paymentMethod: Optional[str] = None # Added for compatibility
    renewal_date: Optional[datetime] = None
    auto_renew: bool = True

class CalendarEvent(SQLModel, table=True):
    __tablename__ = "calendar_events"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    title: str
    date: str # "YYYY-MM-DD" or "MM-DD"
    type: str = "event" # birthday, tax, maintenance, ritual
    description: Optional[str] = None
    ritual_instructions: Optional[str] = None
    recurring: bool = False
    tags: Optional[str] = None

# --- INSURANCE ---
class InsurancePolicy(SQLModel, table=True):
    __tablename__ = "insurance_policies"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
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
    policy_documents: Optional[str] = None
    status: str = "Active" # Active, Inactive, Pending
    expiration_date: Optional[datetime] = None
    notes: Optional[str] = None

# --- MEDICAL ---
class MedicalProfile(SQLModel, table=True):
    __tablename__ = "medical_profiles"
    user_id: int = Field(primary_key=True, foreign_key="users.id")
    organ_donor: bool = Field(default=False)
    blood_type: Optional[str] = None
    allergies: Optional[str] = None

class MedicalDirective(SQLModel, table=True):
    __tablename__ = "medical_directives"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    type: str # healthcare_proxy, living_will, dnr, palliative_care, other
    title: str
    location_of_original: Optional[str] = None
    primary_contact: Optional[str] = None
    contact_phone: Optional[str] = None
    summary: Optional[str] = None

# --- PETS ---
class Pet(SQLModel, table=True):
    __tablename__ = "pets"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    name: str
    type: str # dog, cat, bird, other
    breed: Optional[str] = None
    guardian: Optional[str] = None
    vet_name: Optional[str] = None
    vet_phone: Optional[str] = None
    food_instructions: Optional[str] = None
    medical_needs: Optional[str] = None
    microchip_number: Optional[str] = None
    notes: Optional[str] = None

# --- FAMILY & MEMORIES ---
class FamilyMemory(SQLModel, table=True):
    __tablename__ = "family_memories"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    type: str # photo, recipe, quote
    title: str
    date: Optional[str] = None
    image: Optional[str] = None
    desc: Optional[str] = None
    text: Optional[str] = None
    author: Optional[str] = None
    is_favorite: bool = Field(default=False)

class VisualMemory(SQLModel, table=True):
    __tablename__ = "visual_memories"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    url: str 
    name: str
    date: Optional[str] = None
    type: str # photo, video
    tags: Optional[str] = None
    is_favorite: bool = Field(default=False)
    description: Optional[str] = None
    size: Optional[int] = None

class ExternalArchive(SQLModel, table=True):
    __tablename__ = "external_archives"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    platform: str
    access_url: Optional[str] = None
    location_details: str
    icon: Optional[str] = None

# --- FAMILY NETWORK ---
class ContactRelationship(SQLModel, table=True):
    __tablename__ = "contact_relationships"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    source_id: str # Can be 'owner' or a Contact UUID/ID
    target_id: str
    type: str # parent_of, spouse_of, sibling_of, professional_to

# --- TIMELINE ---
class LifeEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
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

# --- TIME CAPSULE ---
class TimeCapsuleMessage(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
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

# --- FUNERAL ---
class FuneralData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
    wishes: str = Field(default="{}") # JSON of FuneralWishes
    budget: str = Field(default="[]") # JSON of List[FuneralBudgetItem]

# --- ADVANCED ASSETS ---
class AdvancedAssetData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
    transactions: str = Field(default="[]") # JSON of List[AssetTransaction]
    maintenance: str = Field(default="[]") # JSON of List[MaintenanceLog]
    claims: str = Field(default="[]") # JSON of List[InsuranceClaim]

