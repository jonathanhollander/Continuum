"""
Export snapshot (card D1, CU-003): the recorded legacy and practical handover.

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
from fastapi.responses import JSONResponse
from sqlmodel import Session, select

from backend.auth import get_current_user
from backend.database import Estate, User, get_session
from backend.estate_persistence import profile_of
from backend.estate_models import (
    AdvancedAssetData, Asset, CalendarEvent, Document, ExecutorStep, ExternalArchive, FamilyMemory, FinancialAccount,
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
    ("advanced_assets", AdvancedAssetData),
    ("executor_steps", ExecutorStep),
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
                "legal_address", "legal_city_state", "executor_note_sharing")

ADVANCED_LISTS = {"transactions": "asset_transactions", "maintenance": "maintenance_logs", "claims": "insurance_claims"}


def snapshot_profile(session: Session, user_id: int) -> Dict[str, Any]:
    estate = session.exec(select(Estate).where(Estate.user_id == user_id)).first()
    recorded = profile_of(estate) if estate else {}
    profile = {key: recorded[key] for key in PROFILE_KEYS if recorded.get(key) not in (None, "")}
    profile["executor_note_sharing"] = "all_recipients" if profile.get("executor_note_sharing") == "all_recipients" else "executors_only"
    return profile


def _handover_rows(section: str, rows: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Expand the saved history lists; keep the current row per touched checklist step.

    These are read-only views of the same rows the record pages reload. Singleton ids and
    superseded checklist rows are storage details, rather than additional family records.
    """
    if section == "advanced_assets":
        expanded = {key: [] for key in ADVANCED_LISTS.values()}
        for parent in rows:
            for field, key in ADVANCED_LISTS.items():
                value = parent.get(field)
                try:
                    entries = json.loads(value) if isinstance(value, str) else value
                except (TypeError, ValueError):
                    entries = []
                if not isinstance(entries, list):
                    continue
                for index, item in enumerate(entries):
                    if not isinstance(item, dict):
                        continue
                    row = dict(item)
                    if row.get("id") in (None, ""):
                        row["id"] = f"{parent.get('id')}:{field}:{index}"
                    expanded[key].append(row)
        return expanded
    if section == "executor_steps":
        latest = {row["step_id"]: row for row in rows}  # input is ordered by database id
        return {section: list(latest.values())}
    return {section: rows}

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
        # One file's bytes, with every distinct record/field that points to it. A cover can
        # also be in the evidence gallery; that is one attachment with both source references.
        if ref not in entry["records"]:
            entry["records"].append(ref)

    for section, rows in sections.items():
        for row in rows:
            rid = _record_id(section, row)
            for field, value in row.items():
                ref = {"section": section, "id": rid, "field": field}
                if section == "assets" and field == "evidence":
                    # The property gallery persists JSON [{id, filename, mime}], rather than
                    # download URLs. Resolve through this owner's undeleted media map as usual.
                    try:
                        evidence = json.loads(value) if isinstance(value, str) else value
                    except ValueError:
                        evidence = None
                    if isinstance(evidence, list):
                        for item in evidence:
                            mid = item.get("id") if isinstance(item, dict) else None
                            if isinstance(mid, (int, str)) and str(mid).isdigit():
                                link_media(int(mid), ref)
                        continue
                if section == "assets" and field == "thumbnail" and str(value).isdigit():
                    link_media(int(value), ref)
                    continue
                if field == "custom_attributes" and isinstance(value, (str, dict)) and CUSTOM_MEDIA_KEY in value:
                    try:
                        held = (json.loads(value) if isinstance(value, str) else value).get(CUSTOM_MEDIA_KEY)
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
                   keep: Optional[Callable[[str, Dict[str, Any]], bool]] = None,
                   owner_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """`keep(section, row)` (optional) drops records before attachments are matched, so a
    filtered snapshot (the recipient view, card D2) lists only the files its records use."""
    user = session.get(User, user_id)
    profile = dict(owner_profile) if owner_profile is not None else snapshot_profile(session, user_id)
    sections: Dict[str, List[Dict[str, Any]]] = {}
    for section, model in SECTION_MODELS:
        stmt = select(model).where(model.user_id == user_id)
        if hasattr(model, "id"):
            stmt = stmt.order_by(model.id)
        rows = [_row(section, r) for r in session.exec(stmt).all()]
        for key, records in _handover_rows(section, rows).items():
            sections[key] = [r for r in records if keep(key, r)] if keep else records

    media_rows = session.exec(
        select(MediaFile).where(MediaFile.user_id == user_id, MediaFile.deleted_at == None)  # noqa: E711
    ).all()
    attachments, missing = _attachments(sections, {m.id: m for m in media_rows})

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


@router.get("/snapshot", summary="The recorded handover, for the packet and the download copy")
def get_snapshot(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return JSONResponse(content=build_snapshot(session, user.id))
