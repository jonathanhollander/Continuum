#!/usr/bin/env python3
"""Update Issue #6 with implementation details"""
import requests
import os

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"
ISSUE_NUM = 6

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

comment = """## ✅ Implementation Complete

**Changes Made:**

### 1. Enhanced System Prompt with Stronger Empathy Focus
- Replaced "TONE & PERSONA" with explicit "EMPATHY IS YOUR PRIMARY FUNCTION" statement
- Added critical warning that compassion > completion
- Removed any task-focused language from core principles

### 2. Added Role-Aware Context System
**New Interface:**
```typescript
export interface AIContext {
    userRole?: 'owner' | 'executor' | 'family';
    moduleName?: string;
    emotionalState?: 'calm' | 'overwhelmed' | 'uncertain';
}
```

**Role-Specific Adaptations:**
- **Executor**: Grief-aware language, extra compassion, encourages breaks
- **Family**: Supportive, helps understand value of work
- **Owner**: Acknowledges courage, contemplative, values-focused

### 3. Strengthened Empathy Guidelines
- "ACKNOWLEDGE COURAGE ALWAYS" - reinforced as primary behavior
- "EMOTIONAL SAFETY IS PARAMOUNT" - prioritizes well-being over data
- Explicitly banned efficiency language: "quick", "fast", "done", "just", "simply"
- Added "RESPECT THEIR PACE" rule

### 4. Updated Primary Rules
- Rule #1 now: "EMPATHY FIRST, DATA SECOND"
- Changed "GENTLE PACING" to "GENTLE GUIDANCE (Never Demand)"
- Added "NO EFFICIENCY PRESSURE" rule
- All suggestions framed as invitations, not demands

### 5. Added Helper Functions
```typescript
export function detectUserRole(): 'owner' | 'executor' | 'family'
```

**File Modified:** `/frontend/src/lib/services/aiConciergeService.ts`

**Testing Needed:**
- [ ] Test AI responses with executor role context
- [ ] Test AI responses with owner role context
- [ ] Verify no efficiency language appears in responses
- [ ] Confirm AI offers breaks when detecting overwhelm

**Notes:**
The "NO FLUFF" directive mentioned in the issue didn't exist in current code - the prompt was already compassionate. However, I've significantly strengthened the empathy focus and added role-awareness as specified in the requirements.
"""

url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{ISSUE_NUM}/comments"
response = requests.post(url, headers=headers, json={"body": comment})

if response.status_code == 201:
    print(f"✅ Successfully updated Issue #{ISSUE_NUM}")
else:
    print(f"❌ Failed: {response.status_code}")
    print(response.json())
