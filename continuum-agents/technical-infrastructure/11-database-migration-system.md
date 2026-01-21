# Agent 11: Database Migration System
**Priority:** P1 - HIGH
**Estimated Time:** 1 day
**Dependencies:** 05-configuration-management
**Category:** Technical Infrastructure

---

## OBJECTIVE

Implement proper database migration system using Alembic for schema version control.

**Current Issues:**
- No database migrations
- Schema changes require manual SQL
- No way to track database version
- Can't rollback schema changes
- Production deployments risky

**Expected Outcome:**
- Alembic migration system setup
- Initial migration capturing current schema
- Migration commands documented
- Safe schema evolution process
- Version control for database

---

## FILES TO CREATE

1. `/backend/alembic.ini` - Alembic configuration
2. `/backend/alembic/env.py` - Alembic environment
3. `/backend/alembic/versions/001_initial_schema.py` - Initial migration
4. `/backend/migrations/README.md` - Migration guide

---

## IMPLEMENTATION

### Install Alembic:

```bash
cd backend
pip install alembic
pip freeze > requirements.txt
```

### Initialize Alembic:

```bash
alembic init alembic
```

### Configure Alembic:

**File:** `/backend/alembic/env.py`

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from backend.config import settings
from backend.models import *  # Import all models
from backend.database import Base

config = context.config

# Override sqlalchemy.url with our settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
```

### Create Initial Migration:

```bash
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

---

## USAGE

```bash
# Create new migration
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Check current version
alembic current
```

---

## SUCCESS CRITERIA

- [ ] Alembic installed and configured
- [ ] Initial migration created
- [ ] Can create new migrations
- [ ] Can apply and rollback migrations
- [ ] Documentation for migration workflow

---

## COMMIT MESSAGE

```
feat(db): implement Alembic database migration system

Add proper schema version control with Alembic.

Implementation:
- Alembic setup with configuration
- Initial migration capturing current schema
- Migration commands documented
- Safe schema evolution process

Impact:
- Safe database schema changes
- Version control for database
- Can rollback migrations
- Production deployments safer

Closes: Database migration system
```

---

**READY TO EXECUTE**
