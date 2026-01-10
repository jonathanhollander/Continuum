<script lang="ts">
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
    } from "lucide-svelte";
    import {
        qrStore,
        type AccessPack,
        type AssetLabel,
    } from "$lib/stores/qrStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { estateProfile } from "$lib/stores/estateStore";
    import { onMount } from "svelte";

    let selectedPack: AccessPack | null = null;
    let showGenerateModal = false;
    let searchQuery = "";

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

    function deleteAssetQR(id: string, name: string) {
        if (!confirm(`Remove QR label for "${name}"?`)) return;
        qrStore.removeAssetQR(id);

        activityLog.logEvent({
            module: "QR Center",
            action: "DELETE",
            entityType: "Asset Label",
            entityId: id,
            entityName: name,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    $: filteredAssets = $qrStore.assetLabels.filter(
        (a) =>
            a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.assetType.toLowerCase().includes(searchQuery.toLowerCase()),
    );
</script>

<div
    class="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700"
>
    <!-- Header Section -->
    <header
        class="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-4"
    >
        <div class="space-y-4">
            <nav
                class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4A7C74]"
            >
                <QrCode size={14} />
                <span>Concierge v4.0</span>
                <ChevronRight size={12} />
                <span class="text-slate-900">QR Access Center</span>
            </nav>
            <div>
                <h1
                    class="text-5xl font-black text-slate-900 tracking-tight mb-3 font-serif"
                >
                    QR Access <span class="text-[#4A7C74] font-light italic"
                        >Center</span
                    >
                </h1>
                <p class="text-slate-500 max-w-3xl text-xl leading-relaxed">
                    Bridge the gap between physical reality and digital security
                    with encrypted access keys and asset labels.
                </p>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <div
                class="bg-[#FDFBF7] border border-stone-200 p-4 rounded-3xl flex items-center gap-6 shadow-sm"
            >
                <div
                    class="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400"
                >
                    <History size={24} />
                </div>
                <div>
                    <p
                        class="text-[10px] font-black uppercase tracking-widest text-stone-400"
                    >
                        Active Keys
                    </p>
                    <p class="text-sm font-bold text-slate-700">
                        {$qrStore.assetLabels.length +
                            $qrStore.accessPacks.filter((p) => p.qrUrl).length} Total
                    </p>
                </div>
            </div>
        </div>
    </header>

    <!-- Essential Access Packs -->
    <section class="space-y-8">
        <div class="flex items-center gap-4">
            <div class="w-1 h-8 bg-[#4A7C74] rounded-full"></div>
            <h2
                class="text-2xl font-black text-slate-900 uppercase tracking-tighter"
            >
                Digital Access Keys
            </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {#each $qrStore.accessPacks as pack}
                <div
                    class="group relative bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row"
                >
                    <div class="p-10 flex-1 space-y-6">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-16 h-16 rounded-2xl flex items-center justify-center {pack.type ===
                                'Executor'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-[#4A7C74] text-white'} shadow-xl"
                            >
                                <svelte:component
                                    this={pack.type === "Executor"
                                        ? Shield
                                        : Users}
                                    size={32}
                                />
                            </div>
                            <div>
                                <span
                                    class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                                    >{pack.type} Access Pack</span
                                >
                                <h3
                                    class="text-2xl font-black text-slate-900 font-serif"
                                >
                                    {pack.name}
                                </h3>
                            </div>
                        </div>
                        <p class="text-slate-500 text-lg leading-relaxed">
                            {pack.description}
                        </p>

                        <div class="flex flex-wrap gap-2">
                            {#each pack.modules as mod}
                                <span
                                    class="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-100"
                                >
                                    {mod}
                                </span>
                            {/each}
                        </div>

                        <div class="pt-4 flex items-center gap-4">
                            {#if !pack.qrUrl}
                                <button
                                    on:click={() => generatePack(pack.id)}
                                    class="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
                                >
                                    <Sparkles size={18} /> Generate Secure Key
                                </button>
                            {:else}
                                <button
                                    on:click={() => printPack(pack)}
                                    class="px-8 py-4 bg-[#4A7C74] text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-[#4A7C74]/20"
                                >
                                    <Printer size={18} /> Print for Red Binder
                                </button>
                                <button
                                    on:click={() => generatePack(pack.id)}
                                    class="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                                    title="Regenerate Key"
                                >
                                    <History size={18} />
                                </button>
                            {/if}
                        </div>
                    </div>

                    <div
                        class="md:w-72 bg-slate-50 p-10 flex flex-col items-center justify-center border-l border-slate-100"
                    >
                        {#if pack.qrUrl}
                            <div
                                class="bg-white p-4 rounded-3xl shadow- inner ring-8 ring-slate-100 group-hover:scale-105 transition-transform duration-500"
                            >
                                <img
                                    src={pack.qrUrl}
                                    alt="QR Code"
                                    class="w-40 h-40 object-contain"
                                />
                            </div>
                            <p
                                class="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                            >
                                Scan to Preview
                            </p>
                        {:else}
                            <div
                                class="w-40 h-40 rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300"
                            >
                                <Smartphone size={32} class="mb-2 opacity-20" />
                                <span
                                    class="text-[10px] font-black uppercase text-center px-4"
                                    >Key Not Yet Generated</span
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
                <div class="w-1 h-8 bg-amber-500 rounded-full"></div>
                <h2
                    class="text-2xl font-black text-slate-900 uppercase tracking-tighter"
                >
                    Physical Asset Labels
                </h2>
            </div>

            <div class="relative w-80">
                <Search
                    class="absolute left-4 top-3 text-slate-400"
                    size={18}
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search labels..."
                    class="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all shadow-sm"
                />
            </div>
        </div>

        {#if $qrStore.assetLabels.length === 0}
            <div
                class="bg-white border-2 border-dashed border-slate-200 p-24 rounded-[3rem] text-center space-y-4"
            >
                <div
                    class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300"
                >
                    <ScanLine size={40} />
                </div>
                <h3 class="text-xl font-bold text-slate-400">
                    No Asset Labels Generated
                </h3>
                <p class="text-slate-400 max-w-sm mx-auto text-sm">
                    Visit the Heirlooms or Property modules to generate labels
                    for physical items.
                </p>
                <div class="pt-4">
                    <a
                        href="/modules/property"
                        class="inline-flex items-center gap-2 text-[#4A7C74] font-black uppercase text-xs tracking-widest hover:underline"
                    >
                        Go to Assets <ArrowRight size={14} />
                    </a>
                </div>
            </div>
        {:else}
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {#each filteredAssets as label}
                    <div
                        class="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                        <div class="flex gap-4 items-start mb-6">
                            <div
                                class="w-24 h-24 bg-slate-50 p-2 rounded-2xl ring-4 ring-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden"
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
                                        class="text-[10px] font-black uppercase tracking-tighter text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"
                                        >{label.assetType}</span
                                    >
                                    <button
                                        on:click={() =>
                                            deleteAssetQR(
                                                label.assetId,
                                                label.assetName,
                                            )}
                                        class="text-slate-200 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <h4
                                    class="font-bold text-slate-900 leading-tight truncate"
                                >
                                    {label.assetName}
                                </h4>
                                <div
                                    class="mt-2 flex items-center gap-1.5 text-slate-400"
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
                            on:click={() => window.print()}
                            class="w-full py-3 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Printer size={14} /> Print Label
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <!-- Visual Guide Section -->
    <section
        class="bg-slate-900 rounded-[4rem] p-12 text-white overflow-hidden relative"
    >
        <div
            class="absolute top-0 right-0 w-96 h-96 bg-[#4A7C74] rounded-full blur-[12rem] opacity-20 -mr-48 -mt-48"
        ></div>
        <div
            class="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
            <div class="space-y-8">
                <div>
                    <span
                        class="px-4 py-1.5 bg-[#4A7C74] rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-6 inline-block"
                        >Best Practices</span
                    >
                    <h2 class="text-4xl font-black font-serif leading-tight">
                        Securing Your <span
                            class="italic font-light text-[#4A7C74]"
                            >Physical Legacy</span
                        >
                    </h2>
                </div>

                <div class="space-y-6">
                    <div class="flex gap-4">
                        <div
                            class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"
                        >
                            <Smartphone size={24} class="text-[#4A7C74]" />
                        </div>
                        <div>
                            <h4 class="font-bold text-xl mb-1">
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
                            <Shield size={24} class="text-[#4A7C74]" />
                        </div>
                        <div>
                            <h4 class="font-bold text-xl mb-1">Gated Access</h4>
                            <p class="text-slate-400">
                                The "Family Essentials" pack is designed for
                                convenience, while the "Executor Master" pack
                                granted access to sensitive data.
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
                        class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#4A7C74]"
                    >
                        <CircleCheck size={20} />
                    </div>
                    <p
                        class="text-xs font-medium text-slate-300 italic leading-relaxed"
                    >
                        "QR labels allow my children to know the story of my
                        heirlooms just by scanning them."
                    </p>
                    <p
                        class="text-[10px] font-black uppercase tracking-widest text-[#4A7C74]"
                    >
                        — User Feedback
                    </p>
                </div>
                <div
                    class="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm mt-8 space-y-4"
                >
                    <div
                        class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#4A7C74]"
                    >
                        <LayoutGrid size={20} />
                    </div>
                    <p
                        class="text-xs font-medium text-slate-300 italic leading-relaxed"
                    >
                        "One QR code at the front of the Red Binder changed
                        everything for our executor."
                    </p>
                    <p
                        class="text-[10px] font-black uppercase tracking-widest text-[#4A7C74]"
                    >
                        — User Feedback
                    </p>
                </div>
            </div>
        </div>
    </section>
</div>

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

    :global(.animate-in) {
        animation: fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
