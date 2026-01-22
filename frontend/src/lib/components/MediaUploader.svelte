<script lang="ts">
    import { uploadMedia, fileToDataUrl, isValidMediaType, formatFileSize, type UploadProgress } from '$lib/services/mediaService';
    import { createEventDispatcher } from 'svelte';

    export let module: string; // heirlooms, properties, visual_memories, time_capsules
    export let referenceId: string | undefined = undefined;
    export let accept: string = 'image/*,video/*,audio/*';
    export let maxSizeMB: number = 10;
    export let showPreview: boolean = true;
    export let buttonText: string = 'Upload Media';
    export let dropzoneText: string = 'Drop files here or click to browse';

    const dispatch = createEventDispatcher<{
        success: { mediaId: number; downloadUrl: string };
        error: { message: string };
    }>();

    let uploading = false;
    let progress: UploadProgress | null = null;
    let error: string | null = null;
    let previewUrl: string | null = null;
    let selectedFile: File | null = null;

    let fileInput: HTMLInputElement;

    const handleFileSelect = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            await processFile(file);
        }
    };

    const handleDrop = async (event: DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer?.files[0];
        if (file) {
            await processFile(file);
        }
    };

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
    };

    const processFile = async (file: File) => {
        error = null;
        selectedFile = file;

        // Validate file type
        if (!isValidMediaType(file)) {
            error = 'Invalid file type. Please upload an image, video, or audio file.';
            selectedFile = null;
            return;
        }

        // Validate file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            error = `File too large. Maximum size: ${maxSizeMB}MB`;
            selectedFile = null;
            return;
        }

        // Generate preview for images
        if (showPreview && file.type.startsWith('image/')) {
            try {
                previewUrl = await fileToDataUrl(file);
            } catch (e) {
                console.error('Failed to generate preview:', e);
            }
        }

        // Auto-upload
        await upload();
    };

    const upload = async () => {
        if (!selectedFile) return;

        uploading = true;
        error = null;
        progress = null;

        try {
            const response = await uploadMedia(
                selectedFile,
                module,
                referenceId,
                undefined,
                (p) => {
                    progress = p;
                }
            );

            dispatch('success', {
                mediaId: response.id,
                downloadUrl: response.download_url
            });

            // Reset state
            selectedFile = null;
            previewUrl = null;
            progress = null;
        } catch (e: any) {
            error = e.message || 'Upload failed';
            dispatch('error', { message: error });
        } finally {
            uploading = false;
        }
    };

    const clearFile = () => {
        selectedFile = null;
        previewUrl = null;
        error = null;
        progress = null;
        if (fileInput) {
            fileInput.value = '';
        }
    };
</script>

<div class="media-uploader">
    {#if !selectedFile && !uploading}
        <div
            class="dropzone"
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:click={() => fileInput.click()}
            role="button"
            tabindex="0"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="dropzone-text">{dropzoneText}</p>
            <button type="button" class="upload-button">{buttonText}</button>
        </div>
        <input
            type="file"
            bind:this={fileInput}
            on:change={handleFileSelect}
            {accept}
            hidden
        />
    {/if}

    {#if selectedFile && !uploading}
        <div class="file-preview">
            {#if previewUrl}
                <img src={previewUrl} alt="Preview" class="preview-image" />
            {/if}
            <div class="file-info">
                <p class="file-name">{selectedFile.name}</p>
                <p class="file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button type="button" on:click={clearFile} class="clear-button">×</button>
        </div>
    {/if}

    {#if uploading && progress}
        <div class="upload-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: {progress.percentage}%"></div>
            </div>
            <p class="progress-text">{progress.percentage}% uploaded</p>
        </div>
    {/if}

    {#if error}
        <div class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{error}</span>
        </div>
    {/if}
</div>

<style>
    .media-uploader {
        width: 100%;
    }

    .dropzone {
        border: 2px dashed #cbd5e0;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        background-color: #f7fafc;
    }

    .dropzone:hover {
        border-color: #4299e1;
        background-color: #ebf8ff;
    }

    .upload-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 1rem;
        color: #718096;
    }

    .dropzone-text {
        color: #4a5568;
        margin-bottom: 1rem;
    }

    .upload-button {
        background-color: #4299e1;
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 6px;
        border: none;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .upload-button:hover {
        background-color: #3182ce;
    }

    .file-preview {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background-color: #f7fafc;
        position: relative;
    }

    .preview-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 4px;
    }

    .file-info {
        flex: 1;
    }

    .file-name {
        font-weight: 500;
        color: #2d3748;
        margin-bottom: 0.25rem;
    }

    .file-size {
        color: #718096;
        font-size: 0.875rem;
    }

    .clear-button {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background-color: #e53e3e;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.25rem;
        line-height: 1;
    }

    .clear-button:hover {
        background-color: #c53030;
    }

    .upload-progress {
        padding: 1rem;
    }

    .progress-bar {
        height: 8px;
        background-color: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background-color: #4299e1;
        transition: width 0.3s;
    }

    .progress-text {
        text-align: center;
        color: #4a5568;
        font-size: 0.875rem;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background-color: #fff5f5;
        border: 1px solid #feb2b2;
        border-radius: 6px;
        color: #c53030;
        margin-top: 1rem;
    }

    .error-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }
</style>
