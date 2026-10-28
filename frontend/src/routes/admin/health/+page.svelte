<script lang="ts">
    import { onMount } from "svelte";
    import { estateAudit } from "$lib/stores/auditStore.svelte";
    import { auditReadiness } from "$lib/utils/auditReadiness.svelte";
    import AuditSourceStatus from "$lib/components/AuditSourceStatus.svelte";
    import { TriangleAlert, Activity, ShieldAlert } from "lucide-svelte";

    onMount(() => {
        estateAudit.runAudit();
    });

    let audit = $derived($estateAudit);
    let auditSources = $derived(auditReadiness());
    // The level box takes the level's colour (it was red even at Low)
    const tones = {
        High: { box: "bg-danger-soft border-danger/30", icon: "text-danger", label: "text-danger" },
        Moderate: { box: "bg-warning-soft border-warning/30", icon: "text-warning", label: "text-warning" },
        Low: { box: "bg-success/10 border-success/30", icon: "text-success", label: "text-success" },
    };
    let level = $derived(
        audit.issues.length > 5 ? "High" : audit.issues.length > 0 ? "Moderate" : "Low",
    );
    let levelTone = $derived(tones[level as keyof typeof tones]);
</script>

<div class="space-y-8">
    <div
        class="flex items-center justify-between border-b border-border pb-8"
    >
        <div>
            <h1 class="text-3xl font-bold text-foreground mb-2">
                Record Review List
            </h1>
            <p class="text-muted-foreground">
                Questions raised by the same six-area record checks as Record Coverage.
            </p>
        </div>
        {#if auditSources.canScore}<div
            class="flex items-center gap-3 px-4 py-2 rounded-lg border {levelTone.box}"
        >
            <ShieldAlert class={levelTone.icon} size={24} />
            <div>
                <div class="text-xs uppercase font-bold {levelTone.label}">
                    Review list size
                </div>
                <div class="text-lg font-bold text-foreground">
                    {level}
                </div>
                <div class="text-xs text-muted-foreground">{audit.issues.length} questions</div>
            </div>
        </div>{/if}
    </div>

    <AuditSourceStatus state={auditSources} />
    {#if auditSources.canScore}
    <!-- Red Flags Grid -->
    <div class="grid grid-cols-1 gap-6">
        <section class="bg-card border border-border rounded-xl p-6">
            <h3
                class="flex items-center gap-2 text-lg font-bold text-foreground mb-6"
            >
                <TriangleAlert class="text-warning" size={20} />
                Questions to review
            </h3>

            {#if audit.issues.length === 0}
                <div
                    class="p-4 bg-success/10 border border-success/30 rounded-lg text-success text-sm flex items-center gap-2"
                >
                    <Activity size={16} /> Every one of these record checks has an entry. Review dates, details and access separately.
                </div>
            {:else}
                <ul class="space-y-2">
                    {#each audit.issues as issue}
                        <li
                            class="flex items-start gap-3 p-3 bg-background rounded border border-border"
                        >
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-danger mt-2 shrink-0"
                            ></span>
                            <span class="text-sm text-foreground">{issue}</span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

    </div>
    {/if}

    <!-- JSON Inspector (Developer Tool) -->
    <section
        class="bg-background border border-border rounded-xl p-6 overflow-hidden"
    >
        <h3
            class="text-sm font-mono text-muted-foreground mb-4 uppercase tracking-wider"
        >
            Record-check Details and Source IDs
        </h3>
        <pre
            class="text-xs text-success font-mono overflow-x-auto p-4 bg-card rounded-lg border border-border max-h-64">
{JSON.stringify({ ...(auditSources.canScore ? audit : {}), sourceReadiness: auditSources }, null, 2)}
        </pre>
    </section>
</div>
