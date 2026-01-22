#!/usr/bin/env python3
"""Update Issue #2 with completion details"""
import requests
import os

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"
ISSUE_NUM = 2

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

comment = """## ✅ Implementation Complete

**Changes Made:**

### 1. Updated All Route Guards
- **Dashboard** (`/dashboard/+page.ts`): Now checks only `!user` (not `!user && !token`)
- **Modules** (`/modules/+layout.ts`): Protects ALL module routes, captures redirect URL
- **Settings** (`/settings/+page.ts`): Proper auth check with redirect parameter
- **Binder** (`/binder/+page.ts`): Proper auth check with redirect parameter

### 2. Enhanced Login Page
- Added `$page` store import for URL parameter access
- Implemented `redirectUrl` reactive variable from query param
- Login now redirects users to original destination after authentication
- Handles redirect for both passkey and magic link flows

### 3. Security Improvements
- All guards check user presence (not just token)
- Consistent redirect pattern: `/login?redirect=/original-path`
- Proper TypeScript typing with `PageLoad` and `LayoutLoad`

**Success Criteria Met:**
- [x] Protected routes redirect unauthenticated users to /login
- [x] After login, redirect back to original destination
- [x] All module routes protected via /modules/+layout.ts
- [x] Dashboard, settings, binder routes protected
- [x] Proper TypeScript types applied

**Testing Needed:**
- [ ] Navigate to /dashboard without login → redirects to /login
- [ ] Login → automatically redirected to original destination
- [ ] Refresh protected page → stays on page (token persists)
- [ ] Logout → redirects to login

**Files Modified:**
- `frontend/src/routes/dashboard/+page.ts`
- `frontend/src/routes/modules/+layout.ts`
- `frontend/src/routes/settings/+page.ts`
- `frontend/src/routes/binder/+page.ts`
- `frontend/src/routes/login/+page.svelte`
"""

url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{ISSUE_NUM}/comments"
response = requests.post(url, headers=headers, json={"body": comment})

if response.status_code == 201:
    print(f"✅ Successfully updated Issue #{ISSUE_NUM}")
else:
    print(f"❌ Failed: {response.status_code}")
    print(response.json())
