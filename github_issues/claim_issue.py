#!/usr/bin/env python3
"""Claim a GitHub issue by adding a comment"""
import requests
import os
from datetime import datetime

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"
ISSUE_NUM = 6

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

comment = f"""🤖 **Claude Agent Claimed This Issue**

**Status:** In Progress
**Started:** {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}
**Agent:** ai-empathy

Working on fixing the AI Concierge empathy system. Will investigate current implementation and make necessary improvements.
"""

url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{ISSUE_NUM}/comments"
response = requests.post(url, headers=headers, json={"body": comment})

if response.status_code == 201:
    print(f"✅ Successfully claimed Issue #{ISSUE_NUM}")
else:
    print(f"❌ Failed to claim issue: {response.status_code}")
    print(response.json())
