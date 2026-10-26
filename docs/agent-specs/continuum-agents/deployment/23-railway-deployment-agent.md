# Agent 23: Railway Deployment Agent
**Priority:** P1 - HIGH
**Estimated Time:** 4 hours
**Dependencies:** 05-configuration-management, 11-database-migration-system
**Category:** Deployment

---

## OBJECTIVE

Configure and deploy Continuum to Railway platform with proper environment variables, database, and health checks.

**Current Issues:**
- Deployment not configured
- No production environment setup
- Missing Railway configuration
- Health checks not implemented
- Database migrations not automated

**Expected Outcome:**
- Railway deployment configured
- PostgreSQL database connected
- Environment variables set
- Health checks working
- Automated migrations on deploy
- HTTPS enabled

---

## FILES TO CREATE/MODIFY

1. `/railway.json` - Railway configuration
2. `/backend/main.py` - Add health check endpoint
3. `/Procfile` - Process configuration
4. `/runtime.txt` - Python version
5. `/.github/workflows/deploy.yml` - CI/CD pipeline

---

## IMPLEMENTATION

### Railway Configuration:

**File:** `/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && pip install -r requirements.txt && cd ../frontend && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd backend && alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Procfile:

**File:** `/Procfile`

```
web: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
release: cd backend && alembic upgrade head
```

### Health Check Endpoint:

**File:** `/backend/main.py` (add endpoint)

```python
from backend.config import settings
from backend.database import engine

@app.get("/health")
def health_check():
    """Health check endpoint for Railway"""

    # Check database connection
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database": db_status
    }
```

### Railway Environment Variables:

```bash
# Set in Railway dashboard

APP_ENV=production
DEBUG=false

# Database (Railway provides this automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Secrets (generate secure values)
SECRET_KEY=<generate-secure-random-string>
JWT_SECRET_KEY=<generate-secure-random-string>

# Email (configure your SMTP)
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=${{SendGrid.API_KEY}}
FROM_EMAIL=noreply@continuum.app
FROM_NAME=Continuum

# AI
OPENROUTER_API_KEY=${{OpenRouter.API_KEY}}

# CORS (your production domain)
CORS_ORIGINS=https://continuum.up.railway.app,https://www.continuum.app
```

### Deployment Checklist:

1. **Create Railway Project:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Initialize project
   railway init

   # Link to GitHub
   railway link
   ```

2. **Add PostgreSQL:**
   - In Railway dashboard: New > Database > PostgreSQL
   - Railway automatically sets `$DATABASE_URL`

3. **Set Environment Variables:**
   - Copy all from `.env.example`
   - Set production values
   - Use Railway variables for secrets

4. **Deploy:**
   ```bash
   railway up
   # Or configure GitHub auto-deploy
   ```

5. **Run Migrations:**
   ```bash
   railway run alembic upgrade head
   ```

6. **Verify Health:**
   ```bash
   curl https://your-app.railway.app/health
   ```

---

## SUCCESS CRITERIA

- [ ] Railway project created
- [ ] PostgreSQL database connected
- [ ] Environment variables set
- [ ] Health check returns 200
- [ ] Migrations run successfully
- [ ] App accessible via HTTPS
- [ ] GitHub auto-deploy configured

---

## COMMIT MESSAGE

```
feat(deploy): configure Railway deployment with PostgreSQL

Set up production deployment to Railway platform.

Implementation:
- railway.json configuration
- Health check endpoint
- PostgreSQL database integration
- Environment variable setup
- Automated migrations on deploy
- HTTPS enabled
- GitHub auto-deploy

Components:
- Backend API on Railway
- PostgreSQL database
- Automated health checks
- Migration on deployment
- Production environment config

Impact:
- Production-ready deployment
- Scalable infrastructure
- Automated deployments
- Database backups
- HTTPS security

Closes: Railway deployment setup
```

---

## NOTES

### Your Existing Railway Setup:
- ✅ **PostgreSQL is ALREADY RUNNING on Railway** - No need to create it
- ✅ Railway automatically provides `DATABASE_URL` environment variable
- ✅ Your existing database will be used by the application
- ✅ Just need to configure other environment variables (secrets, SMTP, AI keys)

### What This Agent Does:
- Configures deployment settings (railway.json, Procfile)
- Sets up health check endpoint
- Configures environment variables (JWT secrets, SMTP, etc.)
- Sets up automated migrations on deploy
- Does NOT create a new database - uses your existing Railway PostgreSQL

### Environment Variables to Set:
You'll need to set these in Railway dashboard (Database URL is already set):
- `JWT_SECRET_KEY` - Generate with `openssl rand -hex 32`
- `SECRET_KEY` - Generate with `openssl rand -hex 32`
- `SMTP_SERVER`, `SMTP_USERNAME`, `SMTP_PASSWORD` - Your email provider
- `OPENROUTER_API_KEY` - Your AI API key
- `CORS_ORIGINS` - Your production domain

### Railway Dashboard:
```bash
# Check your existing setup
railway variables

# Should show:
DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway  ✅ Already set
```

---

**READY TO EXECUTE**
