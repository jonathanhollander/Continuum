#!/usr/bin/env python3
"""
Verify that view_preferences migration was successful
"""

import sqlite3

# Check the database schema directly
conn = sqlite3.connect('continuum_saas.db')
cursor = conn.cursor()

# Get table info
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()

print("Users table columns:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

# Check if view_preferences exists
has_view_prefs = any(col[1] == 'view_preferences' for col in columns)

if has_view_prefs:
    print("\n✓ view_preferences column exists in database!")

    # Try to insert and query
    cursor.execute("""
        INSERT INTO users (external_id, email, sign_count, created_at, user_role, overwhelm_muted, onboarding_completed, view_preferences)
        VALUES ('test-123', 'test@test.com', 0, datetime('now'), 'planning', 0, 0, '{"contacts": "card"}')
    """)
    conn.commit()

    cursor.execute("SELECT id, email, view_preferences FROM users WHERE email = 'test@test.com'")
    result = cursor.fetchone()

    if result:
        print(f"✓ Successfully inserted and retrieved user with view_preferences:")
        print(f"  ID: {result[0]}")
        print(f"  Email: {result[1]}")
        print(f"  view_preferences: {result[2]}")
    else:
        print("✗ Failed to retrieve inserted user")
else:
    print("\n✗ view_preferences column NOT found in database!")
    print("Please run: alembic upgrade head")

conn.close()
