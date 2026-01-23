import os
from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, create_engine, Session, select
from backend.config import settings

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: Optional[str] = Field(default=None)  # Password hash for email/password login
    public_key: Optional[str] = Field(default=None)  # WebAuthn Public Key (optional)
    sign_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # User role for context-aware messaging (planning, executor, family, advisor)
    user_role: Optional[str] = Field(default="planning")  # planning | executor | family | advisor
    # Optional: User's emotional context (healthy, preparing, grieving)
    emotional_context: Optional[str] = Field(default=None)  # healthy | preparing | grieving
    # Overwhelm support preference
    overwhelm_muted: bool = Field(default=False)
    # Onboarding fields
    display_name: Optional[str] = Field(default=None)  # User's preferred name (owner's name)
    deceased_name: Optional[str] = Field(default=None)  # Name of person being honored (executor/family mode)
    onboarding_step: Optional[str] = Field(default=None)  # Current onboarding step
    onboarding_completed: bool = Field(default=False)  # Whether onboarding is complete
    language: Optional[str] = Field(default="en")  # Preferred language
    font_size: Optional[str] = Field(default="normal")  # Preferred font size (normal, large, xlarge)


class RefreshToken(SQLModel, table=True):
    """Refresh token for JWT token rotation - stored in DB for revocation support."""
    __tablename__ = "refresh_tokens"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(unique=True, index=True)  # SHA-256 hash of token
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    revoked: bool = Field(default=False)
    # Optional: track device/session info
    device_info: Optional[str] = Field(default=None)


class Estate(SQLModel, table=True):
    __tablename__ = "estates"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    
    # Transparent data (Accessibly to server/AI)
    transparent_data: str = Field(default="{}") 
    
    # Secret Box (Encrypted on Client, Opaque to server)
    encrypted_vault: bytes = Field(default=b"") 
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)

from sqlalchemy import inspect, text
from backend.estate_models import (
    Asset, FinancialAccount, Vendor, HomeAccess, Utility,
    Document, Letter, JournalEntry, Subscription, CalendarEvent,
    InsurancePolicy, MedicalProfile, MedicalDirective, Pet, ContactRelationship
)
from backend.models.media import MediaFile
from backend.models.email_log import EmailLog

# Database Engine
DATABASE_URL = settings.DATABASE_URL
connect_args = settings.get_database_connect_args()

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DB_ECHO,
    pool_size=settings.DB_POOL_SIZE if "postgresql" in DATABASE_URL else 5,
    max_overflow=settings.DB_MAX_OVERFLOW if "postgresql" in DATABASE_URL else 10,
    pool_pre_ping=True,
    pool_recycle=3600,
)

import time
from sqlalchemy.exc import OperationalError

from backend.utils.logger import get_logger

logger = get_logger(__name__)

def create_db_and_tables():
    retries = 5
    for i in range(retries):
        try:
            logger.info(f"Attempting Database Connection ({i+1}/{retries})...")
            SQLModel.metadata.create_all(engine)
            migrate_db()
            logger.info("Database Connected & Initialized!")
            break
        except OperationalError as e:
            if i == retries - 1:
                logger.error(f"Database Connection Failed after {retries} attempts: {e}")
                raise e
            logger.warning(f"Connection Refused. Database might be sleeping. Retrying in 3s...")
            time.sleep(3)

def migrate_db():
    """Simple migration helper to add missing columns for SQLite/Postgres"""
    inspector = inspect(engine)
    with Session(engine) as session:
        # Add password field to users table
        try:
            user_columns = [c["name"] for c in inspector.get_columns("users")]
            if "hashed_password" not in user_columns:
                logger.info("Migrating: Adding hashed_password to users table")
                session.execute(text("ALTER TABLE users ADD COLUMN hashed_password TEXT"))
                session.commit()
            # Add user_role for context-aware messaging
            if "user_role" not in user_columns:
                logger.info("Migrating: Adding user_role to users table")
                session.execute(text("ALTER TABLE users ADD COLUMN user_role TEXT DEFAULT 'owner'"))
                session.commit()
            # Add emotional_context for grief-aware features
            if "emotional_context" not in user_columns:
                logger.info("Migrating: Adding emotional_context to users table")
                session.execute(text("ALTER TABLE users ADD COLUMN emotional_context TEXT"))
                session.commit()
            # Add overwhelm_muted for support preferences
            if "overwhelm_muted" not in user_columns:
                logger.info("Migrating: Adding overwhelm_muted to users table")
                session.execute(text("ALTER TABLE users ADD COLUMN overwhelm_muted BOOLEAN DEFAULT FALSE"))
                session.commit()
            # Add onboarding fields
            onboarding_cols = {
                "display_name": "TEXT",
                "deceased_name": "TEXT",
                "onboarding_step": "TEXT",
                "onboarding_completed": "BOOLEAN DEFAULT FALSE",
                "language": "TEXT DEFAULT 'en'",
                "font_size": "TEXT DEFAULT 'normal'"
            }
            for col_name, col_type in onboarding_cols.items():
                if col_name not in user_columns:
                    logger.info(f"Migrating: Adding {col_name} to users table")
                    try:
                        session.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                        session.commit()
                    except Exception as col_e:
                        logger.warning(f"Migration Error adding {col_name}: {col_e}")
                        session.rollback()
            # Make public_key nullable
            if "public_key" in user_columns:
                # Execute for PostgreSQL only
                if engine.dialect.name == "postgresql":
                    logger.info("Migrating: Making public_key nullable (PostgreSQL)")
                    session.execute(text("ALTER TABLE users ALTER COLUMN public_key DROP NOT NULL"))
                    session.commit()
        except Exception as e:
            logger.warning(f"Core user table migration info/failed: {e}")
            session.rollback()

        # Generic Migration for all models
        table_cols = {
            "assets": {
                "valuation": "FLOAT",
                "status": "TEXT",
                "ownershipDetails": "TEXT",
                "documents": "TEXT",
                "recipient": "TEXT",
                "story": "TEXT",
                "platform": "TEXT",
                "username": "TEXT",
                "instructions": "TEXT",
                "priority": "TEXT",
                "image": "TEXT",
                "is_closed": "BOOLEAN DEFAULT FALSE",
                "closure_date": "TEXT"
            },
            "subscriptions": {
                "cycle": "TEXT",
                "difficulty": "TEXT",
                "paymentMethod": "TEXT"
            },
            "documents": {
                "name": "TEXT",
                "status": "TEXT",
                "location": "TEXT"
            },
            "utilities": {
                "location": "TEXT"
            }
        }

        for table, cols in table_cols.items():
            try:
                # Ensure table exists
                inspector.get_columns(table)
                existing = [c["name"] for c in inspector.get_columns(table)]
                for col_name, col_type in cols.items():
                    if col_name not in existing:
                        logger.info(f"Migrating: Adding {col_name} to {table}")
                        try:
                            session.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"))
                            session.commit()
                            session.begin() # Start a new transaction for the next column
                        except Exception as e:
                            logger.warning(f"Migration Error adding {col_name} to {table}: {e}")
                            session.rollback()
                            session.begin()
            except Exception as e:
                logger.error(f"Migration critical failure on table {table}: {e}")
                session.rollback()
                session.begin()

        # Check pulse_settings columns
        columns = [c["name"] for c in inspector.get_columns("pulse_settings")]
        
        # New columns in v0.5.x
        new_cols = {
            "checkin_token": "TEXT",
            "ghost_mode_until": "DATETIME",
            "pet_protocol_enabled": "BOOLEAN DEFAULT FALSE",
            "pet_details": "TEXT",
            "safety_timer_active_until": "DATETIME",
            "legacy_heartbeat_enabled": "BOOLEAN DEFAULT FALSE",
            "medical_safe_pass_enabled": "BOOLEAN DEFAULT TRUE",
            "location_vault_enabled": "BOOLEAN DEFAULT FALSE",
            "last_known_location_lat": "FLOAT",
            "last_known_location_lon": "FLOAT",
            "last_known_location_time": "DATETIME",
            "biometric_extension_enabled": "BOOLEAN DEFAULT FALSE",
            "biometric_extension_hours": "INTEGER DEFAULT 24"
        }
        
        for col_name, col_type in new_cols.items():
            if col_name not in columns:
                logger.info(f"Migrating: Adding column {col_name} to pulse_settings")
                try:
                    session.execute(text(f"ALTER TABLE pulse_settings ADD COLUMN {col_name} {col_type}"))
                    session.commit()
                    session.begin()
                except Exception as e:
                    logger.warning(f"Migration Error adding {col_name}: {e}")
                    session.rollback()
                    session.begin()

        # Check pulse_contacts columns
        try:
             # Verify table exists first
            inspector.get_columns("pulse_contacts")
            contact_columns = [c["name"] for c in inspector.get_columns("pulse_contacts")]

            contact_new_cols = {
                "individual_delay_hours": "INTEGER",
                "notify_on_safety_timer": "BOOLEAN DEFAULT TRUE",
                "role": "TEXT DEFAULT 'Family'",
                "relation": "TEXT",
                "notes": "TEXT",
                "avatar": "TEXT",
                "is_executor": "BOOLEAN DEFAULT FALSE",
                "is_beneficiary": "BOOLEAN DEFAULT FALSE",
                "is_emergency_contact": "BOOLEAN DEFAULT FALSE"
            }

            for col_name, col_type in contact_new_cols.items():
                if col_name not in contact_columns:
                    logger.info(f"Migrating: Adding column {col_name} to pulse_contacts")
                    try:
                        session.execute(text(f"ALTER TABLE pulse_contacts ADD COLUMN {col_name} {col_type}"))
                        session.commit()
                        session.begin()
                    except Exception as e:
                        logger.warning(f"Migration Error adding {col_name}: {e}")
                        session.rollback()
                        session.begin()

            # Note: Making tier_id nullable is harder in SQLite (requires recreate).
            # ideally we would do: session.execute(text("ALTER TABLE pulse_contacts ALTER COLUMN tier_id DROP NOT NULL"))
            # For now in Dev, if we insert without tier_id it might fail if schema enforces it.
            # We will assume SQLite logic allows null if not stricter defined or we might need a workaround for dev.
            # (SQLModel by default doesn't enforce NOT NULL on DB level for Optional fields unless specified, so we might be safe for new rows)
        except Exception:
            pass # Table might not exist yet

        # Create email_logs table if it doesn't exist (new in email integration update)
        try:
            inspector.get_columns("email_logs")
            logger.info("email_logs table exists")
        except Exception:
            logger.info("Creating email_logs table...")
            # Table will be created by SQLModel.metadata.create_all() above

        session.commit()

def get_session():
    with Session(engine) as session:
        yield session
