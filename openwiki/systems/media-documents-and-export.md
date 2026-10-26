---
type: system
title: Media, Documents and Export
description: Where Continuum keeps uploaded files and recordings (backend media storage on local disk or S3, browser IndexedDB, inline data URLs), how vault documents are stored, the IndexedDB-to-server media migration, and how the PDF export and the printable Red Binder assemble a readable copy.
tags: [media, uploads, storage, documents, export, pdf]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-82a325da453da1db06378e6d
    resource: repo://backend/config.py
  - id: openwiki-source-7c71a30249a930334214acfd
    resource: repo://backend/estate_models.py
  - id: openwiki-source-1e5af31bf167b154eac9b49f
    resource: repo://backend/routers/documents.py
  - id: openwiki-source-41a1eca19991b116136cabe8
    resource: repo://backend/routers/media.py
  - id: openwiki-source-306b4630976cea3bea2eec27
    resource: repo://backend/utils/file_storage.py
  - id: openwiki-source-cd4369ae6063931c17cf6844
    resource: repo://frontend/src/lib/components/MediaMigrationNotice.svelte
  - id: openwiki-source-de073f67ed10ac976aa5dcfd
    resource: repo://frontend/src/lib/components/modules/heirlooms/VisionUploader.svelte
  - id: openwiki-source-14c3be6935399696130cf8cb
    resource: repo://frontend/src/lib/components/ui/FileUploader.svelte
  - id: openwiki-source-f915623e80b2f9d67a451aab
    resource: repo://frontend/src/lib/services/exportService.ts
  - id: openwiki-source-25d0c51966284244fa071d87
    resource: repo://frontend/src/lib/services/indexedDB.ts
  - id: openwiki-source-02145419be8da113fcd2c89d
    resource: repo://frontend/src/lib/services/mediaMigration.ts
  - id: openwiki-source-c92c33a5680b07bae5a34f67
    resource: repo://frontend/src/lib/services/mediaService.ts
  - id: openwiki-source-a8bb049846a7a0d5899046d3
    resource: repo://frontend/src/lib/utils/mediaStorage.ts
  - id: openwiki-source-24e94b66b85ebee0a619982f
    resource: repo://frontend/src/routes/binder/%2Bpage.svelte
  - id: openwiki-source-3d0548204610eff66b0d9787
    resource: repo://frontend/src/routes/export/preview/%2Bpage.svelte
  - id: openwiki-source-5e94c9a80820e508294c7cf5
    resource: repo://frontend/src/routes/modules/time-capsule/%2Bpage.svelte
  - id: openwiki-source-1dc2c5da93432466cee6ad1b
    resource: repo://frontend/src/routes/modules/visual-memories/%2Bpage.svelte
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Media, Documents and Export

Files reach storage by three different routes, depending on which module saved them. Knowing which route a module uses tells you whether its files survive a cleared browser.

## Backend media API (`/api/media`)

`backend/routers/media.py` handles uploads for the current user:

| Endpoint | Behaviour |
|---|---|
| `POST /upload` | Multipart upload; checks MIME type against image, video, audio and document allow-lists and size against `MAX_UPLOAD_SIZE` (10 MB); stores the file and a `MediaFile` row with `storage_provider` and `doc_category` |
| `GET /` | List the user's non-deleted media |
| `GET /{id}` | Metadata |
| `GET /{id}/download` | Owner only (403 otherwise); S3 files redirect to a presigned URL, local files are streamed with `FileResponse` |
| `PUT /{id}/metadata` | Update descriptive fields |
| `DELETE /{id}` | **Soft delete**: sets `deleted_at` and keeps the file in storage |

`backend/utils/file_storage.py` provides the storage layer:

- `LocalStorage` writes under `UPLOAD_DIR` (`backend/uploads`) in `{user_id}/{category}/{module}` folders.
- `S3Storage` uses `boto3` against `AWS_ENDPOINT_URL` / `AWS_BUCKET_NAME` (S3 or MinIO) with keys `{user_id}/{category}/{module}/{filename}` and one-hour presigned URLs.
- `HybridStorage` (the one the router uses) tries S3 first when `S3_ENABLED` is true and falls back to local disk if the upload fails; it returns which provider was used. `S3_ENABLED` defaults to false, so files go to local disk unless it is set.

`/api/health` checks that the upload directory is writable.

On the frontend, `src/lib/services/mediaService.ts` wraps these endpoints (`uploadMedia` with progress, `listMedia`, `getMedia`, `getMediaBlobUrl`, `deleteMedia`, `updateMediaMetadata`) and also offers `fileToDataUrl` and `isValidMediaType`.

## Browser-only storage

Two older paths keep files inside the browser:

- **IndexedDB** — `src/lib/services/indexedDB.ts` (database `continuum_media_db`) and `src/lib/utils/mediaStorage.ts` (database `continuum-media`, via `idb`) both expose a `mediaStorage` object. The time capsule page still saves recordings with `mediaStorage.save(...)` from `indexedDB.ts`.
- **Data URLs** — several uploaders read the file with `FileReader.readAsDataURL` and store the resulting string inside the record itself (for example `FileUploader.svelte`, the heirloom `VisionUploader.svelte` and the visual memories page). Those strings then travel through the normal record sync and can be large.

Files in IndexedDB exist only in that browser. `src/lib/services/mediaMigration.ts` moves them to the server: `needsMigration()` checks `continuum_media_db`, `migrateAllMedia(onProgress)` uploads each blob through `uploadMedia` and records an old-id → new-id mapping in localStorage (`getMigrationMapping`, `clearMigrationMapping`). The root layout shows `MediaMigrationNotice.svelte`, which offers this migration.

## Documents

Vault documents are `Document` rows (`documents` table) served by `backend/routers/documents.py` at `/api/data/vault_documents` — list, create, update and delete, scoped to the current user. This router is registered before the generic `/api/data/{data_type}` router so the generic route does not capture it (see [Backend API and Routers](/openwiki/architecture/backend-api.md)). A document row records a required `title` and `category` (will, trust, deed, insurance…), plus optional `name`, `status`, `location_physical`, `location`, `is_digitized`, `file_path` and notes.

## PDF export

`src/lib/services/exportService.ts` builds PDFs in the browser with `jsPDF` and `jspdf-autotable`:

- `createPDFBlob(scope, includeImages, onProgress)` reads current data from the frontend stores (property, heirlooms, timeline, medical, insurance) and lays out tables per section. `scope` is `'full'`, `'insurance'` or `'medical'`.
- `generatePDF(...)` creates the blob and triggers a download.

`/export/preview` reads `scope` and `images` from the query string, calls `createPDFBlob`, and shows the result from an object URL with a download button. Because the export reads the stores, it reflects what the browser has loaded and synced.

## The Red Binder

`/binder` is a printable summary. On mount it reads cached data directly with `getStored` from fixed localStorage keys — for example `docs_legal-vault`, `assets_assets-main` and `subscriptions` — builds a list of sections, and prints with `window.print()`. It does not call the API or go through the SyncManager stores, so sections whose data is stored under different keys show as empty.

## Related pages

- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
- [Routes, Modules and Navigation](/openwiki/frontend/routes-and-navigation.md)
- [Backend API and Routers](/openwiki/architecture/backend-api.md)
