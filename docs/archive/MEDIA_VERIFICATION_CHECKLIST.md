# Media Upload System - Verification Checklist

Use this checklist to verify the media upload system is working correctly.

## Backend Verification

### ✅ Files Created

- [ ] `/backend/models/media.py` exists
- [ ] `/backend/utils/file_storage.py` exists
- [ ] `/backend/routers/media.py` exists
- [ ] `/backend/uploads/` directory exists
- [ ] `/backend/uploads/.gitignore` exists

### ✅ Code Integration

- [ ] `database.py` imports `MediaFile` model
- [ ] `main.py` imports and registers media router
- [ ] Config includes `UPLOAD_DIR` setting

### ✅ Startup Tests

```bash
# Test 1: Backend starts without errors
cd backend
uvicorn main:app --reload

# Expected: No import errors, server starts on port 8000
```

- [ ] Server starts successfully
- [ ] No import errors in console
- [ ] `/api/media` endpoints appear in logs

### ✅ API Documentation

```bash
# Visit http://localhost:8000/docs
```

- [ ] `/api/media/upload` endpoint visible
- [ ] `/api/media/{media_id}/download` endpoint visible
- [ ] `/api/media/` list endpoint visible
- [ ] All endpoints show authentication required

### ✅ Database Migration

```bash
# Check database tables
sqlite3 continuum_saas.db ".schema media_files"
```

- [ ] `media_files` table created
- [ ] All columns present (id, user_id, filename, storage_path, etc.)
- [ ] Indexes created

## Frontend Verification

### ✅ Files Created

- [ ] `/frontend/src/lib/services/mediaService.ts` exists
- [ ] `/frontend/src/lib/services/mediaMigration.ts` exists
- [ ] `/frontend/src/lib/components/MediaUploader.svelte` exists
- [ ] `/frontend/src/lib/components/MediaMigrationNotice.svelte` exists

### ✅ TypeScript Compilation

```bash
cd frontend
npm run build
```

- [ ] No TypeScript errors
- [ ] MediaService types compile
- [ ] Components compile without errors

## Integration Tests

### Test 1: Basic Upload

**Steps:**
1. Start backend: `uvicorn main:app --reload`
2. Login to app (http://localhost:5173)
3. Navigate to heirlooms or any module
4. Add MediaUploader component temporarily
5. Upload a test image

**Verify:**
- [ ] Upload progress shows
- [ ] Upload completes successfully
- [ ] File appears in `/backend/uploads/{user_id}/`
- [ ] Database record created in `media_files`
- [ ] Download URL returned

**Test with curl:**
```bash
# Login first to get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@continuum.im","password":"dev123"}'

# Copy the access_token from response

# Upload file
curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test-image.jpg" \
  -F "module=heirlooms" \
  -F "reference_id=test-123"
```

- [ ] Returns 200 OK
- [ ] Response includes media ID
- [ ] Response includes download_url

### Test 2: File Download

**Steps:**
1. Note media ID from upload test
2. Access download URL

**Test with curl:**
```bash
curl -X GET http://localhost:8000/api/media/1/download \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o downloaded.jpg
```

- [ ] File downloads successfully
- [ ] File matches original
- [ ] Correct MIME type in headers

### Test 3: List Media

**Test with curl:**
```bash
curl -X GET http://localhost:8000/api/media/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

- [ ] Returns array of media files
- [ ] Each file has complete metadata
- [ ] Each file has download_url

**Filter by module:**
```bash
curl -X GET "http://localhost:8000/api/media/?module=heirlooms" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

- [ ] Returns only heirlooms media
- [ ] Filtering works correctly

### Test 4: Delete Media

**Test with curl:**
```bash
curl -X DELETE http://localhost:8000/api/media/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

- [ ] Returns success message
- [ ] File marked as deleted in database
- [ ] File no longer appears in list
- [ ] File still exists on disk (soft delete)

### Test 5: File Validation

**Upload too large file:**
```bash
# Create 15MB file
dd if=/dev/zero of=large.bin bs=1M count=15

curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@large.bin" \
  -F "module=test"
```

- [ ] Returns 413 error (file too large)
- [ ] Error message indicates max size

**Upload invalid file type:**
```bash
curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test.exe" \
  -F "module=test"
```

- [ ] Returns 400 error (invalid type)
- [ ] Error message lists allowed types

### Test 6: Authentication

**Access without token:**
```bash
curl -X GET http://localhost:8000/api/media/
```

- [ ] Returns 401 Unauthorized
- [ ] Requires authentication

**Access other user's file:**
1. Login as user A, upload file, note media ID
2. Login as user B, try to download user A's file

- [ ] Returns 403 Forbidden
- [ ] Users isolated from each other

### Test 7: Frontend Upload Component

**Steps:**
1. Add MediaUploader to a test page:
```svelte
<MediaUploader
    module="test"
    on:success={(e) => console.log('Success:', e.detail)}
    on:error={(e) => console.log('Error:', e.detail)}
/>
```

**Verify:**
- [ ] Dropzone displays
- [ ] Drag-and-drop works
- [ ] Click to browse works
- [ ] File preview shows (for images)
- [ ] Upload progress displays
- [ ] Success event fires with media ID
- [ ] Error event fires on failure

### Test 8: Migration from IndexedDB

**Setup:**
1. Use old system to create IndexedDB media
2. Add MediaMigrationNotice component

**Verify:**
- [ ] Migration notice appears
- [ ] "Migrate Now" button visible
- [ ] Click triggers migration
- [ ] Progress shows
- [ ] Files upload to backend
- [ ] IndexedDB cleared after migration
- [ ] Success message shows

## Cross-Device Testing

### Test 9: Device Sync

**Steps:**
1. Login on Device A (or Browser A)
2. Upload media files
3. Logout
4. Login on Device B (or Browser B in incognito)

**Verify:**
- [ ] Media files visible on Device B
- [ ] Download works on Device B
- [ ] No IndexedDB needed
- [ ] All metadata present

### Test 10: Cache Clear Test

**Steps:**
1. Upload media files
2. Clear browser cache (DevTools > Application > Clear Storage)
3. Refresh page

**Verify:**
- [ ] Media files still accessible
- [ ] Downloads still work
- [ ] No data loss

## Performance Testing

### Test 11: Upload Performance

**Test various file sizes:**
- [ ] 100KB image - uploads quickly (<1s)
- [ ] 1MB image - progress visible
- [ ] 5MB video - progress smooth
- [ ] 10MB file - reaches limit

### Test 12: Download Performance

**Test download speeds:**
- [ ] Small images load instantly
- [ ] Large images show loading state
- [ ] Multiple images can download concurrently

### Test 13: Gallery Performance

**Create gallery with 20+ images:**
- [ ] Lazy loading works
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Blob URLs cleaned up

## Security Testing

### Test 14: Path Traversal

**Try to access files outside user directory:**
```bash
curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test.jpg" \
  -F "module=../../../etc"
```

- [ ] Module name sanitized
- [ ] No directory traversal possible

### Test 15: SQL Injection

**Try SQL in metadata:**
```bash
curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test.jpg" \
  -F "module=test' OR '1'='1"
```

- [ ] Input sanitized
- [ ] No SQL injection possible

## Production Readiness

### ✅ Configuration

- [ ] `MAX_UPLOAD_SIZE` appropriate for production
- [ ] `UPLOAD_DIR` has correct permissions
- [ ] Database backups include `media_files` table
- [ ] File storage has monitoring/alerts

### ✅ Documentation

- [ ] MEDIA_UPLOAD_GUIDE.md complete
- [ ] MEDIA_QUICK_START.md clear
- [ ] INTEGRATION_EXAMPLES.md helpful
- [ ] API documented in /docs

### ✅ Error Handling

- [ ] Upload errors shown to user
- [ ] Download errors handled gracefully
- [ ] Network errors don't break UI
- [ ] Invalid files rejected with clear message

### ✅ Monitoring

- [ ] Backend logs upload/download events
- [ ] File storage size monitored
- [ ] Failed uploads logged
- [ ] Migration success tracked

## Deployment Checklist

### Railway Deployment

- [ ] `python-multipart` in requirements.txt
- [ ] `/backend/uploads/` created on deploy
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Health check passes

### Post-Deployment

- [ ] Upload test in production
- [ ] Download test in production
- [ ] Cross-device test in production
- [ ] Migration test with real users

## User Acceptance Testing

### Heirlooms Module

- [ ] Add photo to heirloom
- [ ] Photo displays in gallery
- [ ] Photo survives logout/login
- [ ] Photo accessible on mobile

### Properties Module

- [ ] Add property photos
- [ ] Multiple photos per property
- [ ] Photos in correct order
- [ ] Photos sync across devices

### Visual Memories Module

- [ ] Add photos and videos
- [ ] Videos play correctly
- [ ] Thumbnails generate
- [ ] Gallery performs well

### Time Capsules Module

- [ ] Add media to capsule
- [ ] Media sealed with capsule
- [ ] Media accessible after unlock
- [ ] Audio files play correctly

## Final Verification

- [ ] All backend tests pass ✓
- [ ] All frontend tests pass ✓
- [ ] All integration tests pass ✓
- [ ] All security tests pass ✓
- [ ] All module integrations work ✓
- [ ] Documentation complete ✓
- [ ] Ready for production ✓

## Issues Found

Document any issues discovered during verification:

```
Issue: [Description]
Severity: [Low/Medium/High]
Steps to Reproduce:
1.
2.
Expected: [What should happen]
Actual: [What actually happened]
Fix: [How it was resolved]
```

## Sign-Off

- [ ] Backend developer verified
- [ ] Frontend developer verified
- [ ] QA tested
- [ ] Product owner approved
- [ ] Ready for user testing

---

**Verification Date**: _________________
**Verified By**: _________________
**Status**: ⬜ Pass  ⬜ Fail  ⬜ Needs Work
