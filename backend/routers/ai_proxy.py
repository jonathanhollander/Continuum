"""Send exactly the request prepared by the visible settings resolver."""
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from backend.ai_capabilities import validate_selection
from backend.ai_request import StructuredRequest
from backend.ai_settings import UNAVAILABLE_MESSAGE, get_client, prepare_request, runtime_config
from backend.auth import get_current_user
from backend.database import User, get_session
from backend.limiter import limiter
from backend.utils.logger import get_logger

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = get_logger(__name__)


@router.get("/config")
def get_runtime_config(purpose: str = "concierge.chat", variant: str = "",
                       user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    try:
        validate_selection(purpose, variant)
        return runtime_config(session, purpose, variant)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from None
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE) from None


@router.post("/chat")
@limiter.limit("30/minute")
async def ai_chat(request: Request, body: StructuredRequest,
                  current_user: User = Depends(get_current_user),
                  session: Session = Depends(get_session)):
    try:
        prepared, transport = prepare_request(session, body)
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE) from None
    except ValueError:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE) from None
    if prepared["limits"]["exceeded"]:
        raise HTTPException(status_code=413, detail="Your conversation and draft are kept. Review the input limits in AI settings before trying again.")
    if not prepared["can_send"]:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE)
    try:
        response = await get_client().post(transport["url"], json=prepared["request"], headers=transport["headers"])
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict):
            raise ValueError("response envelope")
        if current_user.is_admin:
            result["continuum_request"] = {**prepared, "attempt_status": "completed"}
        return result
    except (httpx.HTTPError, ValueError) as error:
        logger.warning("AI gateway request paused: %s", type(error).__name__)
        detail = {"detail": UNAVAILABLE_MESSAGE}
        if current_user.is_admin:
            detail["continuum_request"] = {**prepared, "attempt_status": "attempted"}
        return JSONResponse(status_code=503, content=detail)
