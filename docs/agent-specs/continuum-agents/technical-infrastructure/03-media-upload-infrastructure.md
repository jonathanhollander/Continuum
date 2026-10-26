# Agent 03: Media Upload Infrastructure
**Priority:** P1 - HIGH
**Estimated Time:** 6-8 hours (1 day)
**Dependencies:** 01-authentication-architect, 05-configuration-management
**Category:** Technical Infrastructure

---

## OBJECTIVE

Replace IndexedDB media storage with proper backend file upload system.

**Current Issues:**
- Media files (photos, videos, audio) stored only in IndexedDB
- Data lost when browser cache cleared
- No cross-device sync for media files
- Large files cause browser performance issues
- Used by: Heirlooms, Time Capsule, Properties, Visual Memories

**Expected Outcome:**
- Backend file upload endpoint with validation
- Files stored in `/uploads/` directory or S3
- File metadata saved to database
- Frontend updated to upload files to backend
- Media accessible across devices
- Secure file access with authentication

---

## FILES TO MODIFY

### Backend Files (Create):
1. `/backend/models/media_file.py` - Media file metadata model
2. `/backend/routers/media.py` - File upload/download endpoints
3. `/backend/config.py` - Upload configuration
4. `/backend/utils/file_storage.py` - File storage utilities

### Backend Files (Modify):
5. `/backend/main.py` - Register media router, serve static files

### Frontend Files (Modify):
6. `/frontend/src/lib/services/indexedDB.ts` - Add backend upload
7. `/frontend/src/lib/components/media/MediaUploader.svelte` - Use backend upload
8. `/frontend/src/routes/modules/heirlooms/+page.svelte` - Load media from backend
9. `/frontend/src/routes/modules/time-capsule/+page.svelte` - Load media from backend
10. `/frontend/src/routes/modules/properties/+page.svelte` - Load media from backend
11. `/frontend/src/routes/modules/visual-memories/+page.svelte` - Load media from backend

---

## IMPLEMENTATION

### Step 1: Create Media File Model

**File:** `/backend/models/media_file.py`

```python
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
from enum import Enum

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"

class MediaFile(SQLModel, table=True):
    """Media file metadata and storage information"""
    __tablename__ = "media_files"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # File Information
    filename: str = Field(max_length=255)
    original_filename: str = Field(max_length=255)
    file_path: str = Field(max_length=500)  # Relative path in storage
    file_size: int  # Bytes
    mime_type: str = Field(max_length=100)
    media_type: MediaType

    # Associations
    module: str = Field(max_length=50)  # heirloom, time_capsule, property, visual_memory
    related_id: Optional[int] = None  # ID of related object (heirloom_id, property_id, etc.)

    # Metadata
    width: Optional[int] = None  # For images/videos
    height: Optional[int] = None  # For images/videos
    duration: Optional[int] = None  # For videos/audio (seconds)

    # Descriptions
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None)
    alt_text: Optional[str] = Field(default=None, max_length=500)

    # Security
    is_public: bool = Field(default=False)
    access_token: Optional[str] = Field(default=None, max_length=64)  # For secure sharing

    # Status
    is_processed: bool = Field(default=True)  # For async processing (thumbnails, etc.)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "filename": "family_photo_20240101_abc123.jpg",
                "original_filename": "IMG_1234.jpg",
                "file_size": 2048576,
                "mime_type": "image/jpeg",
                "media_type": "image",
                "module": "heirloom"
            }
        }
```

---

### Step 2: Create File Storage Utility

**File:** `/backend/utils/file_storage.py`

```python
import os
import hashlib
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException

# Configuration
UPLOAD_DIR = os.getenv('UPLOAD_DIR', './uploads')
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', '52428800'))  # 50MB default
ALLOWED_EXTENSIONS = {
    'image': {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'},
    'video': {'.mp4', '.mov', '.avi', '.webm'},
    'audio': {'.mp3', '.wav', '.m4a', '.ogg'},
    'document': {'.pdf', '.doc', '.docx', '.txt'}
}

def ensure_upload_dir():
    """Create upload directory if it doesn't exist"""
    Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

def get_file_extension(filename: str) -> str:
    """Extract file extension"""
    return Path(filename).suffix.lower()

def get_media_type(filename: str) -> str:
    """Determine media type from file extension"""
    ext = get_file_extension(filename)

    for media_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return media_type

    raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")

def validate_file(file: UploadFile) -> Tuple[str, str]:
    """
    Validate uploaded file

    Returns: (media_type, file_extension)
    Raises: HTTPException if validation fails
    """

    # Check file size (read first chunk to estimate)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to start

    if file_size > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_mb}MB"
        )

    # Check file extension
    ext = get_file_extension(file.filename)
    media_type = get_media_type(file.filename)

    return media_type, ext

def generate_unique_filename(original_filename: str, user_id: int) -> str:
    """
    Generate unique filename to prevent collisions

    Format: {timestamp}_{user_id}_{random_uuid}_{original_name}
    """
    import time

    timestamp = int(time.time())
    random_id = uuid.uuid4().hex[:8]
    ext = get_file_extension(original_filename)
    base_name = Path(original_filename).stem[:50]  # Limit length

    # Sanitize filename
    safe_name = "".join(c for c in base_name if c.isalnum() or c in ('_', '-'))

    return f"{timestamp}_{user_id}_{random_id}_{safe_name}{ext}"

def get_file_path(user_id: int, filename: str) -> str:
    """
    Get storage path for file

    Structure: uploads/{user_id}/{year}/{month}/{filename}
    """
    from datetime import datetime

    now = datetime.utcnow()
    year = now.strftime('%Y')
    month = now.strftime('%m')

    relative_path = f"{user_id}/{year}/{month}/{filename}"
    full_path = Path(UPLOAD_DIR) / relative_path

    # Create directory if needed
    full_path.parent.mkdir(parents=True, exist_ok=True)

    return relative_path

async def save_upload_file(file: UploadFile, user_id: int) -> Tuple[str, int]:
    """
    Save uploaded file to storage

    Returns: (relative_file_path, file_size)
    """

    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename, user_id)

    # Get storage path
    relative_path = get_file_path(user_id, unique_filename)
    full_path = Path(UPLOAD_DIR) / relative_path

    # Save file
    file_size = 0
    with open(full_path, 'wb') as f:
        while chunk := await file.read(1024 * 1024):  # Read 1MB at a time
            f.write(chunk)
            file_size += len(chunk)

    return relative_path, file_size

def delete_file(file_path: str):
    """Delete file from storage"""
    full_path = Path(UPLOAD_DIR) / file_path

    if full_path.exists():
        full_path.unlink()
```

---

### Step 3: Create Media Upload Router

**File:** `/backend/routers/media.py`

```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List
from pathlib import Path
from backend.models.media_file import MediaFile, MediaType
from backend.models.user import User
from backend.database import get_session
from backend.dependencies import get_current_active_user
from backend.utils.file_storage import (
    validate_file,
    save_upload_file,
    delete_file,
    UPLOAD_DIR
)

router = APIRouter(prefix="/api/media", tags=["media"])

@router.post("/upload", response_model=MediaFile)
async def upload_media(
    file: UploadFile = File(...),
    module: str = None,
    related_id: int = None,
    title: str = None,
    description: str = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """
    Upload media file (image, video, audio, document)

    Compassionate handling: Large files may take time to upload.
    """

    # Validate file
    media_type, ext = validate_file(file)

    # Save file to storage
    try:
        file_path, file_size = await save_upload_file(file, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="We encountered an issue uploading your file. Please try again."
        )

    # Create database record
    media_file = MediaFile(
        user_id=current_user.id,
        filename=Path(file_path).name,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or 'application/octet-stream',
        media_type=media_type,
        module=module or 'general',
        related_id=related_id,
        title=title,
        description=description
    )

    session.add(media_file)
    session.commit()
    session.refresh(media_file)

    return media_file

@router.get("/files", response_model=List[MediaFile])
async def get_media_files(
    module: str = None,
    related_id: int = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get all media files for authenticated user"""

    query = select(MediaFile).where(MediaFile.user_id == current_user.id)

    if module:
        query = query.where(MediaFile.module == module)
    if related_id:
        query = query.where(MediaFile.related_id == related_id)

    files = session.exec(query).all()
    return files

@router.get("/files/{file_id}", response_model=MediaFile)
async def get_media_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get media file metadata"""

    media_file = session.get(MediaFile, file_id)

    if not media_file or media_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return media_file

@router.get("/download/{file_id}")
async def download_media_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Download actual media file"""

    media_file = session.get(MediaFile, file_id)

    if not media_file or media_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    full_path = Path(UPLOAD_DIR) / media_file.file_path

    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File no longer exists in storage"
        )

    return FileResponse(
        path=full_path,
        filename=media_file.original_filename,
        media_type=media_file.mime_type
    )

@router.delete("/files/{file_id}")
async def delete_media_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Delete media file"""

    media_file = session.get(MediaFile, file_id)

    if not media_file or media_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Delete from storage
    try:
        delete_file(media_file.file_path)
    except Exception as e:
        # Continue even if file deletion fails (may already be deleted)
        pass

    # Delete from database
    session.delete(media_file)
    session.commit()

    return {"message": "File deleted successfully"}

@router.put("/files/{file_id}", response_model=MediaFile)
async def update_media_file(
    file_id: int,
    title: str = None,
    description: str = None,
    alt_text: str = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Update media file metadata (not the file itself)"""

    media_file = session.get(MediaFile, file_id)

    if not media_file or media_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    if title is not None:
        media_file.title = title
    if description is not None:
        media_file.description = description
    if alt_text is not None:
        media_file.alt_text = alt_text

    media_file.updated_at = datetime.utcnow()

    session.add(media_file)
    session.commit()
    session.refresh(media_file)

    return media_file
```

---

### Step 4: Update Frontend Media Service

**File:** `/frontend/src/lib/services/mediaService.ts` (create new)

```typescript
import { apiRequest } from '$lib/api/client';

export interface MediaFile {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  module: string;
  related_id?: number;
  title?: string;
  description?: string;
  created_at: string;
}

export class MediaService {
  /**
   * Upload media file to backend
   */
  static async uploadFile(
    file: File,
    module: string,
    relatedId?: number,
    metadata?: { title?: string; description?: string }
  ): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);

    if (module) formData.append('module', module);
    if (relatedId) formData.append('related_id', relatedId.toString());
    if (metadata?.title) formData.append('title', metadata.title);
    if (metadata?.description) formData.append('description', metadata.description);

    const response = await apiRequest('/api/media/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return await response.json();
  }

  /**
   * Get all media files for a module
   */
  static async getFiles(module?: string, relatedId?: number): Promise<MediaFile[]> {
    const params = new URLSearchParams();
    if (module) params.append('module', module);
    if (relatedId) params.append('related_id', relatedId.toString());

    const response = await apiRequest(`/api/media/files?${params}`);

    if (!response.ok) {
      throw new Error('Failed to load media files');
    }

    return await response.json();
  }

  /**
   * Get download URL for media file
   */
  static getDownloadUrl(fileId: number): string {
    return `/api/media/download/${fileId}`;
  }

  /**
   * Delete media file
   */
  static async deleteFile(fileId: number): Promise<void> {
    const response = await apiRequest(`/api/media/files/${fileId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Update media file metadata
   */
  static async updateFile(
    fileId: number,
    metadata: { title?: string; description?: string; alt_text?: string }
  ): Promise<MediaFile> {
    const params = new URLSearchParams();
    if (metadata.title) params.append('title', metadata.title);
    if (metadata.description) params.append('description', metadata.description);
    if (metadata.alt_text) params.append('alt_text', metadata.alt_text);

    const response = await apiRequest(`/api/media/files/${fileId}?${params}`, {
      method: 'PUT'
    });

    if (!response.ok) {
      throw new Error('Failed to update file');
    }

    return await response.json();
  }
}
```

---

### Step 5: Update Frontend MediaUploader Component

**File:** `/frontend/src/lib/components/media/MediaUploader.svelte`

**Replace IndexedDB with backend upload:**

```svelte
<script lang="ts">
  import { MediaService } from '$lib/services/mediaService';

  export let module: string;
  export let relatedId: number | undefined = undefined;
  export let accept: string = 'image/*,video/*,audio/*';
  export let maxSizeMB: number = 50;

  let uploading = false;
  let progress = 0;
  let error = '';

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      error = `File too large. Maximum size is ${maxSizeMB}MB.`;
      return;
    }

    error = '';
    uploading = true;
    progress = 0;

    try {
      // Upload to backend
      const mediaFile = await MediaService.uploadFile(file, module, relatedId);

      // Emit success event
      dispatch('uploaded', mediaFile);

      progress = 100;
    } catch (err) {
      error = err.message || 'Upload failed. Please try again.';
      console.error('Upload error:', err);
    } finally {
      uploading = false;
      input.value = ''; // Reset input
    }
  }
</script>

<div class="media-uploader">
  <input
    type="file"
    {accept}
    on:change={handleFileSelect}
    disabled={uploading}
    class="file-input"
  />

  {#if uploading}
    <div class="upload-progress">
      <p>Uploading your file...</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="error-message">
      <p>{error}</p>
    </div>
  {/if}
</div>
```

---

### Step 6: Register Media Router and Serve Uploads

**File:** `/backend/main.py`

**Add media router and static file serving:**

```python
from fastapi.staticfiles import StaticFiles
from backend.routers import media
from backend.utils.file_storage import UPLOAD_DIR, ensure_upload_dir

# Ensure upload directory exists
ensure_upload_dir()

# Register media router
app.include_router(media.router)

# Serve uploaded files (only for authenticated users - handled by router)
# Note: For production, use CDN or object storage (S3) instead
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Backend validation
cd backend
python -m pytest tests/test_media.py

# Test file storage utility
python -c "from utils.file_storage import validate_file; print('✓ File storage valid')"

# Test media model
python -c "from models.media_file import MediaFile; print('✓ Media model valid')"

# Test media router
python -c "from routers.media import router; print('✓ Media router valid')"

# Frontend validation
cd frontend
npm run check
npm run build

# Test upload directory creation
python -c "from backend.utils.file_storage import ensure_upload_dir; ensure_upload_dir(); print('✓ Upload dir created')"
```

---

## SUCCESS CRITERIA

- [ ] Media file model created with metadata fields
- [ ] File storage utility with validation and unique naming
- [ ] Upload endpoint accepts files up to 50MB
- [ ] Download endpoint serves files securely
- [ ] Delete endpoint removes file from storage and database
- [ ] Frontend MediaService created
- [ ] MediaUploader component updated to use backend
- [ ] All modules (Heirlooms, Time Capsule, Properties, Visual Memories) using backend
- [ ] Files accessible across devices
- [ ] Files persist after browser cache clear
- [ ] Proper error messages for upload failures
- [ ] File size and type validation working

---

## TESTING

### Manual Testing:

1. **Upload Flow:**
   - Open Heirlooms module
   - Upload photo (< 50MB)
   - Verify appears in UI
   - Check database for media_file record
   - Check uploads directory for actual file

2. **Download Flow:**
   - Click on uploaded image
   - Verify file downloads correctly
   - Verify correct filename

3. **Cross-Device Test:**
   - Upload image on Device A
   - Login on Device B
   - Verify image appears on Device B

4. **Validation Tests:**
   - Try uploading 100MB file (should fail)
   - Try uploading .exe file (should fail)
   - Try uploading valid image (should succeed)

### Automated Testing:

```python
# backend/tests/test_media.py
def test_upload_image(client, auth_headers):
    with open('test_image.jpg', 'rb') as f:
        response = client.post(
            '/api/media/upload',
            files={'file': ('test.jpg', f, 'image/jpeg')},
            data={'module': 'heirloom'},
            headers=auth_headers
        )
    assert response.status_code == 200
    assert 'file_path' in response.json()

def test_upload_too_large(client, auth_headers):
    # Create 100MB dummy file
    large_file = b'0' * (100 * 1024 * 1024)
    response = client.post(
        '/api/media/upload',
        files={'file': ('large.jpg', large_file, 'image/jpeg')},
        headers=auth_headers
    )
    assert response.status_code == 400
    assert 'too large' in response.json()['detail'].lower()

def test_download_media(client, auth_headers, media_file_id):
    response = client.get(
        f'/api/media/download/{media_file_id}',
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.headers['content-type'] == 'image/jpeg'
```

---

## ROLLBACK

### If Issues Occur:

```bash
# Remove upload directory
rm -rf backend/uploads

# Revert code changes
git checkout HEAD -- backend/models/media_file.py
git checkout HEAD -- backend/routers/media.py
git checkout HEAD -- backend/utils/file_storage.py
git checkout HEAD -- backend/main.py
git checkout HEAD -- frontend/src/lib/services/mediaService.ts
git checkout HEAD -- frontend/src/lib/components/media/MediaUploader.svelte

# Revert database migration
cd backend
alembic downgrade -1
```

---

## COMMIT MESSAGE

```
feat(media): implement backend file upload infrastructure

Replace IndexedDB media storage with proper backend file upload system.

Issues Fixed:
- Media files stored only in IndexedDB (lost on cache clear)
- No cross-device sync for photos/videos/audio
- Large files cause browser performance issues
- Used by: Heirlooms, Time Capsule, Properties, Visual Memories

Implementation:

Backend:
- backend/models/media_file.py: Media file metadata model
  - Tracks filename, size, mime type, module association
  - User isolation with foreign key
  - Support for images, videos, audio, documents

- backend/utils/file_storage.py: File storage utilities
  - File validation (size, type, extension)
  - Unique filename generation to prevent collisions
  - Directory structure: uploads/{user_id}/{year}/{month}/{filename}
  - Max 50MB file size (configurable via env var)

- backend/routers/media.py: Upload/download endpoints
  - POST /api/media/upload: Upload file with metadata
  - GET /api/media/files: List user's media files
  - GET /api/media/download/{id}: Download file
  - DELETE /api/media/files/{id}: Delete file
  - PUT /api/media/files/{id}: Update metadata
  - All endpoints require authentication

Frontend:
- frontend/src/lib/services/mediaService.ts: Media upload service
  - uploadFile(): Upload to backend with progress
  - getFiles(): Load media files for module
  - deleteFile(): Remove file
  - updateFile(): Update metadata

- frontend/src/lib/components/media/MediaUploader.svelte:
  - Uses backend upload instead of IndexedDB
  - File size validation
  - Upload progress indicator
  - Error handling with user-friendly messages

- Updated modules to use backend media:
  - Heirlooms, Time Capsule, Properties, Visual Memories

Security:
- Authentication required for all uploads/downloads
- User isolation (can only access own files)
- File type validation (only allowed extensions)
- File size limits enforced
- Unique filenames prevent overwrites

Storage:
- Files stored in uploads/ directory
- Organized by user, year, month
- Database tracks metadata
- Secure file access with authentication

Testing:
- Unit tests for file validation
- Integration tests for upload/download
- Manual testing of cross-device access
- File size limit enforcement verified

Impact:
- CRITICAL: Prevents media data loss
- Files accessible across devices
- Cloud backup of precious memories
- Better performance (no large files in browser)
- Production-ready media management

Future Enhancements:
- S3/CloudFront for scalability
- Image thumbnail generation
- Video transcoding
- Progress callbacks for large uploads

Closes: Media file persistence
Ref: CODEBASE_REVIEW_REPORT.md issue #4
```

---

## NOTES

- This fixes CRITICAL media data loss issue
- For production, use S3/CloudFront instead of local storage
- Consider adding:
  - Image thumbnail generation (Pillow library)
  - Video transcoding (ffmpeg)
  - Virus scanning (ClamAV)
  - CDN integration for faster delivery
- Add backup strategy for uploads/ directory
- Consider rate limiting uploads to prevent abuse
- May want to add image compression before storage
- Implement cleanup job for orphaned files
- Add total storage quota per user

### Security Considerations:
- Validate file content (not just extension)
- Scan for malware before serving
- Use signed URLs for time-limited access
- Implement CORS properly for media serving
- Consider watermarking for shared images

### Performance Optimizations:
- Generate thumbnails asynchronously
- Cache frequently accessed files
- Use CDN for static file serving
- Implement lazy loading in frontend
- Add pagination for media galleries

---

**READY TO EXECUTE**

Claude: Read this specification and execute after authentication is implemented.
