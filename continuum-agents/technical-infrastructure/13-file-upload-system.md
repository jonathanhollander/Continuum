# Agent 13: File Upload System
**Priority:** P1 - HIGH
**Estimated Time:** 2 days
**Dependencies:** 05-configuration-management, 01-authentication-architect
**Category:** Technical Infrastructure

---

## OBJECTIVE

Replace IndexedDB file storage with proper backend file upload system.

**Current Issues:**
- Files stored in IndexedDB (browser storage)
- Files lost when browser cache cleared
- No server-side file storage
- Files not backed up
- File size limits in browser

**Expected Outcome:**
- Backend file upload endpoints
- Server-side file storage
- File metadata in database
- Secure file access
- File type validation

---

## IMPLEMENTATION

### Backend File Upload:

**File:** `/backend/routers/files.py`

```python
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from backend.config import settings
from backend.dependencies import get_current_active_user
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/api/files", tags=["files"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload file to server storage"""

    # Validate file type
    if file.content_type not in settings.allowed_upload_types_list:
        raise HTTPException(400, f"File type {file.content_type} not allowed")

    # Validate file size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(400, f"File too large. Max size: {settings.MAX_UPLOAD_SIZE} bytes")

    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    # Create user directory
    user_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    # Save file
    file_path = user_dir / unique_filename
    with open(file_path, 'wb') as f:
        f.write(contents)

    # Save metadata to database
    file_record = FileUpload(
        user_id=current_user.id,
        filename=file.filename,
        stored_filename=unique_filename,
        content_type=file.content_type,
        size=len(contents),
        path=str(file_path)
    )
    session.add(file_record)
    session.commit()

    return {
        "id": file_record.id,
        "filename": file.filename,
        "url": f"/api/files/{file_record.id}"
    }

@router.get("/{file_id}")
async def get_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Download file"""

    file_record = session.get(FileUpload, file_id)

    if not file_record or file_record.user_id != current_user.id:
        raise HTTPException(404, "File not found")

    return FileResponse(file_record.path)
```

### Database Model:

```python
class FileUpload(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    filename: str
    stored_filename: str
    content_type: str
    size: int
    path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## SUCCESS CRITERIA

- [ ] File upload endpoint works
- [ ] Files saved to server storage
- [ ] File metadata in database
- [ ] Secure file access (ownership check)
- [ ] File type and size validation
- [ ] Files organized by user

---

## COMMIT MESSAGE

```
feat(files): implement server-side file upload system

Replace IndexedDB with proper backend file storage.

Implementation:
- File upload endpoint
- Server-side file storage
- File metadata in database
- Secure file access
- File validation

Impact:
- Files no longer lost on browser clear
- Server-side file backup possible
- Larger file support
- Secure file storage

Closes: File upload system
Ref: CODEBASE_REVIEW_REPORT.md issue #5
```

---

**READY TO EXECUTE**
