# Specialized Agent Recommendations for Continuum
**Purpose:** Agent blueprints to systematically fix identified issues
**Date:** 2026-01-21

---

## 🤖 RECOMMENDED AGENTS TO CREATE

Based on the comprehensive codebase review, here are specialized agents you should create in Claude Code to help fix this project:

---

## 1. **Authentication Architect Agent**
**Priority:** P0 - CRITICAL
**Estimated Impact:** Fixes 30+ files
**Complexity:** High

### Scope
Fix the broken authentication system and implement proper JWT-based auth.

### Specific Tasks
1. **Replace Hardcoded User IDs**
   - Search for all `USER_ID = 1` or `const USER_ID = 1` occurrences
   - Replace with proper auth store integration
   - Connect to `keyringStore` for current user

2. **Implement JWT Backend**
   - Add JWT token generation on login
   - Create middleware for token validation
   - Extract user_id from token instead of query params
   - Add refresh token logic

3. **Frontend Auth Integration**
   - Create auth service with token storage
   - Add request interceptor to inject JWT headers
   - Implement token refresh logic
   - Handle 401 responses with redirect to login

4. **Secure Endpoints**
   - Replace `user_id: int` query params with JWT dependency
   - Add `current_user: User = Depends(get_current_user)` to all endpoints
   - Validate user ownership on all data access

### Files to Modify
- `/frontend/src/lib/stores/keyringStore.ts` - Add JWT storage
- `/backend/main.py` - Add JWT middleware
- `/backend/security.py` - Add JWT utils
- All `/frontend/src/routes/modules/**/*.svelte` files (30+)

### Success Criteria
- [ ] No hardcoded user IDs in codebase
- [ ] All API calls include Authorization header
- [ ] Backend validates JWT on every request
- [ ] Multi-user support works (can test with 2 accounts)

---

## 2. **Data Persistence Unifier Agent**
**Priority:** P0 - CRITICAL
**Estimated Impact:** Fixes 11 modules
**Complexity:** High

### Scope
Standardize data persistence across all modules and create backend endpoints for missing data.

### Specific Tasks
1. **Create Missing Backend Models**
   - Family members model
   - Insurance policies model
   - Medical directives model
   - Pets model
   - Funeral plans model
   - Time capsules model
   - Visual memories metadata model

2. **Add Backend CRUD Endpoints**
   - Extend `/api/data/{type}` pattern to support new models
   - Add to `MODEL_MAP` in `estate_data.py`
   - Create migration scripts

3. **Refactor Frontend Stores**
   - Convert all `createProfileStore` modules to use SyncManager
   - Remove localStorage-only persistence
   - Add proper backend sync

4. **Implement SyncManager.update()**
   - Add missing `update()` method in `sync.svelte.ts`
   - Add `PUT` endpoint support
   - Test with all modules using it

### Files to Create
- `/backend/family_models.py` - Family member schemas
- `/backend/insurance_models.py` - Insurance schemas
- `/backend/medical_models.py` - Medical schemas
- `/backend/pet_models.py` - Pet schemas

### Files to Modify
- `/backend/estate_data.py` - Add new models to MODEL_MAP
- `/frontend/src/lib/services/sync.svelte.ts` - Add update() method
- `/frontend/src/lib/stores/familyStore.ts` - Convert to SyncManager
- `/frontend/src/lib/stores/insuranceStore.ts` - Convert to SyncManager
- `/frontend/src/lib/stores/medicalStore.ts` - Convert to SyncManager
- `/frontend/src/lib/stores/petStore.ts` - Convert to SyncManager
- `/frontend/src/lib/stores/funeralStore.ts` - Convert to SyncManager
- `/frontend/src/lib/stores/timeCapsuleStore.ts` - Convert to SyncManager

### Success Criteria
- [ ] All modules save to backend database
- [ ] No data stored only in localStorage
- [ ] SyncManager has full CRUD (create, read, update, delete)
- [ ] Data survives browser cache clear

---

## 3. **Media Upload Infrastructure Agent**
**Priority:** P0 - CRITICAL
**Estimated Impact:** Fixes 4 modules
**Complexity:** High

### Scope
Build media upload/download system to replace IndexedDB-only storage.

### Specific Tasks
1. **Backend Media Service**
   - Add file upload endpoint `/api/media/upload`
   - Add file download endpoint `/api/media/{id}`
   - Implement storage (S3 or local filesystem for dev)
   - Add media metadata model (filename, user_id, module, size, mime_type)

2. **Frontend Upload Component**
   - Create reusable MediaUploader component
   - Support drag-and-drop
   - Show upload progress
   - Handle errors gracefully

3. **Migrate Existing Media**
   - Create migration script to upload IndexedDB blobs to backend
   - Update references in heirloom, property, visual memory stores
   - Clean up IndexedDB after successful migration

4. **Update Modules**
   - Replace IndexedDB calls with backend API calls
   - Add media gallery with backend loading
   - Implement lazy loading for images

### Files to Create
- `/backend/routers/media.py` - Media endpoints
- `/backend/models/media.py` - Media metadata model
- `/frontend/src/lib/components/MediaUploader.svelte` - Reusable uploader
- `/backend/storage/` - Storage adapter pattern

### Files to Modify
- `/frontend/src/lib/stores/heirloomStore.ts` - Use backend media
- `/frontend/src/lib/stores/visualMemoryStore.ts` - Use backend media
- `/frontend/src/lib/stores/propertyStore.ts` - Use backend media
- `/frontend/src/lib/services/indexedDB.ts` - Deprecate or remove

### Success Criteria
- [ ] Media files uploaded to backend/S3
- [ ] Media accessible across devices
- [ ] IndexedDB no longer used for media
- [ ] Upload progress shown to users
- [ ] Lazy loading implemented for performance

---

## 4. **Email Integration Agent**
**Priority:** P0 - CRITICAL
**Estimated Impact:** Critical feature enablement
**Complexity:** Medium

### Scope
Replace mock email service with real email provider integration.

### Specific Tasks
1. **Choose Email Provider**
   - Recommend: SendGrid or Postmark
   - Set up account and get API keys
   - Add credentials to environment variables

2. **Update Email Service**
   - Replace file-saving logic with actual API calls
   - Implement retry logic for failed sends
   - Add email template system (Jinja2 templates)
   - Log sent emails to database

3. **Create Email Templates**
   - Magic link template
   - Pulse escalation tier 1-4 templates
   - Guardian notification template
   - Weekly summary template
   - Welcome email template

4. **Add Email Queue**
   - Implement background job queue (Celery or RQ)
   - Retry failed emails
   - Track email delivery status

### Files to Modify
- `/backend/email_service.py` - Replace with real provider
- Create `/backend/templates/emails/` directory
- `/backend/requirements.txt` - Add sendgrid or postmark library
- `.env.example` - Add email configuration

### Success Criteria
- [ ] Emails actually sent to users
- [ ] Magic links work end-to-end
- [ ] Pulse escalation notifications arrive
- [ ] Failed emails retried automatically
- [ ] Email logs in database for audit

---

## 5. **Configuration Management Agent**
**Priority:** P1 - HIGH
**Estimated Impact:** Fixes 30+ files
**Complexity:** Low

### Scope
Replace all hardcoded values with environment-based configuration.

### Specific Tasks
1. **Backend Configuration**
   - Create `config.py` with Settings class (pydantic BaseSettings)
   - Load from `.env` file
   - Replace hardcoded URLs, secrets, config values

2. **Frontend Configuration**
   - Create `.env` file with `VITE_API_URL`
   - Replace all `http://localhost:8000` with `import.meta.env.VITE_API_URL`
   - Create config utility in `/frontend/src/lib/config.ts`

3. **Environment Files**
   - Create `.env.example` for documentation
   - Create `.env.development` for local dev
   - Create `.env.production` for deployment
   - Add `.env` to `.gitignore`

4. **Deployment Configuration**
   - Update `nixpacks.toml` to use env vars
   - Document required Railway environment variables
   - Create setup script to validate config

### Files to Create
- `/backend/config.py` - Centralized configuration
- `/frontend/.env.example` - Template
- `/frontend/src/lib/config.ts` - Frontend config

### Files to Modify
- All files with `http://localhost:8000` (30+ files)
- `/backend/main.py` - Use config.py
- `/backend/database.py` - Use config for DB URL
- `/backend/security.py` - Use config for RP_ID, ORIGIN

### Success Criteria
- [ ] No hardcoded URLs in codebase
- [ ] All config from environment variables
- [ ] Different configs for dev/staging/production
- [ ] Documentation for all required env vars

---

## 6. **WebAuthn Quick Fix Agent**
**Priority:** P0 - CRITICAL (Quick Win)
**Estimated Impact:** Fixes 1 broken feature
**Complexity:** Trivial (5 minutes)

### Scope
Fix the missing import breaking biometric authentication.

### Specific Tasks
1. Add missing import to Pulse settings page
2. Test WebAuthn registration flow
3. Test WebAuthn authentication flow
4. Add error handling for unsupported browsers
5. Add fallback messaging

### Files to Modify
- `/frontend/src/routes/modules/pulse/settings/+page.svelte:1` - Add import

### Code Change
```typescript
// Add to top of file:
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
```

### Success Criteria
- [ ] "Connect Biometric" button works
- [ ] No console errors
- [ ] Credential saved to backend
- [ ] Authentication successful
- [ ] Graceful degradation for unsupported browsers

---

## 7. **Pulse Scheduler Tuner Agent**
**Priority:** P0 - CRITICAL (Quick Win)
**Estimated Impact:** Prevents database overload
**Complexity:** Trivial (2 minutes)

### Scope
Fix the scheduler running 60x too frequently.

### Specific Tasks
1. Change interval from minutes=1 to hours=1
2. Add configurable interval via environment variable
3. Add logging to track scheduler runs
4. Test escalation timing in scenario mode

### Files to Modify
- `/backend/pulse_scheduler.py:19` - Change interval

### Code Change
```python
# Current:
scheduler.add_job(pulse_job, 'interval', minutes=1, id='pulse_check')

# Change to:
interval_hours = int(os.getenv('PULSE_CHECK_INTERVAL_HOURS', '1'))
scheduler.add_job(pulse_job, 'interval', hours=interval_hours, id='pulse_check')
```

### Success Criteria
- [ ] Scheduler runs hourly (not every minute)
- [ ] Configurable via environment variable
- [ ] Logged to console/file for monitoring
- [ ] Tested with different intervals in dev

---

## 8. **Error Handling Standardization Agent**
**Priority:** P1 - HIGH
**Estimated Impact:** Improves reliability
**Complexity:** Medium

### Scope
Add comprehensive error handling across frontend and backend.

### Specific Tasks
1. **Backend Error Handling**
   - Replace bare `except:` with specific exceptions
   - Add custom exception classes
   - Return proper HTTP status codes
   - Log errors with context

2. **Frontend Error Handling**
   - Create error notification component
   - Add error boundary for Svelte
   - Show user-friendly error messages
   - Add retry buttons for failed requests

3. **Sync Error Feedback**
   - Show sync status in UI (syncing, synced, error)
   - Display specific error messages
   - Add manual retry button
   - Queue failed requests for automatic retry

4. **Monitoring**
   - Add error logging to file
   - Integrate Sentry or similar (optional)
   - Create error dashboard in admin panel

### Files to Create
- `/backend/exceptions.py` - Custom exception classes
- `/frontend/src/lib/components/ErrorNotification.svelte` - Error UI
- `/frontend/src/lib/components/SyncStatus.svelte` - Sync indicator

### Files to Modify
- All backend endpoints - Add try/except with proper errors
- `/backend/database.py` - Replace bare except
- All frontend API calls - Add error handling
- `/frontend/src/lib/services/sync.svelte.ts` - Add retry logic

### Success Criteria
- [ ] No bare except clauses in backend
- [ ] All API errors shown to users
- [ ] Failed requests retried automatically
- [ ] Errors logged with full context
- [ ] User can manually retry failed operations

---

## 9. **API Response Standardization Agent**
**Priority:** P2 - MEDIUM
**Estimated Impact:** Better developer experience
**Complexity:** Medium

### Scope
Standardize API request/response patterns across all endpoints.

### Specific Tasks
1. **RESTful Standards**
   - Convert query parameter messages to JSON bodies
   - Use proper HTTP verbs (GET, POST, PUT, DELETE)
   - Standardize response formats

2. **Response Wrapper**
   - Create standard response format: `{success: bool, data: any, error: string}`
   - Add pagination support for list endpoints
   - Add metadata (timestamps, version)

3. **Request Validation**
   - Use Pydantic models for all request bodies
   - Validate all inputs
   - Return detailed validation errors

4. **API Versioning**
   - Add `/api/v1/` prefix to all endpoints
   - Document breaking changes
   - Plan for v2 migration path

### Files to Modify
- `/frontend/src/routes/modules/pulse/messages/+page.svelte:44` - Fix query params
- All backend endpoints - Add response wrapper
- All frontend API calls - Handle new response format

### Success Criteria
- [ ] All endpoints follow REST conventions
- [ ] Consistent response format
- [ ] Comprehensive input validation
- [ ] API versioning in place

---

## 10. **Sync Conflict Resolution Agent**
**Priority:** P2 - MEDIUM
**Estimated Impact:** Prevents data loss
**Complexity:** High

### Scope
Implement smart merge and conflict resolution for offline editing.

### Specific Tasks
1. **Conflict Detection**
   - Add `updated_at` timestamp to all models
   - Compare local and remote timestamps on sync
   - Identify conflicts

2. **Merge Strategies**
   - Server wins (current behavior)
   - Client wins (option)
   - Smart merge (merge non-conflicting fields)
   - User choice (show UI)

3. **Conflict UI**
   - Create conflict resolution modal
   - Show diff between local and remote
   - Let user choose which to keep
   - Option to merge manually

4. **Offline Queue**
   - Queue all changes while offline
   - Replay changes when back online
   - Handle failures gracefully

### Files to Create
- `/frontend/src/lib/components/ConflictResolver.svelte` - Conflict UI
- `/frontend/src/lib/services/conflictResolution.ts` - Merge logic

### Files to Modify
- All database models - Add `updated_at` field
- `/frontend/src/lib/services/sync.svelte.ts` - Add conflict detection
- All stores - Track local modifications

### Success Criteria
- [ ] Conflicts detected automatically
- [ ] User notified of conflicts
- [ ] Choice of merge strategies
- [ ] No silent data overwrites
- [ ] Offline changes queued and replayed

---

## 11. **Database Migration Agent**
**Priority:** P1 - HIGH
**Estimated Impact:** Safe schema evolution
**Complexity:** Medium

### Scope
Set up proper database migration system.

### Specific Tasks
1. **Migration Framework**
   - Set up Alembic for SQLAlchemy
   - Create initial migration from current schema
   - Document migration process

2. **Missing Tables**
   - Create migrations for family, insurance, medical, pets
   - Add indexes for performance
   - Add foreign key constraints

3. **Data Migration**
   - Create script to migrate localStorage data to database
   - Create script to migrate IndexedDB media to backend
   - Backup before migration

4. **Migration Testing**
   - Test migrations on fresh database
   - Test rollback procedures
   - Document manual steps if any

### Files to Create
- `/backend/alembic/` - Migration directory
- `/backend/migrations/` - Migration scripts
- `/scripts/migrate_local_data.py` - Data migration

### Files to Modify
- `/backend/requirements.txt` - Add alembic
- `/backend/database.py` - Integrate Alembic

### Success Criteria
- [ ] Alembic properly configured
- [ ] All schema changes versioned
- [ ] Rollback tested and working
- [ ] Data migration scripts ready
- [ ] Documentation for running migrations

---

## 12. **Testing Infrastructure Agent**
**Priority:** P2 - MEDIUM
**Estimated Impact:** Code quality & confidence
**Complexity:** High

### Scope
Add comprehensive testing to prevent regressions.

### Specific Tasks
1. **Backend Tests**
   - Set up pytest
   - Create test database
   - Write unit tests for models
   - Write integration tests for endpoints
   - Aim for 80% coverage

2. **Frontend Tests**
   - Set up Vitest
   - Write component tests
   - Write store tests
   - Write service tests

3. **E2E Tests**
   - Set up Playwright
   - Test critical user flows
   - Test Pulse escalation workflow
   - Test data persistence

4. **CI/CD Integration**
   - Run tests on every commit (GitHub Actions)
   - Block merges if tests fail
   - Generate coverage reports

### Files to Create
- `/backend/tests/` - Backend test directory
- `/frontend/src/lib/tests/` - Frontend test directory
- `/e2e/` - E2E test directory
- `/.github/workflows/test.yml` - CI config

### Success Criteria
- [ ] Backend: 80% test coverage
- [ ] Frontend: 60% test coverage
- [ ] E2E: Critical paths covered
- [ ] Tests run automatically on CI
- [ ] Fast test execution (<2 minutes)

---

## 13. **Performance Optimization Agent**
**Priority:** P3 - LOW
**Estimated Impact:** Better UX
**Complexity:** Medium

### Scope
Optimize loading times and reduce API calls.

### Specific Tasks
1. **Frontend Optimization**
   - Lazy load modules
   - Implement virtual scrolling for long lists
   - Add image lazy loading
   - Optimize bundle size

2. **Backend Optimization**
   - Add database indexes
   - Implement caching (Redis)
   - Optimize N+1 queries
   - Add pagination

3. **Network Optimization**
   - Batch API calls
   - Implement GraphQL (optional)
   - Add HTTP caching headers
   - Compress responses

4. **Monitoring**
   - Add performance logging
   - Track API response times
   - Monitor database query times
   - Set up alerts for slow endpoints

### Success Criteria
- [ ] Page load time < 2 seconds
- [ ] API responses < 200ms (p95)
- [ ] Bundle size < 500KB
- [ ] Lighthouse score > 90

---

## 14. **Security Hardening Agent**
**Priority:** P1 - HIGH
**Estimated Impact:** Production readiness
**Complexity:** Medium

### Scope
Fix security vulnerabilities before production launch.

### Specific Tasks
1. **Authentication Security**
   - Implement JWT with short expiry
   - Add refresh tokens with rotation
   - Use httpOnly cookies for tokens
   - Implement CSRF protection

2. **Input Validation**
   - Sanitize all user inputs
   - Use parameterized queries (mostly done)
   - Validate file uploads
   - Add rate limiting

3. **CORS & Headers**
   - Restrict CORS to production domain
   - Add security headers (helmet)
   - Enable HTTPS only
   - Add CSP headers

4. **Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS for all requests
   - Implement audit logging
   - Add data export/deletion (GDPR)

5. **Secrets Management**
   - Never commit secrets to git
   - Use environment variables
   - Rotate credentials regularly
   - Document secret rotation process

### Files to Modify
- `/backend/main.py` - Add security headers, CORS restriction
- All endpoints - Add rate limiting
- `/backend/security.py` - Add CSRF protection

### Success Criteria
- [ ] No security vulnerabilities in scan
- [ ] OWASP Top 10 addressed
- [ ] HTTPS enforced
- [ ] Secrets never in code
- [ ] Audit logging in place

---

## 🎯 AGENT EXECUTION PRIORITY ORDER

### Phase 1: Critical Fixes (Week 1)
1. **WebAuthn Quick Fix Agent** (5 min)
2. **Pulse Scheduler Tuner Agent** (5 min)
3. **Authentication Architect Agent** (2-3 days)
4. **Email Integration Agent** (1 day)

### Phase 2: Data Persistence (Week 2)
5. **Data Persistence Unifier Agent** (2-3 days)
6. **Media Upload Infrastructure Agent** (2 days)
7. **Database Migration Agent** (1 day)

### Phase 3: Reliability (Week 3)
8. **Configuration Management Agent** (1 day)
9. **Error Handling Standardization Agent** (1-2 days)
10. **Security Hardening Agent** (2 days)

### Phase 4: Polish (Week 4+)
11. **API Response Standardization Agent** (1 day)
12. **Sync Conflict Resolution Agent** (2 days)
13. **Testing Infrastructure Agent** (3-4 days)
14. **Performance Optimization Agent** (2-3 days)

---

## 📋 AGENT USAGE TEMPLATE

For each agent, follow this workflow:

### 1. Agent Planning Session
```
You: "I want to create an agent to [specific goal from above].
Let's plan the approach first before coding."

Claude: [Creates detailed implementation plan with file list]
```

### 2. Agent Execution
```
You: "Proceed with the plan. Make the changes."

Claude: [Makes systematic changes across identified files]
```

### 3. Agent Verification
```
You: "Run tests to verify the changes work."

Claude: [Runs backend/frontend tests, checks for errors]
```

### 4. Agent Commit
```
You: "Commit these changes with a clear message."

Claude: [Creates commit with descriptive message]
```

---

## 🔧 QUICK WINS (Do These First)

These agents provide immediate value with minimal effort:

1. **WebAuthn Quick Fix** - 5 minutes, fixes broken feature
2. **Pulse Scheduler Tuner** - 2 minutes, prevents database overload
3. **Configuration Management** - 4 hours, fixes hardcoded URLs

---

## 📚 AGENT DEVELOPMENT GUIDELINES

### Best Practices for Each Agent
1. **Start with planning** - Don't jump straight to coding
2. **Work incrementally** - One file at a time, test as you go
3. **Keep scope focused** - Don't let agents do unrelated tasks
4. **Document changes** - Update README, add comments
5. **Test thoroughly** - Manual testing + automated tests
6. **Commit frequently** - Small, atomic commits with clear messages

### Agent Communication Style
- Ask clarifying questions before starting
- Explain the approach before implementing
- Show file diffs for review
- Highlight potential breaking changes
- Suggest testing strategies

---

## 🎓 LEARNING OUTCOMES

After running all agents, you will have:

✅ Production-ready authentication system
✅ Reliable data persistence across all modules
✅ Media upload/download infrastructure
✅ Real email notifications
✅ Environment-based configuration
✅ Comprehensive error handling
✅ Security hardening
✅ Database migrations
✅ Testing infrastructure
✅ Performance optimizations

**Estimated Total Time:** 4-6 weeks with one developer
**Estimated Total Time with Agents:** 1-2 weeks (much faster!)

---

## 📖 ADDITIONAL RESOURCES

### Documentation to Create
- API documentation (Swagger/OpenAPI)
- Developer setup guide
- Deployment guide
- User manual
- Security audit report

### Tools to Integrate
- Sentry (error tracking)
- LogRocket (session replay)
- Plausible (analytics)
- GitHub Actions (CI/CD)
- Railway (deployment)

---

**Next Steps:**
1. Review this document
2. Prioritize which agents to start with
3. Create a project board to track agent work
4. Start with Quick Wins for immediate value
5. Work through Phase 1 before moving to Phase 2

Good luck fixing the Continuum platform! 🚀
