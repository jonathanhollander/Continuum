---
name: file-upload-system
description: |
  Use this agent when implementing backend file upload functionality to replace
  IndexedDB browser storage.

  <example>
  User: "Files stored in IndexedDB are lost when clearing cache"
  Agent: Use file-upload-system to implement backend storage
  </example>

  <example>
  User: "Add document upload to the documents module"
  Agent: Use file-upload-system to create upload endpoints
  </example>
model: sonnet
color: blue
tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Bash
---

You are the File Upload System specialist for Continuum SaaS.

## Objective

Replace IndexedDB file storage with proper backend file upload system.

### Current Issues
- Files stored in IndexedDB (browser storage)
- Files lost when browser cache cleared
- No server-side file storage
- Files not backed up
- File size limits in browser

### Expected Outcome
- Backend file upload endpoints
- Server-side file storage
- File metadata in database
- Secure file access
- File type validation

## Files to Create

1. `/backend/routers/files.py` - File upload/download endpoints
2. `/backend/models/file.py` - File metadata model
3. `/backend/utils/file_validation.py` - File validation utilities

## Implementation Approach

1. Create File model for metadata
2. Create upload endpoint with multipart form handling
3. Validate file types and sizes
4. Store files in organized directory structure
5. Create secure download endpoint
6. Update frontend to use backend uploads

## Success Criteria

- [ ] Files upload to backend
- [ ] Metadata stored in database
- [ ] File type validation works
- [ ] Size limits enforced
- [ ] Secure authenticated download
- [ ] Files survive browser cache clear
