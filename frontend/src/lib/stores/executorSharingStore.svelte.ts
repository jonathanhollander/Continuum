import { registerProfileSlice } from '$lib/services/sync.svelte';

export type ExecutorNoteSharing = 'executors_only' | 'all_recipients';
interface ExecutorSharing { executorNoteSharing: ExecutorNoteSharing; }

const sharingSync = registerProfileSlice<ExecutorSharing>('executor_sharing', (data) => ({
    executorNoteSharing: data.executorNoteSharing === 'all_recipients' ? 'all_recipients' : 'executors_only',
}));

export const executorSharing = {
    get current(): ExecutorNoteSharing { return sharingSync.data?.executorNoteSharing ?? 'executors_only'; },
    get status() { return sharingSync.status; },
    sync: () => sharingSync.sync(),
    save: (value: ExecutorNoteSharing) => sharingSync.update({ executorNoteSharing: value }),
};
