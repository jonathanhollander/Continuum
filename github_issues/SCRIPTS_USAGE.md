# GitHub Issues Scripts - Usage Guide

Scripts for posting updates to GitHub issues for the Continuum project.

## Setup

1. **Create a GitHub Personal Access Token**:
   - Go to: https://github.com/settings/tokens/new
   - Give it a name: "Continuum Issues Bot"
   - Select scopes: `repo` (all sub-options)
   - Click "Generate token"
   - Copy the token (starts with `ghp_`)

2. **Configure the token**:
   ```bash
   cd github_issues
   echo "GITHUB_TOKEN=your_token_here" > .env
   ```

   The `.env` file is already gitignored, so your token won't be committed.

## Usage

### Using the Helper Script (Recommended)

The `post_update.py` helper automatically loads the token from `.env`:

```bash
# Post a completion update
python3 post_update.py complete_issue_7.py

# Claim an issue
python3 post_update.py claim_issue_8.py

# List available scripts
python3 post_update.py
```

### Running Scripts Directly

You can also run scripts directly (token must be in `.env`):

```bash
cd github_issues
export GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d= -f2)
python3 complete_issue_7.py
```

## Available Scripts

### Completion Scripts (Post Issue Updates)

- ✅ `complete_issue_7.py` - Alembic migrations (Issue #8) - **POSTED**
- ✅ `complete_issue_8.py` - Error handling standardization (Issue #9) - **POSTED**
- ✅ `update_issue_2.py` - Authentication guards (Issue #2) - **POSTED**
- ✅ `update_issue_3.py` - Backend models verification (Issue #3) - **POSTED**
- ✅ `update_issue_4.py` - Media upload verification (Issue #4) - **POSTED**
- ✅ `update_issue_5.py` - Email service verification (Issue #5) - **POSTED**
- ✅ `update_issue_6.py` - Configuration management (Issue #7) - **POSTED**

### Claim Scripts

- `claim_issue_5.py` - Email configuration (Issue #5)
- `claim_issue_7.py` - Alembic migrations (Issue #8)
- `claim_issue_8.py` - Error handling (Issue #9)

## Script Structure

Each script follows this pattern:

```python
#!/usr/bin/env python3
import requests
import os

TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"
ISSUE_NUM = 8  # GitHub issue number

headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

comment = """Your markdown comment here"""

url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{ISSUE_NUM}/comments"
response = requests.post(url, headers=headers, json={"body": comment})

if response.status_code == 201:
    print(f"✅ Successfully posted to Issue #{ISSUE_NUM}")
else:
    print(f"❌ Failed: {response.status_code}")
    print(response.json())
```

## Issue Status

| Local Doc Issue | GitHub Issue | Title | Status |
|-----------------|--------------|-------|--------|
| #2 | #2 | Authentication Guards | ✅ Complete - Posted |
| #3 | #3 | Backend Models & Sync | ✅ Complete - Posted |
| #4 | #4 | Media Upload Infrastructure | ✅ Complete - Posted |
| #5 | #5 | Email Configuration | ✅ Complete - Posted |
| #6 | #6 | AI Empathy Fix | ✅ Complete |
| #7 (Config) | #7 | Configuration Management | ✅ Complete - Posted |
| #7 (Alembic) | #8 | Alembic Migrations | ✅ Complete - Posted |
| #8 (Error) | #9 | Error Handling | ✅ Complete - Posted |
| #9 (Security) | #10 | Security Hardening | ⏳ Next |

## Troubleshooting

### 403 Forbidden Error

**Error**: `Resource not accessible by personal access token`

**Solution**: Make sure your GitHub token has the `repo` scope:
1. Go to: https://github.com/settings/tokens
2. Click on your token
3. Check that "repo" is selected (all sub-options)
4. Regenerate if needed

### Token Not Found

**Error**: `GITHUB_TOKEN not found in environment`

**Solution**:
1. Make sure `.env` file exists in `github_issues/` directory
2. Make sure it contains: `GITHUB_TOKEN=your_token_here`
3. Use the helper script: `python3 post_update.py script_name.py`

### Rate Limiting

**Error**: `403 rate limit exceeded`

**Solution**:
- Wait 1 hour for rate limit to reset
- GitHub allows 5000 requests/hour for authenticated requests

## Security

✅ `.env` files are in `.gitignore` - tokens won't be committed
✅ Scripts read token from environment variables
✅ No hardcoded credentials in code
✅ Token has minimal required permissions (repo scope only)

⚠️ **Never commit `.env` files**
⚠️ **Never share your GitHub token**
⚠️ **Regenerate token if accidentally exposed**

## GitHub API Reference

- [Create Issue Comment](https://docs.github.com/rest/issues/comments#create-an-issue-comment)
- [GitHub API Authentication](https://docs.github.com/rest/overview/authenticating-to-the-rest-api)
- [Personal Access Tokens](https://docs.github.com/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
