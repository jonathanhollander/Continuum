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

# Database Engine
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./continuum_saas.db")
engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
