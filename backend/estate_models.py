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
    date: datetime
    type: str = "event" # birthday, tax, maintenance
    recurrence: Optional[str] = None # yearly, monthly
