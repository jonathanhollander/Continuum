<script lang="ts">
    import { fade } from "svelte/transition";
    import { Gift, Heart, Plus, Search, X, QrCode } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import HeirloomCard from "$lib/components/modules/heirlooms/HeirloomCard.svelte";
    import VisionUploader from "$lib/components/modules/heirlooms/VisionUploader.svelte";
    import type { AnalyzedHeirloom } from "$lib/services/visionService";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import { onMount } from "svelte";
    import { qrStore } from "$lib/stores/qrStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { estateProfile } from "$lib/stores/estateStore";
    import { goto } from "$app/navigation";
    import { heirloomStore, type Heirloom } from "$lib/stores/heirloomStore";
    import { REFLECTION_POOLS } from "$lib/data/reflectionPools";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT

    onMount(() => {
        // Migration: Fix broken/legacy Unsplash URLs in existing data
        heirloomStore.update((items) => {
            let hasChanges = false;
            const updated = items.map((item) => {
                if (item.image && item.image.includes("unsplash.com")) {
                    hasChanges = true;
                    return {
                        ...item,
                        image: getsuggestedImage(
                            item.name || "",
                            item.story || "",
                        ),
                    };
                }
                return item;
            });
            return hasChanges ? updated : items;
        });
    });

    function handleAnalysis(event: CustomEvent<AnalyzedHeirloom>) {
        const analysis = event.detail;
        newHeirloom.name = analysis.name;
        newHeirloom.story = analysis.description;
        // In a real app, the image would be uploaded to storage.
        // For this demo, if the analysis returns a mock, usage of a placeholder or the blob URL is fine.
        if (!newHeirloom.image || newHeirloom.image.startsWith("blob:")) {
            // Keep the blob if it exists.
        }
    }

    // Default placeholder images for items without photos
    // Default placeholder images mapped to keywords
    const HEIRLOOM_THEMES = [
        {
            keywords: [
                "watch",
                "clock",
                "timepiece",
                "rolex",
                "omega",
                "pocket watch",
            ],
            url: "/images/heirlooms/heirloom_watch_placeholder_1767552136426.png", // Vintage Watch
        },
        {
            keywords: [
                "book",
                "bible",
                "journal",
                "diary",
                "letter",
                "paper",
                "document",
            ],
            url: "/images/heirlooms/heirloom_books_placeholder_1767552150155.png", // Old Books
        },
        {
            keywords: [
                "ring",
                "necklace",
                "gold",
                "silver",
                "jewelry",
                "locket",
                "diamond",
                "pendant",
                "bracelet",
            ],
            url: "/images/heirlooms/heirloom_jewelry_placeholder_1767552162926.png", // Gold Locket
        },
        {
            keywords: [
                "camera",
                "photo",
                "leica",
                "canon",
                "nikon",
                "lens",
                "film",
            ],
            url: "/images/heirlooms/heirloom_camera_placeholder_1767552182401.png", // Vintage Camera
        },
        {
            keywords: [
                "vase",
                "ceramic",
                "bowl",
                "plate",
                "china",
                "porcelain",
                "dish",
                "pottery",
            ],
            url: "/images/heirlooms/heirloom_vase_placeholder_retry_1767552227926.png", // Antique Vase
        },
        {
            keywords: ["tool", "hammer", "wrench", "saw", "knife", "blade"],
            url: "/images/heirlooms/heirloom_tools_placeholder_1767552195001.png", // Vintage Tools
        },
        {
            keywords: ["music", "guitar", "violin", "piano", "instrument"],
            url: "/images/heirlooms/heirloom_instrument_placeholder_1767552207664.png", // Instrument
        },
    ];

    function getsuggestedImage(name: string, story: string) {
        const searchText = (name + " " + story).toLowerCase();

        // 1. Try to find a thematic match
        const match = HEIRLOOM_THEMES.find((theme) =>
            theme.keywords.some((k) => searchText.includes(k)),
        );

        if (match) return match.url;

        // 2. Fallback to random if no keyword match
        return HEIRLOOM_THEMES[
            Math.floor(Math.random() * HEIRLOOM_THEMES.length)
        ].url;
    }

    let showAddForm = false;

    let newHeirloom: Partial<Heirloom> = {
        image: "", // Default to empty to show upload state
    };

    function addHeirloom() {
        if (!newHeirloom.name) return;

        heirloomStore.update((items) => [
            {
                id: crypto.randomUUID(),
                name: newHeirloom.name || "Unknown Treasure",
                recipient: newHeirloom.recipient || "Undecided",
                story: newHeirloom.story || "",
                image:
                    newHeirloom.image ||
                    getsuggestedImage(
                        newHeirloom.name || "",
                        newHeirloom.story || "",
                    ),
            } as Heirloom,
            ...items,
        ]);
        showAddForm = false;
        newHeirloom = {
            image: "",
        };
    }

    function removeHeirloom(id: string) {
        if (!confirm("Remove this heirloom from the registry?")) return;
        heirloomStore.update((items) => items.filter((h) => h.id !== id));
    }

    // QR Logic
    let showQrModal = false;
    let qrTarget: Heirloom | null = null;
    let qrUrl = "";

    function openQrModal(item: Heirloom) {
        qrTarget = item;
        showQrModal = true;

        // Generate URL for display
        const deepLink = `${window.location.origin}/modules/heirlooms?id=${item.id}`;
        qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deepLink)}`;

        qrStore.generateAssetQR({
            id: crypto.randomUUID(),
            assetId: item.id,
            assetName: item.name,
            assetType: "Heirloom",
            location: "Registry",
        });

        activityLog.logEvent({
            module: "Heirlooms",
            action: "CREATE",
            entityType: "QR Label",
            entityId: item.id,
            entityName: item.name,
            userContext: $estateProfile.ownerName || "User",
        });

        // alert("QR Label generated! Redirecting to QR Access Center...");
        // goto("/modules/qr-codes");
    }

    function printLabel() {
        window.print();
    }
</script>

<div class="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Hero / Header -->
    <div class="text-center mb-12">
        <div
            class="inline-flex items-center justify-center p-4 bg-amber-100 text-amber-800 rounded-full mb-6"
        >
            <Gift size={48} />
        </div>
        <h1 class="font-serif font-bold text-4xl text-[#304743] mb-4">
            Heirloom Stories
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            Objects carry stories. Document the history and meaning behind your
            most treasured possessions so they remain more than just "things."
        </p>
    </div>

    <!-- AI Prompt Injection -->
    <div class="max-w-3xl mx-auto mb-12">
        <AIPromptBar
            context="heirlooms"
            promptPool={REFLECTION_POOLS.heirlooms.story}
        />
    </div>

    <!-- Controls -->
    <div
        class="flex flex-col md:flex-row gap-4 justify-between items-center mb-8"
    >
        <div class="relative w-full md:w-96">
            <Search
                size={18}
                class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
                type="text"
                placeholder="Search by item, story, or recipient..."
                class="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-[#4A7C74] focus:ring-0 shadow-sm"
            />
        </div>
        <button
            class="bg-[#304743] leading-none text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:bg-[#20302d] transition-all"
            on:click={() => (showAddForm = true)}
        >
            <Plus size={20} /> Add Heirloom
        </button>
    </div>

    <!-- Grid -->
    {#if $heirloomStore.length === 0}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            <GhostRow type="Heirloom" onClick={() => (showAddForm = true)} />
            <GhostRow type="Heirloom" onClick={() => (showAddForm = true)} />
            <GhostRow type="Heirloom" onClick={() => (showAddForm = true)} />

            <button
                class="border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 hover:border-[#4A7C74] hover:text-[#4A7C74] hover:bg-[#4A7C74]/5 transition-all h-[88px] group"
                on:click={() => (showAddForm = true)}
            >
                <div class="flex items-center gap-2">
                    <Plus size={20} />
                    <span class="font-bold">Catalog New</span>
                </div>
            </button>
        </div>
        <div class="flex justify-center mt-6">
            <button
                on:click={() => (showAddForm = true)}
                class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
                <Gift size={14} /> Start Heirloom Registry
            </button>
        </div>
    {:else}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            {#each $heirloomStore as heirloom (heirloom.id)}
                <div in:fade={{ duration: 400 }} class="relative group">
                    <HeirloomCard
                        {heirloom}
                        onPrintQr={() => openQrModal(heirloom)}
                    />
                    <button
                        on:click={() => removeHeirloom(heirloom.id)}
                        class="absolute top-2 right-2 p-2 bg-white/90 text-rose-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50"
                        title="Remove"
                    >
                        <X size={16} />
                    </button>
                </div>
            {/each}

            <!-- Add New Placeholder -->
            <button
                class="border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 hover:border-[#4A7C74] hover:text-[#4A7C74] hover:bg-[#4A7C74]/5 transition-all min-h-[350px] group"
                on:click={() => (showAddForm = true)}
            >
                <div
                    class="w-16 h-16 rounded-full bg-stone-100 group-hover:bg-[#4A7C74]/10 flex items-center justify-center mb-4 transition-colors"
                >
                    <Plus size={32} />
                </div>
                <span class="font-bold">Catalog a New Treasure</span>
            </button>
        </div>
    {/if}

    <!-- QR / Label Modal -->
    {#if showQrModal && qrTarget}
        <div
            class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0"
        >
            <div
                class="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden print:shadow-none print:w-full print:max-w-none"
            >
                <div class="p-8 text-center print:text-left print:p-0">
                    <div class="mb-4 print:hidden">
                        <span
                            class="text-xs font-bold uppercase tracking-widest text-[#4A7C74] rounded-full bg-[#4A7C74]/10 px-3 py-1"
                        >
                            Printable Label
                        </span>
                    </div>

                    <!-- Printable Area -->
                    <div
                        class="border-2 border-dashed border-stone-300 rounded-xl p-6 bg-stone-50 print:border-4 print:border-black print:bg-white print:rounded-none"
                    >
                        <h2
                            class="font-serif font-bold text-2xl text-slate-900 mb-1"
                        >
                            {qrTarget.name}
                        </h2>
                        <p
                            class="text-xs text-stone-500 uppercase tracking-wide font-bold mb-4"
                        >
                            For {qrTarget.recipient}
                        </p>

                        <div
                            class="bg-white p-2 rounded-lg inline-block shadow-sm mb-4 print:shadow-none"
                        >
                            <img
                                src={qrUrl}
                                alt="QR Code"
                                class="w-48 h-48 mx-auto"
                            />
                        </div>

                        <p class="text-xs text-stone-400 font-mono">
                            ID: {qrTarget.id.split("-")[0]} // Scan to view story
                        </p>
                    </div>

                    <!-- Actions -->
                    <div class="mt-8 flex gap-3 justify-center print:hidden">
                        <button
                            on:click={() => (showQrModal = false)}
                            class="px-5 py-2 rounded-xl font-bold text-stone-500 hover:bg-stone-100"
                        >
                            Close
                        </button>
                        <button
                            on:click={printLabel}
                            class="px-5 py-2 rounded-xl font-bold bg-[#304743] text-white hover:bg-[#20302d] flex items-center gap-2"
                        >
                            <QrCode size={18} /> Print Label
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Add Form Modal -->
    {#if showAddForm}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
            <div
                class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                <div
                    class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50"
                >
                    <h3 class="font-serif font-bold text-2xl text-slate-800">
                        Add Heirloom
                    </h3>
                    <button
                        on:click={() => (showAddForm = false)}
                        class="text-gray-400 hover:text-gray-600">Close</button
                    >
                </div>

                <div class="p-6 space-y-4">
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Item Name</label
                        >
                        <input
                            type="text"
                            bind:value={newHeirloom.name}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="e.g. Grandma's Ring"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Intended Recipient</label
                        >
                        <input
                            type="text"
                            bind:value={newHeirloom.recipient}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="Who should have this?"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >The Story</label
                        >
                        <textarea
                            bind:value={newHeirloom.story}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 h-32"
                            placeholder="Why is this meaningful? Where did it come from?"
                        ></textarea>
                    </div>

                    <div>
                        <VisionUploader
                            imageUrl={newHeirloom.image || ""}
                            on:analyze={handleAnalysis}
                        />
                        {#if !newHeirloom.image}
                            <div class="mt-2 text-center">
                                <span class="text-xs text-stone-400">or</span>
                            </div>
                            <div class="mt-2">
                                <label
                                    class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                    >Or paste a URL</label
                                >
                                <input
                                    type="text"
                                    bind:value={newHeirloom.image}
                                    class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                                    placeholder="https://..."
                                />
                                <!-- (QR Label Modal moved to top level) -->
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="p-6 bg-gray-50 flex justify-end gap-3">
                    <button
                        on:click={() => (showAddForm = false)}
                        class="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200"
                        >Cancel</button
                    >
                    <button
                        on:click={addHeirloom}
                        disabled={!newHeirloom.name}
                        class="px-6 py-2 rounded-xl font-bold bg-[#304743] text-white hover:bg-[#20302d] disabled:opacity-50"
                        >Save Item</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>
