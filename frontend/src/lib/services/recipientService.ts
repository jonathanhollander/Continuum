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
import { captureSession, assertCurrentSession, isCurrentSession, sessionToken } from '$lib/services/sessionOwnership';
import { notifications } from '$lib/stores/notificationStore';

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
    if (!res.ok) throw new Error("Everything here is kept safe. You can try again whenever you're ready.");
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
        if (!res.ok) throw new Error("This file is kept safe. You can open it again whenever you're ready.");
        return res.blob();
    };
}

/** The owner's preview reads the same files with their own session. */
export const ownerFileFetcher = (a: SnapshotAttachment) => fetchMediaBlob(a.media_id as number);

// --- Owner link controls ---------------------------------------------------

// Preserve the order in which this session requested changes to one recipient, including
// a blur-save queued before its panel closes. Later visits share the same per-contact tail.
const mutationTails = new Map<string, Promise<void>>();
const latestNotes = new Map<string, number>();
const retryNotices = new Map<string, string>();
let noteSequence = 0;
function mutateRecipient(contactId: number | string, method: 'PUT' | 'POST' | 'DELETE', body?: object): Promise<RecipientLinkState> {
    const owner = captureSession();
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const key = `${owner.generation}:${contactId}`;
    const note = body && 'note' in body ? ++noteSequence : null;
    if (note !== null) {
        latestNotes.set(key, note);
        const notice = retryNotices.get(key);
        if (notice) notifications.dismiss(notice);
        retryNotices.delete(key);
    }
    // This closure keeps the original owner/contact/payload even when its panel has closed.
    const send = (): Promise<RecipientLinkState> => {
        const previous = mutationTails.get(key) ?? Promise.resolve();
        const result = previous.then(async () => {
            assertCurrentSession(owner);
            const token = sessionToken(owner);
            const saved = await read<RecipientLinkState>(await fetch(`${BASE}/links/${contactId}`, {
                method,
                headers: { Authorization: `Bearer ${token}`, ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }) },
                body: payload,
            }));
            assertCurrentSession(owner);
            if (note !== null && latestNotes.get(key) === note) {
                latestNotes.delete(key);
                const notice = retryNotices.get(key);
                if (notice) notifications.dismiss(notice);
                retryNotices.delete(key);
            }
            return saved;
        }).catch((error: unknown) => {
            // Any requested note can fail after unmount: keep its account-bound retry outside the panel.
            // A later note supersedes this retry, so old words cannot overwrite a newer save.
            if (note !== null && isCurrentSession(owner) && latestNotes.get(key) === note) {
                retryNotices.set(key, notifications.showError({ message: 'Your note is ready for another save.', code: 'DATABASE_ERROR' }, () => {
                    if (isCurrentSession(owner) && latestNotes.get(key) === note) void send().catch(() => {});
                }));
            }
            throw error;
        });
        // A refused save leaves the next explicitly requested save eligible, with its own snapshot.
        const settled = result.then(() => {}, () => {});
        mutationTails.set(key, settled);
        void settled.then(() => { if (mutationTails.get(key) === settled) mutationTails.delete(key); });
        return result;
    };
    return send();
}

export async function getLinkState(contactId: number | string): Promise<RecipientLinkState> {
    return read(await fetch(`${BASE}/links/${contactId}`, { headers: ownerHeaders() }));
}

export async function updateRecipient(contactId: number | string, body: { is_recipient?: boolean; note?: string }): Promise<RecipientLinkState> {
    return mutateRecipient(contactId, 'PUT', body);
}

export async function createLink(contactId: number | string): Promise<RecipientLinkState> {
    return mutateRecipient(contactId, 'POST');
}

export async function revokeLink(contactId: number | string): Promise<RecipientLinkState> {
    return mutateRecipient(contactId, 'DELETE');
}

export const linkUrl = (path: string) => `${window.location.origin}${path}`;
