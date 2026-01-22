# Continuum Agent: Deploy to Railway
## Slash Command: /deploy

Execute Agent 23: Railway Deployment - Deploy Continuum to Railway platform.

---

## What This Does

Executes the Railway Deployment agent to configure production deployment.

**Priority:** P1-HIGH

**This agent:**
- Configures `railway.json` for deployment
- Sets up health check endpoint
- Configures environment variables
- Sets up automated migrations on deploy
- Enables HTTPS
- Configures GitHub auto-deploy

**Time Estimate:** 4 hours

---

## Dependencies

- Agent 05 (Configuration Management)
- Agent 11 (Database Migration System)

---

## Execution

Read and execute the agent specification:
`/home/user/Continuum/continuum-agents/deployment/23-railway-deployment-agent.md`

This agent will:
1. Read the specification file
2. Create `railway.json` configuration
3. Create `Procfile` for process management
4. Add health check endpoint to FastAPI
5. Document environment variables to set
6. Set up GitHub auto-deploy
7. Test deployment
8. Commit changes

---

## Important Notes

- **Railway PostgreSQL:** Uses your existing Railway database
- DATABASE_URL is automatically provided by Railway
- You'll need to set other environment variables:
  - JWT_SECRET_KEY
  - SECRET_KEY
  - SMTP credentials
  - OPENROUTER_API_KEY
- Railway CLI will be used for deployment

---

## Environment Variables to Set in Railway Dashboard:

```bash
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
SECRET_KEY=<generate-with-openssl-rand-hex-32>
SMTP_SERVER=smtp.sendgrid.net
SMTP_USERNAME=apikey
SMTP_PASSWORD=<your-sendgrid-api-key>
OPENROUTER_API_KEY=<your-ai-api-key>
CORS_ORIGINS=https://continuum.up.railway.app
```

---

**Execute this agent by running:**
```
Read and execute /home/user/Continuum/continuum-agents/deployment/23-railway-deployment-agent.md
```
