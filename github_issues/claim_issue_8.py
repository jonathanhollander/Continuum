#!/usr/bin/env python3
"""Claim Issue #9 (Error Handling - maps to GitHub Issue #9)"""
import requests
import os

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"
ISSUE_NUM = 9  # Error handling standardization on GitHub

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

comment = """🔧 **Claimed** - Standardizing error handling across frontend and backend. Will create consistent error response formats, add compassionate user-facing error messages, and implement proper error logging and monitoring."""

url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{ISSUE_NUM}/comments"
response = requests.post(url, headers=headers, json={"body": comment})

if response.status_code == 201:
    print(f"✅ Successfully claimed Issue #{ISSUE_NUM}")
else:
    print(f"❌ Failed: {response.status_code}")
    print(response.json())
