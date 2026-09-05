# Task List - Report #001
**Total Tasks**: 5 | **Categories**: Bug Fix (2), Testing (2), Documentation (1)

---

## TASK 1: Fix Router Registration Order in main.py

**Description**: Move the documents.router registration to occur BEFORE estate_data.router in main.py. FastAPI matches routes in registration order, so specific routes must be registered before generic catch-all routes.

**Files**:
- `/Users/jonathanhollander/AI Code/Notion Template/Continuum_SaaS/backend/main.py`

**Changes**:
```python
# Current order (line 117, 125):
app.include_router(estate_data.router)
...
app.include_router(documents.router)

# Required order:
app.include_router(documents.router)  # MOVE BEFORE estate_data
...
app.include_router(estate_data.router)  # Generic routes LAST
```

**Testing**:
1. Start backend server: `cd backend && python main.py`
2. Obtain auth token: `curl -X POST http://localhost:8000/api/auth/token -d "username=jh@continuum.estate&password=any"`
3. Test GET: `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/data/vault_documents`
4. Expected: `[]` (empty array) or list of documents, NOT "Invalid type" error
5. Test POST: Create a document and verify it persists

**Effort**: 15 minutes
**Category**: Bug Fix

---

## TASK 2: Audit Other Specific Routers for Similar Issues

**Description**: Check if any other routers with specific paths under `/api/data/*` are also registered after `estate_data.router` and could have the same routing conflict.

**Files**:
- `/Users/jonathanhollander/AI Code/Notion Template/Continuum_SaaS/backend/main.py`
- All files in `/Users/jonathanhollander/AI Code/Notion Template/Continuum_SaaS/backend/routers/`

**Changes**:
- Review each router's prefix
- If prefix starts with `/api/data/`, ensure it's registered before `estate_data.router`
- Document any routers that need reordering

**Testing**:
- For each affected endpoint, verify it responds correctly
- Test both GET and POST operations

**Effort**: 30 minutes
**Category**: Bug Fix

---

## TASK 3: Verify Document CRUD Operations End-to-End

**Description**: After fixing the router order, perform end-to-end testing of all document operations through the UI.

**Files**:
- Browser testing at `http://localhost:5173/modules/legal-documents`

**Changes**: None (testing only)

**Testing**:
1. Navigate to Document Vault page
2. Click "Add a document" button
3. Fill in document details (name, type, location)
4. Save the document
5. Verify it appears in the list
6. Edit the document
7. Verify changes persist after page refresh
8. Delete the document
9. Verify it's removed

**Effort**: 20 minutes
**Category**: Testing

---

## TASK 4: Verify Data Migration from localStorage

**Description**: The SyncManager has migration logic that uploads local documents to the server when the server has none. Verify this works correctly after the fix.

**Files**:
- Browser testing with localStorage inspection

**Changes**: None (testing only)

**Testing**:
1. Clear server documents (or use fresh user)
2. Add documents to localStorage manually or via previous broken state
3. Refresh page
4. Verify SyncManager detects local-only items
5. Verify items are migrated to server
6. Verify localStorage is updated with server IDs

**Effort**: 15 minutes
**Category**: Testing

---

## TASK 5: Add Comment Explaining Router Registration Order

**Description**: Add a code comment in main.py explaining why router order matters, to prevent future regressions.

**Files**:
- `/Users/jonathanhollander/AI Code/Notion Template/Continuum_SaaS/backend/main.py`

**Changes**:
```python
# === ROUTER REGISTRATION ORDER IS CRITICAL ===
# FastAPI matches routes in registration order.
# Specific routes (e.g., /api/data/vault_documents) MUST be registered
# BEFORE generic routes (e.g., /api/data/{data_type}) to avoid conflicts.
#
# Correct order:
# 1. Routers with specific paths (documents.router, contacts.router, etc.)
# 2. Routers with parameterized paths (estate_data.router)
app.include_router(documents.router)
# ... other specific routers ...
app.include_router(estate_data.router)  # MUST BE LAST for /api/data routes
```

**Testing**:
- Code review to ensure comment is accurate
- Verify server still starts without errors

**Effort**: 5 minutes
**Category**: Documentation

---

## Task Categories Summary
- **Bug Fixes**: 2 tasks (Task 1, Task 2)
- **Testing**: 2 tasks (Task 3, Task 4)
- **Documentation**: 1 task (Task 5)

## Dependencies & Risks

### Dependencies
- Task 1 must be completed before Tasks 3 and 4 (testing depends on fix)
- Task 2 can run in parallel with Task 1
- Task 5 can run after Task 1

### Technical Risks
- **Low Risk**: Moving router registration is a safe change
- **Rollback**: Simple - just revert the line order in main.py

### Notes
- The fix is straightforward but the impact is significant (critical user functionality)
- Consider adding integration tests to catch router conflicts in CI/CD (future enhancement)
