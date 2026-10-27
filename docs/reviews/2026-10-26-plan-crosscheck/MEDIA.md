# Media, documents and archives — implementation-plan crosscheck

**Last Updated:** 2026-10-26 15:25 EDT

**Source reviewed:** `8751f224b2a1bf0d915940f61242829d08964d18`. Application source remained unchanged. This is a source review with three pinpoint, synthetic inline probes; it is not a new full browser or production-storage test.

## Coverage

| Area | Source actually inspected | Plan cross-reference |
|---|---|---|
| Document entry/edit/download/remove and readiness | `routes/modules/legal-documents/+page.svelte`, `components/archetypes/DocumentVault.svelte` handlers and relevant markup, `stores/documentStore.svelte.ts` | C1, X68, X130, X189 |
| Visual-memory upload/edit/favourite/remove/bulk-tag and external archives | `routes/modules/visual-memories/+page.svelte` handlers/modal/route wiring, `stores/visualMemoryStore.svelte.ts`, `MemoryGallery.svelte`, `ExternalArchiveCard.svelte` | X91, X98, G7, X223, X233 |
| Shared file controls, previews and recording | `ui/FileUploader.svelte`, `ui/UniversalUploader.svelte`, `ui/MediaView.svelte`, `ui/EvidenceGalleryUploader.svelte`, `ui/MediaGallery.svelte`, `media/VideoRecorder.svelte`, heirlooms `VisionUploader.svelte`, legal-documents `JargonSlayer.svelte` | C2, E11, X89, X96, X120, X128, X206, X211 |
| Transfer, retention and migration | `services/mediaService.ts`, `services/mediaMigration.ts`, `services/indexedDB.ts`, `utils/mediaStorage.ts`, `MediaMigrationNotice.svelte`, layout mount and time-capsule legacy-reader call sites | C2, X63 |
| API, metadata and physical-storage paths | `backend/routers/media.py`, `backend/routers/memories.py`, `backend/models/media.py`, `backend/utils/file_storage.py` | C1, C2, X91, X98, X104, X233, X241, X279, X292 |
| Handover boundary | `backend/routers/export.py` attachment matcher; full export/recipient review belongs to HANDOVER | D1, D2, X128 |
| Failure-state contract | `SyncManager.create/update` failure/retry paths, to distinguish real missing retry from premature form dismissal | B4/B4.1 |

The source was located/read through CodeGraph first. Targeted line reads filled trimmed source sections. The review inspected the named paths and dependencies; it does not assert line-by-line review of every unrelated component or archived implementation.

## Confirmed findings

### F1 — P1: migration reports success and deletes the original while parent records remain browser-dependent

**Evidence:** `frontend/src/lib/services/mediaMigration.ts:179–191,235–245`; `frontend/src/lib/services/indexedDB.ts:53–58,110–123`; `frontend/src/routes/modules/time-capsule/+page.svelte:261–266`; `backend/routers/export.py:158–177`.

`migrateAllMedia()` uploads a blob, saves old-ID → new-ID only in `localStorage`, and deletes the IndexedDB original. It never updates the saved parent record. The time-capsule legacy reader resolves its old string `mediaId` through that same browser-local map. A fresh owner context lacks that map. The export matcher accepts numeric `media_id` references and media download URLs, so it also omits the newly uploaded file and does not report a nonnumeric legacy ID as missing.

**Trigger/impact:** migrate an existing capsule recording identified by a legacy string, then use another browser or the recipient/download copy. The original browser can play it, but the family archive still cannot find the file even though migration said it succeeded. A retained pending upload whose parent still points at a failed first upload also gains a replacement media row without repairing the parent reference.

**Plan:** C2's second-context retrieval and original retention, C5's playable saved capsules, D1/D2 attachment completeness; the X63 success proof checks local mapping/empty IndexedDB, which does not establish a durable record link.

**Probe:** actual `mediaMigration.ts` transpiled in memory with esbuild and synthetic File/IndexedDB/upload stubs, followed by the actual export `_attachments` function extracted with Python AST (no application import or database):

```text
migration result: success=true, total=1, migrated=1, failed=0
parent record: {id:"capsule-A", media_id:"timecapsule_capsule-A_video"} unchanged
local original removed: true
browser-only mapping: oldId -> media 912
server media 912 exists: true
export result: attachments=[], missing_attachments=[]
```

**Smallest correction:** make migration an owner-scoped, resumable parent-reference update. Read back the linked record and file before removing its local original; retain unresolved files visibly. Repair/rebind pending-upload parent references instead of merely producing another upload. **Acceptance:** migrate a legacy capsule and a retained failed-upload recovery, open from a fresh context, and verify owner/recipient playback and packet attachment bytes while testing interrupted reference-update recovery.

### F2 — P1: browser media recovery has no account ownership boundary

**Evidence:** `frontend/src/lib/services/indexedDB.ts:7–8,65–81`; `frontend/src/lib/services/mediaService.ts:228–237`; `frontend/src/lib/services/mediaMigration.ts:27–34,124–125,148–168`; layout mounts the notice at `frontend/src/routes/+layout.svelte:332`.

The database/store are shared across accounts. New backup keys are `pending:<module>:<referenceId>:<time>` with no account ID. Migration enumerates every blob and uploads each with the current session; it captures neither an originating account nor a session generation. A failed upload from A can therefore be offered and uploaded after B signs in, and the original is then removed after read-back under B. This is a durable-data ownership defect, separate from HTTP retry token handling.

**Plan:** C2 retention plus X56/X62 account isolation and AGENTS persistence invariants. The account-aware collection fixes do not cover this independent file store.

**Probe:** the same isolated migration probe above started with a synthetic A capsule blob while the uploader's simulated current session was B. Its captured upload was `{account:"B",module:"time_capsules",reference:"capsule-A"}`; migration reported success and deleted the original. No real account/network was used.

**Smallest correction:** persist originating account ownership with new pending media and filter/check that owner through upload, read-back, mapping, parent update and deletion. Legacy entries whose owner cannot be determined need an explicit safe recovery choice; they should not silently migrate into whichever account happens to be active. **Acceptance:** retain A's failed-upload file, switch to B and run migration: B receives no A bytes; returning to A recovers the linked file. Also switch accounts mid-run and verify later items remain for A.

### F3 — P2: archive forms close before a save outcome and discard the visible editing context on failure

**Evidence:** `frontend/src/routes/modules/visual-memories/+page.svelte:85–118,338–344`; `frontend/src/lib/stores/visualMemoryStore.svelte.ts:175–179`; `frontend/src/lib/services/sync.svelte.ts:435–445,560–587`.

`saveArchive()` calls asynchronous create/update without awaiting/catching it, then immediately closes the modal. A rejected promise becomes unhandled. Opening Add again replaces the form with blanks; opening Edit reloads the saved row, replacing the user's failed edits. The global SyncManager error **does retain a payload-based Try Again**, so this is not a claim that every retry or all recoverable data is missing. The missing behavior is honest pending state and the ability to inspect/correct the failed draft in its form.

**Probe:** evaluated the actual `saveArchive` function with an unresolved synthetic create promise. Result: `dialogClosedWhileSavePending=true` with the submitted fields captured. No application state or request was used.

**Plan:** B4 save-state/draft behavior; G7 archive usability. X233 fixed backend partial PUT semantics but does not fix this caller.

**Smallest correction:** await create/update, keep modal and values on failure, catch rejection, close only after success, and prevent additional submission while pending. **Acceptance:** forced POST and PUT failures keep the form/draft, allow correction or retry, and produce zero unhandled rejections; success closes once.

### F4 — P2: gallery download failures produce blank or disappearing media with no visible retry

**Evidence:** visual `MemoryGallery.svelte:42–60,209–231`; shared `EvidenceGalleryUploader.svelte:35–44,102–115`; `MediaView.svelte:123–126,181–183` demonstrates the existing visible-message pattern.

The visual gallery catches a failed file fetch by logging to console and leaving the media URL undefined. The evidence uploader removes the failed URL and filters that saved evidence out of `galleryItems`. Neither renders a failed-file message or retry action. Removing `requested`/`urls` markers alone does not retry until another reactive dependency changes or the page/component is recreated. Records can still exist while their previews appear absent.

**Plan:** C2 retrieval/error paths, E4/E11 clarity and G7 visual-memory usability; collection-level X273 notices do not cover these binary fetches.

**Smallest correction:** retain visible media identity on read failure with a per-file retry using the shared fetch cache's failed-entry eviction. **Acceptance:** one forced download failure in each gallery shows the recorded filename and actionable retry; retry displays the original bytes without reuploading or modifying the parent.

### F5 — P2: the document vault omits attachment cleanup on replacement, abandonment and record removal

**Evidence:** `DocumentVault.svelte:99–168,193–210,579–585`; `UniversalUploader.svelte:124–158`; `backend/routers/media.py:161–183,318–345`.

The uploader creates a durable active media row as soon as a file is chosen. The document vault binds the returned reference but provides no cleanup callback/tracking for a superseded or abandoned upload. `resetForm()` simply discards it, and removing a saved document deletes only the document row. The result is active uploaded files with no reachable parent or file-management action. Unlike the intentional backend soft-delete policy, these rows are never even marked removed. Existing visual-memory, medical and pet cleanup fixes illustrate the missing integration.

**Plan:** C1/C2 lifecycle integration; X98 established cleanup for the equivalent visual-memory flow, X116/X132 for other attached records. This is a completion gap in the document path, not a proposal to hard-delete recovery data.

**Smallest correction:** track original and newly uploaded references; soft-delete newly abandoned/replaced files only at the appropriate successful parent transition, accounting for references shared by another record. **Acceptance:** abandon a new upload, replace a document copy, and remove its document: unreferenced media becomes unavailable through the API; failed saves preserve the current saved file and retryable new upload.

### F6 — P2: external-archive edit/remove actions remain hover-only

**Evidence:** `ExternalArchiveCard.svelte:54–71` uses `opacity-0 group-hover:opacity-100` on its action container with no `focus-within` or always-visible state.

The native buttons are focusable, but a keyboard user can focus controls that remain visually transparent; touch/hoverless desktop operation also lacks a reliable discovery path. This is a source-confirmed omission, not a new visual measurement.

**Plan:** E11's visible named controls/desktop keyboard journey and G7 external-archive usability. **Smallest correction:** keep the controls visible or expose them on both hover and focus-within with clear accessible names. **Acceptance:** tab through an archive card at desktop width and visibly locate/activate Edit and Remove without pointer hover.

## Cross-area findings owned elsewhere

- `mediaService.ts:168–176` replays the original XHR upload after a 401 using the current `refreshSession()` token without binding the initiating account. CONTRACTS owns the combined account-session retry finding, including the analogous fetch wrapper; this report does not propose a duplicate card.
- Asset evidence-array attachment omission and partial-export/read-failure reporting belong to HANDOVER. Its reviewer was given the export attachment matcher and shared evidence persistence path.

## Deliberate limits and non-findings

- `JargonSlayer` uses `EXAMPLE_WILL` but clearly labels it “Example” and “An example will, explained”; this is an honest example, not live document analysis.
- `FileUploader`'s legacy image-only path is bypassed when `module` is supplied; the actual document vault passes `module="documents"` and uses the server uploader. It is not still image-only.
- New visual-memory records use server URLs, with metadata linking and explicit record/media cleanup. The old inline `data:` fallback is intentional compatibility, not an upload stub.
- Backend media deletion intentionally soft-deletes and retains bytes for recovery. Physical retention by itself is not a new defect.
- Current Railway-volume persistence is prior X292 evidence. No production filesystem or database was touched, and no live data/device/browser was inspected. S3 read-back/CORS and absent-file behavior were source-reviewed, not live-tested.
- The 10 MB upload limit, public QR scan page, phone/tablet work and broader security/infrastructure remain deferred owner scope. No security-hardening finding was manufactured from these limits.
- No full build, broad suite, external mail, scheduled loop, app lifespan, real media capture, new test file or deployment was run. Source-confirmed UI findings require their focused browser acceptance when implemented; this report does not claim screenshots or working-interface verification.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X308 | MEDIA F2 |
| X309 | MEDIA F1 |
| X315 | LEGACY F1,F2; MEDIA F3 |
| X339 | MEDIA F4 |
| X340 | MEDIA F5 |
| X341 | MEDIA F6 |
