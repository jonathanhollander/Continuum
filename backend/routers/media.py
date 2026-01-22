"""
Media Upload/Download Router
Handles file uploads for photos, videos, and audio across all modules
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlmodel import select
from typing import List, Optional
import mimetypes
from pathlib import Path

from backend.database import get_session, User
from backend.auth import get_current_user
from backend.models.media import MediaFile, MediaFileResponse, MediaUploadResponse
from backend.utils.file_storage import storage
from backend.config import settings

router = APIRouter(prefix="/api/media", tags=["media"])

# Allowed file types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic"
}
ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"
}
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"
}
ALLOWED_MIME_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES | ALLOWED_AUDIO_TYPES


def validate_file_type(mime_type: str) -> bool:
    """Validate that the file type is allowed"""
    return mime_type.lower() in ALLOWED_MIME_TYPES


def validate_file_size(file_size: int) -> bool:
    """Validate that the file size is within limits"""
    return file_size <= settings.MAX_UPLOAD_SIZE


def get_download_url(media_id: int) -> str:
    """Generate download URL for a media file"""
    return f"/api/media/{media_id}/download"


@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media(
    file: UploadFile = File(...),
    module: str = Query(..., description="Module name: heirlooms, properties, visual_memories, time_capsules"),
    reference_id: Optional[str] = Query(None, description="ID of the item in the module"),
    description: Optional[str] = Query(None, description="Optional file description"),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload a media file (image, video, or audio).

    - **file**: The file to upload
    - **module**: Which module this file belongs to (heirlooms, properties, etc.)
    - **reference_id**: Optional ID of the item in that module
    - **description**: Optional description of the file
    """
    # Validate file type
    mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    if not validate_file_type(mime_type):
        raise HTTPException(
            status_code=400,
            detail=f"File type '{mime_type}' not allowed. Allowed types: images, videos, audio."
        )

    # Read file and validate size
    file_data = await file.read()
    file_size = len(file_data)

    if not validate_file_size(file_size):
        max_size_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {max_size_mb:.1f}MB"
        )

    # Save file to storage
    try:
        from io import BytesIO
        storage_path = storage.save_file(
            file_data=BytesIO(file_data),
            user_id=user.id,
            original_filename=file.filename,
            module=module
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create database record
    media_record = MediaFile(
        user_id=user.id,
        filename=file.filename,
        storage_path=storage_path,
        mime_type=mime_type,
        file_size=file_size,
        module=module,
        reference_id=reference_id,
        description=description
    )

    session.add(media_record)
    session.commit()
    session.refresh(media_record)

    return MediaUploadResponse(
        id=media_record.id,
        filename=media_record.filename,
        mime_type=media_record.mime_type,
        file_size=media_record.file_size,
        download_url=get_download_url(media_record.id)
    )


@router.get("/{media_id}/download")
async def download_media(
    media_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Download a media file by ID.
    Returns the actual file with proper content-type headers.
    """
    # Get media record
    media = session.get(MediaFile, media_id)

    if not media or media.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Media file not found")

    # Verify user owns this file
    if media.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get file path
    file_path = storage.get_file_path(media.storage_path)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    # Return file
    return FileResponse(
        path=str(file_path),
        media_type=media.mime_type,
        filename=media.filename
    )


@router.get("/", response_model=List[MediaFileResponse])
def list_media(
    module: Optional[str] = Query(None, description="Filter by module"),
    reference_id: Optional[str] = Query(None, description="Filter by reference_id"),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all media files for the current user.
    Optionally filter by module or reference_id.
    """
    statement = select(MediaFile).where(
        MediaFile.user_id == user.id,
        MediaFile.deleted_at == None
    )

    if module:
        statement = statement.where(MediaFile.module == module)

    if reference_id:
        statement = statement.where(MediaFile.reference_id == reference_id)

    media_files = session.exec(statement).all()

    return [
        MediaFileResponse(
            id=m.id,
            filename=m.filename,
            mime_type=m.mime_type,
            file_size=m.file_size,
            module=m.module,
            reference_id=m.reference_id,
            description=m.description,
            width=m.width,
            height=m.height,
            duration=m.duration,
            created_at=m.created_at,
            download_url=get_download_url(m.id)
        )
        for m in media_files
    ]


@router.get("/{media_id}", response_model=MediaFileResponse)
def get_media(
    media_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get metadata for a specific media file"""
    media = session.get(MediaFile, media_id)

    if not media or media.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Media file not found")

    if media.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return MediaFileResponse(
        id=media.id,
        filename=media.filename,
        mime_type=media.mime_type,
        file_size=media.file_size,
        module=media.module,
        reference_id=media.reference_id,
        description=media.description,
        width=media.width,
        height=media.height,
        duration=media.duration,
        created_at=media.created_at,
        download_url=get_download_url(media.id)
    )


@router.delete("/{media_id}")
def delete_media(
    media_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a media file (soft delete).
    The actual file remains on disk but is marked as deleted.
    """
    media = session.get(MediaFile, media_id)

    if not media or media.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Media file not found")

    if media.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Soft delete
    from datetime import datetime
    media.deleted_at = datetime.utcnow()

    session.add(media)
    session.commit()

    # Optionally delete physical file (commented out for safety)
    # storage.delete_file(media.storage_path)

    return {"ok": True, "message": "Media file deleted"}


@router.put("/{media_id}/metadata")
def update_media_metadata(
    media_id: int,
    description: Optional[str] = None,
    reference_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update media file metadata (description, reference_id)"""
    media = session.get(MediaFile, media_id)

    if not media or media.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Media file not found")

    if media.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if description is not None:
        media.description = description

    if reference_id is not None:
        media.reference_id = reference_id

    from datetime import datetime
    media.updated_at = datetime.utcnow()

    session.add(media)
    session.commit()
    session.refresh(media)

    return {"ok": True, "message": "Metadata updated"}
