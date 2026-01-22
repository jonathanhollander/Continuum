#!/usr/bin/env python3
"""
Helper script to post GitHub issue updates with automatic .env loading.

Usage:
    python3 post_update.py complete_issue_7.py
    python3 post_update.py claim_issue_8.py
"""
import sys
import os
import subprocess
from pathlib import Path

def load_env_file():
    """Load environment variables from .env file."""
    env_file = Path(__file__).parent / '.env'

    if not env_file.exists():
        print("❌ Error: .env file not found in github_issues/")
        print("Create it with: echo 'GITHUB_TOKEN=your_token' > github_issues/.env")
        sys.exit(1)

    # Read .env file
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

    if 'GITHUB_TOKEN' not in os.environ:
        print("❌ Error: GITHUB_TOKEN not found in .env file")
        sys.exit(1)

    print(f"✅ Loaded GITHUB_TOKEN from .env")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 post_update.py <script_name.py>")
        print("\nAvailable scripts:")
        scripts_dir = Path(__file__).parent
        for script in sorted(scripts_dir.glob("*.py")):
            if script.name != "post_update.py":
                print(f"  - {script.name}")
        sys.exit(1)

    script_name = sys.argv[1]
    script_path = Path(__file__).parent / script_name

    if not script_path.exists():
        print(f"❌ Error: Script not found: {script_name}")
        sys.exit(1)

    # Load environment variables
    load_env_file()

    # Run the script
    print(f"\n🚀 Running {script_name}...")
    result = subprocess.run([sys.executable, str(script_path)])
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
