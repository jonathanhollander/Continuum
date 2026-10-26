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
- time capsules: only released ones for this person (card C5 rule: marked released, or a
  date capsule whose date has arrived; milestone capsules via "Milestone reached");
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
Files for the view: GET /api/media/shared/{token}/{media_id} (routers/media.py).
"""
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Set

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, SQLModel, select

from backend.auth import get_current_user
from backend.database import User, get_session
from backend.pulse_models import PulseContact
from backend.routers.export import build_snapshot
from backend.utils.clock import utc_now

router = APIRouter(prefix="/api/recipient", tags=["recipient"])

CLOSED = "This page is closed for now. The person who shared it can send a fresh link whenever it is needed."
FOUND_NOTHING = "We couldn't find that person. They may have been moved."
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


def recipient_snapshot(session: Session, contact: PulseContact) -> Dict[str, Any]:
    names = _names(contact)
    today = datetime.now(timezone.utc).date().isoformat()

    def keep(section: str, row: Dict[str, Any]) -> bool:
        if section == "letters":
            if row.get("isLocked"):
                return False
            rid = row.get("recipient_contact_id")
            if rid not in (None, ""):
                return str(rid) == str(contact.id)
            return _is_for(row.get("recipient_name"), names)
        if section == "time_capsule":
            return capsule_released(row, today) and _is_for(row.get("recipient"), names)
        return True

    snap = build_snapshot(session, contact.user_id, keep=keep)
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


def _view(session: Session, contact: PulseContact, preview: bool) -> Dict[str, Any]:
    return {
        "preview": preview,
        "recipient": {
            "id": contact.id,
            "name": contact.name,
            "relation": contact.relation,
            "is_executor": bool(contact.is_executor),
        },
        "note": contact.recipient_note or "",
        "snapshot": recipient_snapshot(session, contact),
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
    return _view(session, contact_for_token(session, token), preview=False)


@router.get("/preview/{contact_id}", summary="The owner's preview of a recipient's start page")
def preview(contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return _view(session, _owned(session, contact_id, user), preview=True)


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
