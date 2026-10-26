"""Server-side Bifrost chat; browser requests carry only their normal login."""
from typing import List, Literal, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from backend.ai_capabilities import required_output, validate_selection
from backend.ai_settings import (UNAVAILABLE_MESSAGE, gateway_configuration, gateway_headers,
                                 get_client, read_settings, resolve_setting)
from backend.auth import get_current_user
from backend.config import settings
from backend.database import User, get_session
from backend.limiter import limiter
from backend.utils.logger import get_logger

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = get_logger(__name__)


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["system", "user", "assistant"]
    content: str = Field(max_length=20000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    purpose: str = Field(max_length=64)
    variant: str = Field(default="", max_length=64)
    messages: List[ChatMessage] = Field(min_length=1, max_length=30)
    temperature: Optional[float] = Field(default=None, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=4000)

    @model_validator(mode="after")
    def valid_selection(self):
        validate_selection(self.purpose, self.variant)
        return self


@router.post("/chat")
@limiter.limit("30/minute")
async def ai_chat(request: Request, body: ChatRequest,
                  current_user: User = Depends(get_current_user),
                  session: Session = Depends(get_session)):
    try:
        model, contexts = resolve_setting(read_settings(session), body.purpose, body.variant)
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE) from None
    if settings.BIFROST_VIRTUAL_KEY:
        configuration = gateway_configuration()
        if configuration is None:
            raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE)
        origin, key = configuration
        url = f"{origin}/v1/chat/completions"
        headers = gateway_headers(key)
    else:
        # Retain the existing OpenRouter connection while the gateway is set up.
        # A configured gateway always owns its failures; another provider/model
        # is never selected silently after a gateway request.
        key = settings.OPENROUTER_API_KEY or settings.VITE_OPENROUTER_API_KEY
        if not key or not model.startswith("openrouter/"):
            raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE)
        model = model.removeprefix("openrouter/")
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {"Authorization": f"Bearer {key}", "HTTP-Referer": "https://continuum.estate",
                   "X-Title": "Continuum Estate", "Content-Type": "application/json"}
    messages = [message.model_dump() for message in body.messages]
    additions = "\n\n".join([*contexts, required_output(body.purpose)])
    # Keep every already-redacted client message and its order. Additional
    # instructions apply after the existing prompt; output requirements remain last.
    system = next((message for message in messages if message["role"] == "system"), None)
    if system is None:
        messages.insert(0, {"role": "system", "content": additions})
    else:
        system["content"] += f"\n\n{additions}"
    payload = {"model": model, "messages": messages, "max_tokens": body.max_tokens or 4000}
    if body.temperature is not None:
        payload["temperature"] = body.temperature
    try:
        response = await get_client().post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as error:
        logger.warning("AI gateway request paused: %s", type(error).__name__)
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE) from None
