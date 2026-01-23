from typing import Optional
from sqlmodel import Field, SQLModel

class AcceptanceTask(SQLModel, table=True):
    """Model for tracking legal/administrative task acceptance progress."""
    __tablename__ = "acceptance_tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    
    task_id: str = Field(index=True) # ID from DEFAULT_TASKS ('1', '2', etc.)
    page: str
    role: str
    check: str
    status: str = Field(default="Pending") # Pending, Complete
    est_time: int
    section: str
    complexity: str # simple, moderate, complex
