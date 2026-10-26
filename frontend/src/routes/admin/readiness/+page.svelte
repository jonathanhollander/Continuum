<script lang="ts">
    import { onMount } from "svelte";
    import { estateAudit, AuditStore } from "$lib/stores/auditStore.svelte";
    import { CircleCheck, Circle, ArrowRight, Loader2 } from "lucide-svelte";
    import { financialAssetsSync } from "$lib/stores/financialAssetsStore.svelte";
    import { insuranceSync } from "$lib/stores/insuranceStore.svelte";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import { directiveSync } from "$lib/stores/medicalStore.svelte";
    import { digitalAssetsSync } from "$lib/stores/digitalAssetsStore.svelte";

    onMount(() => {
        estateAudit.runAudit();
    });

    let audit = $derived($estateAudit);
    let ringColor = $derived(
        audit.percentage === 100 ? "stroke-success" : "stroke-info",
    );
    // A gentle cue, not 0% and 0 pts, until every store the audit reads has its first server
    // answer (a store this device already holds records for counts as answered).
    let isLoading = $derived(
        [financialAssetsSync, insuranceSync, contactSync, directiveSync, digitalAssetsSync].some(
            (m) => m.lastSync === null && m.status !== "error" && m.items.length === 0,
        ),
    );

    // Each area's page; every id the audit scores has one
    const modulePath: Record<string, string> = {
        financial: "financial-accounts",
        insurance: "insurance",
        family: "contacts",
        medical: "medical",
        digital: "digital-guardian",
        legacy: "heirlooms",
    };
    const share = (id: string, score: number) =>
        Math.min(1, score / (AuditStore.maxScores[id] || 50));
</script>

<!-- Header Section -->
<div class="flex items-center justify-between mb-12">
    <div>
        <h1 class="text-3xl font-bold text-white mb-2">Estate Readiness Hub</h1>
        <p class="text-slate-400 max-w-2xl">
            See how complete each section is.
        </p>
    </div>

    <!-- Big Score Ring -->
    <div class="relative flex items-center justify-center">
        <svg class="transform -rotate-90 w-32 h-32">
            <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                class="text-slate-800"
            />
            <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                class="{ringColor} transition-all duration-1000 ease-out"
                stroke-dasharray={2 * Math.PI * 60}
                stroke-dashoffset={2 *
                    Math.PI *
                    60 *
                    (1 - audit.percentage / 100)}
            />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
            {#if isLoading}
                <Loader2 size={28} class="animate-spin text-info" />
            {:else}
                <span class="text-3xl font-bold text-white"
                    >{audit.percentage}%</span
                >
                <span class="text-[10px] uppercase tracking-widest text-muted-foreground"
                    >Ready</span
                >
            {/if}
        </div>
    </div>
</div>

{#if isLoading}
    <div class="flex flex-col items-center justify-center gap-3 py-16" role="status" data-testid="readiness-loading">
        <Loader2 class="w-8 h-8 animate-spin text-info" />
        <p class="text-sm text-slate-400">Gathering your records...</p>
    </div>
{:else}
<!-- Module Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each Object.entries(audit.moduleScores) as [id, score], i}
        <div
            class="bg-slate-900 border border-slate-800 rounded-xl p-6 relative group hover:border-slate-700 transition-all"
        >
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-white capitalize">{id} Data</h3>
                <span
                    class="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300"
                >
                    {score} pts
                </span>
            </div>

            <!-- Mini Progress Bar -->
            <div class="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                    class="h-full bg-info transition-all duration-500"
                    style="width: {share(id, score) * 100}%"
                ></div>
            </div>

            <p class="text-sm text-slate-400 mb-4">
                {#if score === 0}
                    Ready when you are.
                {:else if share(id, score) < 1}
                    A good start.
                {:else}
                    Well covered.
                {/if}
            </p>

            {#if id === "family"}
                <div class="mb-4 text-sm text-slate-300" data-testid="contact-readiness-evidence">
                    <p class="text-xs text-slate-400 mb-3">{audit.contactEvidence.rule}</p>
                    <p class="font-medium mb-2">Recorded contacts: {audit.contactEvidence.includedContacts.length}</p>
                    {#each audit.contactEvidence.includedContacts as contact (contact.id)}
                        <details class="border-t border-slate-800 py-2" data-contact-id={contact.id}>
                            <summary class="cursor-pointer break-words">{contact.name} <span class="text-xs text-slate-400">#{contact.id}</span></summary>
                            <dl class="mt-2 space-y-1 text-xs break-words">
                                <div><dt class="inline text-slate-400">Role: </dt><dd class="inline">{contact.role}</dd></div>
                                {#if contact.relation}<div><dt class="inline text-slate-400">Relationship: </dt><dd class="inline">{contact.relation}</dd></div>{/if}
                                {#if contact.email}<div><dt class="inline text-slate-400">Email: </dt><dd class="inline">{contact.email}</dd></div>{/if}
                                {#if contact.phone}<div><dt class="inline text-slate-400">Phone: </dt><dd class="inline">{contact.phone}</dd></div>{/if}
                            </dl>
                        </details>
                    {/each}
                </div>
            {/if}

            <div class="flex justify-end">
                <a
                    href="/modules/{modulePath[id] ?? id}"
                    class="text-xs text-primary hover:text-primary-hover flex items-center gap-1 font-medium"
                >
                    {id === "family" ? "View contact records" : "Go to Module"} <ArrowRight size={12} />
                </a>
            </div>
        </div>
    {/each}
</div>

<!-- Action Cards -->
{#if audit.issues.length > 0}
    <div class="mt-12">
        <h3 class="text-xl font-bold text-white mb-6">Priority Actions</h3>
        <div class="space-y-3">
            {#each audit.issues.slice(0, 5) as issue}
                <div
                    class="flex items-center gap-4 p-4 bg-slate-900/50 border-l-4 border-warning rounded-r-lg"
                >
                    <CircleCheck class="text-warning shrink-0" size={20} />
                    <span class="text-slate-300 text-sm font-medium"
                        >{issue}</span
                    >
                </div>
            {/each}
        </div>
    </div>
{/if}
{/if}
