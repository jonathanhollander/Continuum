<script lang="ts">
    import { onMount } from 'svelte';
    import { migrateAllMedia, needsMigration, type MigrationProgress } from '$lib/services/mediaMigration';

    let showNotice = false;
    let migrating = false;
    let progress: MigrationProgress | null = null;
    let error: string | null = null;
    let success = false;

    onMount(async () => {
        // Check if migration is needed
        const needs = await needsMigration();
        showNotice = needs;
    });

    async function startMigration() {
        migrating = true;
        error = null;
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
                error = `Migration completed with ${result.failed} errors. Check console for details.`;
            }
        } catch (e: any) {
            error = e.message || 'Migration failed';
        } finally {
            migrating = false;
        }
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
                <h3>Media Migration Available</h3>
            </div>

            {#if !migrating && !success}
                <p class="notice-text">
                    We've detected media files stored in your browser.
                    Migrate them to secure cloud storage to access them across all your devices.
                </p>
                <div class="notice-actions">
                    <button on:click={startMigration} class="btn-primary">
                        Migrate Now
                    </button>
                    <button on:click={dismiss} class="btn-secondary">
                        Later
                    </button>
                </div>
            {/if}

            {#if migrating && progress}
                <div class="migration-progress">
                    <p class="progress-label">
                        Migrating {progress.completed + 1} of {progress.total}...
                    </p>
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            style="width: {((progress.completed / progress.total) * 100).toFixed(0)}%"
                        ></div>
                    </div>
                    <p class="progress-details">
                        Current: {progress.current}
                    </p>
                </div>
            {/if}

            {#if success}
                <div class="success-message">
                    <svg class="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <p>Migration completed successfully!</p>
                </div>
            {/if}

            {#if error}
                <div class="error-message">
                    <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <p>{error}</p>
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

    .progress-details {
        font-size: 0.875rem;
        color: #718096;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .success-message, .error-message {
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

    .error-message {
        background-color: #fff5f5;
        border: 1px solid #feb2b2;
        color: #c53030;
    }

    .success-icon, .error-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .success-message p, .error-message p {
        margin: 0;
        flex: 1;
    }
</style>
