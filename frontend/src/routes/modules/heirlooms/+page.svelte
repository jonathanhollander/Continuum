<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import {
        Gift,
        Heart,
        Plus,
        Search,
        X,
        QrCode,
        Sparkles,
        Download,
        Share2,
        Loader2,
    } from "lucide-svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import HeirloomCard from "$lib/components/modules/heirlooms/HeirloomCard.svelte";
    import VisionUploader from "$lib/components/modules/heirlooms/VisionUploader.svelte";
    import type { AnalyzedHeirloom } from "$lib/services/visionService";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import { onMount } from "svelte";
    import {
        heirloomSync,
        type Heirloom,
    } from "$lib/stores/heirloomStore.svelte";
    import { qrStore } from "$lib/stores/qrStore";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import EvidenceGalleryUploader from "$lib/components/ui/EvidenceGalleryUploader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { REFLECTION_POOLS } from "$lib/data/reflectionPools";
    import { language } from "$lib/stores/localization";
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    let showAddModal = $state(false);
    let viewMode = $state<ViewMode>('card');
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let showAffirmation = $state(false);
    let isEditing = $state(false);
    let selectedImage = $state<string | null>(null);
    let showWizard = $state(false);
    let isLoading = $state(true);

    let newHeirloom: Partial<Heirloom> = $state({
        name: "",
        recipient: "",
        story: "",
        image: "",
    });

    // Derived items from SyncManager
    let items = $derived(heirloomSync.items);

    const wizardSteps = [
        {
            id: "intro",
            question: "wizard.heirloom_start",
            type: "boolean" as const,
            logic: { yes: "watch", no: "cancel", next: "watch" },
        },
        {
            id: "watch",
            question: "wizard.heirloom_watch",
            type: "boolean" as const,
            logic: { next: "jewelry" },
        },
        {
            id: "jewelry",
            question: "wizard.heirloom_jewelry",
            type: "boolean" as const, // Fixed type
            logic: { next: "furniture" },
        },
        {
            id: "furniture",
            question: "wizard.heirloom_furniture",
            type: "boolean" as const,
        },
    ];

    function handleWizardComplete(event: CustomEvent) {
        const answers = event.detail;
        if (answers.intro === false) {
            showWizard = false;
            return;
        }

        if (answers.watch) addWizardItem("Vintage Watch", "Grandson");
        if (answers.jewelry)
            addWizardItem("Wedding Ring", "Spouse / Eldest Child");
        if (answers.furniture) addWizardItem("Antique Desk", "Home Office");

        showWizard = false;
    }

    function addWizardItem(name: string, recipient: string) {
        heirloomSync.create({
            name,
            recipient,
            story: "Family heirloom passed down...",
            image: "",
        });
    }

    onMount(async () => {
        // Migration: Fix broken/legacy Unsplash URLs in existing data
        await heirloomSync.update((items) => {
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
        isLoading = false;
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

    let showAddForm = $state(false);

    function addHeirloom() {
        if (!newHeirloom.name) return;

        heirloomSync.create({
            name: newHeirloom.name || "Unknown Treasure",
            recipient: newHeirloom.recipient || "Undecided",
            story: newHeirloom.story || "",
            image:
                newHeirloom.image ||
                getsuggestedImage(
                    newHeirloom.name || "",
                    newHeirloom.story || "",
                ),
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        });

        showAddForm = false;
        showAffirmation = true;
        newHeirloom = {
            image: "",
        };
        parsedCustomAttributes = {};
    }

    function removeHeirloom(id: string) {
        if (
            !confirm(
                "Remove this heirloom? Your story will be preserved in the activity log.",
            )
        )
            return;
        heirloomSync.delete(id);
    }

    // QR Logic
    let showQrModal = $state(false);
    let qrTarget: Heirloom | null = $state(null);
    let qrUrl = $state("");

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
    }

    function printLabel() {
        window.print();
    }
</script>

{#if showWizard}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        transition:fade
    >
        <div class="w-full max-w-2xl relative" in:fly={{ y: 20 }}>
            <button
                class="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
                onclick={() => (showWizard = false)}>Not right now</button
            >
            <ConciergeFlow
                steps={wizardSteps}
                on:complete={handleWizardComplete}
            />
        </div>
    </div>
{/if}

<LivingBlueprintHeader
    title="Heirlooms & Treasures"
    subtitle="Objects carry stories that deserve to be told"
    tier="legacy"
    detailedDescription="When you document the history and meaning behind your treasured possessions, you're ensuring these stories survive—transforming objects into heirlooms that connect generations."
    whyMatters="Objects without stories become 'stuff' that gets donated or thrown away. That watch your grandfather wore every day? Without its story documented, it loses its meaning. You're preserving the emotional value that makes these items irreplaceable."
>
    <div class="flex items-center gap-3">
        <DataViewToggle module="heirlooms" onchange={(mode) => viewMode = mode} />
        <button
            onclick={() => (showWizard = true)}
            class="px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
        >
            <Sparkles size={18} />
            Start Concierge
        </button>
        <button
            class="bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all font-bold px-6 py-2 rounded-xl"
            onclick={() => (showAddForm = true)}
        >
            <Plus size={20} /> Share a story or object
        </button>
    </div>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Affirmation Message -->
    <Affirmation module="heirlooms" bind:show={showAffirmation} />

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
    </div>

    <!-- Grid -->
    {#if items.length === 0}
        <EmptyState
            title="Your treasures deserve their stories"
            whyMatters="<strong>Objects without stories become 'stuff' that gets donated or thrown away.</strong> That watch your grandfather wore every day? Your wedding dress? The painting your mother loved? Without their stories documented, they lose their meaning.<br/><br/>When you catalog heirlooms here, you're not just making a list—you're preserving the emotional value that makes these items irreplaceable. You're ensuring their stories survive even when you can't tell them anymore."
            encouragement="Start with one meaningful object. Take a photo, write why it matters. The rest will follow naturally."
            icon={Gift}
            iconClass="text-amber-500"
            ctaLabel="Preserve your first treasure"
            onAction={() => (showAddForm = true)}
        />
        <!-- Hidden Ghost Rows for reference -->
        <div
            class="hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            {#each getSmartSamples($language).heirlooms || [] as sample}
                <GhostRow
                    name={sample.name}
                    subtitle={`${sample.story}. For: ${sample.recipient}`}
                    type="Heirloom"
                    onClick={() => {
                        newHeirloom = {
                            ...newHeirloom,
                            name: sample.name,
                            story: sample.story,
                            recipient: sample.recipient,
                        };
                        showAddForm = true;
                    }}
                >
                    <svelte:fragment slot="icon">
                        <Gift size={20} class="text-slate-400" />
                    </svelte:fragment>
                </GhostRow>
            {/each}
        </div>
    {:else}
        {#if viewMode === 'card'}
            <!-- Card Grid -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {#each items as heirloom (heirloom.id)}
                    <div in:fade={{ duration: 400 }} class="relative group">
                        <HeirloomCard
                            {heirloom}
                            onPrintQr={() => openQrModal(heirloom)}
                        />
                        <button
                            onclick={() => removeHeirloom(heirloom.id)}
                            class="absolute top-2 right-2 p-2 bg-white/90 text-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10"
                            title="Remove"
                        >
                            <X size={16} />
                        </button>
                    </div>
                {/each}

                <!-- Add New Placeholder -->
                <button
                    class="border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 hover:border-[#4A7C74] hover:text-[#4A7C74] hover:bg-[#4A7C74]/5 transition-all min-h-[350px] group"
                    onclick={() => (showAddForm = true)}
                >
                    <div
                        class="w-16 h-16 rounded-full bg-stone-100 group-hover:bg-[#4A7C74]/10 flex items-center justify-center mb-4 transition-colors"
                    >
                        <Plus size={32} />
                    </div>
                    <span class="font-bold">Catalog a New Treasure</span>
                </button>
            </div>
        {:else}
            <!-- Table View -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Item</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Recipient</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Story</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each items as heirloom (heirloom.id)}
                            <tr class="hover:bg-slate-50 transition-colors group">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        {#if heirloom.image}
                                            <img src={heirloom.image} alt={heirloom.name} class="w-10 h-10 rounded-lg object-cover" />
                                        {:else}
                                            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                                                <Gift size={18} />
                                            </div>
                                        {/if}
                                        <span class="font-medium text-slate-800">{heirloom.name}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-600">{heirloom.recipient || '-'}</td>
                                <td class="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{heirloom.story || '-'}</td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onclick={() => openQrModal(heirloom)}
                                            class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                            title="Generate QR"
                                        >
                                            <QrCode size={14} />
                                        </button>
                                        <button
                                            onclick={() => removeHeirloom(heirloom.id)}
                                            class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
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
                            onclick={() => (showQrModal = false)}
                            class="px-5 py-2 rounded-xl font-bold text-stone-500 hover:bg-stone-100"
                        >
                            Go back
                        </button>
                        <button
                            onclick={printLabel}
                            class="px-5 py-2 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <QrCode size={18} /> Print Label
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Add Form Modal -->
    <Modal
        bind:open={showAddForm}
        title="Preserve a Treasure"
        description="This object holds a story that only you can tell. By documenting it here, you're ensuring that story survives—transforming an object into an heirloom that connects generations."
        maxWidth="max-w-lg"
    >
        <div class="space-y-4">
            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >What Is It?</label
                >
                <input
                    type="text"
                    bind:value={newHeirloom.name}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Grandma's wedding ring"
                />
            </div>

            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >Who Should Have This?</label
                >
                <input
                    type="text"
                    bind:value={newHeirloom.recipient}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="The person who will cherish it"
                />
                <p class="text-xs text-slate-400 mt-1.5">
                    Think about who would treasure this item and honor
                    its meaning.
                </p>
            </div>

            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >The Story Behind It</label
                >
                <textarea
                    bind:value={newHeirloom.story}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-32"
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
                            class="block text-xs font-bold uppercase text-slate-500 mb-1"
                            >Or paste a URL</label
                        >
                        <input
                            type="text"
                            bind:value={newHeirloom.image}
                            class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                            placeholder="https://..."
                        />
                    </div>
                {/if}
            </div>

            <!-- Custom Fields -->
            <div class="pt-4 mt-4 border-t border-slate-100">
                <CustomFieldsManager
                    entityType="heirloom"
                    bind:data={parsedCustomAttributes}
                />
            </div>
        </div>

        <!-- Footer buttons -->
        <div class="-mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-6">
            <button
                onclick={() => (showAddForm = false)}
                class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >Not right now</button
            >
            <button
                onclick={addHeirloom}
                disabled={!newHeirloom.name}
                class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
                {isEditing
                    ? "Save these details"
                    : "Record this treasure"}
            </button>
        </div>
    </Modal>
</div>
{/if}
