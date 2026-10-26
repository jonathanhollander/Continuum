<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { focusTrap } from "$lib/actions/focusTrap";
    import { readCustom } from "$lib/utils/customFields";
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
        Pencil,
    } from "lucide-svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import HeirloomCard from "$lib/components/modules/heirlooms/HeirloomCard.svelte";
    import VisionUploader from "$lib/components/modules/heirlooms/VisionUploader.svelte";
    import HeirloomImage from "$lib/components/modules/heirlooms/HeirloomImage.svelte";
    import { mediaIdFromRef } from "$lib/services/mediaService";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { onMount, tick } from "svelte";
    import {
        heirloomSync,
        heirloomStore,
        type Heirloom,
    } from "$lib/stores/heirloomStore.svelte";
    import { qrStore, assetQrImage } from "$lib/stores/qrStore";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
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
    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('heirlooms'));
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isEditing = $state(false);
    let editingId = $state<string | number | null>(null);
    let showWizard = $state(false);
    let isLoading = $state(true);

    let newHeirloom: Partial<Heirloom> = $state({
        name: "",
        recipient: "",
        story: "",
        image: "",
        ownershipDetails: "",
    });

    // Derived items from SyncManager
    let items = $derived(heirloomSync.items);

    // People from Contacts; choosing one fills "Who Should Have This?" with their name.
    let contacts = $derived(contactSync.items);
    let recipientContactId = $state("");
    function chooseRecipient(id: string) {
        const person = contacts.find((c) => String(c.id) === id);
        if (person) newHeirloom.recipient = person.name;
    }

    // A scanned label opens /modules/heirlooms?id=N: that story is opened and brought into view.
    let focusId = $state<string | null>(null);

    // The search box narrows the list by item, story or recipient; empty shows all.
    let searchQuery = $state("");
    let filteredItems = $derived.by(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return items;
        return items.filter((h) =>
            [h.name, h.story, h.recipient].some((v) =>
                String(v ?? "").toLowerCase().includes(q),
            ),
        );
    });

    const wizardSteps = [
        {
            id: "intro",
            question: "wizard.heirloom_start",
            type: "boolean" as const,
            logic: { yes: "watch", no: "EXIT" },
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

    // Each "yes" opens the add form with only the name filled; the person writes who it is for
    // and its story. After one is saved, the next named item opens.
    let wizardQueue = $state<string[]>([]);

    function handleWizardComplete(answers: Record<string, any>) {
        showWizard = false;
        if (answers.intro === false) return;

        const wanted: string[] = [];
        if (answers.watch) wanted.push("Vintage Watch");
        if (answers.jewelry) wanted.push("Wedding Ring");
        if (answers.furniture) wanted.push("Antique Desk");

        if (wanted.length > 0) {
            const [first, ...rest] = wanted;
            openAddForm(first);
            wizardQueue = rest;
        }
    }

    onMount(async () => {
        await heirloomSync.sync();
        // Migration: an Unsplash placeholder is cleared to no image (one update per record)
        for (const item of [...heirloomSync.items]) {
            if (item.image && item.image.includes("unsplash.com")) {
                try {
                    await heirloomSync.update(item.id, { image: "" });
                } catch {
                    // The record stays as it was; the gentle message has already been shown.
                }
            }
        }
        isLoading = false;

        const id = new URLSearchParams(window.location.search).get("id");
        if (id && heirloomSync.items.some((h) => String(h.id) === id)) {
            focusId = id;
            await tick();
            document.getElementById(`heirloom-${id}`)?.scrollIntoView({ block: "center" });
        }
    });

    let showAddForm = $state(false);

    function openAddForm(name = "") {
        wizardQueue = [];
        isEditing = false;
        editingId = null;
        newHeirloom = { name, recipient: "", story: "", image: "", ownershipDetails: "" };
        recipientContactId = "";
        parsedCustomAttributes = {};
        showAddForm = true;
    }

    function closeForm() {
        wizardQueue = [];
        showAddForm = false;
    }

    function openEditForm(item: Heirloom) {
        wizardQueue = [];
        recipientContactId = "";
        isEditing = true;
        editingId = item.id;
        newHeirloom = {
            name: item.name || "",
            recipient: item.recipient || "",
            story: item.story || "",
            image: item.image || "",
            ownershipDetails: item.ownershipDetails || "",
        };
        parsedCustomAttributes = readCustom(item);
        showAddForm = true;
    }

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function saveHeirloom() {
        if (saving) return;
        saving = true;
        try {
            await saveHeirloomOnce();
        } finally {
            saving = false;
        }
    }

    async function saveHeirloomOnce() {
        if (!newHeirloom.name) return;

        if (isEditing && editingId !== null) {
            try {
                await heirloomStore.updateItem(editingId, {
                    name: newHeirloom.name,
                    recipient: newHeirloom.recipient || "",
                    story: newHeirloom.story || "",
                    image: newHeirloom.image || "",
                    ownershipDetails: newHeirloom.ownershipDetails || "",
                    custom_attributes: JSON.stringify(parsedCustomAttributes),
                });
            } catch {
                return; // the manager already showed the one gentle message; the form keeps the edits
            }
            showAddForm = false;
            isEditing = false;
            editingId = null;
            return;
        }

        try {
            await heirloomSync.create({
                name: newHeirloom.name || "Untitled treasure",
                recipient: newHeirloom.recipient || "",
                story: newHeirloom.story || "",
                image: newHeirloom.image || "",
                ownershipDetails: newHeirloom.ownershipDetails || "",
                custom_attributes: JSON.stringify(parsedCustomAttributes),
            }, false, false, saveHeirloom);
        } catch {
            return; // the manager already showed the one gentle message; the form keeps the draft
        }

        showAddForm = false;
        newHeirloom = { name: "", recipient: "", story: "", image: "", ownershipDetails: "" };
        parsedCustomAttributes = {};

        if (wizardQueue.length > 0) {
            const [next, ...rest] = wizardQueue;
            await tick();
            openAddForm(next);
            wizardQueue = rest;
        }
    }

    async function removeHeirloom(id: string | number) {
        if (
            !(await askConfirm(
                "Remove this heirloom?",
            ))
        )
            return;
        try {
            await heirloomSync.delete(id);
        } catch {
            // the manager already showed the one gentle message
        }
    }

    // QR Logic
    let showQrModal = $state(false);
    let qrTarget: Heirloom | null = $state(null);
    let qrUrl = $state("");

    function openQrModal(item: Heirloom) {
        qrTarget = item;
        showQrModal = true;

        // The same address the QR Center label uses: this heirloom's own story.
        qrUrl = assetQrImage("Heirloom", item.id, 300);

        qrStore.generateAssetQR({
            id: crypto.randomUUID(),
            assetId: String(item.id),
            assetName: item.name,
            assetType: "Heirloom",
            location: "Registry",
        });

        activityLog.logEvent({
            module: "Heirlooms",
            action: "CREATE",
            entityType: "QR Label",
            entityId: String(item.id),
            entityName: item.name,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    function printLabel() {
        window.print();
    }
</script>

{#if showWizard}
    <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: () => (showWizard = false) }}
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        transition:fade
    >
        <div class="w-full max-w-2xl relative" in:fly={{ y: 20 }}>
            <button
                class="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
                onclick={() => (showWizard = false)}>Maybe later</button
            >
            <ConciergeFlow
                steps={wizardSteps}
                oncomplete={handleWizardComplete}
            />
        </div>
    </div>
{/if}

<LivingBlueprintHeader
    title="Heirlooms & Treasures"
    subtitle="Objects carry stories that deserve to be told"
    detailedDescription="When you document the history and meaning behind your treasured possessions, you're ensuring these stories survive—transforming objects into heirlooms that connect generations."
    whyMatters="Every object holds a story. That watch your grandfather wore every day, your wedding dress, the painting your mother loved. When you record their stories, you keep the emotional value that makes them irreplaceable, and your family will carry those stories forward."
>
    <div class="flex items-center gap-3">
        <DataViewToggle module="heirlooms" />
        <button
            onclick={() => (showWizard = true)}
            class="flex items-center gap-2 px-5 py-3 border border-primary/20 text-primary font-bold rounded-2xl hover:bg-primary/5 transition-colors"
        >
            <Sparkles size={18} />
            Start Concierge
        </button>
        <button
            class="flex items-center gap-2 bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all font-bold px-6 py-2 rounded-xl"
            onclick={() => openAddForm()}
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
                bind:value={searchQuery}
                aria-label="Search by item, story, or recipient"
                placeholder="Search by item, story, or recipient..."
                class="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-[#4A7C74] focus:ring-0 shadow-sm"
            />
        </div>
    </div>

    <!-- Grid -->
    {#if items.length === 0}
        <EmptyState
            title="Your treasures deserve their stories"
            whyMatters="Every object holds a story. That watch your grandfather wore every day, your wedding dress, the painting your mother loved. When you record their stories, you keep the emotional value that makes them irreplaceable, and your family will carry those stories forward."
            encouragement="Start with one meaningful object. Take a photo, write why it matters. The rest will follow naturally."
            icon={Gift}
            iconClass="text-amber-500"
            ctaLabel="Preserve your first treasure"
            onAction={() => openAddForm()}
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
                        isEditing = false;
                        editingId = null;
                        showAddForm = true;
                    }}
                >
                    {#snippet icon()}
                        <Gift size={20} class="text-slate-400" />
                    {/snippet}
                </GhostRow>
            {/each}
        </div>
    {:else}
        {#if viewMode === 'card'}
            <!-- Card Grid -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {#each filteredItems as heirloom (heirloom.id)}
                    <div
                        in:fade={{ duration: 400 }}
                        class="relative group"
                        id="heirloom-{heirloom.id}"
                        data-focused={focusId === String(heirloom.id)}
                    >
                        <HeirloomCard
                            {heirloom}
                            focused={focusId === String(heirloom.id)}
                            onPrintQr={() => openQrModal(heirloom)}
                        />
                        <button
                            onclick={() => openEditForm(heirloom)}
                            class="absolute top-2 right-12 p-2 bg-white/90 text-primary rounded-full shadow-md transition-all hover:bg-primary/10"
                            title="Edit these details"
                            aria-label="Edit these details"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onclick={() => removeHeirloom(heirloom.id)}
                            class="absolute top-2 right-2 p-2 bg-white/90 text-primary rounded-full shadow-md transition-all hover:bg-primary/10"
                            title="Remove"
                            aria-label="Remove this item"
                        >
                            <X size={16} />
                        </button>
                    </div>
                {/each}

                <!-- Add New Placeholder -->
                <button
                    class="border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 hover:border-[#4A7C74] hover:text-[#4A7C74] hover:bg-[#4A7C74]/5 transition-all min-h-[350px] group"
                    onclick={() => openAddForm()}
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
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Provenance</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each filteredItems as heirloom (heirloom.id)}
                            <tr class="hover:bg-slate-50 transition-colors group">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        {#if heirloom.image}
                                            <HeirloomImage src={heirloom.image} alt={heirloom.name} class="w-10 h-10 rounded-lg object-cover" />
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
                                <td class="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{heirloom.ownershipDetails || '-'}</td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2 transition-opacity">
                                        <button
                                            onclick={() => openQrModal(heirloom)}
                                            class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                            title="Generate QR"
                                        >
                                            <QrCode size={14} />
                                        </button>
                                        <button
                                            onclick={() => openEditForm(heirloom)}
                                            class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                            title="Edit these details"
                                            aria-label="Edit these details"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button aria-label="Remove this item"
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
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: () => (showQrModal = false) }}
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
                        {#if qrTarget.recipient}
                            <p
                                class="text-xs text-stone-500 uppercase tracking-wide font-bold mb-4"
                            >
                                For {qrTarget.recipient}
                            </p>
                        {/if}

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
                            ID: {String(qrTarget.id).split("-")[0]} // Scan to view story
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
        title={isEditing ? "Edit these details" : "Preserve a Treasure"}
        description="This object holds a story that only you can tell. By documenting it here, you're ensuring that story survives—transforming an object into an heirloom that connects generations."
        maxWidth="max-w-lg"
    >
        <div class="space-y-4">
            <div>
                <label
                    for="heirloom-name"
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >What Is It?</label
                >
                <input
                    id="heirloom-name"
                    type="text"
                    bind:value={newHeirloom.name}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Grandma's wedding ring"
                />
            </div>

            <div>
                <label
                    for="heirloom-recipient"
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >Who Should Have This?</label
                >
                {#if contacts.length > 0}
                    <select
                        id="heirloom-recipient-contact"
                        aria-label="Choose someone from your contacts"
                        bind:value={recipientContactId}
                        onchange={() => chooseRecipient(recipientContactId)}
                        class="w-full mb-2 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    >
                        <option value="">Choose someone from your contacts</option>
                        {#each contacts as contact (contact.id)}
                            <option value={String(contact.id)}
                                >{contact.name}{contact.relation
                                    ? ` (${contact.relation})`
                                    : ""}</option
                            >
                        {/each}
                    </select>
                {/if}
                <input
                    id="heirloom-recipient"
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
                    for="heirloom-story"
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >The Story Behind It</label
                >
                <textarea
                    id="heirloom-story"
                    bind:value={newHeirloom.story}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-32"
                    placeholder="Why is this meaningful? Where did it come from?"
                ></textarea>
            </div>

            <div>
                <VisionUploader
                    bind:imageUrl={newHeirloom.image}
                    bind:provenance={newHeirloom.ownershipDetails}
                />
                <!-- A chosen photo is saved to the media store (older records may hold a data URL); a typed address stays editable here. -->
                {#if !newHeirloom.image?.startsWith("data:") && mediaIdFromRef(newHeirloom.image) === null}
                    <div class="mt-2 text-center">
                        <span class="text-xs text-stone-400">or</span>
                    </div>
                    <div class="mt-2">
                        <label
                            for="heirloom-image-url"
                            class="block text-xs font-bold uppercase text-slate-500 mb-1"
                            >Or paste a URL</label
                        >
                        <input
                            id="heirloom-image-url"
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
        <!-- Sticky so the save stays in view while the form scrolls inside the modal. -->
        <div class="sticky -bottom-6 z-10 -mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-6">
            <button
                onclick={closeForm}
                class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >Maybe later</button
            >
            <button
                onclick={saveHeirloom}
                disabled={!newHeirloom.name || saving}
                aria-busy={saving}
                class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
                {saving
                    ? "Saving..."
                    : isEditing
                    ? "Save these details"
                    : "Record this treasure"}
            </button>
        </div>
    </Modal>
</div>
{/if}
