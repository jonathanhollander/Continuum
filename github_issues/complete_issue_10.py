#!/usr/bin/env python3
"""Post completion update for Issue #10 - Security Hardening"""
import requests
import os

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"
ISSUE_NUM = 10

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

comment = """✅ **Issue #10: Security Hardening - COMPLETED**

## Summary

Implemented comprehensive security hardening for Continuum SaaS, including rate limiting, security headers, HTTPS enforcement, audit logging infrastructure, and production-ready CORS configuration.

## Implemented Features

### 1. Rate Limiting (slowapi)
- ✅ Global rate limiter: 100 req/minute per IP
- ✅ Auth endpoints protected:
  - Signup: 5/minute
  - Login: 5/minute
  - Magic link: 5/minute
  - Passkey endpoints: 10/minute
- **Files**: `backend/requirements.txt`, `backend/limiter.py`, `backend/main.py`, `backend/routers/auth.py`

### 2. Security Headers
- ✅ Implemented secure package middleware
- ✅ Headers applied: CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy
- **Files**: `backend/main.py`

### 3. HTTPS Enforcement
- ✅ Production-only automatic HTTP → HTTPS redirect (301)
- ✅ Only active when `ENVIRONMENT=production`
- **Files**: `backend/main.py`

### 4. Audit Logging Infrastructure
- ✅ Created AuditLog SQLModel with comprehensive fields
- ✅ Created audit utility functions for common operations
- ✅ Integrated into authentication router (login, signup, magic link)
- ✅ Ready for integration into other routers
- **Files**: `backend/models/audit_log.py`, `backend/utils/audit.py`, `backend/routers/auth.py`

### 5. Secrets Management
- ✅ Scanned git history for exposed secrets
- ✅ **Result**: No secrets found in git history
- ✅ GitHub token only in `.env` file (gitignored)

### 6. CORS Configuration
- ✅ Production whitelist validation (continuum.im, Railway domains)
- ✅ Automatic filtering of unauthorized origins in production
- ✅ Specific headers/methods in production (not wildcard)
- ✅ 1-hour preflight caching for performance
- **Files**: `backend/config.py`, `backend/main.py`

### 7. Security Documentation
- ✅ Created comprehensive `SECURITY_AUDIT.md`
- ✅ Documented all vulnerabilities and fixes
- ✅ Identified remaining validation issues for future work
- ✅ Added security monitoring recommendations
- **Files**: `SECURITY_AUDIT.md`

## Files Modified/Created

### Created
1. `backend/limiter.py` - Rate limiter configuration
2. `backend/models/audit_log.py` - Audit logging model
3. `backend/utils/audit.py` - Audit logging utilities
4. `SECURITY_AUDIT.md` - Comprehensive security documentation

### Modified
1. `backend/requirements.txt` - Added slowapi, secure packages
2. `backend/main.py` - Security middleware, CORS, HTTPS
3. `backend/routers/auth.py` - Audit logging integration
4. `backend/config.py` - Production CORS validation

## Remaining Work (Documented in SECURITY_AUDIT.md)

### P1-High Priority
1. **Input Validation**: Add Pydantic models to replace raw `dict` types in:
   - `estate_data.py` (POST/PUT endpoints)
   - `main.py` (estate endpoints)
   - `pulse.py` (checkin, messages, safety timer)

2. **Audit Logging Integration**: Expand to all routers:
   - Data deletion endpoints (contacts, insurance, medical, etc.)
   - Configuration changes (Pulse settings, tiers)
   - Data export events

### P2-Medium Priority
1. Replace in-memory WebAuthn challenge store with Redis
2. Implement JWT refresh tokens
3. Add request ID tracking for distributed tracing

## Testing Verification

✅ All security middleware loads without errors
✅ Rate limiting applied to auth endpoints
✅ Security headers present in responses
✅ HTTPS redirect working in production mode
✅ Audit logs created for auth events
✅ CORS validated for production domains

## Production Checklist

Before deploying:
- [ ] Change `JWT_SECRET_KEY` from default value
- [ ] Change `SECRET_KEY` from default value
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure production `CORS_ORIGINS`
- [ ] Set up Redis for WebAuthn challenges (optional improvement)
- [ ] Review `SECURITY_AUDIT.md` for additional hardening

## Documentation

All security implementation details, remaining vulnerabilities, and recommendations are documented in:
- `SECURITY_AUDIT.md` - Comprehensive security audit report
- `CLAUDE.md` - Development guidelines (already includes security notes)

---

**Agent**: security-scanner
**Time**: 3 hours
**Status**: ✅ Complete
**Severity**: P1-High

🔒 **Security Status**: Production-ready with audit logging infrastructure and comprehensive hardening. Additional P1 validation improvements documented for future work.
"""

url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{ISSUE_NUM}/comments"
response = requests.post(url, headers=headers, json={"body": comment})

if response.status_code == 201:
    print(f"✅ Successfully posted completion update to Issue #{ISSUE_NUM}")
    print(f"   View at: https://github.com/{OWNER}/{REPO}/issues/{ISSUE_NUM}")
else:
    print(f"❌ Failed to post update: {response.status_code}")
    print(response.json())
