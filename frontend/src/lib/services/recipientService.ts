/**
 * Recipient start page (card D2, CU-005).
 *
 * The owner marks a contact as a recipient and creates a link (/for/<token>). The page reads
 * one token-scoped snapshot (D1's export snapshot, filtered to what this person should see) and
 * its files through the same link, so it works with no sign-in. The owner's preview reads the
 * same payload with their own session. Endpoints: backend/routers/recipient.py, and
 * GET /api/media/shared/{token}/{media_id} in backend/routers/media.py.
 */
import { get } from 'svelte/store';
import { API_BASE_URL } from '$lib/config';
import { auth } from '$lib/stores/auth';
import { fetchMediaBlob } from '$lib/services/mediaService';
import type { Snapshot, SnapshotAttachment } from '$lib/services/exportService';

export interface RecipientView {
    preview: boolean;
    recipient: { id: number; name: string; relation?: string | null; is_executor: boolean };
    note: string;
    snapshot: Snapshot;
}

export interface RecipientLinkState {
    contact_id: number;
    name: string;
    relation?: string | null;
    is_recipient: boolean;
    is_executor: boolean;
    note: string;
    token: string | null;
    path: string | null;
    created_at: string | null;
}

/** Thrown when a link has been closed (or never existed): the page shows its closed message. */
export class LinkClosed extends Error { }

const BASE = `${API_BASE_URL}/api/recipient`;

function ownerHeaders(json = false): Record<string, string> {
    const token = get(auth).token;
    return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

async function read<T>(res: Response): Promise<T> {
    if (res.status === 404) throw new LinkClosed();
    if (!res.ok) throw new Error('This is taking a moment. You can try again shortly.');
    return res.json();
}

export async function fetchRecipientView(token: string): Promise<RecipientView> {
    return read(await fetch(`${BASE}/view/${encodeURIComponent(token)}`));
}

export async function fetchRecipientPreview(contactId: number | string): Promise<RecipientView> {
    return read(await fetch(`${BASE}/preview/${contactId}`, { headers: ownerHeaders() }));
}

/** Each file on the recipient's page, fetched through their link (no sign-in). */
export function sharedFileFetcher(token: string) {
    return async (a: SnapshotAttachment): Promise<Blob> => {
        const res = await fetch(`${API_BASE_URL}/api/media/shared/${encodeURIComponent(token)}/${a.media_id}`);
        if (!res.ok) throw new Error('This file is taking a moment to open.');
        return res.blob();
    };
}

/** The owner's preview reads the same files with their own session. */
export const ownerFileFetcher = (a: SnapshotAttachment) => fetchMediaBlob(a.media_id as number);

// --- Owner link controls ---------------------------------------------------

export async function getLinkState(contactId: number | string): Promise<RecipientLinkState> {
    return read(await fetch(`${BASE}/links/${contactId}`, { headers: ownerHeaders() }));
}

export async function updateRecipient(contactId: number | string, body: { is_recipient?: boolean; note?: string }): Promise<RecipientLinkState> {
    return read(await fetch(`${BASE}/links/${contactId}`, { method: 'PUT', headers: ownerHeaders(true), body: JSON.stringify(body) }));
}

export async function createLink(contactId: number | string): Promise<RecipientLinkState> {
    return read(await fetch(`${BASE}/links/${contactId}`, { method: 'POST', headers: ownerHeaders() }));
}

export async function revokeLink(contactId: number | string): Promise<RecipientLinkState> {
    return read(await fetch(`${BASE}/links/${contactId}`, { method: 'DELETE', headers: ownerHeaders() }));
}

export const linkUrl = (path: string) => `${window.location.origin}${path}`;
