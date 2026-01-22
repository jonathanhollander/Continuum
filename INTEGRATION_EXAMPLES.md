# Media Upload Integration Examples

This document shows how to integrate the new backend media upload system into existing modules.

## Example 1: Heirlooms Module Integration

### Before (IndexedDB)

```typescript
// OLD: heirloomStore.svelte.ts with IndexedDB
import { mediaStorage } from '$lib/services/indexedDB';

async function addHeirloomPhoto(heirloomId: string, file: File) {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const mediaId = `heirloom_${heirloomId}_image`;

    // Store in IndexedDB (browser only)
    await mediaStorage.save(mediaId, blob);

    return mediaId;
}
```

### After (Backend Storage)

```typescript
// NEW: heirloomStore.svelte.ts with backend storage
import { uploadMedia, type MediaFile } from '$lib/services/mediaService';

async function addHeirloomPhoto(heirloomId: string, file: File): Promise<MediaFile> {
    // Upload to backend (accessible from all devices)
    const result = await uploadMedia(
        file,
        'heirlooms',
        heirloomId,
        'Heirloom photo',
        (progress) => {
            console.log(`Upload: ${progress.percentage}%`);
        }
    );

    return {
        id: result.id,
        filename: result.filename,
        mime_type: result.mime_type,
        file_size: result.file_size,
        module: 'heirlooms',
        reference_id: heirloomId,
        download_url: result.download_url,
        created_at: new Date().toISOString()
    };
}
```

## Example 2: Heirloom Component with MediaUploader

### Component: HeirloomForm.svelte

```svelte
<script lang="ts">
    import MediaUploader from '$lib/components/MediaUploader.svelte';
    import { heirloomSync } from '$lib/stores/heirloomStore.svelte';

    let heirloom = {
        id: crypto.randomUUID(),
        name: '',
        recipient: '',
        story: '',
        image: '', // Will store media ID or download URL
        value: ''
    };

    let uploadedMediaId: number | null = null;

    function handleMediaSuccess(event: CustomEvent) {
        const { mediaId, downloadUrl } = event.detail;
        uploadedMediaId = mediaId;
        heirloom.image = downloadUrl; // Store download URL for display
        console.log('Photo uploaded:', mediaId);
    }

    async function saveHeirloom() {
        await heirloomSync.create(heirloom);
        // Reset form
        heirloom = {
            id: crypto.randomUUID(),
            name: '',
            recipient: '',
            story: '',
            image: '',
            value: ''
        };
        uploadedMediaId = null;
    }
</script>

<form on:submit|preventDefault={saveHeirloom}>
    <label>
        Name
        <input type="text" bind:value={heirloom.name} required />
    </label>

    <label>
        Recipient
        <input type="text" bind:value={heirloom.recipient} />
    </label>

    <label>
        Story
        <textarea bind:value={heirloom.story} rows="4"></textarea>
    </label>

    <label>
        Photo
        <MediaUploader
            module="heirlooms"
            referenceId={heirloom.id}
            on:success={handleMediaSuccess}
            on:error={(e) => console.error(e.detail.message)}
        />
    </label>

    {#if heirloom.image}
        <div class="preview">
            <img src={heirloom.image} alt="Heirloom preview" />
        </div>
    {/if}

    <label>
        Estimated Value
        <input type="text" bind:value={heirloom.value} placeholder="$0.00" />
    </label>

    <button type="submit">Save Heirloom</button>
</form>
```

## Example 3: Display Heirloom Photos

### Component: HeirloomGallery.svelte

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { listMedia, getMediaBlobUrl, type MediaFile } from '$lib/services/mediaService';

    export let heirloomId: string;

    let photos: MediaFile[] = [];
    let photoUrls: Record<number, string> = {};
    let loading = true;

    onMount(async () => {
        try {
            // Fetch all photos for this heirloom
            photos = await listMedia('heirlooms', heirloomId);

            // Load blob URLs for display
            for (const photo of photos) {
                photoUrls[photo.id] = await getMediaBlobUrl(photo.id);
            }
        } catch (error) {
            console.error('Failed to load photos:', error);
        } finally {
            loading = false;
        }
    });
</script>

<div class="gallery">
    {#if loading}
        <p>Loading photos...</p>
    {:else if photos.length === 0}
        <p>No photos yet. Add one above!</p>
    {:else}
        <div class="photo-grid">
            {#each photos as photo}
                <div class="photo-item">
                    <img
                        src={photoUrls[photo.id] || ''}
                        alt={photo.filename}
                        loading="lazy"
                    />
                    <div class="photo-info">
                        <p class="filename">{photo.filename}</p>
                        <p class="date">{new Date(photo.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .photo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }

    .photo-item {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .photo-item img {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }

    .photo-info {
        padding: 0.75rem;
        background: white;
    }

    .filename {
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    .date {
        font-size: 0.875rem;
        color: #718096;
    }
</style>
```

## Example 4: Properties Module Integration

### Updated Property Store

```typescript
// propertyStore.svelte.ts - Media integration
import { uploadMedia, listMedia, deleteMedia } from '$lib/services/mediaService';

export interface Property {
    id: string;
    address: string;
    type: string;
    photos: number[]; // Array of media IDs
    // ... other fields
}

async function addPropertyPhoto(propertyId: string, file: File): Promise<number> {
    const result = await uploadMedia(file, 'properties', propertyId);
    return result.id;
}

async function getPropertyPhotos(propertyId: string) {
    return await listMedia('properties', propertyId);
}

async function deletePropertyPhoto(mediaId: number) {
    await deleteMedia(mediaId);
}

export const propertyMedia = {
    addPhoto: addPropertyPhoto,
    getPhotos: getPropertyPhotos,
    deletePhoto: deletePropertyPhoto
};
```

## Example 5: Visual Memories Integration

### Visual Memory with Multiple Media Types

```typescript
// visualMemoryStore.ts - Support images, videos, audio
import { uploadMedia, listMedia, type MediaFile } from '$lib/services/mediaService';

export interface VisualMemory {
    id: string;
    title: string;
    date: string;
    description: string;
    media: MediaFile[]; // Array of media files (images, videos, audio)
}

async function addMemoryMedia(memoryId: string, files: File[]): Promise<MediaFile[]> {
    const uploaded: MediaFile[] = [];

    for (const file of files) {
        const result = await uploadMedia(
            file,
            'visual_memories',
            memoryId,
            `Memory: ${file.name}`
        );

        uploaded.push({
            id: result.id,
            filename: result.filename,
            mime_type: result.mime_type,
            file_size: result.file_size,
            module: 'visual_memories',
            reference_id: memoryId,
            download_url: result.download_url,
            created_at: new Date().toISOString()
        });
    }

    return uploaded;
}

async function loadMemoryMedia(memoryId: string): Promise<MediaFile[]> {
    return await listMedia('visual_memories', memoryId);
}
```

## Example 6: Time Capsule with Media

### Time Capsule Component

```svelte
<script lang="ts">
    import MediaUploader from '$lib/components/MediaUploader.svelte';
    import { listMedia, getMediaBlobUrl } from '$lib/services/mediaService';

    let capsule = {
        id: crypto.randomUUID(),
        title: '',
        unlockDate: '',
        message: '',
        mediaFiles: [] as number[]
    };

    function handleMediaSuccess(event: CustomEvent) {
        const { mediaId } = event.detail;
        capsule.mediaFiles = [...capsule.mediaFiles, mediaId];
    }

    async function saveCapsule() {
        // Save capsule with array of media IDs
        await timeCapsuleSync.create(capsule);
    }
</script>

<form on:submit|preventDefault={saveCapsule}>
    <input type="text" bind:value={capsule.title} placeholder="Capsule Title" />
    <input type="date" bind:value={capsule.unlockDate} />
    <textarea bind:value={capsule.message} placeholder="Your message..."></textarea>

    <MediaUploader
        module="time_capsules"
        referenceId={capsule.id}
        accept="image/*,video/*,audio/*"
        on:success={handleMediaSuccess}
    />

    <p>Media files: {capsule.mediaFiles.length}</p>

    <button type="submit">Seal Time Capsule</button>
</form>
```

## Example 7: Migration Integration in App Layout

### Add to +layout.svelte

```svelte
<script>
    import MediaMigrationNotice from '$lib/components/MediaMigrationNotice.svelte';
    import { onMount } from 'svelte';

    // Show migration notice on app load
    onMount(() => {
        console.log('Checking for media migration...');
    });
</script>

<!-- Your existing layout -->
<slot />

<!-- Migration notice (auto-shows if needed) -->
<MediaMigrationNotice />
```

## Example 8: Batch Upload for Multiple Photos

```typescript
async function uploadMultiplePhotos(
    module: string,
    referenceId: string,
    files: File[]
): Promise<MediaFile[]> {
    const results: MediaFile[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (const file of files) {
        try {
            const result = await uploadMedia(file, module, referenceId);
            results.push({
                id: result.id,
                filename: result.filename,
                mime_type: result.mime_type,
                file_size: result.file_size,
                module,
                reference_id: referenceId,
                download_url: result.download_url,
                created_at: new Date().toISOString()
            });
        } catch (error: any) {
            errors.push({
                file: file.name,
                error: error.message
            });
        }
    }

    if (errors.length > 0) {
        console.warn('Some uploads failed:', errors);
    }

    return results;
}
```

## Testing Checklist

After integrating media uploads into a module:

- [ ] Upload new media files successfully
- [ ] Display uploaded media in UI
- [ ] Delete media files
- [ ] Migrate existing IndexedDB media
- [ ] Verify media accessible after browser refresh
- [ ] Test media sync across devices (login on different browser)
- [ ] Verify file size validation
- [ ] Verify file type validation
- [ ] Test upload progress display
- [ ] Test error handling (network errors, file too large, etc.)
- [ ] Verify media deleted when parent item deleted
- [ ] Test lazy loading for large galleries
- [ ] Verify media security (can't access other user's files)

## Migration Strategy

1. **Phase 1: Add New Upload System**
   - Implement backend media routes
   - Add MediaUploader components to forms
   - Keep IndexedDB reads for backward compatibility

2. **Phase 2: Enable Migration**
   - Add MediaMigrationNotice to app
   - Test migration with existing users
   - Monitor migration success rates

3. **Phase 3: Full Backend Migration**
   - Update all stores to use backend media service
   - Display both old (IndexedDB) and new (backend) media
   - Encourage users to migrate

4. **Phase 4: Deprecate IndexedDB**
   - Remove IndexedDB write operations
   - Keep IndexedDB reads for legacy data
   - Show warnings for unmigrated media

5. **Phase 5: Complete Removal**
   - Remove all IndexedDB media code
   - Keep migration tools for edge cases
   - Full backend-only operation

## Performance Considerations

### Lazy Loading

```typescript
// Load media only when needed (intersection observer)
import { onMount } from 'svelte';

let imageElement: HTMLImageElement;
let imageUrl: string | null = null;

onMount(() => {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadImage();
            observer.disconnect();
        }
    });

    if (imageElement) {
        observer.observe(imageElement);
    }

    return () => observer.disconnect();
});

async function loadImage() {
    imageUrl = await getMediaBlobUrl(mediaId);
}
```

### Caching

```typescript
// Cache blob URLs in memory
const blobUrlCache = new Map<number, string>();

async function getCachedBlobUrl(mediaId: number): Promise<string> {
    if (blobUrlCache.has(mediaId)) {
        return blobUrlCache.get(mediaId)!;
    }

    const url = await getMediaBlobUrl(mediaId);
    blobUrlCache.set(mediaId, url);
    return url;
}
```

### Thumbnails (Future Enhancement)

```typescript
// Request thumbnail instead of full image
const thumbnailUrl = `/api/media/${mediaId}/thumbnail?size=200x200`;
```
