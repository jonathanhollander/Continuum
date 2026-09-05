
import sqlite3
import os

# Database path (root)
DB_PATH = "../continuum_saas.db"
# DB Path (backend) - fixing potential duplicate issue
DB_PATH_BACKEND = "continuum_saas.db"

def migrate_db(db_path):
    print(f"Migrating {db_path}...")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Create UserCustomFieldDefinition table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_custom_field_definitions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            entity_type VARCHAR NOT NULL,
            name VARCHAR NOT NULL,
            field_type VARCHAR DEFAULT 'text',
            options VARCHAR,
            "order" INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        """)
        print(" - Created user_custom_field_definitions table")
        
        # 2. Add custom_attributes column to core tables
        tables = [
            "assets", 
            "financial_accounts", 
            "calendar_events", 
            "insurance_policies", 
            "pets", 
            "medical_profiles"
        ]
        
        for table in tables:
            try:
                # Check if column exists first
                cursor.execute(f"PRAGMA table_info({table})")
                columns = [info[1] for info in cursor.fetchall()]
                
                if "custom_attributes" not in columns:
                    cursor.execute(f"ALTER TABLE {table} ADD COLUMN custom_attributes VARCHAR DEFAULT '{{}}'")
                    print(f" - Added custom_attributes to {table}")
                else:
                    print(f" - {table} already has custom_attributes")
            except Exception as e:
                print(f" - Error updating {table}: {e}")

        conn.commit()
        conn.close()
        print("Success.")
    except Exception as e:
        print(f"Migration failed for {db_path}: {e}")

if __name__ == "__main__":
    # Migrate both potential DB locations to be safe
    if os.path.exists(DB_PATH):
        migrate_db(DB_PATH)
    if os.path.exists(DB_PATH_BACKEND):
        migrate_db(DB_PATH_BACKEND)
