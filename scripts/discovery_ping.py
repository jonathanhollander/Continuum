import os
import yaml
import json
import urllib.request
import urllib.parse
from datetime import datetime

# Configuration
AGENT_DIR = "/Users/jonathanhollander/AI Code/Notion Template/Continuum_SaaS/.agent/agents"
PROXY_URL = "http://localhost:8080"
DASHBOARD_URL = "http://localhost:3000"

def get_agents():
    agents = []
    for filename in os.listdir(AGENT_DIR):
        if filename.endswith(".md"):
            path = os.path.join(AGENT_DIR, filename)
            with open(path, 'r') as f:
                content = f.read()
                if content.startswith("---"):
                    try:
                        # Simple YAML extract
                        parts = content.split("---")
                        if len(parts) >= 3:
                            data = yaml.safe_load(parts[1])
                            agents.append(data)
                    except Exception as e:
                        print(f"Error parsing {filename}: {e}")
    return agents

def send_ping(agent):
    name = agent.get('name', 'unknown-agent')
    model = agent.get('model', 'claude-3-5-sonnet')
    
    # Construct a dummy Anthropic message request
    # This will be intercepted by the Antigravity MITM Proxy (8080)
    # The proxy will record it and it will appear in the Dashboard (3000)
    
    payload = {
        "model": model,
        "max_tokens": 10,
        "messages": [
            {"role": "user", "content": f"Discovery Ping for agent: {name}"}
        ],
        "system": f"You are {name}. This is a non-functional system discovery ping."
    }
    
    body = json.dumps(payload).encode('utf-8')
    
    # We send to a dummy API URL that the proxy intercepts
    url = "https://api.anthropic.com/v1/messages"
    
    # Set up the request via the proxy
    proxy_handler = urllib.request.ProxyHandler({'https': PROXY_URL, 'http': PROXY_URL})
    opener = urllib.request.build_opener(proxy_handler)
    
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('X-Antigravity-Agent', name) # Meta-header for easy identification
    req.add_header('X-Discovery-Ping', 'true')
    
    print(f"Ping sent for agent: {name} (Model: {model})")
    
    try:
        # Note: We don't care if the real API fails (since it's a dummy request),
        # but the proxy will have captured the attempt.
        # We use a short timeout.
        with opener.open(req, timeout=2) as response:
            pass
    except Exception as e:
        # We expect errors (e.g. 401 Unauthorized from real API), 
        # but we only care that the PROXY saw it.
        pass

def main():
    print(f"Starting Discovery Ping for Continuum workforce...")
    agents = get_agents()
    print(f"Found {len(agents)} agents in indexing directory.")
    
    for agent in agents:
        send_ping(agent)
    
    print(f"\nDiscovery Ping complete. Checked {len(agents)} agents.")
    print(f"Check the Payload Inspector at {DASHBOARD_URL} to verify visibility.")

if __name__ == "__main__":
    main()
