import requests
import sys

def test_bypass_login():
    url = "http://localhost:8000/api/auth/token"
    # Using data=... sends application/x-www-form-urlencoded
    payload = {
        "username": "jh@continuum.estate",
        "password": "bypass_password_ignored"
    }
    
    print(f"Attempting login to {url} with {payload['username']}...")
    try:
        response = requests.post(url, data=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            if token:
                print("\nSUCCESS: Access Token received!")
                return True
            else:
                print("\nFAILURE: 200 OK but no token found.")
                return False
        else:
            print("\nFAILURE: valid status code not received.")
            return False
            
    except Exception as e:
        print(f"\nEXCEPTION: {e}")
        return False

if __name__ == "__main__":
    if test_bypass_login():
        sys.exit(0)
    else:
        sys.exit(1)
