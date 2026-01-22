# Continuum Agent Skills

Claude Code skills for executing Continuum transformation agents.

---

## Available Slash Commands

### Quick Access (Most Common):

- `/config-setup` - **Execute FIRST** - Set up configuration system (Agent 05)
- `/fix-empathy` - **CRITICAL** - Fix AI anti-empathy directive (Agent 15)
- `/fix-auth` - Fix authentication security issue (Agent 01)
- `/fix-data` - Fix data persistence for 11 modules (Agent 02)
- `/deploy` - Deploy to Railway (Agent 23)

### Master Command:

- `/agent [number]` - Execute any agent by number (1-41)
- `/agent [keyword]` - Execute by keyword (empathy, auth, data, etc.)

---

## Usage Examples

```bash
# Execute critical agents
/config-setup          # Agent 05 - MUST BE FIRST
/fix-empathy          # Agent 15 - Product viability fix
/fix-auth             # Agent 01 - Security fix
/fix-data             # Agent 02 - Data loss fix

# Execute any agent by number
/agent 05             # Configuration Management
/agent 15             # AI Empathy
/agent 23             # Railway Deployment

# Execute by keyword
/agent empathy        # Agent 15
/agent auth           # Agent 01
/agent data           # Agent 02
/agent deploy         # Agent 23
```

---

## All 41 Agents

### P0-CRITICAL (Execute First):
1. `/config-setup` or `/agent 05` - Configuration Management
2. `/fix-empathy` or `/agent 15` - AI Empathy Agent
3. `/fix-auth` or `/agent 01` - Authentication Architect
4. `/fix-data` or `/agent 02` - Data Persistence Unifier

### Technical Infrastructure (14):
- `/agent 01` - Authentication Architect
- `/agent 02` - Data Persistence Unifier
- `/agent 03` - Media Upload Infrastructure
- `/agent 04` - Email Integration
- `/agent 05` - Configuration Management
- `/agent 06` - WebAuthn Quick Fix
- `/agent 07` - Pulse Scheduler Tuner
- `/agent 08` - Error Handling Standardization
- `/agent 09` - API Response Standardization
- `/agent 10` - Frontend State Management
- `/agent 11` - Database Migration System
- `/agent 12` - Logging System
- `/agent 13` - File Upload System
- `/agent 14` - Offline Mode Support

### Emotional Tone (8):
- `/agent 15` - AI Empathy Agent ⭐
- `/agent 16` - Module Header Rewrite
- `/agent 17` - Context-Aware Messaging
- `/agent 18` - Empty State Compassion
- `/agent 19` - Button Language Audit
- `/agent 20` - Grief-Aware Executor Mode
- `/agent 21` - Progress Celebration
- `/agent 22` - Overwhelming Moment Detection

### Deployment (3):
- `/agent 23` or `/deploy` - Railway Deployment
- `/agent 24` - Deployment Validation
- `/agent 25` - Rollback Strategy

### Interoperability (5):
- `/agent 26` - FastAPI Development
- `/agent 27` - API Contract Validator
- `/agent 28` - Type Safety Enforcer
- `/agent 29` - Database Schema Coordinator
- `/agent 30` - Frontend-Backend Sync

### Environment (2):
- `/agent 31` - Development Environment Setup
- `/agent 32` - Local Testing Environment

### Testing (2):
- `/agent 33` - Unit Test Suite
- `/agent 34` - End-to-End Tests

### Monitoring (2):
- `/agent 35` - Error Tracking
- `/agent 36` - Performance Monitoring

### Documentation (2):
- `/agent 37` - API Documentation
- `/agent 38` - Developer Documentation

### GitHub Review (3):
- `/agent 39` - GitHub PR Reviewer
- `/agent 40` - Breaking Change Detector
- `/agent 41` - Security Vulnerability Scanner

---

## Recommended Execution Order

### Week 1 - Critical Foundation:
```bash
/config-setup         # Day 1 - FIRST!
/fix-empathy         # Day 2 - Product fix
/fix-auth            # Day 3-4 - Security
/fix-data            # Day 5-7 - Data loss
```

### Week 2 - Emotional Tone:
```bash
/agent 16            # Module headers
/agent 17            # Context-aware messaging
/agent 18            # Empty states
/agent 19            # Button language
/agent 20            # Grief-aware mode
/agent 21            # Progress celebration
/agent 22            # Overwhelm detection
```

### Week 3 - Infrastructure & Deployment:
```bash
/agent 03-14         # Remaining tech infrastructure
/deploy              # Railway deployment
/agent 24-25         # Deployment validation & rollback
/agent 26-30         # Interoperability
```

### Week 4 - Quality & Automation:
```bash
/agent 31-38         # Environment, testing, monitoring, docs
/agent 39-41         # GitHub review automation
```

---

## How Agents Work

When you execute a skill:

1. Claude reads the agent specification from `/continuum-agents/`
2. Follows all implementation steps
3. Makes code changes
4. Runs validation checks
5. Tests the implementation
6. Commits with detailed message

All agents are:
- Self-contained specifications
- Production-ready code
- Validated and tested
- Properly documented

---

## Railway PostgreSQL Note

**Important:** PostgreSQL is ALREADY RUNNING on Railway.

All database agents will:
- Use your existing Railway PostgreSQL
- Create tables in the existing database
- Use the `DATABASE_URL` Railway provides
- No need to create a new database

---

## Getting Help

- View agent details: `/agent info [number]`
- List all agents: `/agent list`
- Execute specific agent: `/agent [number]`

For questions about specific agents, check the agent specification files in:
`/home/user/Continuum/continuum-agents/`
