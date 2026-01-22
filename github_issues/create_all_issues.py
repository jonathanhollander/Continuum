#!/usr/bin/env python3
"""
Bulk create all 36 GitHub issues using REST API
"""
import requests
import json

import os
TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"

headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

# Phase 1 Issues
issues = [
    {
        "title": "P0: Add authentication guards to protected routes (redirect to login)",
        "body": """Add route guards to all protected pages that redirect unauthenticated users to login.

**Agent:** authentication-architect
**Skill:** fix-auth
**Time:** 8 hours

**Files to Create:**
- /frontend/src/routes/dashboard/+page.ts
- /frontend/src/routes/modules/+layout.ts
- /frontend/src/routes/settings/+page.ts
- /frontend/src/routes/binder/+page.ts

**Success Criteria:**
- [ ] All protected routes have guards
- [ ] Unauthenticated users redirect to /login
- [ ] After login, redirect back to original destination
- [ ] No hardcoded USER_ID anywhere

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md""",
        "labels": ["P0-critical", "authentication"]
    },
    {
        "title": "P0: Create backend models and sync for family, insurance, medical, pets",
        "body": """Create SQLModel models and frontend stores for remaining modules using SyncManager pattern.

**Agent:** data-persistence-unifier
**Skill:** fix-data
**Time:** 16 hours

**Models to Create:**
- backend/models/family_models.py
- backend/models/insurance_models.py
- backend/models/medical_models.py
- backend/models/pet_models.py
- backend/models/funeral_models.py

**Stores to Refactor:**
- frontend/src/lib/stores/familyStore.svelte.ts
- frontend/src/lib/stores/insuranceStore.svelte.ts
- frontend/src/lib/stores/medicalStore.svelte.ts
- frontend/src/lib/stores/petStore.svelte.ts
- frontend/src/lib/stores/funeralStore.svelte.ts

**Success Criteria:**
- [ ] All models created with proper relationships
- [ ] All stores use SyncManager pattern
- [ ] Data persists to database
- [ ] Data accessible across devices

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md""",
        "labels": ["P0-critical", "data-persistence", "backend"]
    },
    {
        "title": "P0: Build media upload infrastructure (replace IndexedDB with backend)",
        "body": """Replace IndexedDB file storage with proper backend file upload system.

**Agent:** media-upload-infrastructure
**Time:** 12 hours

**Backend:**
- Create backend/routers/media.py
- Create backend/models/media.py
- Set up file storage (local + S3-compatible)

**Frontend:**
- Create MediaUploader.svelte component
- Update all modules using file uploads
- Create migration path from IndexedDB

**Success Criteria:**
- [ ] Files upload to backend
- [ ] Files persist across devices
- [ ] Media accessible via URL
- [ ] IndexedDB migration complete

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md""",
        "labels": ["P0-critical", "media", "backend", "frontend"]
    },
    {
        "title": "P0: Configure email service for production (Postmark)",
        "body": """Set up production email service with Postmark for Railway deployment.

**Agent:** email-integration
**Time:** 4 hours

**Tasks:**
- Get Postmark API key
- Set Railway environment variables
- Test email sending in production
- Verify templates render correctly

**Railway Variables:**
- EMAIL_PROVIDER=postmark
- POSTMARK_API_KEY=your_key
- EMAIL_FROM_ADDRESS=noreply@yourdomain.com

**Success Criteria:**
- [ ] Emails send successfully in production
- [ ] All templates tested
- [ ] Delivery tracking works
- [ ] Bounce handling configured

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md""",
        "labels": ["P0-critical", "email"]
    },
    {
        "title": "P0: [CRITICAL] Fix AI empathy - remove 'NO FLUFF' directive",
        "body": """🚨 CRITICAL UX ISSUE: The AI Concierge system prompt says "NO FLUFF: Skip empathetic filler" which is fundamentally wrong for death planning context.

**Agent:** ai-empathy
**Skill:** fix-empathy
**Time:** 4 hours

**File:** /frontend/src/lib/services/aiConciergeService.ts (line 72)

**Current Problem:**
```
7. NO FLUFF: Keep it professional and concise. Skip the empathetic filler.
```

**Fix:** Rewrite entire system prompt to prioritize empathy, compassion, and emotional support.

**Success Criteria:**
- [ ] System prompt emphasizes empathy first
- [ ] Acknowledges emotional difficulty
- [ ] Uses warm, supportive tone
- [ ] No efficiency/task-focused language
- [ ] Tested with real scenarios

**Details:** See github_issues/PHASE_1_P0_CRITICAL.md""",
        "labels": ["P0-critical", "emotional-tone", "frontend"]
    }
]

def create_labels():
    """Create all required labels"""
    labels_data = [
        {"name": "P0-critical", "color": "d73a4a", "description": "Critical - must be done immediately"},
        {"name": "P1-high", "color": "ff6b6b", "description": "High priority - next 2 weeks"},
        {"name": "P2-testing", "color": "ffa500", "description": "Testing and quality - weeks 3-4"},
        {"name": "P3-polish", "color": "ffeb3b", "description": "Polish and optimization - week 5+"},
        {"name": "authentication", "color": "0052cc", "description": "Authentication and authorization"},
        {"name": "data-persistence", "color": "0e8a16", "description": "Database and data storage"},
        {"name": "media", "color": "8b4513", "description": "File uploads and media storage"},
        {"name": "email", "color": "1d76db", "description": "Email service integration"},
        {"name": "emotional-tone", "color": "e99695", "description": "UX tone and compassionate language"},
        {"name": "backend", "color": "0e8a16", "description": "Backend/Python work"},
        {"name": "frontend", "color": "0052cc", "description": "Frontend/TypeScript/Svelte work"},
    ]

    print("Creating labels...")
    for label in labels_data:
        url = f"https://api.github.com/repos/{OWNER}/{REPO}/labels"
        response = requests.post(url, headers=headers, json=label)
        if response.status_code == 201:
            print(f"✓ Created label: {label['name']}")
        elif response.status_code == 422:
            print(f"- Label exists: {label['name']}")
        else:
            print(f"✗ Failed to create {label['name']}: {response.status_code}")

def create_issues():
    """Create all issues"""
    print(f"\nCreating {len(issues)} issues...")

    for i, issue in enumerate(issues, 1):
        url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues"
        response = requests.post(url, headers=headers, json=issue)

        if response.status_code == 201:
            issue_num = response.json()['number']
            print(f"✓ Issue #{issue_num}: {issue['title']}")
        else:
            print(f"✗ Failed to create issue {i}: {response.status_code}")
            print(f"   {response.json().get('message', 'Unknown error')}")

if __name__ == "__main__":
    print("GitHub Issue Creator - Phase 1 (5 critical issues)")
    print("=" * 60)
    create_labels()
    create_issues()
    print("\n✅ Done! View issues at:")
    print(f"   https://github.com/{OWNER}/{REPO}/issues")
