"""
Export snapshot (card D1, CU-003): one read of everything the owner has recorded.

GET /api/export/snapshot returns every record the handover packet and the
download copy show, for the signed-in user only. Both outputs (the printed
binder / PDF and the zip download copy) are built from this one response, so
they always agree with each other.

`build_snapshot(session, user_id)` holds no request state, so a token-scoped
read (card D2) can call it for the owner a link belongs to.

Speed: one SELECT per table, each filtered on `user_id`, plus one for the
user's media files. Attachments are matched in memory (no query per record).
"""
import base64
import json
import re
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from backend.auth import get_current_user
from backend.database import Estate, User, get_session
from backend.estate_models import (
    Asset, CalendarEvent, Document, ExternalArchive, FamilyMemory, FinancialAccount,
    FuneralData, HomeAccess, InsurancePolicy, JournalEntry, Letter, LifeEvent,
    MedicalDirective, MedicalProfile, Pet, Subscription, TimeCapsuleMessage, Utility,
    Vendor, VisualMemory,
)
from backend.models.media import MediaFile
from backend.pulse_models import PulseContact

router = APIRouter(prefix="/api/export", tags=["export"])

SNAPSHOT_VERSION = 1

# Section key -> model. The key names the packet section; order is the packet's order.
SECTION_MODELS = [
    ("financial_accounts", FinancialAccount),
    ("assets", Asset),
    ("insurance_policies", InsurancePolicy),
    ("documents", Document),
    ("contacts", PulseContact),
    ("letters", Letter),
    ("journal_entries", JournalEntry),
    ("time_capsule", TimeCapsuleMessage),
    ("visual_memories", VisualMemory),
    ("external_archives", ExternalArchive),
    ("family_memories", FamilyMemory),
    ("calendar_events", CalendarEvent),
    ("home_access", HomeAccess),
    ("utilities", Utility),
    ("vendors", Vendor),
    ("medical_directives", MedicalDirective),
    ("medical_profiles", MedicalProfile),
    ("timeline_events", LifeEvent),
    ("pets", Pet),
    ("subscriptions", Subscription),
    ("funeral_data", FuneralData),
]

# Columns that never leave the server (link secrets).
PRIVATE_FIELDS = {
    "contacts": {"portal_token", "portal_token_expires", "recipient_token", "recipient_token_created_at"},
}

# The owner-facing profile keys the packet shows (estate/profile stores them snake_case).
PROFILE_KEYS = ("owner_name", "executor_name", "spouse_name", "primary_beneficiary",
                "legal_address", "legal_city_state")

MEDIA_REF = re.compile(r"/api/media/(\d+)(?:/download)?(?:[?#].*)?$")
DATA_URL = re.compile(r"^data:([\w.+-]+/[\w.+-]+)?(;[^,]*)?,", re.I)
# A file kept inside custom_attributes (medical directive, pet care document, time capsule).
CUSTOM_MEDIA_KEY = "_media"


def asset_category(a: Asset) -> str:
    """The one list an Asset row belongs to. Mirrors estate_data._category_clause:
    a stored category wins; rows from before the column use platform/username ->
    digital_assets, else recipient/story -> heirlooms, else properties."""
    if a.category:
        return a.category
    if (a.platform or "") != "" or (a.username or "") != "":
        return "digital_assets"
    if (a.recipient or "") != "" or (a.story or "") != "":
        return "heirlooms"
    return "properties"


def _row(section: str, obj: Any) -> Dict[str, Any]:
    data = obj.model_dump(mode="json")
    for k in PRIVATE_FIELDS.get(section, ()):
        data.pop(k, None)
    if section != "medical_profiles":  # its primary key is user_id
        data.pop("user_id", None)
    if section == "assets":
        data["category"] = asset_category(obj)
    return data


def _record_id(section: str, row: Dict[str, Any]) -> Any:
    return row.get("id") if section != "medical_profiles" else "profile"


def _data_url_size(value: str) -> int:
    head, _, body = value.partition(",")
    if ";base64" in head.lower():
        try:
            return len(base64.b64decode(body, validate=False))
        except Exception:
            return 0
    return len(body.encode("utf-8"))


def _attachments(sections: Dict[str, List[Dict[str, Any]]], media: Dict[int, MediaFile]):
    """Every file a record points at: stored media (by download_url or media_id) and
    files kept inside the record itself as data: URLs. Only files that exist are listed;
    references to files that are gone are reported separately."""
    stored: Dict[int, Dict[str, Any]] = {}
    inline: List[Dict[str, Any]] = []
    missing: List[Dict[str, Any]] = []

    def link_media(mid: int, ref: Dict[str, Any]):
        m = media.get(mid)
        if m is None:
            missing.append({**ref, "media_id": mid})
            return
        entry = stored.setdefault(mid, {
            "key": f"media-{mid}",
            "source": "media",
            "media_id": mid,
            "filename": m.filename,
            "mime_type": m.mime_type,
            "file_size": m.file_size,
            "download_url": f"/api/media/{mid}/download",
            "records": [],
        })
        # one entry per record, even when it names the file twice (file_path and media_id)
        if not any(r["section"] == ref["section"] and r["id"] == ref["id"] for r in entry["records"]):
            entry["records"].append(ref)

    for section, rows in sections.items():
        for row in rows:
            rid = _record_id(section, row)
            for field, value in row.items():
                ref = {"section": section, "id": rid, "field": field}
                if field == "custom_attributes" and isinstance(value, str) and CUSTOM_MEDIA_KEY in value:
                    try:
                        held = json.loads(value).get(CUSTOM_MEDIA_KEY)
                    except (ValueError, AttributeError):
                        held = None
                    mid = held.get("id") if isinstance(held, dict) else None
                    if isinstance(mid, int) or (isinstance(mid, str) and mid.isdigit()):
                        link_media(int(mid), ref)
                    continue
                if field == "media_id" and value not in (None, ""):
                    if str(value).isdigit():
                        link_media(int(value), ref)
                    continue
                if not isinstance(value, str) or not value:
                    continue
                m = MEDIA_REF.search(value)
                if m and (value.startswith("/api/media/") or "://" in value):
                    link_media(int(m.group(1)), ref)
                    continue
                d = DATA_URL.match(value)
                if d:
                    inline.append({
                        "key": f"inline-{section}-{rid}-{field}",
                        "source": "inline",
                        "mime_type": (d.group(1) or "text/plain").lower(),
                        "file_size": _data_url_size(value),
                        "records": [ref],
                    })
    return list(stored.values()) + inline, missing


def build_snapshot(session: Session, user_id: int,
                   keep: Optional[Callable[[str, Dict[str, Any]], bool]] = None) -> Dict[str, Any]:
    """`keep(section, row)` (optional) drops records before attachments are matched, so a
    filtered snapshot (the recipient view, card D2) lists only the files its records use."""
    user = session.get(User, user_id)
    sections: Dict[str, List[Dict[str, Any]]] = {}
    for section, model in SECTION_MODELS:
        stmt = select(model).where(model.user_id == user_id)
        if hasattr(model, "id"):
            stmt = stmt.order_by(model.id)
        rows = [_row(section, r) for r in session.exec(stmt).all()]
        sections[section] = [r for r in rows if keep(section, r)] if keep else rows

    media_rows = session.exec(
        select(MediaFile).where(MediaFile.user_id == user_id, MediaFile.deleted_at == None)  # noqa: E711
    ).all()
    attachments, missing = _attachments(sections, {m.id: m for m in media_rows})

    profile: Dict[str, Any] = {}
    estate = session.exec(select(Estate).where(Estate.user_id == user_id)).first()
    if estate:
        try:
            td = json.loads(estate.transparent_data or "{}")
            ep = td.get("estate_profile", td) if isinstance(td, dict) else {}
            if isinstance(ep, dict):
                profile = {k: ep[k] for k in PROFILE_KEYS if ep.get(k) not in (None, "")}
        except Exception:
            profile = {}

    return {
        "version": SNAPSHOT_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "owner": {
            "display_name": (user.display_name if user else None) or None,
            **profile,
        },
        "sections": sections,
        "attachments": attachments,
        "missing_attachments": missing,
    }


@router.get("/snapshot", summary="One snapshot of every record, for the packet and the download copy")
def get_snapshot(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return build_snapshot(session, user.id)
