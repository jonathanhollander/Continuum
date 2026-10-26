"""
Media Upload/Download Router
Handles file uploads for photos, videos, and audio across all modules
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlmodel import select
from typing import List, Optional
import logging
import mimetypes
import re
from pathlib import Path

from backend.database import get_session, User
from backend.auth import get_current_user
from backend.models.media import MediaFile, MediaFileResponse, MediaUploadResponse
from backend.utils.file_storage import storage
from backend.config import settings
from backend.utils.audit import log_audit, log_deletion
from backend.utils.clock import utc_now
from fastapi import Request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/media", tags=["media"])

# Allowed file types (mirrored by ACCEPTED_MEDIA_TYPES in frontend mediaService.ts)
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic"
}
ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"
}
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/ogg",
    "audio/webm", "audio/mp4", "audio/x-m4a", "audio/aac"
}
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf", "text/plain", "text/csv"
}
# Security: explicitly excluding .doc/.docx to prevent macro viruses

ALLOWED_MIME_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES | ALLOWED_AUDIO_TYPES | ALLOWED_DOCUMENT_TYPES


def base_mime_type(mime_type: str) -> str:
    """'audio/webm;codecs=opus' -> 'audio/webm' (browser recorders add parameters)."""
    return mime_type.split(";")[0].strip().lower()


def validate_file_type(mime_type: str) -> bool:
    """Validate that the file type is allowed"""
    return base_mime_type(mime_type) in ALLOWED_MIME_TYPES


def safe_module_name(module: str) -> str:
    """The module name becomes a storage folder, so keep it to [a-z0-9_-]."""
    cleaned = re.sub(r"[^a-z0-9_-]", "_", (module or "general").lower())[:64]
    return cleaned.strip("_") or "general"


NOT_FOUND = "This file may have been moved."


def get_owned_media(session: Session, media_id: int, user: User) -> MediaFile:
    """The user's own, undeleted file; anyone else's file reads as missing."""
    media = session.get(MediaFile, media_id)
    if not media or media.deleted_at is not None or media.user_id != user.id:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return media


def get_doc_category(mime_type: str) -> str:
    """Determine document category from mime type"""
    if mime_type in ALLOWED_DOCUMENT_TYPES:
        return "documents"
    elif mime_type in ALLOWED_IMAGE_TYPES:
        return "images"
    elif mime_type in ALLOWED_VIDEO_TYPES or mime_type in ALLOWED_AUDIO_TYPES:
        return "media"
    return "uncategorized"


def validate_file_size(file_size: int) -> bool:
    """Validate that the file size is within limits"""
    return file_size <= settings.MAX_UPLOAD_SIZE


def get_download_url(media_id: int) -> str:
    """Generate download URL for a media file"""
    return f"/api/media/{media_id}/download"


@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    module: str = Query(..., description="Module name: heirlooms, properties, visual_memories, time_capsules"),
    reference_id: Optional[str] = Query(None, description="ID of the item in the module"),
    description: Optional[str] = Query(None, description="Optional file description"),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload a media file or document.
    """
    # Validate file type
    mime_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    if not validate_file_type(mime_type):
        raise HTTPException(
            status_code=400,
            detail="This space keeps PDF, text and CSV files, images, audio and video."
        )
    mime_type = base_mime_type(mime_type)
    module = safe_module_name(module)

    # Read file and validate size
    file_data = await file.read()
    file_size = len(file_data)

    if not validate_file_size(file_size):
        max_size_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"This space holds files up to {max_size_mb:.0f} MB. A smaller copy will fit."
        )

    # Determine category
    doc_category = get_doc_category(mime_type)

    # Save file to storage (Hybrid: S3 or Local)
    try:
        from io import BytesIO
        # storage.save_file now returns (path, provider)
        storage_path, provider = storage.save_file(
            file_data=BytesIO(file_data),
            user_id=user.id,
            original_filename=file.filename,
            module=module,
            category=doc_category
        )
    except Exception as e:
        logger.error(f"Media save failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Saving this file paused. It is ready to try again.")

    # Create database record
    media_record = MediaFile(
        user_id=user.id,
        filename=file.filename or "file",
        storage_path=storage_path,
        mime_type=mime_type,
        file_size=file_size,
        module=module,
        reference_id=reference_id,
        description=description,
        storage_provider=provider,
        doc_category=doc_category
    )

    session.add(media_record)
    session.commit()
    session.refresh(media_record)

    # P1-High: Audit logging for media upload
    log_audit(
        session=session,
        request=request,
        action="upload_media",
        user_id=user.id,
        user_email=user.email,
        resource_type="media",
        resource_id=str(media_record.id)
    )

    return MediaUploadResponse(
        id=media_record.id,
        filename=media_record.filename,
        mime_type=media_record.mime_type,
        file_size=media_record.file_size,
        download_url=get_download_url(media_record.id)
    )


@router.get("/{media_id}/download")
def download_media(
    media_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Download a media file by ID.
    Redirects to S3 presigned URL or serves local file. A plain def (card X104): the sync
    session runs in the threadpool, off the event loop.
    """
    media = get_owned_media(session, media_id, user)
    return serve_media_file(media)


def serve_media_file(media: MediaFile):
    """The file's bytes: a presigned redirect for S3, the stored file otherwise."""
    # Handle S3 Storage
    if media.storage_provider == "s3":
        presigned_url = storage.get_presigned_url(media.storage_path)
        if not presigned_url:
            raise HTTPException(status_code=500, detail="This file is taking a moment to open. You can try again shortly.")
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=presigned_url)

    # Handle Local Storage
    file_path = storage.get_file_path(media.storage_path)

    if not file_path.exists():
        logger.error(f"Media {media.id} is missing from storage at {media.storage_path}")
        raise HTTPException(status_code=404, detail=NOT_FOUND)

    # Return file
    return FileResponse(
        path=str(file_path),
        media_type=media.mime_type,
        filename=media.filename
    )


@router.get("/shared/{token}/{media_id}")
def download_shared_media(
    token: str,
    media_id: int,
    session: Session = Depends(get_session)
):
    """
    A file on a recipient's start page (card D2), opened with that page's link instead of a
    sign-in. Only files the recipient view itself shows are served: the owner's own, undeleted
    files attached to a record in that view (held letters and unreleased capsules are left out).
    A plain def (card X104): the sync session runs in the threadpool, off the event loop. The
    link is checked fresh every time; the set of files it shows is kept briefly per token.
    """
    from backend.routers.recipient import contact_for_token, shown_media_ids
    contact = contact_for_token(session, token)
    shown = shown_media_ids(session, contact, token)
    media = session.get(MediaFile, media_id)
    if media_id not in shown or not media or media.deleted_at is not None or media.user_id != contact.user_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return serve_media_file(media)


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
    media = get_owned_media(session, media_id, user)

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
    request: Request,
    media_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a media file (soft delete).
    The actual file remains on disk but is marked as deleted.
    """
    media = get_owned_media(session, media_id, user)

    # P1-High: Audit logging for media deletion
    log_deletion(
        session=session,
        request=request,
        user_id=user.id,
        user_email=user.email,
        resource_type="media",
        resource_id=media_id
    )

    # Soft delete (Mark as deleted in DB)
    media.deleted_at = utc_now()

    session.add(media)
    session.commit()

    # Note: We keep the file in storage for now to allow undo/recovery
    # If hard delete is needed, we would call:
    # storage.delete_file(media.storage_path, provider=media.storage_provider)

    return {"ok": True, "message": "This file has been removed."}


@router.put("/{media_id}/metadata")
def update_media_metadata(
    media_id: int,
    description: Optional[str] = None,
    reference_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update media file metadata (description, reference_id)"""
    media = get_owned_media(session, media_id, user)

    if description is not None:
        media.description = description

    if reference_id is not None:
        media.reference_id = reference_id

    media.updated_at = utc_now()

    session.add(media)
    session.commit()
    session.refresh(media)

    return {"ok": True, "message": "Metadata updated"}
