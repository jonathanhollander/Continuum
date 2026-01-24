"""
Media File Models
Handles metadata for uploaded media files (photos, videos, audio)
"""
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime


class MediaFile(SQLModel, table=True):
    """
    Stores metadata for uploaded media files.
    Actual files are stored in filesystem or S3.
    """
    __tablename__ = "media_files"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # File metadata
    filename: str  # Original filename from user
    storage_path: str  # Path where file is stored (relative to UPLOAD_DIR)
    mime_type: str  # e.g., image/jpeg, video/mp4, audio/mpeg
    file_size: int  # Size in bytes

    # Association metadata
    module: str  # Which module uses this: heirlooms, properties, visual_memories, time_capsules
    reference_id: Optional[str] = None  # ID of the item in that module (e.g., heirloom_id)

    # Storage Architecture
    storage_provider: str = Field(default="local")  # "local" or "s3"
    doc_category: str = Field(default="uncategorized")  # medical, legal, financial, personal, vet_records, media (fallback)
    
    # Optional metadata
    description: Optional[str] = None
    width: Optional[int] = None  # For images/videos
    height: Optional[int] = None  # For images/videos
    duration: Optional[float] = None  # For videos/audio in seconds

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Soft delete support
    deleted_at: Optional[datetime] = None


class MediaFileResponse(SQLModel):
    """Response model for media file metadata"""
    id: int
    filename: str
    mime_type: str
    file_size: int
    module: str
    reference_id: Optional[str] = None
    description: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    created_at: datetime
    download_url: str  # Computed URL for downloading the file


class MediaUploadResponse(SQLModel):
    """Response after successful upload"""
    id: int
    filename: str
    mime_type: str
    file_size: int
    download_url: str
    message: str = "File uploaded successfully"
