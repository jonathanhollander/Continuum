#!/usr/bin/env python3
"""
Test script for view_preferences endpoints
Run from project root: python3 -m backend.test_view_preferences
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from backend.database import engine, User
from backend.routers.auth import ViewPreferencesResponse, ViewPreferencesUpdate

def test_user_model():
    """Test that User model has view_preferences field"""
    print("Testing User model...")

    with Session(engine) as session:
        # Get first user or create test user
        user = session.exec(select(User)).first()

        if not user:
            print("No users found. Creating test user...")
            from backend.auth import get_password_hash
            user = User(
                email="test@example.com",
                external_id="test-user",
                hashed_password=get_password_hash("test123")
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"Created test user: {user.email}")

        print(f"Using user: {user.email}")

        # Test that view_preferences field exists and can be set
        print(f"Current view_preferences: {user.view_preferences}")

        # Test setting preferences
        user.view_preferences = {"contacts": "card", "assets": "table"}
        session.add(user)
        session.commit()
        session.refresh(user)

        print(f"Updated view_preferences: {user.view_preferences}")

        # Test reading preferences
        assert user.view_preferences is not None
        assert user.view_preferences.get("contacts") == "card"
        assert user.view_preferences.get("assets") == "table"

        print("✓ User model test passed!")
        return True

def test_pydantic_models():
    """Test that Pydantic models work correctly"""
    print("\nTesting Pydantic models...")

    # Test ViewPreferencesResponse
    response = ViewPreferencesResponse(
        view_preferences={"contacts": "card", "documents": "table"}
    )
    print(f"ViewPreferencesResponse: {response}")

    # Test ViewPreferencesUpdate
    update = ViewPreferencesUpdate(
        view_preferences={"contacts": "table"}
    )
    print(f"ViewPreferencesUpdate: {update}")

    print("✓ Pydantic models test passed!")
    return True

if __name__ == "__main__":
    print("=== Testing view_preferences implementation ===\n")

    try:
        success = True
        success = test_user_model() and success
        success = test_pydantic_models() and success

        if success:
            print("\n✓ All tests passed!")
            sys.exit(0)
        else:
            print("\n✗ Some tests failed")
            sys.exit(1)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
