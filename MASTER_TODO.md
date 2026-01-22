# Continuum SaaS - Master Todo List

**Generated:** 2026-01-22
**Source:** GitHub Issues, Security Audit, Emotional Tone Audit, Task Board, Documentation

---

## Summary

| Priority | Open Issues | Status |
|----------|-------------|--------|
| P0-Critical | 0 | All closed |
| P1-High | 7 | Open |
| P2-Testing | 12 | Open |
| P3-Polish | 7 | Open |
| **Total Open** | **26** | |

---

## P1-HIGH PRIORITY (7 Open Issues)

### Security (Issue #10)
> Partially complete - rate limiting added, remaining items below

- [ ] **Enforce strong JWT secrets in production** - Validation on startup
- [ ] **Add rate limiting to public portal endpoints** - Guardian portal unprotected
- [ ] **Add Pydantic validation to all dict endpoints** - estate_data.py, main.py, pulse.py
- [ ] **Integrate audit logging in all routers** - Only auth.py has it
- [ ] **Add pre-commit hooks for secret detection** - gitleaks
- [ ] **Update CORS configuration for production** - Add production domains

### Emotional Tone (Issues #12, #13, #15, #16, #17, #18)

#### Issue #12: Rewrite all module headers to be emotionally appropriate
- [ ] Insurance: "Insurance Policies" → "Protecting Your Loved Ones"
- [ ] Medical: "Health Safety Net" → "Your Voice at the End of Life"
- [ ] Funeral: "Funeral Planning" → "Honoring Your Life"
- [ ] Contacts: "Call List" → "Circle of Trust"
- [ ] Add "Why This Matters" emotional introductions to all 11 modules
- [ ] Connect each module to love/values/protection

#### Issue #13: Replace generic 'Saved' with meaningful progress affirmations
- [ ] Create affirmation system for save operations
- [ ] Connect completions to emotional meaning
- [ ] Example: "Your letter has been saved. What you've written will mean everything to the people you love."

#### Issue #15: Replace 'No items yet' with encouraging empty states
- [ ] Rewrite all empty state messages across 11 modules
- [ ] Add emotional context explaining why module matters
- [ ] Add gentle call-to-action buttons

#### Issue #16: Adapt language based on user role (planner vs executor vs bereaved)
- [ ] Create user context detection (owner/executor/family)
- [ ] Store user role in profile/settings
- [ ] Implement conditional rendering based on context
- [ ] Different introductions for each role
- [ ] Add grief support banners for executors

#### Issue #17: Build specialized 'Executor Mode' for bereaved users
- [ ] Create dedicated executor dashboard
- [ ] Prioritize urgent tasks (notifications, bills)
- [ ] Add grief support resources prominent
- [ ] Soften all language for grieving users
- [ ] Add break reminders and pacing

#### Issue #18: Detect when users are overwhelmed and offer support/breaks
- [ ] Track session duration (30+ min trigger)
- [ ] Detect rapid clicking/abandonment patterns
- [ ] Create "Take a Break" reminder component
- [ ] Add "You don't have to finish today" messaging
- [ ] Create grief resource component with counseling links

---

## P2-TESTING (12 Open Issues)

### Testing Infrastructure
- [ ] **Issue #20**: Create comprehensive backend unit test suite (80% coverage)
- [ ] **Issue #21**: Create frontend unit test suite (60% coverage)
- [ ] **Issue #22**: Implement E2E tests for critical user workflows (Playwright)
- [ ] **Issue #26**: Create integration tests verifying frontend/backend communication
- [ ] **Issue #31**: Create isolated test database and mock services

### Documentation
- [ ] **Issue #23**: Generate comprehensive API documentation with OpenAPI
- [ ] **Issue #24**: Create comprehensive developer onboarding documentation

### Type Safety
- [ ] **Issue #25**: Validate frontend TypeScript types match backend models

### Deployment & Monitoring
- [ ] **Issue #27**: Configure Railway deployment with health checks
- [ ] **Issue #28**: Create deployment validation script to verify deployments
- [ ] **Issue #29**: Implement performance monitoring for API endpoints
- [ ] **Issue #30**: Set up Sentry for production error tracking

---

## P3-POLISH (7 Open Issues)

### Type Safety
- [ ] **Issue #32**: Enable strict TypeScript and enforce Python type hints

### Performance
- [ ] **Issue #33**: Implement offline-first PWA with service worker caching
- [ ] **Issue #34**: Optimize frontend performance with code splitting

### Automation
- [ ] **Issue #35**: Automated PR checks for breaking API changes
- [ ] **Issue #36**: Automated code review checks for pull requests
- [ ] **Issue #37**: Coordinate schema changes across SQLModel, Alembic, TypeScript

### API
- [ ] **Issue #38**: Standardize all API responses with consistent format

---

## SECURITY AUDIT REMAINING ITEMS

### P1-High (Short-term)
- [ ] Add Pydantic validation to all dict endpoints
- [ ] Integrate audit logging in all routers
- [ ] Scan git history for secrets (run gitleaks)
- [ ] Update CORS configuration for production
- [ ] Add pre-commit hooks for secret detection

### P2-Medium (Medium-term)
- [ ] Replace in-memory WebAuthn store with Redis
- [ ] Implement JWT refresh tokens
- [ ] Add request ID tracking for distributed tracing (DONE - verify)
- [ ] Set up Sentry or error monitoring
- [ ] Implement CSRF protection for state-changing operations

### P3-Low (Long-term)
- [ ] Consider moving to RS256 JWT signing
- [ ] Implement API versioning
- [ ] Add GraphQL rate limiting (if GraphQL added)
- [ ] Set up automated security scanning in CI/CD

---

## TASK BOARD PENDING ITEMS

From `TASK_BOARD.md`:
- [ ] Auth Guards & Loading States - SvelteKit hooks/layout protection
- [ ] Multi-User Data Isolation - Backend query filtering by `user_id`
- [ ] Backend Models (Family/Ins/Med/Pet) - SQLAlchemy/SQLModel definitions (DONE - verify)
- [ ] SyncManager Integration (All Modules) - Standardize frontend store persistence
- [ ] Implement `SyncManager.update()` - Add full CRUD to sync layer
- [ ] Media Upload Service - Backend file storage + migration (DONE - verify)

---

## EMAIL INTEGRATION REMAINING

From `EMAIL_INTEGRATION_GUIDE.md`:
- [ ] Set up Postmark account and verify domain
- [ ] Add `POSTMARK_API_KEY` to production environment
- [ ] Configure sender email to use verified domain
- [ ] Test all email types (magic link, pulse alerts, welcome)
- [ ] Monitor email logs table for delivery issues
- [ ] Add email rate limiting if needed
- [ ] Configure SPF/DKIM records for your domain
- [ ] Review email templates for branding consistency
- [ ] Test spam score using mail-tester.com

---

## MEDIA UPLOAD FUTURE ENHANCEMENTS

From `MEDIA_UPLOAD_GUIDE.md`:
- [ ] Image resizing/thumbnails
- [ ] Video transcoding
- [ ] CDN integration
- [ ] Batch upload
- [ ] Resumable uploads
- [ ] Client-side encryption
- [ ] Shared albums/galleries
- [ ] EXIF data extraction
- [ ] Automatic backup to multiple storage providers

---

## EMOTIONAL TONE AUDIT CRITICAL ITEMS

### Phase 1: Fix the Foundation (Most Urgent)

#### AI System Prompt Rewrite
- [ ] Remove "NO FLUFF: Skip the empathetic filler" directive
- [ ] Add "EMPATHY FIRST" as primary rule
- [ ] Add context-awareness rules (owner vs executor vs family)
- [ ] Add grief acknowledgment patterns
- [ ] Add break suggestions to AI responses
- [ ] Test with sample conversations

#### Module Headers Rewrite (11 modules)
- [ ] Insurance: Add emotional framing about protecting loved ones
- [ ] Medical: Reframe as "Your Voice at the End of Life"
- [ ] Funeral: Reframe as "Honoring Your Life"
- [ ] Contacts: Reframe as "Circle of Trust"
- [ ] Legacy Letters: Add meaning about preserving voice
- [ ] Time Capsule: (Already good - use as template)
- [ ] Heirlooms: Connect to memory and meaning
- [ ] Family Hub: Emphasize connection
- [ ] Pets: Frame as ensuring care for beloved companions
- [ ] Property: Connect to providing for family
- [ ] Subscriptions: Frame as reducing burden on loved ones

### Phase 2: Emotional Enrichment

#### Empty States
- [ ] Add emotional context to all empty states
- [ ] Explain why each module matters emotionally
- [ ] Soften button labels ("Start when ready" vs "Add Now")

#### Form Modals
- [ ] Add compassionate introductions to all modals
- [ ] Reframe field labels with emotional context
- [ ] Add help text that validates difficulty
- [ ] Include grief/support resources in heavy modals (medical, funeral)

#### Break & Pacing
- [ ] Create "Take a Break" reminder component
- [ ] Detect 30+ minute sessions, suggest breaks
- [ ] Add "You don't have to finish today" messaging
- [ ] Create grief resource component

### Phase 3: Support Infrastructure
> **Plan:** See [grief_support_system_plan.md](./implementation_plans/grief_support_system_plan.md)

#### Grief Support System
- [ ] Create `/resources/grief-support` page
- [ ] Add grief counseling links (BetterHelp, local resources)
- [ ] Add support groups for loss
- [ ] Add resources for terminal diagnoses
- [ ] Create conversation starters for family discussions
- [ ] Add grief resource links throughout app
- [ ] Create "Talking to Family" guides

#### Tone Documentation
- [ ] Create tone guide for future development
- [ ] Document emotional principles
- [ ] Create copy templates for new features

---

## CODE REVIEW FINDINGS (From Recent Audit)

### Security (14 issues found)
- [x] Rate limiting added to sensitive endpoints
- [ ] Debug auth bypass removal (CRITICAL)
- [ ] Enforce strong JWT secrets
- [ ] Add rate limiting to public portal endpoints
- [ ] Replace in-memory challenge store
- [ ] Fix path traversal vulnerability in SPA serving

### Performance (17 issues found)
- [ ] Fix N+1 queries in list endpoints
- [ ] Add database indexes for common queries
- [ ] Implement connection pooling for PostgreSQL
- [ ] Add caching for frequently accessed data
- [ ] Optimize frontend bundle size

### Code Quality (20 items found)
- [ ] Replace bare `except:` clauses with specific exceptions
- [ ] Replace `Any` types with proper typing
- [ ] Reduce code duplication in routers
- [ ] Add missing docstrings

### Architecture (10 concerns)
- [ ] Improve layer separation
- [ ] Fix dependency direction issues
- [ ] Centralize state management patterns

---

## PRODUCTION DEPLOYMENT CHECKLIST

Before going live:
- [ ] Change `JWT_SECRET_KEY` from default value
- [ ] Change `SECRET_KEY` from default value
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure production `CORS_ORIGINS`
- [ ] Set up Redis for WebAuthn challenges
- [ ] Configure Postmark email service
- [ ] Set up Sentry error monitoring
- [ ] Review `SECURITY_AUDIT.md` for additional hardening
- [ ] Run full E2E test suite
- [ ] Verify all database migrations applied
- [ ] Test login/signup flow
- [ ] Test Pulse check-in flow
- [ ] Test email delivery

---

## PRIORITY ORDER RECOMMENDATION

### Immediate (This Week)
1. Remove debug auth bypass (CRITICAL SECURITY)
2. AI empathy rewrite - remove "NO FLUFF" directive
3. Module headers emotional rewrite (3 most critical: medical, funeral, insurance)
4. Empty states compassion update

### Short-term (Next 2 Weeks)
1. Complete Issue #10 security items
2. Complete emotional tone Issues #12-18
3. Executor mode implementation
4. Break/pacing system

### Medium-term (Month 1)
1. P2 testing infrastructure
2. Sentry error monitoring
3. Railway deployment optimization
4. API documentation

### Long-term (Quarter 1)
1. P3 polish items
2. PWA/offline mode
3. Automated testing suite
4. Type safety enforcement

---

*Last Updated: 2026-01-22*
