#!/bin/bash

# Verification Script for Post-Merge Status
# Run this after merging both PRs to verify what's complete and what remains

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   CONTINUUM MERGE VERIFICATION & STATUS CHECK              ║"
echo "╔════════════════════════════════════════════════════════════╗"
echo ""

# Ensure we're on main and up to date
echo "📥 Pulling latest from main..."
git checkout main
git pull origin main
echo ""

# Check for Phase 3 completed work
echo "══════════════════════════════════════════════════════════════"
echo "✅ PHASE 3 COMPLETED WORK (Should be in main after merge)"
echo "══════════════════════════════════════════════════════════════"
echo ""

# Authentication
echo "🔐 Authentication System:"
if [ -f "backend/routers/auth.py" ]; then
    echo "  ✅ Backend auth router exists"
else
    echo "  ❌ Backend auth router missing"
fi

if [ -f "frontend/src/lib/stores/auth.ts" ]; then
    echo "  ✅ Frontend auth store exists"
else
    echo "  ❌ Frontend auth store missing"
fi

if [ -f "frontend/src/lib/api/client.ts" ]; then
    echo "  ✅ API client with JWT exists"
else
    echo "  ❌ API client missing"
fi

if [ -f "frontend/src/routes/auth/login/+page.svelte" ]; then
    echo "  ✅ Login page exists"
else
    echo "  ❌ Login page missing"
fi

if [ -f "frontend/src/routes/auth/signup/+page.svelte" ]; then
    echo "  ✅ Signup page exists"
else
    echo "  ❌ Signup page missing"
fi

# Check for hardcoded USER_ID (should be removed)
echo ""
echo "🔍 Checking for hardcoded USER_ID (should be 0):"
USER_ID_COUNT=$(grep -r "const USER_ID = 1" frontend/src/routes/modules/ 2>/dev/null | wc -l)
echo "  Found $USER_ID_COUNT instances (should be 0)"
if [ "$USER_ID_COUNT" -eq 0 ]; then
    echo "  ✅ All hardcoded USER_ID removed"
else
    echo "  ❌ Still has hardcoded USER_ID in:"
    grep -r "const USER_ID = 1" frontend/src/routes/modules/ 2>/dev/null | cut -d: -f1
fi

# Email Service
echo ""
echo "📧 Email Service:"
if [ -f "backend/services/email_service.py" ]; then
    echo "  ✅ Email service exists"
else
    echo "  ❌ Email service missing"
fi

if [ -d "backend/templates/emails" ]; then
    TEMPLATE_COUNT=$(ls backend/templates/emails/*.html 2>/dev/null | wc -l)
    echo "  ✅ Email templates directory exists ($TEMPLATE_COUNT templates)"
else
    echo "  ❌ Email templates missing"
fi

# Data Persistence
echo ""
echo "💾 Data Persistence (SyncManager):"
if [ -f "frontend/src/lib/services/sync.svelte.ts" ]; then
    echo "  ✅ SyncManager exists"
else
    echo "  ❌ SyncManager missing"
fi

# Count stores using SyncManager
SYNC_STORES=$(grep -r "registerSync" frontend/src/lib/stores/ 2>/dev/null | wc -l)
echo "  📊 Stores using SyncManager: $SYNC_STORES"

# Quick Fixes
echo ""
echo "🔧 Quick Fixes:"
if grep -q "startRegistration" frontend/src/routes/modules/pulse/settings/+page.svelte 2>/dev/null; then
    echo "  ✅ WebAuthn import fixed"
else
    echo "  ❌ WebAuthn import still missing"
fi

if grep -q "hours=interval_hours" backend/pulse_scheduler.py 2>/dev/null; then
    echo "  ✅ Pulse scheduler fixed (hourly)"
elif grep -q "hours=1" backend/pulse_scheduler.py 2>/dev/null; then
    echo "  ✅ Pulse scheduler fixed (hourly)"
else
    echo "  ⚠️  Pulse scheduler may still be per-minute"
fi

# Documentation
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "📚 DOCUMENTATION (Should be in main after merge)"
echo "══════════════════════════════════════════════════════════════"
echo ""

DOCS=("AUTHENTICATION_IMPLEMENTATION.md" "EMAIL_INTEGRATION_GUIDE.md" "DATA_PERSISTENCE_STATUS.md" "COMPREHENSIVE_TASK_LIST.md" "AGENT_SUGGESTIONS.md" "CODEBASE_REVIEW_REPORT.md" "QUICK_START_FIX_GUIDE.md")

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    else
        echo "  ❌ $doc missing"
    fi
done

# Agent Specifications
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "🤖 AGENT SPECIFICATIONS (Should be in main after PR #1)"
echo "══════════════════════════════════════════════════════════════"
echo ""

if [ -d ".claude/agents" ]; then
    AGENT_COUNT=$(ls .claude/agents/*.md 2>/dev/null | wc -l)
    echo "  ✅ Agent directory exists with $AGENT_COUNT agents"
else
    echo "  ❌ .claude/agents directory missing"
fi

if [ -d "continuum-agents" ]; then
    CONTINUUM_AGENT_COUNT=$(find continuum-agents -name "*.md" 2>/dev/null | wc -l)
    echo "  ✅ continuum-agents directory exists with $CONTINUUM_AGENT_COUNT agent files"
else
    echo "  ❌ continuum-agents directory missing"
fi

if [ -d ".claude/skills" ]; then
    SKILLS_COUNT=$(ls .claude/skills/*.md 2>/dev/null | wc -l)
    echo "  ✅ Skills directory exists with $SKILLS_COUNT skills"
else
    echo "  ❌ .claude/skills directory missing"
fi

# Remaining Work Summary
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "📋 REMAINING WORK SUMMARY"
echo "══════════════════════════════════════════════════════════════"
echo ""

if [ -f "COMPREHENSIVE_TASK_LIST.md" ]; then
    echo "See COMPREHENSIVE_TASK_LIST.md for complete breakdown:"
    echo ""
    echo "  🔥 Phase 1 - Critical Infrastructure (P0): ~44 hours"
    echo "     • Authentication guards on protected routes"
    echo "     • Complete data persistence (family/insurance/medical/pets)"
    echo "     • Media upload infrastructure"
    echo "     • Email production configuration"
    echo "     • AI empathy fix (CRITICAL)"
    echo ""
    echo "  ⚡ Phase 2 - High Priority (P1): ~94 hours"
    echo "     • Configuration management"
    echo "     • Database migrations (Alembic)"
    echo "     • Error handling standardization"
    echo "     • Security hardening"
    echo "     • Emotional tone improvements"
    echo ""
    echo "  🧪 Phase 3 - Testing & Quality (P2): ~90 hours"
    echo "     • Unit tests (80% backend, 60% frontend)"
    echo "     • E2E tests with Playwright"
    echo "     • API documentation"
    echo "     • Integration tests"
    echo ""
    echo "  🚀 Phase 4 - Production Readiness (P2): Included in Phase 2"
    echo ""
    echo "  🎯 Phase 5 - Polish & Optimization (P3): ~56 hours"
    echo "     • Type safety enforcement"
    echo "     • Offline PWA mode"
    echo "     • Performance optimization"
    echo ""
    echo "  📊 TOTAL REMAINING: ~284 hours (6-7 weeks)"
else
    echo "  ⚠️  COMPREHENSIVE_TASK_LIST.md not found"
    echo "  This should be created after feature/phase-3-persistence merge"
fi

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "✅ NEXT IMMEDIATE ACTIONS"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "1. Start Phase 1 with authentication guards (8 hours)"
echo "   Agent: authentication-architect"
echo "   Files: frontend/src/routes/dashboard/+page.ts (and more)"
echo ""
echo "2. Complete data persistence (16 hours)"
echo "   Agent: data-persistence-unifier"
echo "   Create: backend/models/family_models.py (and more)"
echo ""
echo "3. Build media upload infrastructure (12 hours)"
echo "   Agent: media-upload-infrastructure"
echo "   Create: backend/routers/media.py, frontend components"
echo ""
echo "4. Configure Postmark for production (4 hours)"
echo "   Agent: email-integration"
echo "   Environment: Set EMAIL_PROVIDER=postmark in Railway"
echo ""
echo "5. Fix AI empathy [CRITICAL] (4 hours)"
echo "   Agent: ai-empathy"
echo "   Fix: Remove 'NO FLUFF' from aiConciergeService.ts line 72"
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "📖 VERIFICATION COMPLETE"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "Run this script again after any major changes to verify status."
echo ""
