# Agent 05: Configuration Management
**Priority:** P0 - CRITICAL
**Estimated Time:** 2-3 hours
**Dependencies:** None (should be done first)
**Category:** Technical Infrastructure

---

## OBJECTIVE

Create centralized configuration management system using Pydantic Settings with environment variables.

**Current Issues:**
- Hardcoded configuration values throughout codebase
- 30+ files with `http://localhost:8000` hardcoded
- JWT secrets, database URLs, SMTP credentials scattered
- No `.env.example` file for developers
- No production validation
- Configuration inconsistent between files

**Expected Outcome:**
- Central `/backend/config.py` with all configuration
- All config from environment variables
- Complete `.env.example` file
- Type-safe configuration with Pydantic
- Production validation (required vars must be set)
- Frontend environment variable support

---

## FILES TO MODIFY

### Backend Files (Create):
1. `/backend/config.py` - Central configuration with Pydantic Settings
2. `/.env.example` - Template for environment variables
3. `/.env` - Actual environment variables (git-ignored)

### Backend Files (Modify):
4. `/backend/main.py` - Use config instead of hardcoded values
5. `/backend/database.py` - Use config for database URL
6. `/backend/dependencies.py` - Use config for JWT secrets
7. `/backend/services/email_service.py` - Use config for SMTP
8. All `/backend/routers/*.py` - Remove hardcoded values

### Frontend Files (Create):
9. `/frontend/.env.example` - Frontend environment variables
10. `/frontend/.env` - Actual frontend env vars (git-ignored)

### Frontend Files (Modify):
11. `/frontend/src/lib/config.ts` - Frontend configuration
12. `/frontend/src/lib/api/client.ts` - Use API_URL from config
13. All pages with `localhost:8000` - Use config

---

## IMPLEMENTATION

### Step 1: Create Backend Configuration

**File:** `/backend/config.py`

```python
from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache

class Settings(BaseSettings):
    """
    Application configuration using Pydantic Settings.

    All values loaded from environment variables or .env file.
    Provides type safety and validation.
    """

    # Application
    APP_NAME: str = "Continuum Estate Planning"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True  # Auto-reload on code changes (dev only)

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/continuum"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_ECHO: bool = False  # Log all SQL queries (dev only)

    # Security - JWT
    JWT_SECRET_KEY: str  # REQUIRED - no default for security
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days

    # Security - Password Hashing
    PASSWORD_HASH_SCHEME: str = "bcrypt"
    PASSWORD_HASH_DEPRECATED: str = "auto"

    # Security - CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # Email - SMTP
    SMTP_HOST: str = "smtp.sendgrid.net"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey"
    SMTP_PASSWORD: str  # REQUIRED - SendGrid API key or SMTP password
    SMTP_FROM_EMAIL: str = "notifications@continuum.estate"
    SMTP_FROM_NAME: str = "Continuum Estate Planning"
    SMTP_USE_TLS: bool = True

    # Email - Provider
    EMAIL_PROVIDER: str = "sendgrid"  # sendgrid, gmail, ses, smtp

    # Email - SendGrid
    SENDGRID_API_KEY: Optional[str] = None

    # Email - AWS SES
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 52428800  # 50MB in bytes
    ALLOWED_FILE_TYPES: List[str] = [
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".mp4", ".mov", ".avi", ".webm",
        ".mp3", ".wav", ".m4a",
        ".pdf", ".doc", ".docx", ".txt"
    ]

    # AI Integration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_MAX_TOKENS: int = 1000
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-sonnet-20240229"

    # Pulse Scheduler
    PULSE_CHECK_INTERVAL_HOURS: int = 1  # How often to check for missed pulse check-ins

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100  # Requests per minute per IP
    RATE_LIMIT_PERIOD: int = 60  # Seconds

    # Session
    SESSION_SECRET_KEY: str  # REQUIRED - for session encryption
    SESSION_COOKIE_NAME: str = "continuum_session"
    SESSION_COOKIE_SECURE: bool = True  # HTTPS only
    SESSION_COOKIE_HTTPONLY: bool = True  # No JavaScript access
    SESSION_COOKIE_SAMESITE: str = "lax"

    # Frontend URL (for CORS and email links)
    FRONTEND_URL: str = "http://localhost:5173"

    # Monitoring
    SENTRY_DSN: Optional[str] = None
    SENTRY_ENVIRONMENT: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    def validate_production(self) -> List[str]:
        """
        Validate required settings for production environment.

        Returns list of missing/invalid settings.
        """
        issues = []

        if self.ENVIRONMENT == "production":
            # Required secrets
            if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY == "change-me-in-production":
                issues.append("JWT_SECRET_KEY must be set to secure value")

            if not self.SESSION_SECRET_KEY or self.SESSION_SECRET_KEY == "change-me":
                issues.append("SESSION_SECRET_KEY must be set to secure value")

            if not self.SMTP_PASSWORD:
                issues.append("SMTP_PASSWORD must be set for email sending")

            # Security settings
            if self.DEBUG:
                issues.append("DEBUG should be False in production")

            if "localhost" in self.FRONTEND_URL:
                issues.append("FRONTEND_URL should not be localhost in production")

            if "localhost" in self.CORS_ORIGINS[0]:
                issues.append("CORS_ORIGINS should not include localhost in production")

            # Database
            if "localhost" in self.DATABASE_URL:
                issues.append("DATABASE_URL should not use localhost in production")

            if not self.SESSION_COOKIE_SECURE:
                issues.append("SESSION_COOKIE_SECURE should be True in production (HTTPS)")

        return issues


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Uses lru_cache to avoid recreating settings on every call.
    """
    return Settings()

# Global settings instance
settings = get_settings()

# Validate production settings on import
if settings.ENVIRONMENT == "production":
    issues = settings.validate_production()
    if issues:
        import sys
        print("❌ PRODUCTION CONFIGURATION ERRORS:")
        for issue in issues:
            print(f"  - {issue}")
        print("\nFix these issues before deploying to production!")
        sys.exit(1)
```

---

### Step 2: Create Environment Variable Template

**File:** `/.env.example`

```bash
# Continuum Estate Planning - Environment Variables
# Copy this file to .env and fill in your actual values

# ============================================================
# APPLICATION
# ============================================================
APP_NAME="Continuum Estate Planning"
ENVIRONMENT=development  # development, staging, production
DEBUG=true
LOG_LEVEL=INFO

# ============================================================
# SERVER
# ============================================================
HOST=0.0.0.0
PORT=8000
RELOAD=true

# ============================================================
# DATABASE
# ============================================================
# Local development:
DATABASE_URL=postgresql://continuum_user:continuum_pass@localhost:5432/continuum

# Production (replace with actual values):
# DATABASE_URL=postgresql://user:password@your-db-host:5432/continuum_prod

DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_ECHO=false

# ============================================================
# SECURITY - JWT
# ============================================================
# CRITICAL: Generate secure random string for production
# Example: openssl rand -hex 32
JWT_SECRET_KEY=change-me-in-production-use-openssl-rand-hex-32
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=43200  # 30 days

# ============================================================
# SECURITY - SESSION
# ============================================================
# CRITICAL: Generate secure random string for production
SESSION_SECRET_KEY=change-me-in-production-use-openssl-rand-hex-32
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true

# ============================================================
# SECURITY - CORS
# ============================================================
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
# Production:
# CORS_ORIGINS=["https://app.continuum.estate"]

# ============================================================
# EMAIL - SMTP
# ============================================================
# SendGrid (recommended):
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key-here
SMTP_FROM_EMAIL=notifications@continuum.estate
SMTP_FROM_NAME="Continuum Estate Planning"
SMTP_USE_TLS=true

# Gmail (for testing only):
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-specific-password

# AWS SES:
# SMTP_HOST=email-smtp.us-east-1.amazonaws.com
# SMTP_PORT=587
# SMTP_USER=your-ses-smtp-username
# SMTP_PASSWORD=your-ses-smtp-password

EMAIL_PROVIDER=sendgrid

# ============================================================
# FILE STORAGE
# ============================================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# Production (use S3):
# UPLOAD_DIR=s3://your-bucket/uploads
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_REGION=us-east-1

# ============================================================
# AI INTEGRATION
# ============================================================
# OpenAI:
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# Anthropic Claude (alternative):
# ANTHROPIC_API_KEY=your-anthropic-api-key-here
# ANTHROPIC_MODEL=claude-3-sonnet-20240229

# ============================================================
# PULSE SCHEDULER
# ============================================================
PULSE_CHECK_INTERVAL_HOURS=1  # Check every hour

# ============================================================
# RATE LIMITING
# ============================================================
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100  # Requests per minute
RATE_LIMIT_PERIOD=60

# ============================================================
# FRONTEND URL
# ============================================================
FRONTEND_URL=http://localhost:5173
# Production:
# FRONTEND_URL=https://app.continuum.estate

# ============================================================
# MONITORING
# ============================================================
# Sentry (for error tracking):
# SENTRY_DSN=your-sentry-dsn-here
# SENTRY_ENVIRONMENT=production
```

---

### Step 3: Create Frontend Configuration

**File:** `/frontend/.env.example`

```bash
# Continuum Frontend - Environment Variables
# Copy this file to .env and fill in your actual values

# API URL
VITE_API_URL=http://localhost:8000

# Production:
# VITE_API_URL=https://api.continuum.estate

# Environment
VITE_ENVIRONMENT=development

# Feature Flags
VITE_FEATURE_AI_CONCIERGE=true
VITE_FEATURE_WEBAUTHN=true
VITE_FEATURE_PULSE_SAFETY=true

# Analytics
# VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
# VITE_MIXPANEL_TOKEN=your-mixpanel-token
```

**File:** `/frontend/src/lib/config.ts`

```typescript
/**
 * Frontend configuration
 *
 * All values loaded from environment variables (VITE_*)
 */

interface Config {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    aiConcierge: boolean;
    webauthn: boolean;
    pulseSafety: boolean;
  };
  analytics: {
    googleAnalyticsId?: string;
    mixpanelToken?: string;
  };
}

function getConfig(): Config {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  return {
    apiUrl,
    environment: environment as Config['environment'],
    features: {
      aiConcierge: import.meta.env.VITE_FEATURE_AI_CONCIERGE !== 'false',
      webauthn: import.meta.env.VITE_FEATURE_WEBAUTHN !== 'false',
      pulseSafety: import.meta.env.VITE_FEATURE_PULSE_SAFETY !== 'false'
    },
    analytics: {
      googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
      mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN
    }
  };
}

export const config = getConfig();

// Validate in development
if (config.environment === 'development') {
  console.log('🔧 Configuration loaded:', {
    apiUrl: config.apiUrl,
    environment: config.environment,
    features: config.features
  });
}
```

---

### Step 4: Update Backend to Use Config

**File:** `/backend/main.py`

**Replace hardcoded values:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS - use config instead of hardcoded origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Startup message
@app.on_event("startup")
async def startup():
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Environment: {settings.ENVIRONMENT}")
    print(f"🗄️  Database: {settings.DATABASE_URL.split('@')[1]}")  # Hide password
    print(f"🌐 CORS Origins: {settings.CORS_ORIGINS}")
    print(f"📧 Email: {settings.SMTP_FROM_EMAIL} via {settings.EMAIL_PROVIDER}")
```

**File:** `/backend/database.py`

```python
from sqlmodel import create_engine, Session
from backend.config import settings

# Use config for database URL
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.DATABASE_ECHO
)
```

---

### Step 5: Update Frontend to Use Config

**File:** `/frontend/src/lib/api/client.ts`

**Replace hardcoded localhost:**

```typescript
import { config } from '$lib/config';
import { authStore } from '$lib/stores/authStore';
import { get } from 'svelte/store';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Use config instead of hardcoded URL
  const url = `${config.apiUrl}${endpoint}`;

  const auth = get(authStore);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (auth.isAuthenticated && auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    authStore.logout();
    throw new Error('Session expired. Please login again.');
  }

  return response;
}
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Backend validation
cd backend
python -c "from config import settings; print(f'✓ Config loaded: {settings.APP_NAME}')"

# Test production validation
ENVIRONMENT=production python -c "from config import settings"
# Should exit with errors if secrets not set

# Frontend validation
cd frontend
npm run check

# Test .env loading
cat .env.example > .env
# Edit .env with real values
npm run dev  # Should start without errors
```

---

## SUCCESS CRITERIA

- [ ] Backend config.py created with all settings
- [ ] .env.example file complete with all variables
- [ ] Pydantic Settings provides type safety
- [ ] Production validation catches missing secrets
- [ ] All hardcoded values replaced with config
- [ ] Frontend config.ts created
- [ ] Frontend .env.example created
- [ ] API_URL no longer hardcoded in frontend
- [ ] CORS origins configurable
- [ ] Database URL configurable
- [ ] JWT secrets configurable
- [ ] SMTP settings configurable
- [ ] File upload settings configurable

---

## TESTING

### Manual Testing:

1. **Development Mode:**
   ```bash
   cp .env.example .env
   # Edit .env with dev values
   python backend/main.py
   # Should start successfully
   ```

2. **Production Validation:**
   ```bash
   ENVIRONMENT=production JWT_SECRET_KEY=test python -c "from backend.config import settings"
   # Should fail with list of missing/invalid settings
   ```

3. **Frontend Config:**
   ```bash
   cd frontend
   cp .env.example .env
   npm run dev
   # Check console for config loading message
   ```

### Automated Testing:

```python
# backend/tests/test_config.py
from backend.config import Settings

def test_default_settings():
    settings = Settings(
        JWT_SECRET_KEY="test-key",
        SESSION_SECRET_KEY="test-key",
        SMTP_PASSWORD="test-password"
    )
    assert settings.APP_NAME == "Continuum Estate Planning"
    assert settings.ENVIRONMENT == "development"

def test_production_validation():
    settings = Settings(
        ENVIRONMENT="production",
        JWT_SECRET_KEY="weak",
        SESSION_SECRET_KEY="weak",
        SMTP_PASSWORD="test",
        DEBUG=True  # Should fail
    )
    issues = settings.validate_production()
    assert len(issues) > 0
    assert any("DEBUG" in issue for issue in issues)
```

---

## ROLLBACK

### If Issues Occur:

```bash
# Remove config files
git checkout HEAD -- backend/config.py
rm .env .env.example
rm frontend/.env frontend/.env.example

# Revert to hardcoded values
git checkout HEAD -- backend/main.py
git checkout HEAD -- backend/database.py
git checkout HEAD -- frontend/src/lib/config.ts
git checkout HEAD -- frontend/src/lib/api/client.ts
```

---

## COMMIT MESSAGE

```
feat(config): implement centralized configuration management

Create configuration management system using Pydantic Settings.

Issues Fixed:
- Configuration scattered across 30+ files
- Hardcoded localhost URLs throughout codebase
- JWT secrets, database URLs, SMTP credentials hardcoded
- No .env.example for developers
- No production validation
- Configuration inconsistent between files

Implementation:

Backend Configuration:
- backend/config.py: Central configuration with Pydantic Settings
  - Type-safe settings with validation
  - All values from environment variables
  - Production validation (exits if secrets missing)
  - Comprehensive settings for all services
  - Cached settings instance for performance

Configuration Categories:
- Application: Name, version, environment, debug
- Server: Host, port, reload
- Database: URL, pool size, echo
- Security: JWT secrets, password hashing, CORS, sessions
- Email: SMTP settings for SendGrid/Gmail/SES
- File Storage: Upload directory, file size limits
- AI: OpenAI and Anthropic API keys
- Pulse: Scheduler interval
- Rate Limiting: Requests per minute
- Monitoring: Sentry integration

Frontend Configuration:
- frontend/src/lib/config.ts: Configuration loader
- frontend/.env.example: Environment variable template
- VITE_API_URL for backend connection
- Feature flags for toggling features

Environment Files:
- .env.example: Complete template with comments
- Documents all configuration options
- Provides example values
- Explains production requirements

Backend Updates:
- backend/main.py: Use settings for CORS, app config
- backend/database.py: Use settings for database URL
- backend/dependencies.py: Use settings for JWT
- backend/services/email_service.py: Use settings for SMTP

Frontend Updates:
- frontend/src/lib/api/client.ts: Use config.apiUrl
- All pages: Replace localhost with config

Production Validation:
- Checks all required secrets are set
- Validates security settings (DEBUG=false, HTTPS cookies)
- Validates URLs don't contain localhost
- Exits with clear error messages if invalid

Security Improvements:
- Secrets never committed to git
- .env files in .gitignore
- Type-safe configuration prevents typos
- Production validation prevents deployment errors

Developer Experience:
- .env.example shows all available options
- Comments explain each setting
- Clear instructions for setup
- Validation catches mistakes early

Testing:
- Unit tests for configuration loading
- Production validation tests
- Environment variable parsing tests
- Default value tests

Impact:
- P0-CRITICAL: Required for production deployment
- Eliminates hardcoded secrets and URLs
- Enables environment-specific configuration
- Improves security (secrets in env vars, not code)
- Better developer onboarding (.env.example)

Future Enhancements:
- Secrets management (Vault, AWS Secrets Manager)
- Configuration hot-reloading
- Per-environment config files
- Configuration validation UI

Closes: Configuration management system
Ref: CODEBASE_REVIEW_REPORT.md issue #8
```

---

## NOTES

- This should be the FIRST agent to execute (P0-CRITICAL)
- All other agents depend on proper configuration
- Never commit .env file to git (add to .gitignore)
- Generate secure secrets for production:
  ```bash
  openssl rand -hex 32
  ```
- Consider using secrets management in production:
  - AWS Secrets Manager
  - HashiCorp Vault
  - Azure Key Vault
- Add configuration validation on application startup
- Document all environment variables in README

### Railway PostgreSQL (IMPORTANT):
- **PostgreSQL is ALREADY RUNNING on Railway**
- Railway automatically provides `DATABASE_URL` environment variable
- No need to create a new database - use the existing one
- The `DATABASE_URL` value is automatically injected by Railway
- For local development, use the Railway connection string or local PostgreSQL
- To get your Railway database URL:
  ```bash
  railway variables
  # Shows: DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway
  ```
- The config system will automatically use Railway's `DATABASE_URL` in production
- All database agents (02, 11) will use this existing PostgreSQL database

### Security Best Practices:
- Rotate secrets regularly
- Use different secrets for each environment
- Never log secrets or configuration values
- Use key management services in production
- Implement secret rotation
- Audit secret access

### Production Deployment:
1. Copy .env.example to .env
2. Fill in all production values
3. Generate secure random secrets
4. Set ENVIRONMENT=production
5. Run validation: `python -c "from backend.config import settings"`
6. Deploy

---

**READY TO EXECUTE**

Claude: Read this specification and execute FIRST before all other agents.
