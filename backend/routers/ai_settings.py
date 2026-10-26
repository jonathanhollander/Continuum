"""Administrator model and additional-instruction settings."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from backend.admin import require_admin
from backend.ai_capabilities import validate_selection
from backend.ai_settings import model_catalogue, settings_view, validate_model_id
from backend.database import User, get_session
from backend.models.ai_settings import AISetting
from backend.utils.clock import utc_now

router = APIRouter(prefix="/api/ai/admin", tags=["ai settings"], dependencies=[Depends(require_admin)])
SAVE_PAUSED = "Your changes are ready to save again."


class SettingScope(BaseModel):
    model_config = ConfigDict(extra="forbid")
    purpose: str = Field(max_length=64)
    variant: str = Field(default="", max_length=64)

    @model_validator(mode="after")
    def valid_scope(self):
        validate_selection(self.purpose, self.variant, allow_shared=True)
        return self


class SettingInput(SettingScope):
    model_id: str | None = Field(default=None, max_length=256)
    additional_context: str = Field(default="", max_length=8000)

    @model_validator(mode="after")
    def valid_values(self):
        validate_model_id(self.model_id)
        if any((ord(c) < 32 and c not in "\n\r\t") or ord(c) == 127 for c in self.additional_context):
            raise ValueError("Use plain text for these instructions.")
        return self


@router.get("/settings")
def get_settings(session: Session = Depends(get_session)):
    try:
        return settings_view(session)
    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(status_code=503, detail="You can open AI settings again whenever you're ready.") from None


@router.put("/settings")
def save_settings(body: SettingInput, session: Session = Depends(get_session),
                  admin: User = Depends(require_admin)):
    try:
        row = session.get(AISetting, (body.purpose, body.variant))
        if row is None:
            row = AISetting(purpose=body.purpose, variant=body.variant)
        row.model_id = body.model_id
        row.additional_context = body.additional_context
        row.updated_at = utc_now()
        row.updated_by = admin.id
        session.add(row)
        session.commit()
        return settings_view(session)
    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(status_code=503, detail=SAVE_PAUSED) from None


@router.post("/settings/reset")
def reset_settings(body: SettingScope, session: Session = Depends(get_session)):
    try:
        row = session.get(AISetting, (body.purpose, body.variant))
        if row is not None:
            session.delete(row)
            session.commit()
        return settings_view(session)
    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(status_code=503, detail=SAVE_PAUSED) from None


@router.get("/models")
async def get_models(refresh: bool = False):
    return await model_catalogue(refresh)
