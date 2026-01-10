import os
import sqlite3
import datetime
from typing import Optional
from sqlalchemy import create_url, create_engine, Column, Integer, String, JSON, DateTime, LargeBinary, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    external_id = Column(String, unique=True, index=True) # WebAuthn credential ID or unique user ID
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Estate(Base):
    __tablename__ = "estates"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Transparent data (Accessibly to server/AI)
    transparent_data = Column(JSON) 
    
    # Secret Box (Encrypted on Client, Opaque to server)
    encrypted_vault = Column(LargeBinary) 
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

def setup_db(database_url: str):
    """Sets up the PostgreSQL (or local SQLite for dev) database schema."""
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)
    print(f"Database schema initialized at {database_url}")

if __name__ == "__main__":
    # For local dev, use SQLite if no POSTGRES_URL is provided
    # Railway will provide DATABASE_URL
    default_db = "sqlite:///./continuum_saas.db"
    db_url = os.getenv("DATABASE_URL", default_db)
    setup_db(db_url)
