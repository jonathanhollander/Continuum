import os
from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, create_engine, Session, select

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(unique=True, index=True) 
    email: str = Field(unique=True, index=True)
    public_key: str # WebAuthn Public Key
    sign_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
    Document, Letter, JournalEntry, Subscription, CalendarEvent
)

# Database Engine
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./continuum_saas.db")

# Force SSL for Postgres (Railway)
connect_args = {}
if "postgresql" in DATABASE_URL:
    connect_args["sslmode"] = "require"

engine = create_engine(DATABASE_URL, connect_args=connect_args)

engine = create_engine(DATABASE_URL, connect_args=connect_args)

import time
from sqlalchemy.exc import OperationalError

def create_db_and_tables():
    retries = 5
    for i in range(retries):
        try:
            print(f"🔄 Attempting Database Connection ({i+1}/{retries})...")
            SQLModel.metadata.create_all(engine)
            migrate_db()
            print("✅ Database Connected & Initialized!")
            break
        except OperationalError as e:
            if i == retries - 1:
                print(f"❌ Database Connection Failed after {retries} attempts: {e}")
                raise e
            print(f"⚠️ Connection Refused. Database might be sleeping. Retrying in 3s...")
            time.sleep(3)

def migrate_db():
    """Simple migration helper to add missing columns for SQLite/Postgres"""
    inspector = inspect(engine)
    with Session(engine) as session:
        # Generic Migration for all models
        table_cols = {
            "assets": {
                "valuation": "FLOAT",
                "status": "TEXT",
                "ownershipDetails": "TEXT",
                "documents": "TEXT"
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
                        print(f"🔧 Migrating: Adding {col_name} to {table}")
                        session.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"))
            except Exception as e:
                print(f"⚠️ Migration skipping {table}: {e}")

        # Check pulse_settings columns
        columns = [c["name"] for c in inspector.get_columns("pulse_settings")]
        
        # New columns in v0.5.x
        new_cols = {
            "checkin_token": "TEXT",
            "ghost_mode_until": "DATETIME",
            "pet_protocol_enabled": "BOOLEAN DEFAULT 0",
            "pet_details": "TEXT",
            "safety_timer_active_until": "DATETIME",
            "legacy_heartbeat_enabled": "BOOLEAN DEFAULT 0",
            "medical_safe_pass_enabled": "BOOLEAN DEFAULT 1",
            "location_vault_enabled": "BOOLEAN DEFAULT 0",
            "last_known_location_lat": "FLOAT",
            "last_known_location_lon": "FLOAT",
            "last_known_location_time": "DATETIME",
            "biometric_extension_enabled": "BOOLEAN DEFAULT 0",
            "biometric_extension_hours": "INTEGER DEFAULT 24"
        }
        
        for col_name, col_type in new_cols.items():
            if col_name not in columns:
                print(f"🔧 Migrating: Adding column {col_name} to pulse_settings")
                try:
                    session.execute(text(f"ALTER TABLE pulse_settings ADD COLUMN {col_name} {col_type}"))
                except Exception as e:
                    print(f"⚠️ Migration Error adding {col_name}: {e}")

        # Check pulse_contacts columns
        try:
             # Verify table exists first
            inspector.get_columns("pulse_contacts")
            contact_columns = [c["name"] for c in inspector.get_columns("pulse_contacts")]
            
            contact_new_cols = {
                "individual_delay_hours": "INTEGER",
                "notify_on_safety_timer": "BOOLEAN DEFAULT 1",
                "role": "TEXT DEFAULT 'Family'",
                "relation": "TEXT",
                "notes": "TEXT",
                "avatar": "TEXT"
            }
            
            for col_name, col_type in contact_new_cols.items():
                if col_name not in contact_columns:
                    print(f"🔧 Migrating: Adding column {col_name} to pulse_contacts")
                    try:
                        session.execute(text(f"ALTER TABLE pulse_contacts ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        print(f"⚠️ Migration Error adding {col_name}: {e}")
            
            # Note: Making tier_id nullable is harder in SQLite (requires recreate). 
            # ideally we would do: session.execute(text("ALTER TABLE pulse_contacts ALTER COLUMN tier_id DROP NOT NULL"))
            # For now in Dev, if we insert without tier_id it might fail if schema enforces it. 
            # We will assume SQLite logic allows null if not stricter defined or we might need a workaround for dev.
            # (SQLModel by default doesn't enforce NOT NULL on DB level for Optional fields unless specified, so we might be safe for new rows)
        except Exception:
            pass # Table might not exist yet
        
        session.commit()

def get_session():
    with Session(engine) as session:
        yield session
