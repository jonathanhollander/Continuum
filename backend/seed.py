from sqlmodel import Session
from backend.database import engine, User, create_db_and_tables

# Ensure tables exist
create_db_and_tables()

with Session(engine) as session:
    user = session.get(User, 1)
    if not user:
        print("🌱 Creating Test User 1...")
        user = User(
            id=1, 
            email="test@continuum.estate", 
            external_id="user-test", 
            public_key="mock-key"
        )
        session.add(user)
        session.commit()
    else:
        print("✅ User 1 already exists.")
