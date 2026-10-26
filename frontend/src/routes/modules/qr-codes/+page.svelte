<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { fade, fly, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import {
        QrCode,
        Shield,
        Users,
        Printer,
        Download,
        Plus,
        Trash2,
        ChevronRight,
        ArrowRight,
        Sparkles,
        CircleCheck,
        Info,
        FileText,
        Smartphone,
        History,
        Search,
        Layers,
        LayoutGrid,
        ScanLine,
        Loader2,
    } from "lucide-svelte";
    import {
        qrStore,
        type AccessPack,
        type AssetLabel,
    } from "$lib/stores/qrStore";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { onMount } from "svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { language } from "$lib/stores/localization";

    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('qr-codes'));
    let showAffirmation = $state(false);
    let isLoading = $state(true);

    onMount(async () => {
        isLoading = false;
    });

    let selectedPack = $state<AccessPack | null>(null);
    let showGenerateModal = $state(false);
    let searchQuery = $state("");

    function generatePack(packId: string) {
        qrStore.generatePackQR(packId);
        const pack = $qrStore.accessPacks.find((p) => p.id === packId);
        if (pack) {
            activityLog.logEvent({
                module: "QR Center",
                action: "CREATE",
                entityType: "Access Pack",
                entityId: packId,
                entityName: pack.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }
        showAffirmation = true;
    }

    function printPack(pack: AccessPack) {
        selectedPack = pack;
        setTimeout(() => window.print(), 100);

        activityLog.logEvent({
            module: "QR Center",
            action: "EXPORT",
            entityType: "Access Pack",
            entityId: pack.id,
            entityName: pack.name,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    async function deleteAssetQR(id: string, name: string, type: AssetLabel["assetType"]) {
        if (
            !(await askConfirm(
                `Remove the QR label for "${name}"? You can create a new one anytime.`,
            ))
        )
            return;
        qrStore.removeAssetQR(id, type);

        activityLog.logEvent({
            module: "QR Center",
            action: "DELETE",
            entityType: "Asset Label",
            entityId: id,
            entityName: name,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    let filteredAssets = $derived(
        $qrStore.assetLabels.filter(
            (a) =>
                a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.assetType.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div
    class="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700"
>
    <!-- Header Section -->
    <LivingBlueprintHeader
        title="QR Access Codes"
        subtitle="Printed shortcuts to your Continuum pages"
        detailedDescription="Create QR codes for your Red Binder and item labels. Pack codes open Dashboard or the executor guide after sign-in; asset labels open the linked record in the signed-in account."
        whyMatters="Keep a printed route back to your records alongside your physical documents and belongings."
    >
        <div class="flex items-center gap-4">
            <div
                class="bg-card border border-border p-4 rounded-2xl flex items-center gap-6 shadow-sm"
            >
                <div
                    class="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground"
                >
                    <History size={24} />
                </div>
                <div>
                    <p
                        class="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                        Generated Codes
                    </p>
                    <p class="text-sm font-bold text-foreground">
                        {$qrStore.assetLabels.length +
                            $qrStore.accessPacks.filter((p) => p.qrUrl).length} Total
                    </p>
                </div>
            </div>
        </div>
    </LivingBlueprintHeader>

    <!-- Affirmation Message -->
    <Affirmation module="general" bind:show={showAffirmation} />

    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="qr-codes"
        prompts={[
            "Explain how these QR shortcuts open my signed-in account...",
            "Draft sign-in instructions for my executor using a printed QR code...",
            "Help me explain recipient links to my family...",
            "Where can I keep printed QR codes safe at home?"
        ]}
    />

    <!-- Essential Access Packs -->
    <section class="space-y-8">
        <div class="flex items-center gap-4">
            <div class="w-1 h-8 bg-primary rounded-full"></div>
            <h2
                class="text-2xl font-black text-foreground uppercase tracking-tighter"
            >
                QR Pack Shortcuts
            </h2>
        </div>

        <p class="text-muted-foreground">
            Pack codes open pages in the signed-in account. For your recipient's own start page,
            open Full Directory in Family &amp; Contacts, edit their contact, and create their link.
            <a href="/modules/contacts" class="font-semibold text-primary hover:underline">Set up a recipient's link</a>
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {#each $qrStore.accessPacks as pack}
                {@const Icon = pack.type === "Executor" ? Shield : Users}
                <div
                    class="group relative bg-card rounded-[3rem] border border-border shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row"
                >
                    <div class="p-10 flex-1 space-y-6">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-16 h-16 rounded-2xl flex items-center justify-center {pack.type ===
                                'Executor'
                                    ? 'bg-primary-deep text-white'
                                    : 'bg-primary text-primary-foreground'} shadow-xl"
                            >
                                <Icon
                                    size={32}
                                />
                            </div>
                            <div>
                                <span
                                    class="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                                    >{pack.type} Pack</span
                                >
                                <h3
                                    class="text-2xl font-black text-foreground font-serif"
                                >
                                    {pack.name}
                                </h3>
                            </div>
                        </div>
                        <p class="text-muted-foreground text-lg leading-relaxed">
                            {pack.description}
                        </p>

                        <div class="space-y-2">
                            <p class="text-xs text-muted-foreground">Suggested topics to review</p>
                            <div class="flex flex-wrap gap-2">
                                {#each pack.modules as mod}
                                    <span
                                        class="px-3 py-1 bg-muted text-muted-foreground rounded-full text-[10px] font-black uppercase tracking-wider border border-border"
                                    >
                                        {mod}
                                    </span>
                                {/each}
                            </div>
                        </div>

                        <div class="pt-4 flex items-center gap-4">
                            {#if !pack.qrUrl}
                                <button
                                    onclick={() => generatePack(pack.id)}
                                    class="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                                >
                                    <Sparkles size={18} /> Create QR Code
                                </button>
                            {:else}
                                <button
                                    onclick={() => printPack(pack)}
                                    class="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                                >
                                    <Printer size={18} /> Print for Red Binder
                                </button>
                                <button
                                    onclick={() => generatePack(pack.id)}
                                    class="p-4 bg-muted text-muted-foreground hover:text-foreground rounded-2xl transition-all"
                                    title="Regenerate QR Code"
                                >
                                    <History size={18} />
                                </button>
                            {/if}
                        </div>
                    </div>

                    <div
                        class="md:w-72 bg-muted p-10 flex flex-col items-center justify-center border-l border-border"
                    >
                        {#if pack.qrUrl}
                            <div
                                class="bg-white p-4 rounded-2xl shadow- inner ring-8 ring-muted group-hover:scale-105 transition-transform duration-500"
                            >
                                <img
                                    src={pack.qrUrl}
                                    alt="QR Code"
                                    class="w-40 h-40 object-contain"
                                />
                            </div>
                            <p
                                class="mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest"
                            >
                                Scan to Open
                            </p>
                        {:else}
                            <div
                                class="w-40 h-40 rounded-2xl border-4 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground"
                            >
                                <Smartphone size={32} class="mb-2" />
                                <span
                                    class="text-[10px] font-black uppercase text-center px-4"
                                    >Ready to generate</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- Physical Asset Labels -->
    <section class="space-y-8">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="w-1 h-8 bg-gold rounded-full"></div>
                <h2
                    class="text-2xl font-black text-foreground uppercase tracking-tighter"
                >
                    Physical Asset Labels
                </h2>
            </div>

            <div class="flex items-center gap-4">
                <DataViewToggle module="qr-codes" />
                <div class="relative w-80">
                    <Search
                        class="absolute left-4 top-3 text-muted-foreground"
                        size={18}
                    />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        aria-label="Search labels"
                        placeholder="Search labels..."
                        class="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                    />
                </div>
            </div>
        </div>

        {#if $qrStore.assetLabels.length === 0}
            <div
                class="bg-card border-2 border-dashed border-border p-24 rounded-[3rem] text-center space-y-4"
            >
                <div
                    class="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground"
                >
                    <ScanLine size={40} />
                </div>
                <h3 class="text-xl font-bold text-muted-foreground">
                    Your asset labels will appear here
                </h3>
                <p class="text-muted-foreground max-w-sm mx-auto text-sm">
                    Visit the Heirlooms or Property modules to generate labels
                    for physical items.
                </p>
                <div class="pt-4">
                    <a
                        href="/modules/property"
                        class="inline-flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest hover:underline"
                    >
                        Go to Assets <ArrowRight size={14} />
                    </a>
                </div>
            </div>

            <!-- Sample Assets That Can Get QR Labels -->
            <div class="mt-8">
                <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Assets that could have QR labels</p>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each getSmartSamples($language).heirlooms || [] as sample}
                        <GhostRow
                            name={sample.name}
                            subtitle={`For: ${sample.recipient}`}
                            type="Heirloom"
                            onClick={() => window.location.href = '/modules/heirlooms'}
                        />
                    {/each}
                    {#each getSmartSamples($language).property?.slice(0, 2) || [] as sample}
                        <GhostRow
                            name={sample.name}
                            subtitle={sample.location}
                            type="Property"
                            value={sample.valuation}
                            onClick={() => window.location.href = '/modules/property'}
                        />
                    {/each}
                </div>
            </div>
        {:else}
            {#if viewMode === 'card'}
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {#each filteredAssets as label}
                        <div
                            class="group bg-card p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <div class="flex gap-4 items-start mb-6">
                                <div
                                    class="w-24 h-24 bg-white p-2 rounded-2xl ring-4 ring-muted border border-border flex items-center justify-center overflow-hidden"
                                >
                                    <img
                                        src={label.qrUrl}
                                        alt="QR"
                                        class="w-full h-full object-contain"
                                    />
                                </div>
                                <div class="flex-1">
                                    <div
                                        class="flex items-center justify-between mb-1"
                                    >
                                        <span
                                            class="text-[10px] font-black uppercase tracking-tighter text-primary-hover bg-primary-soft px-2 py-0.5 rounded-full"
                                            >{label.assetType}</span
                                        >
                                        <button aria-label="Remove this item"
                                            onclick={() =>
                                                deleteAssetQR(
                                                    label.assetId,
                                                    label.assetName,
                                                    label.assetType,
                                                )}
                                            class="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <h4
                                        class="font-bold text-foreground leading-tight truncate"
                                    >
                                        {label.assetName}
                                    </h4>
                                    <div
                                        class="mt-2 flex items-center gap-1.5 text-muted-foreground"
                                    >
                                        <Smartphone size={12} />
                                        <span
                                            class="text-[10px] font-medium truncate"
                                            >Deep Link Active</span
                                        >
                                    </div>
                                </div>
                            </div>
                            <button
                                onclick={() => window.print()}
                                class="w-full py-3 bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Printer size={14} /> Print Label
                            </button>
                        </div>
                    {/each}
                </div>
            {:else}
                <!-- Table View -->
                <div class="bg-card rounded-xl border border-border overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-muted border-b border-border">
                            <tr>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">QR</th>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Asset Name</th>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Type</th>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Status</th>
                                <th class="text-right px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                            {#each filteredAssets as label}
                                <tr class="hover:bg-muted transition-colors group">
                                    <td class="px-4 py-3">
                                        <img src={label.qrUrl} alt="QR" class="w-12 h-12 object-contain" />
                                    </td>
                                    <td class="px-4 py-3 font-medium text-foreground">{label.assetName}</td>
                                    <td class="px-4 py-3">
                                        <span class="text-xs font-bold px-2 py-1 bg-primary-soft text-primary-hover rounded">
                                            {label.assetType}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-muted-foreground text-sm">Deep Link Active</td>
                                    <td class="px-4 py-3 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <button
                                                onclick={() => window.print()}
                                                class="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                                title="Print"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button aria-label="Remove this item"
                                                onclick={() => deleteAssetQR(label.assetId, label.assetName, label.assetType)}
                                                class="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        {/if}
    </section>

    <!-- Visual Guide Section -->
    <section
        class="bg-slate-900 rounded-[4rem] p-12 text-white overflow-hidden relative"
    >
        <div
            class="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-[12rem] opacity-20 -mr-48 -mt-48"
        ></div>
        <div
            class="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
            <div class="space-y-8">
                <div>
                    <span
                        class="px-4 py-1.5 bg-primary rounded-full text-[10px] font-black uppercase tracking-widest text-primary-foreground mb-6 inline-block"
                        >Best Practices</span
                    >
                    <h2 class="text-4xl font-black font-serif leading-tight text-white">
                        Using Your <span
                            class="italic font-light text-primary-on-dark"
                            >Printed Codes</span
                        >
                    </h2>
                </div>

                <div class="space-y-6">
                    <div class="flex gap-4">
                        <div
                            class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"
                        >
                            <Smartphone size={24} class="text-primary-on-dark" />
                        </div>
                        <div>
                            <h4 class="font-bold text-xl mb-1 text-white">
                                Testing is Key
                            </h4>
                            <p class="text-slate-400">
                                Always scan your printed labels with your phone
                                before applying them to ensure the link works as
                                intended.
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-4">
                        <div
                            class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"
                        >
                            <Shield size={24} class="text-primary-on-dark" />
                        </div>
                        <div>
                            <h4 class="font-bold text-xl mb-1 text-white">Sign-in and sharing</h4>
                            <p class="text-slate-400">
                                Each pack opens a page in the signed-in account.
                                Create a recipient's link in Family &amp; Contacts
                                for the page you want to share.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div
                    class="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm space-y-4"
                >
                    <div
                        class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary-on-dark"
                    >
                        <CircleCheck size={20} />
                    </div>
                    <p
                        class="text-xs font-medium text-slate-300 italic leading-relaxed"
                    >
                        Keep the Family Essentials Pack with your printed notes
                        as a shortcut to Dashboard after sign-in.
                    </p>
                    <p
                        class="text-[10px] font-black uppercase tracking-widest text-slate-300"
                    >
                        Printed shortcut
                    </p>
                </div>
                <div
                    class="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm mt-8 space-y-4"
                >
                    <div
                        class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary-on-dark"
                    >
                        <LayoutGrid size={20} />
                    </div>
                    <p
                        class="text-xs font-medium text-slate-300 italic leading-relaxed"
                    >
                        Keep the Executor Master Pack with your Red Binder
                        as a shortcut to the executor guide after sign-in.
                    </p>
                    <p
                        class="text-[10px] font-black uppercase tracking-widest text-slate-300"
                    >
                        Printed shortcut
                    </p>
                </div>
            </div>
        </div>
    </section>
</div>
{/if}

<!-- Print Styles -->
<style>
    @media print {
        :global(body nav, body aside, body header, .print\:hidden) {
            display: none !important;
        }

        :global(body) {
            background: white !important;
        }

        .p-8 {
            padding: 0 !important;
        }
    }
</style>
