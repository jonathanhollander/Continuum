# Database Migrations with Alembic

This project uses Alembic for database schema migrations. All models are defined using SQLModel, and Alembic automatically generates migrations from model changes.

## Overview

- **Migration Tool**: Alembic 1.18.1
- **Models**: SQLModel (combines SQLAlchemy + Pydantic)
- **Dev Database**: SQLite (`continuum.db`)
- **Production Database**: PostgreSQL (Railway)

## Initial Setup (Already Complete)

The migration system is already configured:
- ✅ Alembic initialized in `/backend/alembic/`
- ✅ All models imported in `alembic/env.py`
- ✅ Initial migration created and applied
- ✅ Database URL from `settings.DATABASE_URL`

## Common Migration Commands

All commands should be run from the `/backend` directory:

```bash
cd backend
```

### Check Current Migration Status

```bash
alembic current
```

Shows which migration is currently applied to the database.

### View Migration History

```bash
alembic history
```

Lists all migrations in chronological order.

### Create a New Migration

After modifying models in `database.py`, `estate_models.py`, or `pulse_models.py`:

```bash
alembic revision --autogenerate -m "description of changes"
```

**Important**: Always review the generated migration file before applying it!

**Note**: If the generated migration uses `sqlmodel.sql.sqltypes.AutoString()`, you'll need to add `import sqlmodel` at the top of the migration file.

### Apply Migrations

Apply all pending migrations:

```bash
alembic upgrade head
```

Apply migrations up to a specific revision:

```bash
alembic upgrade <revision_id>
```

### Rollback Migrations

Rollback one migration:

```bash
alembic downgrade -1
```

Rollback to a specific revision:

```bash
alembic downgrade <revision_id>
```

Rollback all migrations:

```bash
alembic downgrade base
```

## Development Workflow

### When Adding a New Model

1. **Define the model** in the appropriate file:
   - `/backend/database.py` - Core models (User, Estate)
   - `/backend/estate_models.py` - Estate planning models
   - `/backend/pulse_models.py` - Pulse system models
   - `/backend/models/` - Other specialized models

2. **Import the model** in `/backend/alembic/env.py` if it's in a new file

3. **Create the migration**:
   ```bash
   alembic revision --autogenerate -m "add new_model table"
   ```

4. **Review the generated migration** in `alembic/versions/`
   - Check that it imports sqlmodel if needed
   - Verify table structure matches your model
   - Ensure foreign keys are correct

5. **Apply the migration**:
   ```bash
   alembic upgrade head
   ```

### When Modifying an Existing Model

1. **Update the model** (add/remove/change fields)

2. **Create the migration**:
   ```bash
   alembic revision --autogenerate -m "add new_field to model_name"
   ```

3. **Review and apply**:
   ```bash
   # Review the generated migration file first!
   alembic upgrade head
   ```

### When Removing a Model

1. **Remove model imports** from `alembic/env.py`

2. **Create the migration**:
   ```bash
   alembic revision --autogenerate -m "remove old_model table"
   ```

3. **Review and apply** (be careful - this drops data!):
   ```bash
   alembic upgrade head
   ```

## Production Deployment

### Railway Deployment

1. **Ensure DATABASE_URL is set** in Railway environment variables

2. **Run migrations on deploy**:
   - Add to your Procfile or start script:
     ```
     release: alembic upgrade head
     ```
   - Or run manually after deployment:
     ```bash
     railway run alembic upgrade head
     ```

### Initial Production Setup

For a fresh production database:

```bash
# This will apply all migrations including the initial schema
alembic upgrade head
```

### Ongoing Production Updates

After deploying code with new migrations:

```bash
# Apply any pending migrations
alembic upgrade head
```

## Migration Files

### Location

All migration files are in:
```
/backend/alembic/versions/
```

### File Structure

Each migration file contains:
- `revision`: Unique ID for this migration
- `down_revision`: ID of the previous migration
- `upgrade()`: Changes to apply
- `downgrade()`: How to rollback the changes

### Initial Migration

The initial migration `539c7f1c89af_initial_schema_with_all_tables.py` creates all tables:
- email_logs
- users
- advancedassetdata
- assets
- calendar_events
- contact_relationships
- documents
- estates
- external_archives
- family_memories
- financial_accounts
- funeraldata
- home_access
- insurance_policies
- journal_entries
- letters
- lifeevent
- media_files
- medical_directives
- medical_profiles
- pets
- pulse_checkins
- pulse_contacts
- pulse_credentials
- pulse_escalation_log
- pulse_escalation_tiers
- pulse_messages
- pulse_safety_timers
- pulse_settings
- pulse_vault
- subscriptions
- timecapsulemessage
- utilities
- vendors
- visual_memories

## Configuration

### Database URLs

Configured in `/backend/config.py`:

**Development (SQLite)**:
```python
DATABASE_URL = "sqlite:///./continuum.db"
```

**Production (PostgreSQL)**:
```python
DATABASE_URL = "postgresql://user:pass@host:port/dbname"
```

The URL is automatically read from the `DATABASE_URL` environment variable.

### SSL Configuration

PostgreSQL connections in production use SSL. This is handled automatically by `settings.get_database_connect_args()` in `alembic/env.py`.

## Troubleshooting

### Import Errors

If you get `ImportError: cannot import name 'ModelName'`:
1. Check the model actually exists in the specified file
2. Verify the import in `alembic/env.py` matches the actual model name
3. Run `grep "^class ModelName" backend/*.py` to find the correct name

### sqlmodel Not Defined

If you get `NameError: name 'sqlmodel' is not defined`:
1. Open the generated migration file in `alembic/versions/`
2. Add `import sqlmodel` at the top after `import sqlalchemy as sa`

### Migration Conflicts

If you have multiple developers creating migrations:
1. Pull the latest migrations from git
2. Check `alembic history` to see the chain
3. If needed, create a merge migration:
   ```bash
   alembic merge -m "merge migration heads" <rev1> <rev2>
   ```

### Database Out of Sync

If your database schema doesn't match your models:
1. **Development**: Delete `continuum.db` and rerun `alembic upgrade head`
2. **Production**: Never delete the database! Create migrations to fix the schema.

## Best Practices

1. **Always review generated migrations** - Alembic may not catch everything correctly
2. **Test migrations locally first** before deploying to production
3. **Never edit applied migrations** - Create a new migration to fix issues
4. **Backup production database** before applying migrations
5. **Add `import sqlmodel`** to generated migration files if they use SQLModel types
6. **Use descriptive migration messages** - "add user_role column" not "update db"
7. **Keep migrations small** - One logical change per migration
8. **Test downgrades** - Make sure `downgrade()` works correctly

## Example: Adding a New Field

Let's say you want to add a `phone_number` field to the User model:

1. **Edit `/backend/database.py`**:
   ```python
   class User(SQLModel, table=True):
       __tablename__ = "users"
       id: Optional[int] = Field(default=None, primary_key=True)
       email: str = Field(unique=True, index=True)
       phone_number: Optional[str] = None  # NEW FIELD
       # ... rest of fields
   ```

2. **Generate migration**:
   ```bash
   cd backend
   alembic revision --autogenerate -m "add phone_number to users"
   ```

3. **Review the generated file** (something like `abc123_add_phone_number_to_users.py`):
   ```python
   def upgrade() -> None:
       op.add_column('users', sa.Column('phone_number', sa.String(), nullable=True))

   def downgrade() -> None:
       op.drop_column('users', 'phone_number')
   ```

4. **Apply the migration**:
   ```bash
   alembic upgrade head
   ```

5. **Verify it worked**:
   ```bash
   alembic current  # Should show your new migration
   ```

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
