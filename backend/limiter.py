"""
Centralized rate limiting configuration using slowapi.
Defines limiters applied to sensitive or high-traffic endpoints.
"""
import os

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

# On Railway, every public request passes Railway's edge, which documents
# X-Real-IP as the client's remote IP and overwrites any copy the caller sends
# (https://docs.railway.com/networking/public-networking/specs-and-limits).
# request.client.host there is a Railway edge hop, shared by many visitors.
# Off Railway (local dev) there is no edge, so the header is ignored.
_ON_RAILWAY = bool(os.environ.get("RAILWAY_ENVIRONMENT"))


def client_ip(request: Request) -> str:
    """The visitor's address: Railway's X-Real-IP on Railway, else the socket peer."""
    if _ON_RAILWAY:
        real_ip = request.headers.get("x-real-ip", "").strip()
        if real_ip:
            return real_ip
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip)
