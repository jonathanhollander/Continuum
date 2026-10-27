"""
Challenge Store for WebAuthn
Provides in-memory storage for development and PostgreSQL for production.

Usage:
    from backend.challenge_store import challenge_store

    # Store a challenge
    challenge_store.set(key, data, expire_seconds=300)

    # Retrieve and remove a challenge
    data = challenge_store.pop(key)
"""
import base64
import json
from abc import ABC, abstractmethod
from typing import Any, Optional
from datetime import datetime, timedelta
from backend.utils.clock import utc_now
from backend.config import settings
from backend.utils.logger import get_logger

logger = get_logger(__name__)


def _encode(value: Any) -> str:
    """JSON with bytes kept as base64 (WebAuthn challenges are bytes)."""
    def default(o):
        if isinstance(o, (bytes, bytearray)):
            return {"__bytes__": base64.b64encode(bytes(o)).decode("ascii")}
        raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")
    return json.dumps(value, default=default)


def _decode(raw: str) -> Any:
    def hook(d):
        if set(d) == {"__bytes__"}:
            return base64.b64decode(d["__bytes__"])
        return d
    return json.loads(raw, object_hook=hook)


class ChallengeStoreInterface(ABC):
    """Abstract interface for challenge storage"""

    @abstractmethod
    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        """Store a challenge with optional expiration"""
        pass

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Get a challenge without removing it"""
        pass

    @abstractmethod
    def pop(self, key: str) -> Optional[Any]:
        """Get and remove a challenge"""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete a challenge"""
        pass


class InMemoryChallengeStore(ChallengeStoreInterface):
    """In-memory challenge store for development"""

    def __init__(self):
        self._store: dict = {}
        self._expiry: dict = {}
        logger.info("Using in-memory challenge store (development mode)")

    def _cleanup_expired(self) -> None:
        """Remove expired challenges"""
        now = utc_now()
        expired_keys = [k for k, v in self._expiry.items() if v < now]
        for key in expired_keys:
            self._store.pop(key, None)
            self._expiry.pop(key, None)

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        """Store a challenge with expiration"""
        self._cleanup_expired()
        self._store[key] = value
        self._expiry[key] = utc_now() + timedelta(seconds=expire_seconds)
        logger.debug(f"Challenge stored: {key}")

    def get(self, key: str) -> Optional[Any]:
        """Get a challenge without removing it"""
        self._cleanup_expired()
        if key in self._expiry and self._expiry[key] < utc_now():
            self.delete(key)
            return None
        return self._store.get(key)

    def pop(self, key: str) -> Optional[Any]:
        """Get and remove a challenge"""
        self._cleanup_expired()
        value = self._store.pop(key, None)
        self._expiry.pop(key, None)
        if value:
            logger.debug(f"Challenge retrieved and removed: {key}")
        return value

    def delete(self, key: str) -> bool:
        """Delete a challenge"""
        if key in self._store:
            del self._store[key]
            self._expiry.pop(key, None)
            return True
        return False


class PostgresChallengeStore(ChallengeStoreInterface):
    """PostgreSQL-based challenge store for production"""

    def __init__(self):
        from backend.database import engine
        from sqlmodel import SQLModel, Field, Session, select, text

        # Create the challenges table if it doesn't exist. If Postgres is still waking, each later
        # use retries this, so the store stays on Postgres for the life of the process.
        self._table_ready = False
        try:
            self._ensure_table()
        except Exception as e:
            logger.warning(f"PostgreSQL challenge store will finish setup on first use: {e}")
        logger.info("Using PostgreSQL challenge store (production mode)")

    def _ensure_table(self) -> None:
        """Ensure the webauthn_challenges table exists (once per process, once it succeeds)"""
        if self._table_ready:
            return
        from backend.database import engine
        from sqlmodel import text

        create_table_sql = """
        CREATE TABLE IF NOT EXISTS webauthn_challenges (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires
            ON webauthn_challenges(expires_at);
        """

        with engine.connect() as conn:
            for statement in create_table_sql.strip().split(';'):
                if statement.strip():
                    conn.execute(text(statement))
            conn.commit()
        self._table_ready = True

    def _cleanup_expired(self) -> None:
        """Remove expired challenges"""
        from backend.database import engine
        from sqlmodel import text

        with engine.connect() as conn:
            conn.execute(
                text("DELETE FROM webauthn_challenges WHERE expires_at < :now"),
                {"now": utc_now()}
            )
            conn.commit()

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        """Store a challenge with expiration"""
        self._ensure_table()
        self._cleanup_expired()
        from backend.database import engine
        from sqlmodel import text

        expires_at = utc_now() + timedelta(seconds=expire_seconds)
        serialized = _encode(value)

        # Use upsert (INSERT ... ON CONFLICT)
        with engine.connect() as conn:
            # First try to delete any existing record
            conn.execute(
                text("DELETE FROM webauthn_challenges WHERE key = :key"),
                {"key": key}
            )
            # Then insert the new record
            conn.execute(
                text("""
                    INSERT INTO webauthn_challenges (key, value, expires_at)
                    VALUES (:key, :value, :expires_at)
                """),
                {"key": key, "value": serialized, "expires_at": expires_at}
            )
            conn.commit()

        logger.debug(f"Challenge stored in PostgreSQL: {key} (expires in {expire_seconds}s)")

    def get(self, key: str) -> Optional[Any]:
        """Get a challenge without removing it"""
        self._ensure_table()
        from backend.database import engine
        from sqlmodel import text

        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT value FROM webauthn_challenges
                    WHERE key = :key AND expires_at > :now
                """),
                {"key": key, "now": utc_now()}
            ).fetchone()

            if result:
                return _decode(result[0])
        return None

    def pop(self, key: str) -> Optional[Any]:
        """Get and remove a challenge atomically"""
        self._ensure_table()
        from backend.database import engine
        from sqlmodel import text

        with engine.connect() as conn:
            # Get the value first
            result = conn.execute(
                text("""
                    SELECT value FROM webauthn_challenges
                    WHERE key = :key AND expires_at > :now
                """),
                {"key": key, "now": utc_now()}
            ).fetchone()

            # Delete the record
            conn.execute(
                text("DELETE FROM webauthn_challenges WHERE key = :key"),
                {"key": key}
            )
            conn.commit()

            if result:
                logger.debug(f"Challenge retrieved and removed from PostgreSQL: {key}")
                return _decode(result[0])
        return None

    def delete(self, key: str) -> bool:
        """Delete a challenge"""
        self._ensure_table()
        from backend.database import engine
        from sqlmodel import text

        with engine.connect() as conn:
            result = conn.execute(
                text("DELETE FROM webauthn_challenges WHERE key = :key"),
                {"key": key}
            )
            conn.commit()
            return result.rowcount > 0


def create_challenge_store() -> ChallengeStoreInterface:
    """
    Factory function to create appropriate challenge store.
    Uses PostgreSQL in production, in-memory in development.
    """
    if settings.is_production():
        return PostgresChallengeStore()  # setup retries on use if Postgres is still waking

    # Development mode: use in-memory store
    return InMemoryChallengeStore()


# Global challenge store instance
challenge_store = create_challenge_store()
