---
type: system
title: Media, Documents and Export
description: Where Continuum keeps uploaded files and recordings (backend media storage on local disk or S3, browser IndexedDB, inline data URLs), how vault documents are stored, the IndexedDB-to-server media migration, and how the PDF export and the printable Red Binder assemble a readable copy.
tags: [media, uploads, storage, documents, export, pdf]
sources:
  - id: openwiki-source-82a325da453da1db06378e6d
    resource: repo://backend/config.py
  - id: openwiki-source-fcffbe3e28749eaf9a39557c
    resource: repo://backend/main.py
  - id: openwiki-source-4be256b5d86d6f7252b493a6
    resource: repo://backend/routers/estate_data.py
  - id: openwiki-source-324f535ac1aad0434228ec83
    resource: repo://backend/routers/export.py
  - id: openwiki-source-41a1eca19991b116136cabe8
    resource: repo://backend/routers/media.py
  - id: openwiki-source-809887f30a8cfd2ece5a8458
    resource: repo://backend/routers/recipient.py
  - id: openwiki-source-306b4630976cea3bea2eec27
    resource: repo://backend/utils/file_storage.py
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
generated: { by: "claude-code", at: "2026-10-28T04:26:57.052Z" }
verified:
  - by: openwiki/0.4.3
    at: 2026-10-28T04:26:57.052Z
---

# Media, Documents and Export

Files reach storage by three different routes, depending on which module saved them. Knowing which route a module uses tells you whether its files survive a cleared browser.

## Backend media API (`/api/media`)

`backend/routers/media.py` handles uploads for the current user:

| Endpoint | Behaviour |
|---|---|
| `POST /upload` | Multipart upload; reads at most one byte past `MAX_UPLOAD_SIZE` (10 MB) so an oversized file is refused without loading it all, checks the MIME type against image, video, audio and document allow-lists, then sniffs the first bytes: a recognised signature overrides a mismatched browser label, and an image or PDF claim with no matching signature is refused with 400; stores the file and a `MediaFile` row with `storage_provider` and `doc_category` |
| `GET /` | List the user's non-deleted media |
| `GET /{id}` | Metadata |
| `GET /{id}/download` | Authenticated owner read; S3 files redirect to a presigned URL, local files are streamed with `FileResponse` |
| `PUT /{id}/metadata` | Update descriptive fields |
| `DELETE /{id}` | **Soft delete**: sets `deleted_at` and keeps the file in storage |

`backend/utils/file_storage.py` provides the storage layer:

- `LocalStorage` writes under `UPLOAD_DIR` (`backend/uploads`) in `{user_id}/{category}/{module}` folders.
- `S3Storage` uses `boto3` against `AWS_ENDPOINT_URL` / `AWS_BUCKET_NAME` (S3 or MinIO) with keys `{user_id}/{category}/{module}/{filename}` and one-hour presigned URLs.
- `HybridStorage` (the one the router uses) tries S3 first when `S3_ENABLED` is true and falls back to local disk if the upload fails (S3 gets its own in-memory copy of the bytes, because boto closes the stream it uploads, so the fallback still has the data); it returns which provider was used. `S3_ENABLED` defaults to false, so files go to local disk unless it is set.

`/api/health` checks that the upload directory is writable.

On the frontend, `src/lib/services/mediaService.ts` wraps these endpoints (`uploadMedia` with progress, `listMedia`, `getMedia`, `getMediaBlobUrl`, `deleteMedia`, `updateMediaMetadata`) and also offers `fileToDataUrl` and `isValidMediaType`.

## Browser originals and verified recovery

The canonical IndexedDB store is `continuum_media_db`; `utils/mediaStorage.ts` reexports it instead of creating another database. Its keys bind pending originals to the authenticated account. Browser bytes and temporary blob URLs remain local until a durable server copy has been verified.

`mediaService.ts` captures session ownership for uploads, adds CSRF itself on XHR, refreshes an expired session once and checks ownership before accepting progress/results. `verifyMediaRetrieval` compares returned bytes with the original. Image-processing controls can also use data URLs; these are distinct from server media references.

`mediaMigration.ts` presents pending originals, offers a separate save-copy action and repairs interrupted uploads. It reuses a verified uploaded identity when available, reads fresh parent rows, changes only attachment references and rechecks snapshot membership and bytes before releasing the local original. Changed/missing parent rows, unavailable bytes and account changes keep the original for another attempt. Advanced-asset history repairs use conditional updates to avoid overwriting a concurrently changed list. A migration mapping alone is not proof of recoverability.

## Document records

The active generic `/api/data/documents` collection uses `Document` (the older `vault_documents` alias has been removed). The document vault is `/modules/legal-documents`; historical dedicated router files are not mounted. Records describe the paper/original location, digitized status and optional stored file reference; describing where an original is kept does not imply an uploaded copy exists.

## One snapshot for the handover

`GET /api/export/snapshot` gathers owner-scoped server records, owner/profile details, attachment membership and missing references. `exportService.ts` builds the same packet structure for the binder, PDF and downloadable copy. It no longer depends on whichever frontend modules happened to be imported or on older fixed localStorage keys.

`createPDFBlob` builds `full`, `insurance` or `medical` scope from the snapshot and optionally retrieves JPEG/PNG images. `/export/preview` reads scope/images query parameters, fetches a snapshot and displays the resulting PDF through an object URL. `/binder` fetches the same snapshot, builds the full packet, retrieves files, offers per-file retry and prints with `window.print()`.

The download ZIP contains `packet.html`, `packet.pdf`, `snapshot.json`, `manifest.json` and successfully fetched attachment bytes. The manifest records file path/type/size/SHA-256, the source records and fields each file belongs to, included versus expected counts, missing references and retry issues. A failed read is retried on the next download rather than cached as success. Partial file coverage is stated explicitly in the screen, readable packet and manifest; a downloaded copy is not called complete just because ZIP creation succeeded.

## Recipient access and files

`/for/<token>` and the owner's `/for/preview/<contactId>` use the server-filtered recipient snapshot. A selected contact ID takes precedence over name matching. Held or differently addressed letters and unreleased/not-addressed capsules are removed before file matching. Executor checklist notes follow their explicit sharing policy. The recipient uses the same packet/export logic over this filtered payload.

`/api/media/shared/<token>/<media_id>` revalidates the live recipient link and serves only undeleted owner files used by records in that view. This is separate from authenticated owner downloads; a browser-only original cannot be retrieved through either path until the server bytes and record links exist.

## Related pages

- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
- [Routes, Modules and Navigation](/openwiki/frontend/routes-and-navigation.md)
- [Backend API and Routers](/openwiki/architecture/backend-api.md)
