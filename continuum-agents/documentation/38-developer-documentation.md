# Agent 38: Developer Documentation
**Priority:** P2 - MEDIUM
**Estimated Time:** 2 days
**Dependencies:** 31-development-environment-setup
**Category:** Documentation

---

## OBJECTIVE

Create comprehensive developer documentation for onboarding and contribution.

---

## IMPLEMENTATION

### Main Documentation Files:

**File:** `/README.md`

```markdown
# Continuum - Estate Planning Platform

Compassionate, user-guided estate planning application.

## Quick Start

```bash
# Setup
./scripts/setup-dev.sh

# Run backend
cd backend && uvicorn main:app --reload

# Run frontend
cd frontend && npm run dev
```

## Architecture

- **Backend**: FastAPI + SQLModel + PostgreSQL
- **Frontend**: SvelteKit + TypeScript
- **Deployment**: Railway
- **AI**: Claude via OpenRouter

## Documentation

- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Deployment](docs/DEPLOYMENT.md)

## Key Principles

1. **Empathy First**: This is a death planning app - compassion is not optional
2. **User Agency**: Never rush users, always offer choice
3. **Context Awareness**: Different tone for owner vs executor vs family helper
4. **Type Safety**: Strict typing across frontend and backend

## License

MIT
```

**File:** `/docs/ARCHITECTURE.md`

```markdown
# Architecture Overview

## System Design

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
┌──────▼──────┐
│  SvelteKit  │ Frontend (TypeScript)
│   Frontend  │
└──────┬──────┘
       │ REST API
┌──────▼──────┐
│   FastAPI   │ Backend (Python)
│   Backend   │
└──────┬──────┘
       │ SQLModel
┌──────▼──────┐
│ PostgreSQL  │ Database
└─────────────┘
```

## Key Components

### Backend
- **FastAPI**: REST API framework
- **SQLModel**: ORM with Pydantic integration
- **Alembic**: Database migrations
- **JWT**: Authentication

### Frontend
- **SvelteKit**: Framework
- **TypeScript**: Type safety
- **Stores**: State management
- **Service Workers**: Offline support

## Data Flow

1. User interacts with SvelteKit UI
2. Frontend calls FastAPI REST API
3. Backend validates JWT token
4. Backend queries PostgreSQL
5. Response sent back to frontend
6. UI updates via Svelte stores

## Security

- JWT token authentication
- HTTPS only in production
- CORS configured for production domains
- SQL injection prevention via SQLModel
- XSS prevention via Svelte's auto-escaping

## Deployment

- **Platform**: Railway
- **Database**: PostgreSQL (Railway addon)
- **Frontend**: Static build served by backend
- **CI/CD**: GitHub Actions
```

**File:** `/docs/CONTRIBUTING.md`

```markdown
# Contributing to Continuum

## Development Setup

1. Clone repository
2. Run `./scripts/setup-dev.sh`
3. Create feature branch
4. Make changes
5. Run tests
6. Submit pull request

## Code Style

- **Python**: Follow PEP 8, use black formatter
- **TypeScript**: Follow Airbnb style, use prettier
- **Commits**: Conventional commits (feat:, fix:, docs:, etc.)

## Testing

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## Pull Request Process

1. Update tests
2. Update documentation
3. Ensure all tests pass
4. Request review
5. Address feedback
6. Squash commits

## Emotional Tone Guidelines

**CRITICAL**: Continuum is a death planning application.

- ✅ Use empathetic, supportive language
- ✅ Acknowledge emotional difficulty
- ✅ Give users agency and choice
- ❌ Never rush users
- ❌ Avoid efficiency language
- ❌ No "quick" or "fast" language

See `EMOTIONAL_TONE_AUDIT.md` for details.
```

---

## SUCCESS CRITERIA

- [ ] README.md created
- [ ] ARCHITECTURE.md created
- [ ] CONTRIBUTING.md created
- [ ] Setup instructions clear
- [ ] Code style documented
- [ ] Emotional tone guidelines included

---

## COMMIT MESSAGE

```
docs: create comprehensive developer documentation

Add onboarding and contribution documentation.

Implementation:
- README.md with quick start
- ARCHITECTURE.md with system design
- CONTRIBUTING.md with guidelines
- Setup instructions
- Code style guide
- Emotional tone guidelines

Impact:
- Easier onboarding
- Clear contribution process
- Documented architecture
- Emotional tone standards

Closes: Developer documentation
```

---

**READY TO EXECUTE**
