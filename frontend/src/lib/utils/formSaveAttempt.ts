import { get } from 'svelte/store';
import type { SyncManager } from '$lib/services/sync.svelte';
import { captureSession, isCurrentSession } from '$lib/services/sessionOwnership';
import { activeAccountId } from '$lib/stores/keyringStore';
import { currentProfileId } from '$lib/stores/profileContext';

/** Each form object owns its attempts; opening another form leaves an earlier retry intact. */
export function formSaveAttempt<T extends { id: string | number }>(sync: SyncManager<T>) {
    type Attempt = { json: string; pending?: Promise<T | undefined>; completed?: T; run: () => Promise<T | undefined>; release: () => void };
    const attempts = new WeakMap<object, Attempt>();
    return (form: object, data: Partial<T>, onSaved: (saved: T) => void | Promise<void>, id?: string | number): Promise<T | undefined> => {
        // Callers supply resolved persistence fields (media references, never File or Blob objects).
        const json = JSON.stringify(data);
        const previous = attempts.get(form);
        if (previous?.pending) return previous.pending;
        if (previous && previous.json === json && !previous.completed) return previous.run();
        previous?.release();
        const payload = JSON.parse(json) as Partial<T>;
        const owner = captureSession();
        const account = get(activeAccountId);
        const profile = get(currentProfileId);
        const current = () => isCurrentSession(owner) && get(activeAccountId) === account && get(currentProfileId) === profile;
        const recoveryId = crypto.randomUUID();
        let released = false;
        const attempt: Attempt = {
            json,
            release: () => { released = true; sync.releaseRecovery(recoveryId, owner); },
            run: () => {
                if (attempt.completed || released || !current()) return Promise.resolve(attempt.completed);
                if (attempt.pending) return attempt.pending;
                attempt.pending = (async () => {
                    const saved = id !== undefined
                        ? await sync.update(id, payload, true, attempt.run, recoveryId)
                        : await sync.create(payload, false, false, attempt.run, recoveryId);
                    // The write is complete before any UI or background bookkeeping runs.
                    attempt.completed = saved;
                    if (current() && attempts.get(form) === attempt) await onSaved(saved);
                    return saved;
                })().finally(() => { attempt.pending = undefined; });
                return attempt.pending;
            },
        };
        attempts.set(form, attempt);
        return attempt.run();
    };
}
