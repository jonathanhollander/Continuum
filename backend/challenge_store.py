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
import json
from abc import ABC, abstractmethod
from typing import Any, Optional
from datetime import datetime, timedelta
from backend.config import settings
from backend.utils.logger import get_logger

logger = get_logger(__name__)


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
        now = datetime.utcnow()
        expired_keys = [k for k, v in self._expiry.items() if v < now]
        for key in expired_keys:
            self._store.pop(key, None)
            self._expiry.pop(key, None)

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        """Store a challenge with expiration"""
        self._cleanup_expired()
        self._store[key] = value
        self._expiry[key] = datetime.utcnow() + timedelta(seconds=expire_seconds)
        logger.debug(f"Challenge stored: {key}")

    def get(self, key: str) -> Optional[Any]:
        """Get a challenge without removing it"""
        self._cleanup_expired()
        if key in self._expiry and self._expiry[key] < datetime.utcnow():
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

        # Create the challenges table if it doesn't exist
        self._ensure_table()
        logger.info("Using PostgreSQL challenge store (production mode)")

    def _ensure_table(self) -> None:
        """Ensure the webauthn_challenges table exists"""
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

    def _cleanup_expired(self) -> None:
        """Remove expired challenges"""
        from backend.database import engine
        from sqlmodel import text

        with engine.connect() as conn:
            conn.execute(
                text("DELETE FROM webauthn_challenges WHERE expires_at < :now"),
                {"now": datetime.utcnow()}
            )
            conn.commit()

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        """Store a challenge with expiration"""
        from backend.database import engine
        from sqlmodel import text

        expires_at = datetime.utcnow() + timedelta(seconds=expire_seconds)
        serialized = json.dumps(value)

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
        from backend.database import engine
        from sqlmodel import text

        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT value FROM webauthn_challenges
                    WHERE key = :key AND expires_at > :now
                """),
                {"key": key, "now": datetime.utcnow()}
            ).fetchone()

            if result:
                return json.loads(result[0])
        return None

    def pop(self, key: str) -> Optional[Any]:
        """Get and remove a challenge atomically"""
        from backend.database import engine
        from sqlmodel import text

        with engine.connect() as conn:
            # Get the value first
            result = conn.execute(
                text("""
                    SELECT value FROM webauthn_challenges
                    WHERE key = :key AND expires_at > :now
                """),
                {"key": key, "now": datetime.utcnow()}
            ).fetchone()

            # Delete the record
            conn.execute(
                text("DELETE FROM webauthn_challenges WHERE key = :key"),
                {"key": key}
            )
            conn.commit()

            if result:
                logger.debug(f"Challenge retrieved and removed from PostgreSQL: {key}")
                return json.loads(result[0])
        return None

    def delete(self, key: str) -> bool:
        """Delete a challenge"""
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
        try:
            return PostgresChallengeStore()
        except Exception as e:
            logger.warning(f"Failed to initialize PostgreSQL challenge store: {e}. Falling back to in-memory.")
            return InMemoryChallengeStore()

    # Development mode: use in-memory store
    return InMemoryChallengeStore()


# Global challenge store instance
challenge_store = create_challenge_store()
