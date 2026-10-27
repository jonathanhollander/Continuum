"""Administrator model and additional-instruction settings."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from backend.admin import require_admin
from backend.ai_capabilities import validate_selection
from backend.ai_settings import model_catalogue, settings_view, validate_model_id, prepare_request
from backend.ai_request import StructuredRequest, validate_configuration
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
    request_config: dict | None = None

    @model_validator(mode="after")
    def valid_values(self):
        validate_model_id(self.model_id)
        if self.request_config is not None:
            validate_configuration(self.request_config, patch=True)
        if any((ord(c) < 32 and c not in "\n\r\t") or ord(c) == 127 for c in self.additional_context):
            raise ValueError("Use plain text for these instructions.")
        return self


@router.get("/settings")
def get_settings(purpose: str = "shared", variant: str = "", session: Session = Depends(get_session)):
    try:
        validate_selection(purpose, variant, allow_shared=True)
        return settings_view(session, purpose, variant)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from None
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
        if body.request_config is not None:
            row.request_config = body.request_config
        row.updated_at = utc_now()
        row.updated_by = admin.id
        session.add(row)
        session.flush()
        saved = settings_view(session, body.purpose, body.variant, changed_scope=(body.purpose, body.variant))
        session.commit()
        return saved
    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(status_code=503, detail=SAVE_PAUSED) from None
    except ValueError as error:
        session.rollback()
        raise HTTPException(status_code=422, detail=str(error)) from None


@router.post("/settings/reset")
def reset_settings(body: SettingScope, session: Session = Depends(get_session)):
    try:
        row = session.get(AISetting, (body.purpose, body.variant))
        if row is not None:
            session.delete(row)
        session.flush()
        saved = settings_view(session, body.purpose, body.variant, changed_scope=(body.purpose, body.variant))
        session.commit()
        return saved
    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(status_code=503, detail=SAVE_PAUSED) from None
    except ValueError as error:
        session.rollback()
        raise HTTPException(status_code=422, detail=str(error)) from None


@router.get("/models")
async def get_models(refresh: bool = False):
    return await model_catalogue(refresh)


@router.post("/preview")
def preview_request(body: StructuredRequest, session: Session = Depends(get_session)):
    try:
        prepared, _ = prepare_request(session, body)
        return prepared
    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(status_code=503, detail="You can preview these settings again whenever you're ready.") from None
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from None
