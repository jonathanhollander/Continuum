# Configuration Management Guide

This document explains how to configure Continuum SaaS for different environments.

## Overview

Continuum SaaS uses **centralized configuration management** with environment variables. All configuration is loaded from `.env` files and managed through:

- **Backend**: `/backend/config.py` (Pydantic Settings)
- **Frontend**: `/frontend/src/lib/config.ts` (Vite environment variables)

## Quick Start

### 1. Backend Configuration

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
nano .env
```

### 2. Frontend Configuration

```bash
# Copy the example file
cp frontend/.env.example frontend/.env

# Edit frontend/.env with your values
nano frontend/.env
```

### 3. Required Configuration

At minimum, set these values in `.env`:

```bash
# Database (use PostgreSQL in production)
DATABASE_URL=sqlite:///./continuum_saas.db

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT Secret (CRITICAL: Change in production!)
JWT_SECRET_KEY=your-random-secret-here

# Secret Key (CRITICAL: Change in production!)
SECRET_KEY=your-random-secret-here
```

## Environment Variables Reference

### Core Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Environment name (development/production) | `development` | No |
| `DEBUG` | Enable debug mode | `true` | No |
| `HOST` | Server host | `0.0.0.0` | No |
| `PORT` | Server port | `8000` | No |

### Frontend URLs

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FRONTEND_URL` | Frontend URL for local/default | `http://localhost:5173` | Yes |
| `FRONTEND_URL_PRODUCTION` | Production frontend URL override | `None` | No |

### CORS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` | Yes |
| `CORS_ALLOW_CREDENTIALS` | Allow credentials | `true` | No |
| `CORS_ALLOW_METHODS` | Allowed HTTP methods | `*` | No |
| `CORS_ALLOW_HEADERS` | Allowed headers | `*` | No |

### Database

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection string | `sqlite:///./continuum_saas.db` | Yes |
| `DB_ECHO` | Echo SQL queries | `false` | No |
| `DB_POOL_SIZE` | Connection pool size | `5` | No |
| `DB_MAX_OVERFLOW` | Max overflow connections | `10` | No |

#### Database URL Formats

```bash
# SQLite (Development)
DATABASE_URL=sqlite:///./continuum_saas.db

# PostgreSQL (Production - Railway auto-provides this)
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Authentication (JWT)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET_KEY` | Secret key for JWT signing | `continuum-dev-secret-key-change-in-production` | Yes |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` | No |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration (minutes) | `10080` (7 days) | No |

**CRITICAL**: Change `JWT_SECRET_KEY` in production!

Generate a secure key:
```bash
openssl rand -hex 32
```

### WebAuthn/Passkey

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RP_ID` | Relying Party ID (domain) | `localhost` | Yes |
| `RP_NAME` | Relying Party display name | `Continuum Estate` | No |
| `ORIGIN` | Expected origin for passkey | `http://localhost:5173` | Yes |

**Production Example**:
```bash
RP_ID=your-app.railway.app
ORIGIN=https://your-app.railway.app
```

### Email Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_ENABLED` | Enable email sending | `false` | No |
| `SMTP_HOST` | SMTP server hostname | `None` | No |
| `SMTP_PORT` | SMTP port | `587` | No |
| `SMTP_USERNAME` | SMTP username | `None` | No |
| `SMTP_PASSWORD` | SMTP password | `None` | No |
| `SMTP_FROM_EMAIL` | From email address | `noreply@continuum.im` | No |
| `POSTMARK_API_KEY` | Postmark API token | `None` | No |

### File Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OUTBOX_DIR` | Email outbox directory | `backend/outbox` | No |
| `UPLOAD_DIR` | Upload directory | `backend/uploads` | No |
| `MAX_UPLOAD_SIZE` | Max upload size (bytes) | `10485760` (10MB) | No |

### Pulse Scheduler

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PULSE_SCHEDULER_ENABLED` | Enable Pulse health checks | `true` | No |
| `PULSE_CHECK_INTERVAL_MINUTES` | Check interval | `15` | No |

## Frontend Configuration

Frontend configuration is in `/frontend/.env`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000

# OpenRouter API (optional)
VITE_OPENROUTER_API_KEY=your-key-here
```

### Using Configuration in Frontend

Import from centralized config:

```typescript
import { API_BASE_URL, API_URL } from '$lib/config';

// Use API_BASE_URL for full base URL
fetch(`${API_BASE_URL}/api/endpoint`);

// Use API_URL for /api prefixed URL
fetch(`${API_URL}/endpoint`);
```

## Production Deployment

### Railway Deployment

Railway automatically provides these variables:

- `DATABASE_URL` - PostgreSQL connection string
- `RAILWAY_ENVIRONMENT` - Set to "production"
- `RAILWAY_STATIC_URL` - Your app's public URL
- `RAILWAY_PUBLIC_DOMAIN` - Your app's domain

**Required Manual Configuration**:

1. Set in Railway environment variables:
```bash
ENVIRONMENT=production
JWT_SECRET_KEY=<your-secure-random-key>
SECRET_KEY=<your-secure-random-key>
FRONTEND_URL=https://your-frontend-url.railway.app
RP_ID=your-app.railway.app
ORIGIN=https://your-app.railway.app
CORS_ORIGINS=https://your-app.railway.app
```

2. Frontend environment variables (Railway or build settings):
```bash
VITE_API_URL=https://your-backend.railway.app
```

### Production Validation

The backend automatically validates production configuration on startup:

```python
from backend.config import settings

if settings.is_production():
    errors = settings.validate_production_config()
    if errors:
        # Prints warnings for each configuration issue
        print("⚠️ PRODUCTION CONFIGURATION WARNINGS:")
        for error in errors:
            print(f"   - {error}")
```

**Validation Checks**:
- JWT_SECRET_KEY is not default value
- SECRET_KEY is not default value
- No "localhost" in FRONTEND_URL
- No "localhost" in ORIGIN
- RP_ID is not "localhost"
- DATABASE_URL uses PostgreSQL (not SQLite)
- CORS_ORIGINS doesn't use wildcard "*"

## Configuration Best Practices

### Security

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use different secrets per environment** - Dev, staging, production should have unique keys
3. **Rotate secrets regularly** - Especially JWT keys
4. **Use strong random keys** - Generate with `openssl rand -hex 32`

### Development

1. **Use `.env.example` as template** - Always keep it updated
2. **Document new variables** - Add to this guide and `.env.example`
3. **Test configuration loading** - Run `python -c "from backend.config import settings; print(settings.DATABASE_URL)"`

### Production

1. **Set ENVIRONMENT=production** - Enables validation
2. **Use PostgreSQL** - SQLite is for development only
3. **Enable SSL** - Automatically enabled for PostgreSQL
4. **Monitor logs** - Check for configuration warnings on startup

## Troubleshooting

### Configuration Not Loading

```bash
# Test backend config
python3 -c "from backend.config import settings; print(settings.DATABASE_URL)"

# Check if .env file exists
ls -la .env

# Verify .env format (no spaces around =)
cat .env
```

### CORS Errors

1. Check `CORS_ORIGINS` includes your frontend URL
2. Verify no trailing slashes in URLs
3. Ensure protocol matches (http vs https)

```bash
# Example fix
CORS_ORIGINS=https://frontend.railway.app,http://localhost:5173
```

### Database Connection Errors

1. Check `DATABASE_URL` format
2. For PostgreSQL, ensure SSL is enabled (automatic)
3. Verify database is running

```bash
# Test connection
python3 -c "from backend.database import engine; print('Connected!')"
```

### JWT Errors

1. Verify `JWT_SECRET_KEY` is set
2. Check key is not the default value
3. Ensure same key across all instances

## Migration Guide

### From Hardcoded to Environment Variables

If migrating from old code with hardcoded values:

1. **Backend**: Replace `os.getenv()` with `settings.VARIABLE_NAME`
```python
# Old
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db.sqlite")

# New
from backend.config import settings
DATABASE_URL = settings.DATABASE_URL
```

2. **Frontend**: Replace inline env checks with config import
```typescript
// Old
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// New
import { API_BASE_URL } from '$lib/config';
const apiUrl = API_BASE_URL;
```

## Additional Resources

- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

## Support

For configuration issues, check:
1. This documentation
2. `.env.example` file
3. `/backend/config.py` source code
4. Project issues on GitHub
