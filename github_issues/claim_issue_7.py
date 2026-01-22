#!/usr/bin/env python3
"""Claim Issue #8 (Alembic migrations - maps to GitHub Issue #8)"""
import requests
import os

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"
ISSUE_NUM = 8  # Alembic migrations issue on GitHub

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

comment = """🔧 **Claimed** - Setting up Alembic for proper database migration management. Will configure Alembic, create initial migration from current schema, and set up automatic migrations for Railway deployment."""

url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{ISSUE_NUM}/comments"
response = requests.post(url, headers=headers, json={"body": comment})

if response.status_code == 201:
    print(f"✅ Successfully claimed Issue #{ISSUE_NUM}")
else:
    print(f"❌ Failed: {response.status_code}")
    print(response.json())
