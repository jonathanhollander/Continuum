"""Global model choices and additional instructions, separate from estate data."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel

from backend.utils.clock import utc_now


class AISetting(SQLModel, table=True):
    __tablename__ = "ai_settings"
    purpose: str = Field(primary_key=True, max_length=64)
    variant: str = Field(default="", primary_key=True, max_length=64)
    model_id: Optional[str] = Field(default=None, max_length=256)
    additional_context: str = Field(default="", sa_column=Column(Text, nullable=False))
    request_config: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))
    updated_at: datetime = Field(default_factory=utc_now)
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
