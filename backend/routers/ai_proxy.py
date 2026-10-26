"""
Server-side AI proxy. The OpenRouter key stays on the server; the browser
only talks to /api/ai/chat with its normal login token.
"""
from typing import List, Literal, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from backend.auth import get_current_user
from backend.config import settings
from backend.limiter import limiter
from backend.database import User
from backend.utils.logger import get_logger

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
ALLOWED_MODELS = {"google/gemini-2.0-flash-001"}
UNAVAILABLE_MESSAGE = (
    "AI help is resting right now. Everything else is here for you, "
    "and you can come back whenever you're ready."
)

_client: Optional[httpx.AsyncClient] = None


def _get_client() -> httpx.AsyncClient:
    """One shared client (lazily created) so connections to OpenRouter are reused."""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0))
    return _client


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(max_length=20000)


class ChatRequest(BaseModel):
    model: str = "google/gemini-2.0-flash-001"
    messages: List[ChatMessage] = Field(min_length=1, max_length=30)
    temperature: Optional[float] = Field(default=None, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=4000)


@router.post("/chat")
@limiter.limit("30/minute")
async def ai_chat(
    request: Request,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Forward a chat completion to OpenRouter and return its response unchanged."""
    api_key = settings.OPENROUTER_API_KEY or settings.VITE_OPENROUTER_API_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE)
    if body.model not in ALLOWED_MODELS:
        raise HTTPException(status_code=400, detail="This space offers a different assistant.")

    payload = body.model_dump(exclude_none=True)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://continuum.estate",
        "X-Title": "Continuum Estate",
        "Content-Type": "application/json",
    }
    try:
        resp = await _get_client().post(OPENROUTER_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        logger.warning(f"AI provider request failed: {type(exc).__name__}")
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE)

    if resp.status_code != 200:
        logger.warning(f"AI provider returned status {resp.status_code}")
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE)
    try:
        return resp.json()
    except ValueError:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE)
