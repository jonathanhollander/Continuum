"""
Recipient start page (card D2, CU-005): one owner-issued link per designated recipient.

The owner marks a contact as a recipient, may leave them a note, and creates a link
(/for/<token>). Whoever opens the link sees that owner's start page, built from D1's
export snapshot (`build_snapshot`), with no sign-in. A simple link, no permissions system:
the token is 32 random bytes, stored on the contact row; revoking clears it.

What the recipient view holds (and the download copy made from it):
- every section of the owner's snapshot, except
- letters: only those for this person (recipient_contact_id, or the same name on older
  letters), and never one the owner holds (isLocked = the owner's "Hold", card C3);
- time capsules: only released ones for this person (recipient_contact_id, card X100, or
  the same name on older capsules; card C5 rule: marked released, or a date capsule whose
  date has arrived; milestone capsules via "Milestone reached");
- the other contacts' recipient notes and every link secret are removed.

Owner endpoints (signed in):
  GET    /api/recipient/links                  each contact with its recipient state
  GET    /api/recipient/links/{contact_id}     one contact's recipient state
  PUT    /api/recipient/links/{contact_id}     {is_recipient?, note?}
  POST   /api/recipient/links/{contact_id}     create (or replace) the link
  DELETE /api/recipient/links/{contact_id}     close the link
  GET    /api/recipient/preview/{contact_id}   the page exactly as the recipient sees it
Recipient endpoint (no sign-in):
  GET    /api/recipient/view/{token}
Files for the view: GET /api/media/shared/{token}/{media_id} (routers/media.py). The set of
files a link shows is kept for SHOWN_TTL_SECONDS per token (card X104), so a page of photos does
not rebuild the snapshot once per file; the token itself is checked fresh on every request.
"""
import secrets
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, FrozenSet, Optional, Set, Tuple

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlmodel import Session, SQLModel, select

from backend.auth import get_current_user
from backend.database import User, get_session
from backend.pulse_models import PulseContact
from backend.routers.export import build_snapshot, snapshot_profile
from backend.utils.clock import utc_now

router = APIRouter(prefix="/api/recipient", tags=["recipient"])

CLOSED = "This page is closed for now. The executor, or the person who shared it, can open it again for you."
FOUND_NOTHING = "That person may have been moved."
MIN_TOKEN_LENGTH = 32


def _names(contact: PulseContact) -> Set[str]:
    """The ways a letter or capsule may name this person: full name, first name, relation."""
    out = set()
    name = (contact.name or "").strip().lower()
    if name:
        out.add(name)
        out.add(name.split()[0])
    if (contact.relation or "").strip():
        out.add(contact.relation.strip().lower())
    return out


def _is_for(value: Any, names: Set[str]) -> bool:
    return isinstance(value, str) and value.strip().lower() in names


def capsule_released(row: Dict[str, Any], today: str) -> bool:
    """Card C5: released when marked released, or a date capsule whose date has arrived."""
    if row.get("is_released"):
        return True
    value = str(row.get("trigger_value") or "")[:10]
    return row.get("trigger_type") == "date" and bool(value) and value <= today


def executor_notes_shared(session: Session, contact: PulseContact, profile: Optional[Dict[str, Any]] = None) -> bool:
    profile = profile if profile is not None else snapshot_profile(session, contact.user_id)
    return is_executor(contact, profile) or profile.get("executor_note_sharing") == "all_recipients"


def recipient_snapshot(session: Session, contact: PulseContact) -> Dict[str, Any]:
    names = _names(contact)
    today = datetime.now(timezone.utc).date().isoformat()
    profile = snapshot_profile(session, contact.user_id)
    share_executor_notes = executor_notes_shared(session, contact, profile)

    def for_this_person(row: Dict[str, Any], text_field: str) -> bool:
        """The chosen contact wins; rows with no chosen contact match on their text."""
        rid = row.get("recipient_contact_id")
        if rid not in (None, ""):
            return str(rid) == str(contact.id)
        return _is_for(row.get(text_field), names)

    def keep(section: str, row: Dict[str, Any]) -> bool:
        if section == "executor_steps":
            return share_executor_notes
        if section == "letters":
            return not row.get("isLocked") and for_this_person(row, "recipient_name")
        if section == "time_capsule":
            return capsule_released(row, today) and for_this_person(row, "recipient")
        return True

    snap = build_snapshot(session, contact.user_id, keep=keep, owner_profile=profile)
    for row in snap["sections"].get("contacts", []):
        row.pop("recipient_note", None)
    return snap


def contact_for_token(session: Session, token: str) -> PulseContact:
    """The recipient a live link belongs to; a closed or unknown link reads as closed."""
    if not token or len(token) < MIN_TOKEN_LENGTH:
        raise HTTPException(status_code=404, detail=CLOSED)
    contact = session.exec(select(PulseContact).where(PulseContact.recipient_token == token)).first()
    if not contact or not contact.is_recipient or not secrets.compare_digest(contact.recipient_token or "", token):
        raise HTTPException(status_code=404, detail=CLOSED)
    return contact


# Card X104: token -> (expiry, contact id, shown media ids, effective checklist-note sharing).
# Policy/explicit executor changes invalidate membership even while the media cache is warm.
# Only ever read after
# contact_for_token() has passed for that token, so a closed or replaced link stops at once.
SHOWN_TTL_SECONDS = 30
_SHOWN_MAX = 512
_shown: Dict[str, Tuple[float, int, FrozenSet[int], bool]] = {}
_shown_lock = threading.Lock()
_shown_build_lock = threading.Lock()


def _media_ids(snap: Dict[str, Any]) -> FrozenSet[int]:
    return frozenset(a.get("media_id") for a in snap["attachments"] if a.get("source") == "media")


def _remember_shown(token: str, contact: PulseContact, ids: FrozenSet[int], share_executor_notes: bool) -> None:
    now = time.monotonic()
    with _shown_lock:
        if len(_shown) >= _SHOWN_MAX:
            for k in [k for k, v in _shown.items() if v[0] <= now]:
                del _shown[k]
            if len(_shown) >= _SHOWN_MAX:
                _shown.clear()
        _shown[token] = (now + SHOWN_TTL_SECONDS, contact.id, ids, share_executor_notes)


def _cached_shown(token: str, contact: PulseContact, share_executor_notes: bool) -> Optional[FrozenSet[int]]:
    with _shown_lock:
        hit = _shown.get(token)
    if hit and hit[0] > time.monotonic() and hit[1] == contact.id and hit[3] == share_executor_notes:
        return hit[2]
    return None


def shown_media_ids(session: Session, contact: PulseContact, token: str) -> FrozenSet[int]:
    """The media ids a live link's page shows. `contact` must come from contact_for_token(token)."""
    share_executor_notes = executor_notes_shared(session, contact)
    ids = _cached_shown(token, contact, share_executor_notes)
    if ids is not None:
        return ids
    with _shown_build_lock:  # many files of one page arriving at once build the set once
        ids = _cached_shown(token, contact, share_executor_notes)
        if ids is None:
            ids = _media_ids(recipient_snapshot(session, contact))
            _remember_shown(token, contact, ids, share_executor_notes)
    return ids


def is_executor(contact: PulseContact, owner: Dict[str, Any]) -> bool:
    """One executor test (the packet's, exportService.isExecutorContact): the contact's flag,
    the role "Executor", or the name the owner gave as executor in the estate profile."""
    if contact.is_executor or (contact.role or "").strip().lower() == "executor":
        return True
    named = str(owner.get("executor_name") or "").strip().lower()
    return bool(named) and named == (contact.name or "").strip().lower()


def _view(session: Session, contact: PulseContact, preview: bool) -> Dict[str, Any]:
    snap = recipient_snapshot(session, contact)
    return {
        "preview": preview,
        "recipient": {
            "id": contact.id,
            "name": contact.name,
            "relation": contact.relation,
            "is_executor": is_executor(contact, snap.get("owner") or {}),
        },
        "note": contact.recipient_note or "",
        "snapshot": snap,
    }


def _state(contact: PulseContact) -> Dict[str, Any]:
    return {
        "contact_id": contact.id,
        "name": contact.name,
        "relation": contact.relation,
        "is_recipient": bool(contact.is_recipient),
        "is_executor": bool(contact.is_executor),
        "note": contact.recipient_note or "",
        "token": contact.recipient_token,
        "path": f"/for/{contact.recipient_token}" if contact.recipient_token else None,
        "created_at": contact.recipient_token_created_at.isoformat() if contact.recipient_token_created_at else None,
    }


def _owned(session: Session, contact_id: int, user: User) -> PulseContact:
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail=FOUND_NOTHING)
    return contact


class RecipientUpdate(SQLModel):
    is_recipient: Optional[bool] = None
    note: Optional[str] = None


@router.get("/view/{token}", summary="The recipient's start page (no sign-in; the link is the key)")
def view(token: str, session: Session = Depends(get_session)):
    contact = contact_for_token(session, token)
    out = _view(session, contact, preview=False)
    share_notes = out["recipient"]["is_executor"] or out["snapshot"]["owner"].get("executor_note_sharing") == "all_recipients"
    _remember_shown(token, contact, _media_ids(out["snapshot"]), bool(share_notes))  # the page's files ask next
    return JSONResponse(content=out)


@router.get("/preview/{contact_id}", summary="The owner's preview of a recipient's start page")
def preview(contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return JSONResponse(content=_view(session, _owned(session, contact_id, user), preview=True))


@router.get("/links")
def list_links(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    rows = session.exec(select(PulseContact).where(PulseContact.user_id == user.id).order_by(PulseContact.id)).all()
    return [_state(c) for c in rows]


@router.get("/links/{contact_id}")
def get_link(contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return _state(_owned(session, contact_id, user))


@router.put("/links/{contact_id}")
def update_link(contact_id: int, body: RecipientUpdate, user: User = Depends(get_current_user),
                session: Session = Depends(get_session)):
    contact = _owned(session, contact_id, user)
    if body.note is not None:
        contact.recipient_note = body.note.strip() or None
    if body.is_recipient is not None:
        contact.is_recipient = body.is_recipient
        if not body.is_recipient:  # no longer a recipient: their link closes too
            contact.recipient_token = None
            contact.recipient_token_created_at = None
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return _state(contact)


@router.post("/links/{contact_id}")
def create_link(contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """A fresh link; any earlier link for this person closes."""
    contact = _owned(session, contact_id, user)
    contact.is_recipient = True
    contact.recipient_token = secrets.token_urlsafe(32)
    contact.recipient_token_created_at = utc_now()
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return _state(contact)


@router.delete("/links/{contact_id}")
def revoke_link(contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    contact = _owned(session, contact_id, user)
    contact.recipient_token = None
    contact.recipient_token_created_at = None
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return _state(contact)
