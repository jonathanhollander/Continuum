# Continuum Agent: Fix Data Persistence
## Slash Command: /fix-data

Execute Agent 02: Data Persistence Unifier - Add backend for 11 modules with no persistence.

---

## What This Does

Executes the Data Persistence Unifier agent to fix the critical data loss issue.

**Priority:** P0-CRITICAL (DATA LOSS)

**The Problem:**
- 80% of app data only stored in browser localStorage
- 11 modules have NO backend persistence
- Data lost when browser cache cleared
- No cross-device sync
- No backups

**Modules Missing Backend:**
1. Family members
2. Insurance policies
3. Medical conditions
4. Pets
5. Funeral wishes
6. Digital accounts
7. Messages to loved ones
8. Beneficiaries
9. Trustees
10. Professional contacts
11. Financial accounts

**This agent:**
- Creates SQLModel models for all 11 modules
- Implements CRUD endpoints for each
- Updates frontend to call backend APIs
- Stores all data in Railway PostgreSQL
- Enables cross-device sync
- Makes data persistent and backed up

**Time Estimate:** 12-16 hours

---

## Dependencies

- Agent 05 (Configuration Management)
- Agent 01 (Authentication Architect)

---

## Execution

Read and execute the agent specification:
`/home/user/Continuum/continuum-agents/technical-infrastructure/02-data-persistence-unifier.md`

This agent will:
1. Read the specification file
2. Create 11 SQLModel models in `backend/models/`
3. Create CRUD routers for each module
4. Update frontend to use backend APIs
5. Test data persistence
6. Commit changes

---

## Important Notes

- **Railway PostgreSQL:** All tables created in existing Railway database
- This fixes the most critical data loss issue
- Consider migrating existing localStorage data
- All data will be backed up by Railway

---

**Execute this agent by running:**
```
Read and execute /home/user/Continuum/continuum-agents/technical-infrastructure/02-data-persistence-unifier.md
```
