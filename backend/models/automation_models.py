from typing import Optional
from sqlmodel import Field, SQLModel

class AutomationRule(SQLModel, table=True):
    """Model for user-defined automation rules."""
    __tablename__ = "automation_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str
    description: str
    enabled: bool = Field(default=True)
    type: str = Field(default="notification") # notification, task, alert
