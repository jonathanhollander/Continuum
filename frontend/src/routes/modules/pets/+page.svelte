<script lang="ts">
    import { aiJobId, aiSourceFacts } from "$lib/services/aiCapabilities";
    import { petSync } from "$lib/stores/petStore.svelte";
    import { formSaveAttempt } from "$lib/utils/formSaveAttempt";
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { readCustom } from "$lib/utils/customFields";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import {
        Cat,
        Dog,
        Heart,
        Syringe,
        Utensils,
        Phone,
        CircleCheck,
        Plus,
        Trash2,
        Pencil,
        X,
        Loader2,
        Download,
    } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import UniversalUploader from "$lib/components/ui/UniversalUploader.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import {
        petStore,
        petMedia,
        PET_MEDIA_KEY,
        type PetEntry,
        type PetMedia,
    } from "$lib/stores/petStore.svelte";
    import { cachedBlobUrl } from "$lib/components/ui/MediaView.svelte";
    import { deleteMedia, downloadMedia, updateMediaMetadata } from "$lib/services/mediaService";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    let showAddForm = $state(false);
    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('pets'));
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isLoading = $state(true);
    /** The document attached in the form, and the one the pet held when the form opened. */
    let formMedia = $state<PetMedia | null>(null);
    let savedMedia: PetMedia | null = null;
    let formMediaUrl = $derived(formMedia ? `/api/media/${formMedia.id}/download` : "");

    onMount(async () => {
        await petStore.sync?.();
        isLoading = false;
    });
    let newPet: Partial<PetEntry> = $state({
        type: "dog",
        name: "",
        breed: "",
        guardian: "",
        vetName: "",
        vetPhone: "",
        foodInstructions: "",
        medicalNeeds: "",
        microchipNumber: "",
        notes: "",
    });

    const saveAttempt = formSaveAttempt(petSync);
    // A failed attempt's uploaded document remains available after its form closes or changes.
    const keptMedia = new Set<number>();

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function savePet() {
        if (saving) return;
        saving = true;
        try {
            await savePetOnce();
        } finally {
            saving = false;
        }
    }

    async function savePetOnce() {
        if (!newPet.name) return;
        const form = newPet;
        const fields = JSON.stringify([form, parsedCustomAttributes, formMedia]);
        const id = form.id;
        const ownerName = estateProfile.current.ownerName || "User";
        const { [PET_MEDIA_KEY]: _ignored, ...customValues } = parsedCustomAttributes;
        const attached = formMedia ? { ...formMedia } : null;
        const replaced = savedMedia && savedMedia.id !== attached?.id ? { ...savedMedia } : null;
        const customJson = JSON.stringify(attached ? { ...customValues, [PET_MEDIA_KEY]: attached } : customValues);
        const payload = { ...form, custom_attributes: customJson, customAttributes: customJson };
        if (attached) keptMedia.add(attached.id);
        try {
            await saveAttempt(form, payload, (saved) => {
                if (attached) updateMediaMetadata(attached.id, undefined, String(saved.id)).catch(() => undefined);
                if (replaced) deleteMedia(replaced.id).catch((e) => console.warn("[pets] file removal paused", replaced.id, e));
                activityLog.logEvent({
                    module: "Pet Care", action: id ? "UPDATE" : "CREATE", entityType: "Pet",
                    entityId: String(saved.id), entityName: saved.name, userContext: ownerName,
                });
                if (newPet !== form) return;
                savedMedia = attached;
                if (JSON.stringify([form, parsedCustomAttributes, formMedia]) === fields) closeAndReset();
                else newPet.id = saved.id;
            }, id);
        } catch {
            // The captured attempt and its document stay available through Try Again.
        }
    }

    function editPet(pet: PetEntry) {
        newPet = {
            id: pet.id,
            type: pet.type || "dog",
            name: pet.name || "",
            breed: pet.breed || "",
            guardian: pet.guardian || "",
            vetName: pet.vetName || "",
            vetPhone: pet.vetPhone || "",
            foodInstructions: pet.foodInstructions || "",
            medicalNeeds: pet.medicalNeeds || "",
            microchipNumber: pet.microchipNumber || "",
            notes: pet.notes || "",
        };
        // Custom field values for editing; the document is edited by the uploader
        const { [PET_MEDIA_KEY]: _media, ...customValues } = readCustom(pet);
        parsedCustomAttributes = customValues;
        formMedia = savedMedia = petMedia(pet) ?? null;
        showAddForm = true;
    }

    /** A document attached in this form but never saved on the pet. */
    function dropUnsavedFile() {
        if (formMedia && formMedia.id !== savedMedia?.id && !keptMedia.has(formMedia.id)) {
            const id = formMedia.id;
            deleteMedia(id).catch((e) => console.warn("[pets] file removal paused", id, e));
        }
    }

    function onFileChange(
        _url: string,
        id?: number,
        file?: { filename: string; mime_type: string; file_size: number },
    ) {
        dropUnsavedFile();
        formMedia =
            id === undefined
                ? null
                : { id, mime_type: file?.mime_type ?? "", filename: file?.filename ?? "", file_size: file?.file_size ?? 0 };
    }

    /** The modal closes through ×, Escape, the backdrop or "Maybe later"; each one drops the draft. */
    function setFormOpen(open: boolean) {
        if (open) showAddForm = true;
        else if (showAddForm) closeAndReset();
    }

    function resetForm() {
        dropUnsavedFile();
        formMedia = null;
        savedMedia = null;
        newPet = {
            type: "dog",
            name: "",
            breed: "",
            guardian: "",
            vetName: "",
            vetPhone: "",
            foodInstructions: "",
            medicalNeeds: "",
            microchipNumber: "",
            notes: "",
        };
        parsedCustomAttributes = {};
    }

    function closeAndReset() {
        showAddForm = false;
        resetForm();
    }

    /** The pet's own custom field values worth showing (filled in; the care document is shown on its own). */
    function shownCustom(pet: PetEntry): [string, string][] {
        const { [PET_MEDIA_KEY]: _media, ...values } = readCustom(pet);
        return Object.entries(values)
            .filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== false)
            .map(([k, v]) => [k, v === true ? "Yes" : String(v)]);
    }

    async function removePet(id: number) {
        if (
            !(await askConfirm(
                "Remove this family member from your list? This detail can always be added back later.",
            ))
        )
            return;
        petStore.removePet(id);
    }
</script>

<LivingBlueprintHeader
    title="Pet Care"
    subtitle="Your companions deserve a plan for their future care"
    detailedDescription="Your pets depend on you completely. This plan ensures they'll be loved and cared for by someone you trust, for the rest of their life. It's one of the kindest things you can do for them—and for the person who steps in to help."
    whyMatters="A documented plan places your pets with someone who knows their needs, fears, and routines. Creating this plan ensures they'll be loved and cared for by someone you trust."
>
    <div class="flex items-center gap-4">
        <DataViewToggle module="pets" />
        <button
            class="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
            onclick={() => (showAddForm = !showAddForm)}
        >
            <Plus size={20} /> Share a pet detail
        </button>
    </div>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="container px-8 mx-auto py-8 animate-in fade-in duration-500">


    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mb-8">
        <AIPromptBar context="pets" />
    </div>

    <!-- Pet Views -->
    {#if viewMode === 'card'}
        <!-- Pet Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {#each petStore.items as pet}
                <div
                    class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all"
                >
                    <!-- Pet Header -->
                    <div
                        class="min-h-32 bg-gradient-to-br from-primary/10 to-secondary/10 relative p-6 group"
                    >
                        <div class="absolute right-4 top-4 opacity-10" aria-hidden="true">
                            {#if pet.type === "cat"}
                                <Cat size={120} />
                            {:else}
                                <Dog size={120} />
                            {/if}
                        </div>
                        <div class="relative flex items-start justify-between gap-3">
                            <h3 class="min-w-0 break-words text-3xl font-serif font-bold text-foreground">
                                {pet.name}
                            </h3>
                            <div class="flex shrink-0 gap-2 z-20">
                                <button
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        editPet(pet);
                                    }}
                                    class="p-2 bg-card/70 hover:bg-card text-primary hover:text-primary-hover rounded-full"
                                    aria-label="Edit these details"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        removePet(pet.id as number);
                                    }}
                                    class="p-2 bg-card/70 hover:bg-card text-muted-foreground hover:text-danger rounded-full"
                                    aria-label="Remove this item"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p class="text-muted-foreground font-medium">{pet.breed}</p>
                    </div>

                    <!-- Pet Details -->
                    <div class="p-6 space-y-4">
                        {#if pet.guardian}
                        <div
                            class="flex items-start gap-3 p-3 bg-primary/5 rounded-xl"
                        >
                            <Heart class="text-primary mt-1 shrink-0" size={18} />
                            <div>
                                <span
                                    class="text-xs font-bold uppercase text-muted-foreground tracking-wide"
                                    >Designated Guardian</span
                                >
                                <div class="font-bold text-foreground">
                                    {pet.guardian}
                                </div>
                            </div>
                        </div>
                        {/if}

                        {#if pet.vetName || pet.vetPhone || pet.foodInstructions}
                        <div class="grid grid-cols-2 gap-4">
                            {#if pet.vetName || pet.vetPhone}
                            <div class="flex items-start gap-2">
                                <Phone
                                    class="text-muted-foreground mt-1 shrink-0"
                                    size={16}
                                />
                                <div>
                                    <span
                                        class="text-xs font-bold uppercase text-muted-foreground"
                                        >Vet Contact</span
                                    >
                                    <div class="text-sm font-medium text-foreground">
                                        {pet.vetName}
                                        {#if pet.vetName && pet.vetPhone}<br />{/if}
                                        {pet.vetPhone}
                                    </div>
                                </div>
                            </div>
                            {/if}
                            {#if pet.foodInstructions}
                            <div class="flex items-start gap-2">
                                <Utensils
                                    class="text-muted-foreground mt-1 shrink-0"
                                    size={16}
                                />
                                <div>
                                    <span
                                        class="text-xs font-bold uppercase text-muted-foreground"
                                        >Food</span
                                    >
                                    <div class="text-sm font-medium text-foreground">
                                        {pet.foodInstructions}
                                    </div>
                                </div>
                            </div>
                            {/if}
                        </div>
                        {/if}

                        {#if pet.medicalNeeds}
                            <div
                                class="flex items-start gap-2 pt-2 border-t border-border"
                            >
                                <Syringe
                                    class="text-muted-foreground mt-1 shrink-0"
                                    size={16}
                                />
                                <div>
                                    <span
                                        class="text-xs font-bold uppercase text-muted-foreground"
                                        >Meds & Routine</span
                                    >
                                    <div class="text-sm font-medium text-foreground">
                                        {pet.medicalNeeds}
                                    </div>
                                </div>
                            </div>
                        {/if}

                        {#if pet.microchipNumber || shownCustom(pet).length}
                            <dl class="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border text-sm">
                                {#if pet.microchipNumber}
                                    <div>
                                        <dt class="text-xs font-bold uppercase text-muted-foreground">Microchip Number</dt>
                                        <dd class="font-medium text-foreground font-mono break-all">{pet.microchipNumber}</dd>
                                    </div>
                                {/if}
                                {#each shownCustom(pet) as [label, value] (label)}
                                    <div>
                                        <dt class="text-xs font-bold uppercase text-muted-foreground break-words">{label}</dt>
                                        <dd class="font-medium text-foreground break-words">{value}</dd>
                                    </div>
                                {/each}
                            </dl>
                        {/if}

                        {#if pet.notes}
                            <p class="text-sm text-muted-foreground italic whitespace-pre-line pt-2 border-t border-border">
                                {pet.notes}
                            </p>
                        {/if}

                        {#if petMedia(pet)}
                            {@const media = petMedia(pet)!}
                            <button
                                type="button"
                                onclick={() => downloadMedia(media.id, media.filename || undefined, cachedBlobUrl(media.id)).catch((e) => console.warn("[pets] file save paused", media.id, e))}
                                class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                            >
                                <Download size={14} />
                                {media.filename}
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}

            <!-- Empty State -->
            {#if petStore.items.length === 0}
                <div class="col-span-full">
                    <EmptyState
                        title="Your companions deserve a plan too"
                        whyMatters="<strong>A documented plan places your pets with someone who knows their needs, fears, and routines.</strong><br/><br/>Creating this plan ensures they'll be loved and cared for by someone you trust—someone who knows their favorite toy, their medical needs, and the way they like to be held. It's one of the most loving things you can do for them."
                        encouragement="When you're ready, take a moment to think about who would give them the life they deserve."
                        icon={Dog}
                        iconClass="text-primary"
                        ctaLabel="Share your companion's story"
                        onAction={() => (showAddForm = true)}
                    />
                </div>
            {/if}
        </div>
    {:else}
        <!-- Table View -->
        {#if petStore.items.length === 0}
            <EmptyState
                title="Your companions deserve a plan too"
                whyMatters="<strong>A documented plan places your pets with someone who knows their needs, fears, and routines.</strong><br/><br/>Creating this plan ensures they'll be loved and cared for by someone you trust—someone who knows their favorite toy, their medical needs, and the way they like to be held. It's one of the most loving things you can do for them."
                encouragement="When you're ready, take a moment to think about who would give them the life they deserve."
                icon={Dog}
                iconClass="text-primary"
                ctaLabel="Share your companion's story"
                onAction={() => (showAddForm = true)}
            />
        {:else}
            <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <table class="w-full">
                    <thead class="bg-background border-b border-border">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Name</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Breed</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Guardian</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Vet</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                        {#each petStore.items as pet}
                            <tr class="hover:bg-background transition-colors group">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 bg-primary-soft rounded-full flex items-center justify-center text-primary-hover">
                                            {#if pet.type === "cat"}
                                                <Cat size={16} />
                                            {:else}
                                                <Dog size={16} />
                                            {/if}
                                        </div>
                                        <span class="font-medium text-foreground">{pet.name}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-muted-foreground capitalize">{pet.type || 'dog'}</td>
                                <td class="px-4 py-3 text-sm text-muted-foreground">{pet.breed || '-'}</td>
                                <td class="px-4 py-3 text-sm text-muted-foreground">{pet.guardian || '-'}</td>
                                <td class="px-4 py-3 text-sm text-muted-foreground">{pet.vetName || '-'}</td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button aria-label="Edit these details"
                                            onclick={() => editPet(pet)}
                                            class="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button aria-label="Remove this item"
                                            onclick={() => removePet(pet.id as number)}
                                            class="p-1.5 text-muted-foreground hover:text-danger transition-colors"
                                        >
                                            <Trash2 size={14} />
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

    <!-- Add Pet Modal -->
    <Modal
        bind:open={() => showAddForm, setFormOpen}
        title={newPet.id ? "Update Their Care Plan" : "Share your companion's story"}
        description={newPet.id
            ? "Keep their information current so their next caregiver has everything they need."
            : "Your pet will be cared for by someone who truly understands them—their routines, their quirks, and their needs."}
        maxWidth="max-w-lg"
    >
        <div class="space-y-4">
            <div>
                <label for="pet-name"
                    class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                    >Name</label
                >
                <input id="pet-name"
                    type="text"
                    bind:value={newPet.name}
                    class="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Barnaby"
                />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="pet-type"
                        class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                        >Type</label
                    >
                    <select id="pet-type"
                        bind:value={newPet.type}
                        class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label for="pet-breed"
                        class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                        >Breed / Species</label
                    >
                    <input id="pet-breed"
                        type="text"
                        bind:value={newPet.breed}
                        class="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. Golden Retriever"
                    />
                </div>
            </div>

            <div>
                <label for="pet-microchip"
                    class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                    >Microchip Number</label
                >
                <input id="pet-microchip"
                    type="text"
                    bind:value={newPet.microchipNumber}
                    class="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                    placeholder="e.g. 985112003456789"
                />
            </div>

            <div>
                <label for="pet-guardian"
                    class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                    >Their Next Loving Home</label
                >
                <input id="pet-guardian"
                    type="text"
                    bind:value={newPet.guardian}
                    class="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Who will love them next?"
                />
                <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed px-1">
                    Choose someone who already knows and loves them, if
                    possible. This person will receive all the care
                    details you provide here.
                </p>
            </div>

            <div>
                <label for="pet-vet-name"
                    class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                    >Vet Name</label
                >
                <input id="pet-vet-name"
                    type="text"
                    bind:value={newPet.vetName}
                    class="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Dr. Name"
                />
            </div>
            <div>
                <label for="pet-vet-phone"
                    class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                    >Vet Phone</label
                >
                <input id="pet-vet-phone"
                    type="text"
                    bind:value={newPet.vetPhone}
                    class="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="(xxx) xxx-xxxx"
                />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="pet-food-instructions"
                        class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                        >Their Daily Routine</label
                    >
                    <input id="pet-food-instructions"
                        type="text"
                        bind:value={newPet.foodInstructions}
                        class="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Food brand, amounts, schedule"
                    />
                </div>
                <div>
                    <label for="pet-medical-needs"
                        class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 mb-1.5"
                        >Health & Medications</label
                    >
                    <input id="pet-medical-needs"
                        type="text"
                        bind:value={newPet.medicalNeeds}
                        class="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Any ongoing care needs"
                    />
                </div>
            </div>

            <div class="pt-2 border-t border-border">
                <UniversalUploader
                    value={formMediaUrl}
                    mediaId={formMedia?.id ?? null}
                    label="Care Records & Photos"
                    mode="any"
                    module="pets"
                    referenceId={newPet.id ? String(newPet.id) : undefined}
                    onchange={onFileChange}
                />
            </div>

            <div class="pt-2">
                <SmartTextarea
                            job={{job_id:aiJobId("pet", newPet, newPet.id)+":notes",document_title:newPet.name,source_facts:aiSourceFacts({name:newPet.name,type:newPet.type,guardian:newPet.guardian,vetName:newPet.vetName,foodInstructions:newPet.foodInstructions,medicalNeeds:newPet.medicalNeeds})}}
                    bind:value={newPet.notes}
                    context="pet"
                    placeholder="Share a favorite memory, tribute, or special quirks..."
                    label="Tribute & Notes"
                    minHeight="100px"
                />
            </div>

            <!-- Custom Fields -->
            <div class="pt-4 mt-4 border-t border-border">
                <CustomFieldsManager
                    entityType="pet"
                    bind:data={parsedCustomAttributes}
                />
            </div>
        </div>

        <!-- Footer buttons -->
        <div class="-mx-6 -mb-6 px-6 py-4 bg-background border-t border-border flex justify-end gap-3 mt-6">
            <button
                onclick={closeAndReset}
                class="px-6 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-border transition-colors"
                >Maybe later</button
            >
            <button
                onclick={savePet}
                disabled={!newPet.name || saving}
                aria-busy={saving}
                class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? "Saving..." : newPet.id ? "Save changes" : "Record detail"}
            </button>
        </div>
    </Modal>
</div>
{/if}
