# Agent 31: Development Environment Setup
**Priority:** P2 - MEDIUM
**Estimated Time:** 4 hours
**Dependencies:** None
**Category:** Environment

---

## OBJECTIVE

Create automated development environment setup for new developers.

---

## IMPLEMENTATION

### Setup Script:

**File:** `/scripts/setup-dev.sh`

```bash
#!/bin/bash
# Development environment setup

echo "🚀 Setting up Continuum development environment..."

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "Python 3 required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }

# Backend setup
echo "\n📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# Frontend setup
echo "\n📦 Setting up frontend..."
cd ../frontend
npm install

# Environment files
echo "\n📝 Creating environment files..."
cp ../.env.example ../.env
echo "⚠️  Please edit .env with your configuration"

# Database
echo "\n💾 Setting up database..."
cd ../backend
python scripts/init_db.py

echo "\n✅ Setup complete!"
echo "\nTo start development:"
echo "  Backend:  cd backend && uvicorn main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
```

---

## SUCCESS CRITERIA

- [ ] Setup script created
- [ ] Works on clean install
- [ ] Prerequisites checked
- [ ] Documentation updated

---

## COMMIT MESSAGE

```
feat(dev): add automated development environment setup

Create one-command setup for new developers.

Implementation:
- Automated setup script
- Prerequisite checking
- Database initialization
- Documentation

Impact:
- Easier onboarding
- Consistent dev environments
- Reduced setup time

Closes: Dev environment automation
```

---

**READY TO EXECUTE**
