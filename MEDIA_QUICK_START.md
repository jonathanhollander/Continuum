# Media Upload System - Quick Start

## 🚀 For Developers

### Backend Setup (Already Done)

The backend infrastructure is complete:

✅ Media file model and database table
✅ File upload/download endpoints
✅ User-isolated file storage
✅ Authentication and security
✅ S3-ready architecture

### Frontend Integration (3 Steps)

#### Step 1: Add Upload Component

```svelte
<script>
    import MediaUploader from '$lib/components/MediaUploader.svelte';

    let itemId = 'heirloom-123';

    function handleUpload(event) {
        const { mediaId, downloadUrl } = event.detail;
        // Save mediaId to your data model
        console.log('Uploaded:', mediaId, downloadUrl);
    }
</script>

<MediaUploader
    module="heirlooms"
    referenceId={itemId}
    on:success={handleUpload}
/>
```

#### Step 2: Display Media

```svelte
<script>
    import { onMount } from 'svelte';
    import { getMediaBlobUrl } from '$lib/services/mediaService';

    let imageUrl = '';

    onMount(async () => {
        imageUrl = await getMediaBlobUrl(mediaId);
    });
</script>

<img src={imageUrl} alt="Media" />
```

#### Step 3: Add Migration Notice

```svelte
<!-- In +layout.svelte or main app component -->
<script>
    import MediaMigrationNotice from '$lib/components/MediaMigrationNotice.svelte';
</script>

<MediaMigrationNotice />
```

That's it! Your module now has backend media storage.

## 📋 API Reference

### Upload Media

```typescript
import { uploadMedia } from '$lib/services/mediaService';

const result = await uploadMedia(
    file,              // File object
    'heirlooms',       // Module name
    'item-123',        // Reference ID (optional)
    'Description',     // Description (optional)
    (progress) => {    // Progress callback (optional)
        console.log(`${progress.percentage}% uploaded`);
    }
);

// Result: { id, filename, mime_type, file_size, download_url }
```

### List Media

```typescript
import { listMedia } from '$lib/services/mediaService';

// All media for a module
const media = await listMedia('heirlooms');

// Media for specific item
const media = await listMedia('heirlooms', 'item-123');
```

### Get Media URL

```typescript
import { getMediaBlobUrl } from '$lib/services/mediaService';

const url = await getMediaBlobUrl(mediaId);
// Use this URL in <img src={url} />
```

### Delete Media

```typescript
import { deleteMedia } from '$lib/services/mediaService';

await deleteMedia(mediaId);
```

## 🎯 Module Names

Use these standard module names:

- `heirlooms` - Heirloom photos
- `properties` - Property photos/documents
- `visual_memories` - Memory photos/videos
- `time_capsules` - Time capsule media
- `documents` - General documents
- `profiles` - Profile pictures

## ✅ File Types Supported

**Images**: JPEG, PNG, GIF, WebP, HEIC
**Videos**: MP4, QuickTime, WebM, AVI
**Audio**: MP3, WAV, OGG, WebM

Max size: 10MB (configurable)

## 🔒 Security

- All endpoints require authentication
- Users can only access their own files
- Files stored in user-isolated directories
- Automatic MIME type validation
- File size validation

## 🗄️ Storage Structure

```
backend/uploads/
└── {user_id}/
    ├── heirlooms/
    ├── properties/
    ├── visual_memories/
    └── time_capsules/
```

## 🔄 Migration

Existing IndexedDB media is automatically detected and can be migrated with one click via the `MediaMigrationNotice` component.

## 📊 Database Schema

Media metadata stored in `media_files` table:

```sql
- id: int (primary key)
- user_id: int (foreign key)
- filename: string
- storage_path: string
- mime_type: string
- file_size: int
- module: string
- reference_id: string (optional)
- created_at: datetime
```

## 🛠️ Utilities

### File Validation

```typescript
import { isValidMediaType } from '$lib/services/mediaService';

if (!isValidMediaType(file)) {
    alert('Invalid file type');
}
```

### File Size Formatting

```typescript
import { formatFileSize } from '$lib/services/mediaService';

console.log(formatFileSize(1024000)); // "1000 KB"
```

### File to Data URL

```typescript
import { fileToDataUrl } from '$lib/services/mediaService';

const dataUrl = await fileToDataUrl(file);
// Use for preview before upload
```

## 🧪 Testing

### Manual Test

1. Start backend: `cd backend && uvicorn main:app --reload`
2. Login to app
3. Upload a file using MediaUploader
4. Check `/backend/uploads/{user_id}/` for file
5. Refresh page - file should still display
6. Login on different device - file should sync

### Test Migration

1. Create test media in IndexedDB (use old system)
2. Refresh page
3. Migration notice should appear
4. Click "Migrate Now"
5. Verify files uploaded to backend

## 🐛 Common Issues

**Upload fails**: Check auth token, file size, file type
**Can't see media**: Verify user ID matches, check storage path
**Migration fails**: Check network, verify backend running

## 📚 Full Documentation

- **Backend Guide**: `/backend/MEDIA_UPLOAD_GUIDE.md`
- **Integration Examples**: `/INTEGRATION_EXAMPLES.md`
- **API Endpoints**: Visit `/docs` when backend running

## 💡 Best Practices

1. Always use `module` parameter to organize files
2. Set `reference_id` to link media to parent items
3. Handle upload errors gracefully
4. Show upload progress for large files
5. Use lazy loading for image galleries
6. Clean up blob URLs with `URL.revokeObjectURL()`
7. Delete media when parent items are deleted

## 🚀 Production Deployment

### Railway

Already configured! Just deploy:

```bash
git push railway main
```

The `/backend/uploads/` directory is automatically created.

### S3 (Future)

To migrate to S3, update `backend/utils/file_storage.py` and add S3 credentials to environment variables.

## 📞 Support

Issues with media uploads? Check:

1. Backend logs for errors
2. Browser console for frontend errors
3. Network tab for failed requests
4. `/backend/uploads/` directory permissions

---

**Happy coding!** 🎉
