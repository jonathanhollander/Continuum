#!/usr/bin/env python3
"""Update all GitHub issues to reference local documentation"""
import requests
import time

import os
TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

# Comment to add to all issues
COMMENT = """
---

📚 **IMPORTANT: Local Documentation Required**

All implementation details, specifications, and context for this issue are in the local Continuum_SaaS folder:

- **Phase details:** `github_issues/PHASE_X_*.md` (contains full specifications)
- **Agent specs:** `.claude/agents/<agent-name>.md` (implementation guidance)
- **Comprehensive tasks:** `COMPREHENSIVE_TASK_LIST.md` (complete context)
- **Codebase:** Review existing code in `/backend` and `/frontend` folders

**Do NOT implement without reading the local documentation first.**

Agent working on this: Check phase markdown file for detailed requirements, success criteria, and code examples.
"""

def update_all_issues():
    """Add comment to all issues"""
    # Get all issues
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues"
    params = {"state": "open", "per_page": 100}
    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        print(f"Failed to get issues: {response.status_code}")
        return

    issues = response.json()
    print(f"Found {len(issues)} open issues")

    for issue in issues:
        issue_num = issue['number']

        # Skip if it's a PR
        if 'pull_request' in issue:
            print(f"- Skipping PR #{issue_num}")
            continue

        # Add comment
        comment_url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{issue_num}/comments"
        r = requests.post(comment_url, headers=headers, json={"body": COMMENT})

        if r.status_code == 201:
            print(f"✓ Updated issue #{issue_num}: {issue['title'][:50]}...")
        else:
            print(f"✗ Failed to update #{issue_num}: {r.status_code}")

        time.sleep(0.5)  # Rate limit protection

if __name__ == "__main__":
    print("Updating all GitHub issues with local documentation reference...")
    print("=" * 60)
    update_all_issues()
    print("\n✅ Done!")
