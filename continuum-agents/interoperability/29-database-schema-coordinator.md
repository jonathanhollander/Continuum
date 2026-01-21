# Agent 29: Database Schema Coordinator
**Priority:** P1 - HIGH
**Estimated Time:** 1 day
**Dependencies:** 11-database-migration-system
**Category:** Interoperability

---

## OBJECTIVE

Ensure database schema changes are coordinated between SQLModel, Alembic migrations, and frontend types.

---

## IMPLEMENTATION

### Workflow:

1. Update SQLModel model
2. Generate Alembic migration
3. Generate TypeScript types
4. Update frontend code
5. Test migration

### Migration Checklist:

```bash
# 1. Update model
vim backend/models/user.py

# 2. Generate migration
alembic revision --autogenerate -m "Add new field"

# 3. Review migration
vim alembic/versions/xxx_add_new_field.py

# 4. Test migration
alembic upgrade head
alembic downgrade -1
alembic upgrade head

# 5. Generate TypeScript types
python scripts/generate-types.py

# 6. Test frontend
cd frontend && npm run check
```

---

## SUCCESS CRITERIA

- [ ] Schema change workflow documented
- [ ] Migration testing automated
- [ ] Type generation integrated
- [ ] Coordination checklist created

---

## COMMIT MESSAGE

```
feat(schema): coordinate database schema changes

Ensure schema changes propagate correctly across stack.

Implementation:
- Schema change workflow
- Migration testing
- Type generation integration
- Coordination checklist

Impact:
- Safe schema evolution
- Frontend/backend sync
- No schema mismatches

Closes: Schema coordination
```

---

**READY TO EXECUTE**
