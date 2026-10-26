<script lang="ts">
    import { Loader2 } from 'lucide-svelte';
    import { retryAuditSources, type AuditReadiness } from '$lib/utils/auditReadiness.svelte';
    let { state: sourceState }: { state: AuditReadiness } = $props();
    let retrying = $state(false);
    async function retry() {
        retrying = true;
        try { await retryAuditSources(); } finally { retrying = false; }
    }
</script>

{#if !sourceState.confirmed}
    <div class="my-4 space-y-2 text-sm text-muted-foreground" role="status" data-testid="audit-source-status">
        <p class="flex items-center gap-2">
            {#if !sourceState.hasErrors}<Loader2 size={16} class="animate-spin shrink-0" />{/if}
            {#if sourceState.hasErrors}Let's try loading your records again.
            {:else if sourceState.hasCached}Showing a provisional view from this device while your records refresh.
            {:else}Gathering your records...{/if}
        </p>
        {#if sourceState.hasCached && sourceState.hasErrors}<p>Showing a provisional view from this device.</p>{/if}
        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {#each sourceState.sources.filter((s) => s.state !== 'ready') as source (source.id)}
                <li data-audit-source={source.id} data-source-state={source.state}>
                    <a class="underline underline-offset-2" href={source.path}>{source.name}</a>:
                    {source.state === 'error' ? 'Try Again' : source.state === 'cached' ? 'Device copy' : 'Gathering'}
                </li>
            {/each}
        </ul>
        {#if sourceState.hasErrors}
            <button class="rounded-lg border border-border px-3 py-2 font-medium text-foreground disabled:opacity-60" disabled={retrying} onclick={retry}>
                {retrying ? 'Gathering your records...' : 'Try Again'}
            </button>
        {/if}
    </div>
{/if}
