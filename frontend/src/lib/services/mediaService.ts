/**
 * Media Service
 * Handles file uploads and downloads via backend API
 * Replaces IndexedDB-based media storage
 */

export interface MediaFile {
    id: number;
    filename: string;
    mime_type: string;
    file_size: number;
    module: string;
    reference_id?: string;
    description?: string;
    width?: number;
    height?: number;
    duration?: number;
    created_at: string;
    download_url: string;
}

export interface MediaUploadResponse {
    id: number;
    filename: string;
    mime_type: string;
    file_size: number;
    download_url: string;
    message: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

const API_BASE = '/api/media';

/**
 * Upload a media file to the backend
 */
export async function uploadMedia(
    file: File,
    module: string,
    referenceId?: string,
    description?: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({ module });
    if (referenceId) params.append('reference_id', referenceId);
    if (description) params.append('description', description);

    const url = `${API_BASE}/upload?${params}`;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percentage: Math.round((event.loaded / event.total) * 100)
                    });
                }
            });
        }

        // Success handler
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('Failed to parse response'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.detail || 'Upload failed'));
                } catch {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        });

        // Error handler
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        // Abort handler
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });

        // Send request
        xhr.open('POST', url);

        // Add auth token if available
        const token = localStorage.getItem('access_token');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
    });
}

/**
 * List media files for a module
 */
export async function listMedia(
    module?: string,
    referenceId?: string
): Promise<MediaFile[]> {
    const params = new URLSearchParams();
    if (module) params.append('module', module);
    if (referenceId) params.append('reference_id', referenceId);

    const url = `${API_BASE}/${params.toString() ? '?' + params : ''}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to list media files');
    }

    return response.json();
}

/**
 * Get a single media file's metadata
 */
export async function getMedia(mediaId: number): Promise<MediaFile> {
    const response = await fetch(`${API_BASE}/${mediaId}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to get media file');
    }

    return response.json();
}

/**
 * Get download URL for a media file
 */
export function getMediaDownloadUrl(mediaId: number): string {
    const token = localStorage.getItem('access_token');
    return `${API_BASE}/${mediaId}/download?token=${token}`;
}

/**
 * Get blob URL for displaying media
 * Downloads the file and creates a local blob URL
 */
export async function getMediaBlobUrl(mediaId: number): Promise<string> {
    const response = await fetch(`${API_BASE}/${mediaId}/download`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to download media file');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

/**
 * Delete a media file
 */
export async function deleteMedia(mediaId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${mediaId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to delete media file');
    }
}

/**
 * Update media metadata
 */
export async function updateMediaMetadata(
    mediaId: number,
    description?: string,
    referenceId?: string
): Promise<void> {
    const params = new URLSearchParams();
    if (description !== undefined) params.append('description', description);
    if (referenceId !== undefined) params.append('reference_id', referenceId);

    const response = await fetch(`${API_BASE}/${mediaId}/metadata?${params}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to update media metadata');
    }
}

/**
 * Convert a File to base64 data URL (for preview before upload)
 */
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Validate file type
 */
export function isValidMediaType(file: File): boolean {
    const validTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
        // Videos
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
        // Audio
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'
    ];

    return validTypes.includes(file.type.toLowerCase());
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
