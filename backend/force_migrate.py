from backend.database import migrate_db
print("Forcing DB Migration...")
migrate_db()
print("Done.")
