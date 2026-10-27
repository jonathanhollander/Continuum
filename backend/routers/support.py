from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
from backend.config import settings
from backend.auth import get_current_user
from backend.database import User
from backend.utils.logger import get_logger

router = APIRouter(prefix="/api/support", tags=["support"])
logger = get_logger(__name__)

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    score: float

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str

def _api_key() -> Optional[str]:
    return os.getenv("TAVILY_API_KEY") or getattr(settings, "TAVILY_API_KEY", None)

@router.get("/discovery/available")
def discovery_available(user: User = Depends(get_current_user)):
    """Whether local search is configured, so the page shows it only when it can answer."""
    return {"available": bool(_api_key())}

@router.get("/discovery", response_model=SearchResponse)
async def discover_local_support(
    location: str = Query(..., max_length=200, description="City, state, or zip code"),
    category: str = Query("grief counseling", max_length=100, description="Type of support to search for"),
    user: User = Depends(get_current_user),
):
    """
    Search for local grief support practitioners and groups using Tavily.
    """
    api_key = _api_key()

    if not api_key:
        logger.warning("Local support discovery provider is not configured.")
        raise HTTPException(
            status_code=503,
            detail="We can search for local support again whenever you're ready."
        )

    try:
        async with httpx.AsyncClient() as client:
            search_query = f"local {category} in {location} reviews contact"
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": api_key,
                    "query": search_query,
                    "search_depth": "basic",
                    "include_answer": False,
                    "max_results": 5
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            results = [
                SearchResult(
                    title=res.get("title", "Untitled"),
                    url=res.get("url", "#"),
                    content=res.get("content", ""),
                    score=res.get("score", 0.0)
                ) for res in data.get("results", [])
            ]
            
            return SearchResponse(results=results, query=search_query)

    except Exception as e:
        logger.error(f"Tavily search failed: {e}")
        raise HTTPException(status_code=503, detail="We can search for local support again whenever you're ready.")
