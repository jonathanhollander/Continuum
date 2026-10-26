/**
 * Media Service — the one supported path for files (PDF, images, audio, video).
 *
 * API for callers (C1 documents, C5 time capsule, uploaders):
 *   uploadMedia(file, module, referenceId?, description?, onProgress?) -> MediaUploadResponse
 *       Keeps the original in IndexedDB, uploads it, reads it back from the server,
 *       and only then removes the local copy. Store `response.download_url`
 *       (e.g. "/api/media/12/download") or `response.id` on the record.
 *   getMediaBlobUrl(ref)  -> object URL for <img>/<audio>/<video> (ref = id or download_url)
 *   fetchMediaBlob(ref)   -> Blob
 *   downloadMedia(ref, filename?) -> saves the file in the browser
 *   getMedia(ref)         -> metadata (filename, mime_type, file_size, ...)
 *   mediaIdFromRef(ref)   -> numeric id, or null when ref is something else (data URL, blob URL)
 *
 * Every request sends the signed-in user's token (`continuum_auth_token`); the
 * server only returns files that belong to that user.
 */

import { API_BASE_URL } from '$lib/config';
import { mediaStorage } from './indexedDB';

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
    storage_provider?: string;
    doc_category?: string;
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

export type MediaRef = number | string;

const TOKEN_KEY = 'continuum_auth_token';
const API_BASE = `${API_BASE_URL}/api/media`;

function authToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}

function authHeaders(): Record<string, string> {
    const token = authToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Read the server's error body ({ error: { message } } or { detail }). */
function messageFrom(body: any, fallback: string): string {
    if (body?.error?.message) return body.error.message;
    if (typeof body?.detail === 'string') return body.detail;
    return fallback;
}

/** The numeric media id inside a ref: 12, "12", or "/api/media/12/download". */
export function mediaIdFromRef(ref: MediaRef | null | undefined): number | null {
    if (ref === null || ref === undefined || ref === '') return null;
    if (typeof ref === 'number') return Number.isFinite(ref) ? ref : null;
    if (/^\d+$/.test(ref)) return Number(ref);
    const match = ref.match(/\/api\/media\/(\d+)(?:\/download)?(?:[?#].*)?$/);
    return match ? Number(match[1]) : null;
}

function requireId(ref: MediaRef): number {
    const id = mediaIdFromRef(ref);
    if (id === null) throw new Error('This file reference belongs to another kind of storage.');
    return id;
}

function readCsrfCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='));
    return match ? decodeURIComponent(match.slice('csrf_token='.length)) : null;
}

/** XHR bypasses the fetch wrapper in hooks.client.ts, so the CSRF header is added here. */
async function csrfToken(): Promise<string | null> {
    let token = readCsrfCookie();
    if (!token) {
        try {
            await fetch(`${API_BASE_URL}/api/health`, { credentials: 'include' });
        } catch {
            // the upload reports its own result
        }
        token = readCsrfCookie();
    }
    return token;
}

/** Upload once with XHR (for progress). Resolves with the status so 401 can refresh and retry. */
function sendUpload(
    url: string,
    formData: FormData,
    token: string | null,
    csrf: string | null,
    onProgress?: (progress: UploadProgress) => void
): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
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
        xhr.addEventListener('load', () => {
            let body: any = null;
            try {
                body = JSON.parse(xhr.responseText);
            } catch {
                body = null;
            }
            resolve({ status: xhr.status, body });
        });
        xhr.addEventListener('error', () =>
            reject(new Error('The connection paused while saving this file. It is still here, ready to try again.'))
        );
        xhr.addEventListener('abort', () => reject(new Error('The upload paused. The file is still here, ready to try again.')));
        xhr.open('POST', url);
        xhr.withCredentials = true;
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf);
        xhr.send(formData);
    });
}

/** Upload without keeping a local copy (used by the migration, which owns its own copy). */
export async function uploadMediaDirect(
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

    const csrf = await csrfToken();
    let result = await sendUpload(url, formData, authToken(), csrf, onProgress);

    // Expired session: refresh once and retry (same rule as the fetch wrapper)
    if (result.status === 401) {
        const { refreshSession } = await import('$lib/stores/auth');
        const refreshed = await refreshSession();
        if (refreshed.ok) {
            result = await sendUpload(url, formData, refreshed.token, csrf, onProgress);
        }
    }

    if (result.status >= 200 && result.status < 300 && result.body) {
        return result.body as MediaUploadResponse;
    }
    throw new Error(messageFrom(result.body, 'Saving this file paused. It is still here, ready to try again.'));
}

/** Fetch the stored file from the server as a Blob. */
export async function fetchMediaBlob(ref: MediaRef): Promise<Blob> {
    const id = requireId(ref);
    const response = await fetch(`${API_BASE}/${id}/download`, { headers: authHeaders() });
    if (!response.ok) {
        let body: any = null;
        try {
            body = await response.json();
        } catch {
            body = null;
        }
        throw new Error(messageFrom(body, 'This file is taking a moment to open. You can try again shortly.'));
    }
    return response.blob();
}

/**
 * Read a just-uploaded file back from the server and confirm its size.
 * True only when the server returns the same number of bytes.
 */
export async function verifyMediaRetrieval(ref: MediaRef, expectedSize: number): Promise<boolean> {
    try {
        const blob = await fetchMediaBlob(ref);
        return blob.size === expectedSize;
    } catch {
        return false;
    }
}

/**
 * Upload a file and keep the original in IndexedDB until the server copy has
 * been read back successfully. If that read-back does not succeed, the local
 * copy stays (under the key "pending:<module>:<referenceId>:<time>") so the
 * media migration can offer it again.
 */
export async function uploadMedia(
    file: File,
    module: string,
    referenceId?: string,
    description?: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<MediaUploadResponse> {
    const localKey = `pending:${module}:${referenceId ?? ''}:${Date.now()}`;
    let keptLocally = false;
    try {
        await mediaStorage.save(localKey, file);
        keptLocally = true;
    } catch (e) {
        console.warn('[media] Could not keep a local copy before upload', e);
    }

    const response = await uploadMediaDirect(file, module, referenceId, description, onProgress);

    if (keptLocally) {
        if (await verifyMediaRetrieval(response.id, file.size)) {
            await mediaStorage.delete(localKey).catch(() => undefined);
        } else {
            console.warn(`[media] Kept local copy ${localKey}; server copy ${response.id} did not read back yet`);
        }
    }
    return response;
}

/**
 * List media files for a module
 */
export async function listMedia(module?: string, referenceId?: string): Promise<MediaFile[]> {
    const params = new URLSearchParams();
    if (module) params.append('module', module);
    if (referenceId) params.append('reference_id', referenceId);

    const response = await fetch(`${API_BASE}/${params.toString() ? '?' + params : ''}`, {
        headers: authHeaders()
    });
    if (!response.ok) throw new Error('Your files are taking a moment to gather. You can try again shortly.');
    return response.json();
}

/**
 * Get a single media file's metadata
 */
export async function getMedia(ref: MediaRef): Promise<MediaFile> {
    const response = await fetch(`${API_BASE}/${requireId(ref)}`, { headers: authHeaders() });
    if (!response.ok) throw new Error('This file may have been moved.');
    return response.json();
}

/**
 * Full download address (no token in it; fetch it with the auth header, or use downloadMedia).
 */
export function getMediaDownloadUrl(ref: MediaRef): string {
    return `${API_BASE}/${requireId(ref)}/download`;
}

/**
 * Object URL for displaying media (<img>, <audio>, <video>). Revoke it when done.
 */
export async function getMediaBlobUrl(ref: MediaRef): Promise<string> {
    const blob = await fetchMediaBlob(ref);
    return URL.createObjectURL(blob);
}

/**
 * Save the stored file to this computer.
 */
export async function downloadMedia(ref: MediaRef, filename?: string): Promise<void> {
    let name = filename;
    if (!name) {
        try {
            name = (await getMedia(ref)).filename;
        } catch {
            name = `file-${requireId(ref)}`;
        }
    }
    const url = await getMediaBlobUrl(ref);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Delete a media file
 */
export async function deleteMedia(ref: MediaRef): Promise<void> {
    const response = await fetch(`${API_BASE}/${requireId(ref)}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    if (!response.ok) throw new Error('Removing this file paused. You can try again shortly.');
}

/**
 * Update media metadata
 */
export async function updateMediaMetadata(
    ref: MediaRef,
    description?: string,
    referenceId?: string
): Promise<void> {
    const params = new URLSearchParams();
    if (description !== undefined) params.append('description', description);
    if (referenceId !== undefined) params.append('reference_id', referenceId);

    const response = await fetch(`${API_BASE}/${requireId(ref)}/metadata?${params}`, {
        method: 'PUT',
        headers: authHeaders()
    });
    if (!response.ok) throw new Error('Updating this file paused. You can try again shortly.');
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

/** Types the server keeps (mirrors ALLOWED_MIME_TYPES in backend/routers/media.py). */
export const ACCEPTED_MEDIA_TYPES = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
    // Videos
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
    // Audio
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg',
    'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac',
    // Documents (PDF, Text, CSV)
    'application/pdf', 'text/plain', 'text/csv'
];

/** Value for an <input type="file" accept>. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_MEDIA_TYPES.join(',') + ',.pdf,.txt,.csv,.mp3,.wav,.m4a,.mp4,.mov,.webm';

/** The base type, without parameters such as ";codecs=opus". */
export function baseMimeType(type: string): string {
    return type.split(';')[0].trim().toLowerCase();
}

/**
 * Validate file type
 */
export function isValidMediaType(file: File): boolean {
    return ACCEPTED_MEDIA_TYPES.includes(baseMimeType(file.type));
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
