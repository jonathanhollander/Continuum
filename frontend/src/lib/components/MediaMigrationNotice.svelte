<script lang="ts">
    import { onMount } from 'svelte';
    import { migrateAllMedia, listPendingMedia, savePendingCopy, type PendingMediaSummary, type MigrationProgress } from '$lib/services/mediaMigration';
    import { auth } from '$lib/stores/auth';
    import { activeAccountId } from '$lib/stores/keyringStore';
    import { captureMediaOwner, isCurrentMediaOwner, MEDIA_STORAGE_CHANGED, type MediaOwner } from '$lib/services/indexedDB';

    let showNotice = false;
    let migrating = false;
    let progress: MigrationProgress | null = null;
    // Set when some files stay in this browser after a run; the person can try those again
    let retryText: string | null = null;
    let retryLabel = 'Try again';
    let success = false;
    let verifiedCount = 0;
    let files: PendingMediaSummary[] = [];
    let errors: Record<string, string> = {};
    let ownerKey: string | null = null;
    let checkRevision = 0;
    let runRevision = 0;
    let dismissed = false;
    let destroyed = false;

    function sameOwner(owner: MediaOwner, run = runRevision): boolean {
        return !destroyed && run === runRevision && isCurrentMediaOwner(owner);
    }

    function checkPending() {
        const owner = captureMediaOwner();
        const nextKey = owner ? `${owner.account}:${owner.session.generation}` : null;
        if (nextKey !== ownerKey) {
            ownerKey = nextKey;
            runRevision++;
            showNotice = false;
            migrating = false;
            progress = null;
            retryText = null;
            success = false;
            verifiedCount = 0;
            dismissed = false;
            files = [];
            errors = {};
        }
        const check = ++checkRevision;
        if (!owner || migrating || success) return;
        const run = runRevision;
        void listPendingMedia(owner).then((pending) => {
            if (check !== checkRevision || !sameOwner(owner, run)) return;
            files = pending;
            showNotice = files.length > 0 && !dismissed;
        }).catch(() => { /* Keep the current owner list available. */ });
    }

    onMount(() => {
        // A fresh account is checked after /me identifies it, and a failed new upload can
        // surface its own retained bytes without a reload. Historical unowned bytes stay aside.
        const offAuth = auth.subscribe(checkPending);
        const offAccount = activeAccountId.subscribe(checkPending);
        const storageChanged = (event: Event) => {
            const owner = captureMediaOwner();
            if ((event as CustomEvent<{ account: string }>).detail?.account === owner?.account) dismissed = false;
            checkPending();
        };
        window.addEventListener(MEDIA_STORAGE_CHANGED, storageChanged);
        return () => {
            destroyed = true;
            runRevision++;
            checkRevision++;
            offAuth();
            offAccount();
            window.removeEventListener(MEDIA_STORAGE_CHANGED, storageChanged);
        };
    });

    async function startMigration() {
        if (migrating) return;
        const owner = captureMediaOwner();
        if (!owner) { checkPending(); return; }
        const run = ++runRevision;
        migrating = true;
        retryText = null;
        success = false;
        verifiedCount = 0;

        try {
            const result = await migrateAllMedia((p) => {
                if (sameOwner(owner, run)) progress = p;
            }, owner);
            if (!sameOwner(owner, run)) return;
            verifiedCount = result.migrated;

            if (result.success) {
                success = true;
            } else {
                errors = Object.fromEntries(result.errors.map(e => [e.id, e.error]));
                const pending = await listPendingMedia(owner);
                if (!sameOwner(owner, run)) return;
                files = pending;
                retryText = restText(result.migrated);
            }
        } catch (e: any) {
            if (!sameOwner(owner, run)) return;
            console.error('Media migration:', e);
            retryText = restText(0);
        } finally {
            if (sameOwner(owner, run)) migrating = false;
        }
    }

    function restText(kept: number): string {
        retryLabel = 'Check saved records again';
        return kept ? `${kept} file${kept === 1 ? '' : 's'} verified with saved records. Your remaining browser copies are listed below.`
            : 'Your browser copies are listed below. Save a copy or check their saved records again.';
    }
    async function saveCopy(id: string) {
        const owner = captureMediaOwner();
        if (!owner) return;
        const run = runRevision;
        try { await savePendingCopy(id, owner); }
        catch { if (sameOwner(owner, run)) errors = { ...errors, [id]: 'Please try saving this browser copy again.' }; }
    }

    function dismiss() {
        dismissed = true;
        showNotice = false;
        success = false;
    }
</script>

{#if showNotice}
    <div class="migration-notice">
        <div class="notice-content">
            <div class="notice-header">
                <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <h3>Your browser copies</h3>
            </div>

            {#if !migrating && !success}
                <p class="notice-text">Browser originals stay here while their saved records and account copies are checked.</p>
                {#if retryText}<p class="notice-text" role="status">{retryText}</p>{/if}
                <ul class="file-list">
                    {#each files as file (file.id)}
                        <li>
                            <strong>{file.filename}</strong>
                            <p>{errors[file.id] || (file.canRecover ? 'Ready to check with its saved record.' : 'Save a copy, then add it to the record you choose.')}</p>
                            <div class="file-actions">
                                <button on:click={() => saveCopy(file.id)}>Save a copy</button>
                                <a href={file.area} data-sveltekit-reload>Open records</a>
                            </div>
                        </li>
                    {/each}
                </ul>
                <div class="notice-actions">
                    {#if files.some(file => file.canRecover)}
                        <button on:click={startMigration} class="btn-primary">{retryText ? retryLabel : 'Check saved records'}</button>
                    {/if}
                    <button on:click={dismiss} class="btn-secondary">Later</button>
                </div>
            {/if}

            {#if migrating && progress}
                <div class="migration-progress">
                    <p class="progress-label">
                        Checking {Math.min(progress.completed + progress.failed + 1, progress.total)} of {progress.total} browser copies…
                    </p>
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            style="width: {(((progress.completed + progress.failed) / progress.total) * 100).toFixed(0)}%"
                        ></div>
                    </div>
                </div>
            {/if}

            {#if success}
                <div class="success-message">
                    <svg class="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <p>Your files and their saved record links have been verified with your account.</p>
                </div>
            {/if}
            {#if !migrating && verifiedCount > 0}
                <div class="notice-actions reload-actions">
                    <button on:click={() => window.location.reload()} class="btn-primary">Reload saved records</button>
                    {#if success}<button on:click={dismiss} class="btn-secondary">Later</button>{/if}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .migration-notice {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: min(400px, calc(100vw - 2rem));
        max-height: calc(100dvh - 4rem);
        overflow-y: auto;
        /* Palette tokens from app.css, so both themes follow (V0e section 3). */
        background: var(--color-card);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .notice-content {
        padding: 1.5rem;
    }

    .notice-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .info-icon {
        width: 24px;
        height: 24px;
        color: var(--color-primary);
        flex-shrink: 0;
    }

    .notice-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--color-foreground);
    }

    .notice-text {
        color: var(--color-muted-foreground);
        line-height: 1.5;
        margin-bottom: 1.5rem;
    }

    .notice-actions {
        display: flex;
        gap: 0.75rem;
    }

    .btn-primary, .btn-secondary {
        flex: 1;
        padding: 0.625rem 1rem;
        border-radius: 6px;
        border: none;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary {
        background-color: var(--color-primary);
        color: var(--color-primary-foreground);
    }

    .btn-primary:hover {
        background-color: var(--color-primary-hover);
    }

    .btn-secondary {
        background-color: var(--color-muted);
        color: var(--color-foreground);
        border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
        background-color: var(--color-border);
    }

    .migration-progress {
        margin-top: 1rem;
    }

    .progress-label {
        font-weight: 500;
        color: var(--color-foreground);
        margin-bottom: 0.5rem;
    }

    .progress-bar {
        height: 8px;
        background-color: var(--color-muted);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background-color: var(--color-primary);
        transition: width 0.3s ease;
    }

    .success-message {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 6px;
        margin-top: 1rem;
    }

    .success-message {
        background-color: color-mix(in srgb, var(--color-success) 8%, var(--color-card));
        border: 1px solid color-mix(in srgb, var(--color-success) 30%, var(--color-card));
        color: var(--color-success);
    }

    .success-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .success-message p {
        margin: 0;
        flex: 1;
    }
    .file-list { list-style: none; padding: 0; margin: 0 0 1rem; }
    .file-list li { padding: .75rem 0; border-top: 1px solid var(--color-border); overflow-wrap: anywhere; }
    .file-list p { font-size: .875rem; color: var(--color-muted-foreground); margin: .5rem 0; }
    .file-actions { display: flex; gap: 1rem; align-items: center; }
    .file-actions button, .file-actions a { color: var(--color-primary); text-decoration: underline; font-size: .875rem; }
    .file-actions button { border: 0; padding: 0; background: none; cursor: pointer; }
    .reload-actions { margin-top: 1rem; }
</style>
