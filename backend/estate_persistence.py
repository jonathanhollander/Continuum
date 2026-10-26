"""One estate root per account and serialized, lossless profile updates."""

import hashlib
import json
from base64 import b64encode
from copy import deepcopy

from sqlalchemy import Connection, delete, func, inspect, select, update
from sqlmodel import Session

from backend.database import Estate, EstateRecoveryCopy, User
from backend.utils.clock import utc_now


def _object(raw):
    try:
        value = json.loads(raw or "{}")
        return value if isinstance(value, dict) else {}
    except (TypeError, ValueError):
        return {}


def profile_of(estate: Estate) -> dict:
    data = _object(estate.transparent_data)
    profile = data.get("estate_profile", data)
    return profile if isinstance(profile, dict) else {}


def _alternates(original: dict, current: dict, path=()) -> list:
    found = []
    for key, value in original.items():
        present = key in current
        kept = current.get(key)
        if present and isinstance(value, dict) and isinstance(kept, dict):
            found.extend(_alternates(value, kept, (*path, key)))
        elif not present or value != kept:
            found.append({"path": [*path, key], "canonical_present": present,
                          "canonical_value": kept, "value": value})
    return found


def recovery_summary(session: Session, user_id: int) -> dict:
    """Owner-scoped originals/alternatives for recovery and the handover manifest.

    Preserved alternatives are provenance, not a claim that conflicting author content
    has been semantically resolved. Encrypted blobs stay in the recovery copies table.
    """
    estate = session.execute(select(Estate).where(Estate.user_id == user_id)
                             .order_by(Estate.id)).scalars().first()
    current = _object(estate.transparent_data) if estate else {}
    entries = []
    copies = session.execute(select(EstateRecoveryCopy).where(EstateRecoveryCopy.user_id == user_id)
                             .order_by(EstateRecoveryCopy.source_estate_id,
                                       EstateRecoveryCopy.id)).scalars()
    for copy in copies:
        try:
            data = json.loads(copy.transparent_data or "{}")
        except (TypeError, ValueError):
            data = None
        data = data if isinstance(data, dict) else None
        profile = data.get("estate_profile", data) if data is not None else {}
        profile = profile if isinstance(profile, dict) else {}
        normalized = {**data, "estate_profile": profile} if data is not None else {}
        entries.append({
            "source_estate_id": copy.source_estate_id,
            "preserved_at": copy.preserved_at.isoformat(),
            "profile": profile,
            "data": data,
            "unparsed_data": copy.transparent_data if data is None else None,
            "alternate_values": _alternates(normalized, current),
            "encrypted_vault_bytes": len(copy.encrypted_vault or b""),
        })
    return {"policy": "lowest_id_kept", "canonical_estate_id": estate.id if estate else None,
            "entries": entries}


def _keep_unique(first: dict, later: dict) -> dict:
    """Keep the previously visible value on conflicts, adding unique nested keys."""
    merged = deepcopy(first)
    for key, value in later.items():
        if key not in merged:
            merged[key] = deepcopy(value)
        elif isinstance(merged[key], dict) and isinstance(value, dict):
            merged[key] = _keep_unique(merged[key], value)
    return merged


def _reconcile(connection: Connection, rows) -> int:
    """The lowest id stays canonical; exact originals retain every conflict/raw value."""
    first = rows[0]
    if len(rows) == 1:
        return first["id"]
    copies = EstateRecoveryCopy.__table__
    have = set(connection.execute(select(copies.c.fingerprint).where(
        copies.c.user_id == first["user_id"])).scalars())
    data, profile = {}, {}
    vault = first["encrypted_vault"]
    for row in rows:
        original = {
            "source_estate_id": row["id"],
            "user_id": row["user_id"],
            "transparent_data": row["transparent_data"],
            "encrypted_vault": row["encrypted_vault"],
            "source_updated_at": row["updated_at"],
        }
        identity = {**original, "encrypted_vault": b64encode(original["encrypted_vault"] or b"").decode(),
                    "source_updated_at": str(original["source_updated_at"])}
        fingerprint = hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()
        if fingerprint not in have:
            connection.execute(copies.insert().values(**original, fingerprint=fingerprint,
                                                       preserved_at=utc_now()))
            have.add(fingerprint)
        row_data = _object(row["transparent_data"])
        row_profile = row_data.get("estate_profile", row_data)
        data = _keep_unique(data, row_data)
        if isinstance(row_profile, dict):
            profile = _keep_unique(profile, row_profile)
        if not vault and row["encrypted_vault"]:
            vault = row["encrypted_vault"]
    data["estate_profile"] = profile
    table = Estate.__table__
    connection.execute(update(table).where(table.c.id == first["id"]).values(
        transparent_data=json.dumps(data), encrypted_vault=vault, updated_at=utc_now()))
    connection.execute(delete(table).where(table.c.id.in_([row["id"] for row in rows[1:]])))
    return first["id"]


def ensure_estate_singletons(connection: Connection) -> None:
    """Idempotent Alembic/runtime repair: preserve duplicates, then enforce uniqueness."""
    table = Estate.__table__
    if table.name not in inspect(connection).get_table_names():
        return
    EstateRecoveryCopy.__table__.create(connection, checkfirst=True)
    # Serialize a repair against other repairs and writers while its unique index is absent.
    # SQLite's zero-row UPDATE obtains a write lock; PostgreSQL locks this table for the DDL.
    if connection.dialect.name == "postgresql":
        connection.exec_driver_sql("LOCK TABLE estates IN EXCLUSIVE MODE")
    elif connection.dialect.name == "sqlite":
        connection.execute(update(table).where(table.c.id < 0).values(id=table.c.id))
    duplicate_users = connection.execute(select(table.c.user_id).group_by(table.c.user_id)
                                         .having(func.count() > 1)).scalars().all()
    for user_id in duplicate_users:
        rows = connection.execute(select(table).where(table.c.user_id == user_id)
                                  .order_by(table.c.id)).mappings().all()
        _reconcile(connection, rows)
    next(index for index in table.indexes if index.name == "uq_estates_user_id").create(
        connection, checkfirst=True)


def estate_for_write(session: Session, user_id: int) -> Estate:
    """Acquire the account's write lock before reading its latest root.

    A no-op UPDATE changes no account values and takes a PostgreSQL row lock / SQLite
    write lock. It works before the first Estate exists and across processes/devices.
    The caller commits the estate write and releases the lock in the same transaction.
    """
    session.execute(update(User).where(User.id == user_id).values(id=User.id))
    statement = select(Estate).where(Estate.user_id == user_id).order_by(Estate.id)
    estate = session.execute(statement.execution_options(populate_existing=True)).scalars().first()
    if estate is None:
        estate = Estate(user_id=user_id)
        session.add(estate)
        session.flush()
    return estate


def merge_profile(session: Session, user_id: int, updates: dict) -> dict:
    """Merge against the locked latest profile; the last serialized same-key save wins."""
    estate = estate_for_write(session, user_id)
    data = _object(estate.transparent_data)
    current = data.get("estate_profile", data)
    merged = dict(current) if isinstance(current, dict) else {}
    for key, value in updates.items():
        if value is None:
            merged.pop(key, None)
        else:
            merged[key] = value
    data["estate_profile"] = merged
    estate.transparent_data = json.dumps(data)
    estate.updated_at = utc_now()
    session.commit()
    return merged
