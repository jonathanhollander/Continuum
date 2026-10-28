<script lang="ts">
    import { onMount } from "svelte";
    import { estateAudit, AuditStore } from "$lib/stores/auditStore.svelte";
    import { CircleCheck, Circle, ArrowRight, Loader2 } from "lucide-svelte";
    import { auditReadiness } from "$lib/utils/auditReadiness.svelte";
    import AuditSourceStatus from "$lib/components/AuditSourceStatus.svelte";

    onMount(() => {
        estateAudit.runAudit();
    });

    let audit = $derived($estateAudit);
    let ringColor = $derived(
        audit.percentage === 100 ? "stroke-success" : "stroke-info",
    );
    let auditSources = $derived(auditReadiness());
    let isLoading = $derived(!auditSources.canScore);

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
    const checkRule: Record<string, string> = {
        financial: "Open non-debt accounts: 20 points for any record, up to 40 for filled beneficiary fields and up to 40 for numeric values, including zero.",
        insurance: "Any insurance policy record earns 50 points. Coverage, beneficiaries and claim requirements still need review.",
        family: "Any saved contact earns 50 points.",
        medical: "Any medical directive record earns 50 points. Its content, original and applicable authority still need review.",
        digital: "Any digital account record earns 50 points.",
        legacy: "25 points each for any heirloom, any letter, a filled funeral wish, and any journal entry, visual memory or time-capsule message.",
    };
    const sectionSources: Record<string, string[]> = {
        financial: ["financial_assets"], insurance: ["insurance_policies"],
        family: ["family_members"], medical: ["medical_directives"],
        digital: ["digital_assets"],
        legacy: ["heirlooms", "letters", "funeral_data", "journal_entries", "visual_memories", "time_capsule"],
    };
</script>

<!-- Header Section -->
<div class="flex flex-col items-start gap-6 sm:flex-row sm:items-center justify-between mb-12">
    <div>
        <h1 class="text-3xl font-bold text-foreground mb-2">Record Coverage</h1>
        <p class="text-muted-foreground max-w-2xl">
            Points for recorded information in six areas.
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
                class="text-muted"
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
                    (1 - (auditSources.canScore ? audit.percentage : 0) / 100)}
            />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
            {#if isLoading}
                {#if auditSources.hasErrors}<span class="text-3xl text-muted-foreground">—</span>
                {:else}<Loader2 size={28} class="animate-spin text-info" />{/if}
            {:else}
                <span class="text-3xl font-bold text-foreground"
                    >{audit.percentage}%</span
                >
                <span class="text-[10px] uppercase tracking-widest text-muted-foreground"
                    >{auditSources.confirmed ? "Record checks" : "Provisional"}</span
                >
            {/if}
        </div>
    </div>
</div>

<AuditSourceStatus state={auditSources} />
{#if !isLoading}
<!-- Module Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each Object.entries(audit.moduleScores) as [id, score], i}
        <div
            class="bg-card border border-border rounded-xl p-6 relative group hover:border-primary/40 transition-all"
        >
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-foreground capitalize">{id} Data</h3>
                <span
                    class="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground"
                >
                    {score} pts
                </span>
            </div>

            <!-- Mini Progress Bar -->
            <div class="h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div
                    class="h-full bg-info transition-all duration-500"
                    style="width: {share(id, score) * 100}%"
                ></div>
            </div>

            <p class="text-sm text-muted-foreground mb-4">
                {#if score === 0}
                    0 points from these record checks so far.
                {:else if share(id, score) < 1}
                    Some checked fields are filled.
                {:else}
                    These record checks are filled.
                {/if}
            </p>
            <p class="text-xs text-muted-foreground mb-4">{checkRule[id]}</p>
            <details class="mb-4 text-xs text-muted-foreground" data-coverage-sources={id}>
                <summary class="cursor-pointer font-semibold">Source records for these checks</summary>
                <p class="mt-2 text-muted-foreground">Loaded source IDs before the scoring rules above are applied. The rules above decide which rows add points.</p>
                {#each auditSources.sources.filter((source) => sectionSources[id]?.includes(source.id)) as source (source.id)}
                    <div class="mt-3" data-coverage-source={source.id}>
                        <a class="underline underline-offset-2" href={source.path}>{source.name}</a>
                        <span class="text-muted-foreground"> · {source.state === "ready" ? "Loaded" : source.state === "error" ? "Refresh failed" : "Device copy"}</span>
                        {#if source.recordIds.length > 0}
                            <ul class="mt-1 space-y-1 break-all">
                                {#each source.recordIds as recordId}
                                    <li data-coverage-record-id={recordId}>Source ID: {recordId}</li>
                                {/each}
                            </ul>
                        {:else}
                            <p class="mt-1 text-muted-foreground">0 source IDs returned.</p>
                        {/if}
                    </div>
                {/each}
            </details>

            {#if id === "family"}
                <div class="mb-4 text-sm text-foreground" data-testid="contact-readiness-evidence">
                    <p class="text-xs text-muted-foreground mb-3">{audit.contactEvidence.rule}</p>
                    <p class="font-medium mb-2">Recorded contacts: {audit.contactEvidence.includedContacts.length}</p>
                    {#each audit.contactEvidence.includedContacts as contact (contact.id)}
                        <details class="border-t border-border py-2" data-contact-id={contact.id}>
                            <summary class="cursor-pointer break-words">{contact.name} <span class="text-xs text-muted-foreground">#{contact.id}</span></summary>
                            <dl class="mt-2 space-y-1 text-xs break-words">
                                <div><dt class="inline text-muted-foreground">Role: </dt><dd class="inline">{contact.role}</dd></div>
                                {#if contact.relation}<div><dt class="inline text-muted-foreground">Relationship: </dt><dd class="inline">{contact.relation}</dd></div>{/if}
                                {#if contact.email}<div><dt class="inline text-muted-foreground">Email: </dt><dd class="inline">{contact.email}</dd></div>{/if}
                                {#if contact.phone}<div><dt class="inline text-muted-foreground">Phone: </dt><dd class="inline">{contact.phone}</dd></div>{/if}
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
        <h3 class="text-xl font-bold text-foreground mb-6">Questions to Review</h3>
        <div class="space-y-3">
            {#each audit.issues.slice(0, 5) as issue}
                <div
                    class="flex items-center gap-4 p-4 bg-muted border-l-4 border-warning rounded-r-lg"
                >
                    <CircleCheck class="text-warning shrink-0" size={20} />
                    <span class="text-foreground text-sm font-medium"
                        >{issue}</span
                    >
                </div>
            {/each}
        </div>
    </div>
{/if}
{/if}
