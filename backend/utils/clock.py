"""Shared clock helper.

`utc_now()` returns the current UTC time as a naive datetime, the same value
the deprecated `datetime.utcnow()` produced, so naive-UTC DateTime columns and
comparisons against them stay unchanged.
"""
from datetime import datetime, timezone


def utc_now() -> datetime:
    """Current UTC time without tzinfo (drop-in for the deprecated datetime.utcnow())."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
