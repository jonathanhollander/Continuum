# Media Upload System

## Overview

The Continuum SaaS media upload system replaces IndexedDB-only storage with a robust backend file upload/download infrastructure. Media files (photos, videos, audio) are now stored on the server filesystem with metadata in the database, enabling cross-device sync and preventing data loss from browser cache clears.

## Architecture

### Backend Components

1. **MediaFile Model** (`backend/models/media.py`)
   - Stores file metadata in database
   - Tracks user ownership, file location, MIME type, size
   - Associates files with modules (heirlooms, properties, etc.)
   - Supports soft deletion

2. **File Storage** (`backend/utils/file_storage.py`)
   - Handles physical file storage in `/backend/uploads/`
   - User-isolated directories: `/uploads/{user_id}/{module}/`
   - Generates unique filenames to prevent collisions
   - Designed for easy migration to S3 in production

3. **Media Router** (`backend/routers/media.py`)
   - `POST /api/media/upload` - Upload files
   - `GET /api/media/{id}/download` - Download files
   - `GET /api/media/` - List user's media files
   - `DELETE /api/media/{id}` - Soft delete files
   - `PUT /api/media/{id}/metadata` - Update metadata

### Frontend Components

1. **Media Service** (`frontend/src/lib/services/mediaService.ts`)
   - `uploadMedia()` - Upload with progress tracking
   - `listMedia()` - Fetch media list
   - `getMediaBlobUrl()` - Get blob URL for display
   - `deleteMedia()` - Delete files
   - File validation and size formatting utilities

2. **MediaUploader Component** (`frontend/src/lib/components/MediaUploader.svelte`)
   - Reusable upload component with drag-and-drop
   - Progress indicators
   - File preview for images
   - Error handling

3. **Migration Tools** (`frontend/src/lib/services/mediaMigration.ts`)
   - `migrateAllMedia()` - Migrate IndexedDB to backend
   - `needsMigration()` - Check if migration needed
   - Progress tracking and error handling

4. **Migration Notice** (`frontend/src/lib/components/MediaMigrationNotice.svelte`)
   - Automatic detection of IndexedDB media
   - User-friendly migration UI
   - Progress visualization

## Usage

### Basic Upload Example

```typescript
import { uploadMedia } from '$lib/services/mediaService';

async function handleUpload(file: File) {
    try {
        const result = await uploadMedia(
            file,
            'heirlooms',  // module name
            'heirloom-123',  // reference ID
            'Family photo from 1975',  // description
            (progress) => {
                console.log(`Upload: ${progress.percentage}%`);
            }
        );

        console.log('Uploaded:', result.download_url);
    } catch (error) {
        console.error('Upload failed:', error);
    }
}
```

### Using MediaUploader Component

```svelte
<script>
    import MediaUploader from '$lib/components/MediaUploader.svelte';

    function handleSuccess(event) {
        const { mediaId, downloadUrl } = event.detail;
        console.log('Media uploaded:', mediaId, downloadUrl);
        // Update your data model with the mediaId
    }
</script>

<MediaUploader
    module="heirlooms"
    referenceId={heirloomId}
    on:success={handleSuccess}
    on:error={(e) => console.error(e.detail.message)}
/>
```

### Displaying Images

```typescript
import { getMediaBlobUrl } from '$lib/services/mediaService';

// Get blob URL for displaying in <img> tag
const imageUrl = await getMediaBlobUrl(mediaId);

// Or use direct download URL (requires auth token in URL)
const directUrl = getMediaDownloadUrl(mediaId);
```

### Listing Media Files

```typescript
import { listMedia } from '$lib/services/mediaService';

// Get all media for a module
const heirloomPhotos = await listMedia('heirlooms');

// Get media for specific item
const itemPhotos = await listMedia('heirlooms', 'heirloom-123');
```

## Migration from IndexedDB

### Automatic Migration

Add the `MediaMigrationNotice` component to your app's root layout:

```svelte
<script>
    import MediaMigrationNotice from '$lib/components/MediaMigrationNotice.svelte';
</script>

<MediaMigrationNotice />
```

The component will:
1. Auto-detect IndexedDB media on mount
2. Show migration notice to user
3. Migrate files when user clicks "Migrate Now"
4. Track progress and handle errors
5. Clean up IndexedDB after successful migration

### Manual Migration

```typescript
import { migrateAllMedia } from '$lib/services/mediaMigration';

const result = await migrateAllMedia((progress) => {
    console.log(`Migrating: ${progress.completed}/${progress.total}`);
});

if (result.success) {
    console.log(`Migrated ${result.migrated} files`);
} else {
    console.error(`Failed: ${result.failed} errors`);
}
```

## File Upload Limits

- **Max File Size**: 10MB (configurable via `MAX_UPLOAD_SIZE` in `config.py`)
- **Allowed Types**:
  - Images: JPEG, PNG, GIF, WebP, HEIC
  - Videos: MP4, QuickTime, WebM, AVI
  - Audio: MP3, WAV, OGG, WebM

## Storage Structure

```
backend/uploads/
├── {user_id}/
│   ├── heirlooms/
│   │   ├── abc-def-123.jpg
│   │   └── xyz-789-456.png
│   ├── properties/
│   │   └── property-photo.jpg
│   ├── visual_memories/
│   │   └── memory-video.mp4
│   └── time_capsules/
│       └── capsule-audio.mp3
```

## Security

- **Authentication Required**: All endpoints require valid JWT token
- **User Isolation**: Users can only access their own files
- **File Validation**: MIME type and size checks on upload
- **Soft Deletion**: Files marked deleted but retained on disk
- **Path Security**: Storage paths validated to prevent directory traversal

## Database Schema

```sql
CREATE TABLE media_files (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    module TEXT NOT NULL,
    reference_id TEXT,
    description TEXT,
    width INTEGER,
    height INTEGER,
    duration REAL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    deleted_at DATETIME
);
```

## Production Deployment

### S3 Storage (Future)

The storage layer is designed for easy S3 migration:

1. Uncomment S3Storage class in `file_storage.py`
2. Add S3 credentials to config:
   ```python
   S3_BUCKET_NAME: str = "continuum-media"
   S3_ACCESS_KEY: str = "your_access_key"
   S3_SECRET_KEY: str = "your_secret_key"
   ```
3. Update storage initialization:
   ```python
   storage = S3Storage(
       bucket_name=settings.S3_BUCKET_NAME,
       aws_access_key=settings.S3_ACCESS_KEY,
       aws_secret_key=settings.S3_SECRET_KEY
   )
   ```

### Environment Variables

```bash
# Upload Configuration
UPLOAD_DIR=backend/uploads
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes

# Optional: S3 Configuration
# S3_BUCKET_NAME=continuum-media
# S3_ACCESS_KEY=your_key
# S3_SECRET_KEY=your_secret
# S3_REGION=us-east-1
```

## Testing

### Manual Testing Steps

1. **Upload Test**
   ```bash
   curl -X POST http://localhost:8000/api/media/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test-image.jpg" \
     -F "module=heirlooms" \
     -F "reference_id=test-123"
   ```

2. **List Media**
   ```bash
   curl http://localhost:8000/api/media/?module=heirlooms \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Download Test**
   ```bash
   curl http://localhost:8000/api/media/1/download \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -o downloaded.jpg
   ```

### Integration Testing

Test the migration flow:

1. Create test media in IndexedDB
2. Trigger migration with `MediaMigrationNotice`
3. Verify files uploaded to backend
4. Confirm IndexedDB cleared
5. Test cross-device access (login on different browser)

## Troubleshooting

### Upload Fails with 413

- File exceeds size limit
- Increase `MAX_UPLOAD_SIZE` in config

### Upload Fails with 400

- Invalid file type
- Check file MIME type against `ALLOWED_MIME_TYPES`

### File Not Found on Download

- Check `storage_path` in database
- Verify file exists in `/backend/uploads/`
- Check user ID matches file owner

### Migration Errors

- Check browser console for specific errors
- Verify auth token is valid
- Ensure backend is running
- Check network connectivity

## Future Enhancements

- [ ] Image resizing/thumbnails
- [ ] Video transcoding
- [ ] CDN integration
- [ ] Batch upload
- [ ] Resumable uploads
- [ ] Client-side encryption
- [ ] Shared albums/galleries
- [ ] EXIF data extraction
- [ ] Automatic backup to multiple storage providers
