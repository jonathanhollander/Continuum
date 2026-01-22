
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import settings

from backend.utils.logger import get_logger

logger = get_logger(__name__)

client = TestClient(app)

def test_csp_headers():
    logger.info("Testing CSP Headers...")
    response = client.get("/")
    # Main endpoint might default to 404 if no root route, but middleware should still execute?
    # Actually, verify if root route exists or check another endpoint like /api/health if exists.
    # backend/main.py might not have a root route.
    # Let's try /openapi.json or similar.
    response = client.get("/openapi.json")
    
    csp = response.headers.get("content-security-policy")
    if csp:
        logger.info(f"CSP Header found: {csp}")
        if "default-src 'self'" in csp:
             logger.info("default-src 'self' verified")
        else:
             logger.warning("default-src 'self' missing")
    else:
        logger.error("CSP Header MISSING")

def test_rate_limiting():
    logger.info("Testing Rate Limiting (5/minute limit on /api/auth/signup)...")
    # We use signup or token. Signup has DB calls so might be slower.
    # /api/auth/token is easier but requires form data.
    # /api/auth/magic-link expects json.
    
    # Let's use /api/auth/magic-link as it's lighter validation
    url = "/api/auth/magic-link"
    data = {"email": "test@example.com"}
    
    # First 5 should succeed (or fail validation, but NOT rate limit)
    for i in range(1, 6):
        response = client.post(url, json=data)
        if response.status_code == 429:
             logger.error(f"Request {i} failed with 429 prematurely")
             return
        logger.info(f"Request {i}: {response.status_code}")
        
    # 6th should fail
    response = client.post(url, json=data)
    if response.status_code == 429:
        logger.info(f"Request 6 correctly Rate Limited (429): {response.json()}")
    else:
        logger.error(f"Request 6 NOT Rate Limited. Status: {response.status_code}")

if __name__ == "__main__":
    logger.info(f"Running Security Checks against env: {settings.ENVIRONMENT}")
    try:
        test_csp_headers()
        test_rate_limiting()
    except Exception as e:
        logger.error(f"Test Script Failed: {e}")
