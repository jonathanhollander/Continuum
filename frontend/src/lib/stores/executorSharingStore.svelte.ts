import { registerProfileSlice } from '$lib/services/sync.svelte';
import { get } from 'svelte/store';
import { activeAccountId } from '$lib/stores/keyringStore';
import { currentProfileId } from '$lib/stores/profileContext';
import { captureSession, isCurrentSession, SessionChangedError, type SessionOwnership } from '$lib/services/sessionOwnership';

export type ExecutorNoteSharing = 'executors_only' | 'all_recipients';
interface ExecutorSharing { executorNoteSharing: ExecutorNoteSharing; }
export interface ExecutorSharingOwner { session: SessionOwnership; account: string | null; profile: string; }

const captureOwner = (): ExecutorSharingOwner => ({ session: captureSession(), account: get(activeAccountId), profile: get(currentProfileId) });
const isCurrent = (owner: ExecutorSharingOwner) => isCurrentSession(owner.session)
    && owner.account === get(activeAccountId) && owner.profile === get(currentProfileId);
const assertOwner = (owner: ExecutorSharingOwner) => { if (!isCurrent(owner)) throw new SessionChangedError(); };

const sharingSync = registerProfileSlice<ExecutorSharing>('executor_sharing', (data) => ({
    executorNoteSharing: data.executorNoteSharing === 'all_recipients' ? 'all_recipients' : 'executors_only',
}));

export const executorSharing = {
    captureOwner,
    isCurrent,
    get current(): ExecutorNoteSharing { return sharingSync.data?.executorNoteSharing ?? 'executors_only'; },
    get status() { return sharingSync.status; },
    sync: async (owner = captureOwner()) => {
        assertOwner(owner);
        await sharingSync.sync();
        assertOwner(owner);
        return sharingSync.status === 'synced';
    },
    save: async (value: ExecutorNoteSharing, owner = captureOwner()) => {
        assertOwner(owner);
        await sharingSync.update({ executorNoteSharing: value }, true);
        assertOwner(owner);
    },
};
