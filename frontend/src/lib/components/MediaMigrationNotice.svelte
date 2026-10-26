<script lang="ts">
    import { onMount } from 'svelte';
    import { migrateAllMedia, needsMigration, type MigrationProgress } from '$lib/services/mediaMigration';

    let showNotice = false;
    let migrating = false;
    let progress: MigrationProgress | null = null;
    // Set when some files stay in this browser after a run; the person can try those again
    let retryText: string | null = null;
    let retryLabel = 'Try again';
    let success = false;

    onMount(async () => {
        // Check if migration is needed
        const needs = await needsMigration();
        showNotice = needs;
    });

    async function startMigration() {
        migrating = true;
        retryText = null;
        success = false;

        try {
            const result = await migrateAllMedia((p) => {
                progress = p;
            });

            if (result.success) {
                success = true;
                setTimeout(() => {
                    showNotice = false;
                }, 3000);
            } else {
                retryText = restText(result.migrated, result.failed);
            }
        } catch (e: any) {
            console.error('Media migration:', e);
            retryText = restText(0, 0);
        } finally {
            migrating = false;
        }
    }

    function restText(kept: number, waiting: number): string {
        retryLabel = kept > 0 && waiting > 0 ? 'Try the rest again' : 'Try again';
        if (kept > 0 && waiting > 0) {
            const more = waiting === 1 ? '1 more is' : `${waiting} more are`;
            return `${kept} now kept with your account. ${more} safe in this browser, and we can try the rest again whenever you're ready.`;
        }
        return "Your photos and recordings are safe in this browser. We can try again whenever you're ready.";
    }

    function dismiss() {
        showNotice = false;
    }
</script>

{#if showNotice}
    <div class="migration-notice">
        <div class="notice-content">
            <div class="notice-header">
                <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <h3>Keep your photos and recordings safe</h3>
            </div>

            {#if !migrating && !success && !retryText}
                <p class="notice-text">
                    Some of your photos and recordings are saved in this browser.
                    When you're ready, we can keep them with your account, so they're there for you on every device you sign in from.
                </p>
                <div class="notice-actions">
                    <button on:click={startMigration} class="btn-primary">
                        Keep them with my account
                    </button>
                    <button on:click={dismiss} class="btn-secondary">
                        Later
                    </button>
                </div>
            {/if}

            {#if migrating && progress}
                <div class="migration-progress">
                    <p class="progress-label">
                        Keeping {Math.min(progress.completed + 1, progress.total)} of {progress.total} with your account…
                    </p>
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            style="width: {((progress.completed / progress.total) * 100).toFixed(0)}%"
                        ></div>
                    </div>
                </div>
            {/if}

            {#if success}
                <div class="success-message">
                    <svg class="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <p>Your photos and recordings are now kept with your account.</p>
                </div>
            {/if}

            {#if retryText && !migrating}
                <div class="retry-message">
                    <p>{retryText}</p>
                </div>
                <div class="notice-actions">
                    <button on:click={startMigration} class="btn-primary">
                        {retryLabel}
                    </button>
                    <button on:click={dismiss} class="btn-secondary">
                        Later
                    </button>
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
        max-width: 400px;
        background: white;
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
        color: #4299e1;
        flex-shrink: 0;
    }

    .notice-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #2d3748;
    }

    .notice-text {
        color: #4a5568;
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
        background-color: #4299e1;
        color: white;
    }

    .btn-primary:hover {
        background-color: #3182ce;
    }

    .btn-secondary {
        background-color: #edf2f7;
        color: #4a5568;
    }

    .btn-secondary:hover {
        background-color: #e2e8f0;
    }

    .migration-progress {
        margin-top: 1rem;
    }

    .progress-label {
        font-weight: 500;
        color: #2d3748;
        margin-bottom: 0.5rem;
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
        transition: width 0.3s ease;
    }

    .success-message, .retry-message {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 6px;
        margin-top: 1rem;
    }

    .success-message {
        background-color: #f0fff4;
        border: 1px solid #9ae6b4;
        color: #2f855a;
    }

    .retry-message {
        background-color: #ebf8ff;
        border: 1px solid #bee3f8;
        color: #2c5282;
        margin-bottom: 1rem;
    }

    .success-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .success-message p, .retry-message p {
        margin: 0;
        flex: 1;
    }
</style>
