"""
Centralized rate limiting configuration using slowapi.
Defines limiters applied to sensitive or high-traffic endpoints.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize the Limiter with the correct key function
limiter = Limiter(key_func=get_remote_address)
