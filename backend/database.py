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

# Database Engine
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./continuum_saas.db")
engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    migrate_db()

def migrate_db():
    """Simple migration helper to add missing columns for SQLite/Postgres"""
    inspector = inspect(engine)
    with Session(engine) as session:
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
                    # SQLModel / SQLAlchemy 2.0 style text execution
                    session.execute(text(f"ALTER TABLE pulse_settings ADD COLUMN {col_name} {col_type}"))
                except Exception as e:
                    print(f"⚠️ Migration Error adding {col_name}: {e}")
        
        session.commit()

def get_session():
    with Session(engine) as session:
        yield session
