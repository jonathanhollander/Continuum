#!/usr/bin/env python3
"""Update PR #43 with correct title and description."""
import os
import requests

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
if not GITHUB_TOKEN:
    print("❌ GITHUB_TOKEN not set")
    exit(1)

headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github+json'
}

pr_data = {
    "title": "feat: simplify onboarding to single-page progressive flow",
    "body": """## Summary
- Redesigns onboarding as a single-page progressive flow
- Collects owner name (required) then offers path choice
- Both paths lead to contacts module (AI option opens concierge)
- No page reloads - questions appear progressively

## Changes
- Add `display_name` field to backend User model for owner's name
- Update OnboardingRequest/Response to include display_name
- Rewrite `/onboarding` page as single-page with smooth transitions
- Flow: Welcome → Name → Path choice → Contacts

## Test plan
- [ ] Sign up with new account
- [ ] Verify name input appears and is required
- [ ] Verify path choice appears after entering name
- [ ] Verify "Guide me" opens AI concierge and goes to contacts
- [ ] Verify "Explore" goes directly to contacts
- [ ] Verify display_name is persisted to backend

https://claude.ai/code/session_01GN8GQ21aZc8iyw1ZN5uzaQ"""
}

response = requests.patch(
    'https://api.github.com/repos/jonathanhollander/Continuum/pulls/43',
    headers=headers,
    json=pr_data
)

if response.status_code == 200:
    print("✅ PR #43 updated successfully!")
    print(f"   Title: {pr_data['title']}")
else:
    print(f"❌ Failed to update PR: {response.status_code}")
    print(response.text)
