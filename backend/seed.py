from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Ensure tables exist
create_db_and_tables()

with Session(engine) as session:
    # Check for existing user by email instead of hardcoded ID
    statement = select(User).where(User.email == "test@continuum.estate")
    user = session.exec(statement).first()
    
    if not user:
        logger.info("Creating Test User...")
        user = User(
            email="test@continuum.estate", 
            external_id="user-test", 
            public_key="mock-key"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        logger.info(f"User created with ID: {user.id}")
    else:
        logger.info(f"Test user already exists (ID: {user.id}).")
