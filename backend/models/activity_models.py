from datetime import datetime
from typing import Optional, List, Any, Dict
from sqlmodel import Field, SQLModel, JSON

class ActivityLogEntry(SQLModel, table=True):
    """General user activity log for tracking module-level changes."""
    __tablename__ = "activity_log_entries"

    id: Optional[str] = Field(default=None, primary_key=True) # UUID from frontend
    user_id: int = Field(foreign_key="users.id", index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    module: str = Field(index=True)
    action: str = Field(index=True) # CREATE, UPDATE, DELETE, etc.
    entity_type: str = Field(index=True)
    entity_id: str
    entity_name: str
    changes: Optional[List[Dict[str, Any]]] = Field(default=None, sa_type=JSON)
    user_context: str = Field(default="owner")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid-123",
                "user_id": 1,
                "timestamp": "2026-01-21T12:00:00Z",
                "module": "heirlooms",
                "action": "CREATE",
                "entity_type": "Heirloom",
                "entity_id": "item-456",
                "entity_name": "Grandpa's Watch",
                "changes": [{"field": "name", "oldValue": None, "newValue": "Grandpa's Watch"}],
                "user_context": "owner"
            }
        }
