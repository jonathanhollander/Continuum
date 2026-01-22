#!/usr/bin/env python3
"""Claim Issue #5"""
import requests
import os

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"
ISSUE_NUM = 5

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

comment = """🔧 **Claimed** - Configuring production email service with Postmark. Will replace mock email implementation with real SMTP delivery for Pulse alerts and notifications."""

url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{ISSUE_NUM}/comments"
response = requests.post(url, headers=headers, json={"body": comment})

if response.status_code == 201:
    print(f"✅ Successfully claimed Issue #{ISSUE_NUM}")
else:
    print(f"❌ Failed: {response.status_code}")
    print(response.json())
