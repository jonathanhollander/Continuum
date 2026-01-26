<script lang="ts">
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
    } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import UniversalUploader from "$lib/components/ui/UniversalUploader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { petStore, type PetEntry } from "$lib/stores/petStore.svelte";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";

    let showAddForm = $state(false);
    let showAffirmation = $state(false);
    let viewMode = $state<ViewMode>('card');
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isLoading = $state(true);

    onMount(async () => {
        await petStore.sync?.();
        isLoading = false;
    });
    let newPet: Partial<PetEntry> = $state({
        type: "dog",
        name: "",
        breed: "",
        guardian:
            $estateProfile.spouse_name || $estateProfile.executor_name || "",
        vetName: "",
        vetPhone: "",
        foodInstructions: "",
        medicalNeeds: "",
        documents: "",
        notes: "",
    });

    function savePet() {
        if (!newPet.name) return;

        // Serialize custom attributes
        const petData = {
            ...newPet,
            custom_attributes: JSON.stringify(parsedCustomAttributes)
        };

        if (newPet.id) {
            petStore.updatePet(newPet.id, petData);
            activityLog.logEvent({
                module: "Pet Care",
                action: "UPDATE",
                entityType: "Pet",
                entityId: newPet.id as string,
                entityName: newPet.name,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            petStore.addPet(petData as Omit<PetEntry, "id">);
            activityLog.logEvent({
                module: "Pet Care",
                action: "CREATE",
                entityType: "Pet",
                entityId: crypto.randomUUID(),
                entityName: newPet.name || "Unknown",
                userContext: $estateProfile.ownerName || "User",
            });
        }

        closeAndReset();
        showAffirmation = true;
    }

    function editPet(pet: PetEntry) {
        newPet = {
            id: pet.id,
            type: pet.type || "dog",
            name: pet.name || "",
            breed: pet.breed || "",
            guardian: pet.guardian || "",
            vetName: pet.vetName || pet.vet_name || "",
            vetPhone: pet.vetPhone || pet.vet_phone || "",
            foodInstructions: pet.foodInstructions || pet.food_instructions || "",
            medicalNeeds: pet.medicalNeeds || pet.medical_needs || "",
            documents: pet.documents || "",
            notes: pet.notes || "",
        };
        // Parse custom attributes for editing
        try {
            parsedCustomAttributes = JSON.parse(pet.custom_attributes || "{}");
        } catch {
            parsedCustomAttributes = {};
        }
        showAddForm = true;
    }

    function resetForm() {
        newPet = {
            type: "dog",
            name: "",
            breed: "",
            guardian:
                $estateProfile.spouse_name ||
                $estateProfile.executor_name ||
                "",
            vetName: "",
            vetPhone: "",
            foodInstructions: "",
            medicalNeeds: "",
            documents: "",
            notes: "",
        };
        parsedCustomAttributes = {};
    }

    function closeAndReset() {
        showAddForm = false;
        resetForm();
    }

    function removePet(id: number) {
        if (
            !confirm(
                "Remove this family member from your list? This detail can always be added back later.",
            )
        )
            return;
        petStore.removePet(id);
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-12 flex justify-between items-end">
        <div>
            <div
                class="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4"
            >
                <Dog size={32} />
            </div>
            <h1 class="font-serif font-bold text-4xl text-slate-900 mb-2">
                Care for Your Companions
            </h1>
            <p class="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Your pets depend on you completely. This plan ensures they'll be
                loved and cared for by someone you trust, no matter what
                happens. It's one of the kindest things you can do for them—and
                for the person who steps in to help.
            </p>
        </div>
        <div class="flex items-center gap-4">
            <DataViewToggle module="pets" onchange={(mode) => viewMode = mode} />
            <button
                class="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                onclick={() => (showAddForm = !showAddForm)}
            >
                <Plus size={20} /> Share a pet detail
            </button>
        </div>
    </div>

    <!-- Affirmation Message -->
    <Affirmation module="pets" bind:show={showAffirmation} />

    <!-- Pet Views -->
    {#if viewMode === 'card'}
        <!-- Pet Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {#each petStore.items as pet}
                <div
                    class="bg-white rounded-2xl border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all"
                >
                    <!-- Pet Header -->
                    <div
                        class="h-32 bg-gradient-to-br from-orange-100 to-amber-50 relative p-6 group"
                    >
                        <div
                            class="absolute top-4 left-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <button
                                onclick={(e) => {
                                    e.stopPropagation();
                                    editPet(pet);
                                }}
                                class="p-2 bg-white/50 hover:bg-white text-primary/60 hover:text-primary rounded-full"
                                title="Edit Pet"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onclick={(e) => {
                                    e.stopPropagation();
                                    removePet(pet.id as number);
                                }}
                                class="p-2 bg-white/50 hover:bg-white text-red-400 hover:text-red-600 rounded-full"
                                title="Remove Pet"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div class="absolute right-4 top-4 opacity-10">
                            {#if pet.type === "cat"}
                                <Cat size={120} />
                            {:else}
                                <Dog size={120} />
                            {/if}
                        </div>
                        <h3 class="text-3xl font-serif font-bold text-slate-900">
                            {pet.name}
                        </h3>
                        <p class="text-amber-800 font-medium">{pet.breed}</p>
                    </div>

                    <!-- Pet Details -->
                    <div class="p-6 space-y-4">
                        <div
                            class="flex items-start gap-3 p-3 bg-red-50 rounded-xl"
                        >
                            <Heart class="text-red-500 mt-1 shrink-0" size={18} />
                            <div>
                                <span
                                    class="text-xs font-bold uppercase text-red-400 tracking-wide"
                                    >Designated Guardian</span
                                >
                                <div class="font-bold text-gray-900">
                                    {pet.guardian}
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex items-start gap-2">
                                <Phone
                                    class="text-gray-400 mt-1 shrink-0"
                                    size={16}
                                />
                                <div>
                                    <span
                                        class="text-xs font-bold uppercase text-gray-400"
                                        >Vet Contact</span
                                    >
                                    <div class="text-sm font-medium text-gray-700">
                                        {pet.vetName} <br />
                                        {pet.vetPhone}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-start gap-2">
                                <Utensils
                                    class="text-gray-400 mt-1 shrink-0"
                                    size={16}
                                />
                                <div>
                                    <span
                                        class="text-xs font-bold uppercase text-gray-400"
                                        >Food</span
                                    >
                                    <div class="text-sm font-medium text-gray-700">
                                        {pet.foodInstructions}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {#if pet.medical_needs}
                            <div
                                class="flex items-start gap-2 pt-2 border-t border-gray-100"
                            >
                                <Syringe
                                    class="text-gray-400 mt-1 shrink-0"
                                    size={16}
                                />
                                <div>
                                    <span
                                        class="text-xs font-bold uppercase text-gray-400"
                                        >Meds & Routine</span
                                    >
                                    <div class="text-sm font-medium text-gray-700">
                                        {pet.medicalNeeds}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}

            <!-- Empty State -->
            {#if petStore.items.length === 0}
                <div class="col-span-full">
                    <EmptyState
                        title="Your companions deserve a plan too"
                        whyMatters="Your pets depend on you completely for their care, comfort, and survival. <strong>Without a documented plan, they could end up in a shelter</strong> or with someone who doesn't know their needs, fears, or routines. <br/><br/>Creating this plan ensures they'll be loved and cared for by someone you trust—someone who knows their favorite toy, their medical needs, and the way they like to be held. It's one of the most loving things you can do for them."
                        encouragement="When you're ready, take a moment to think about who would give them the life they deserve."
                        icon={Dog}
                        iconClass="text-primary"
                        ctaLabel="Protect your companion"
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
                whyMatters="Your pets depend on you completely for their care, comfort, and survival. <strong>Without a documented plan, they could end up in a shelter</strong> or with someone who doesn't know their needs, fears, or routines. <br/><br/>Creating this plan ensures they'll be loved and cared for by someone you trust—someone who knows their favorite toy, their medical needs, and the way they like to be held. It's one of the most loving things you can do for them."
                encouragement="When you're ready, take a moment to think about who would give them the life they deserve."
                icon={Dog}
                iconClass="text-primary"
                ctaLabel="Protect your companion"
                onAction={() => (showAddForm = true)}
            />
        {:else}
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Name</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Breed</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Guardian</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Vet</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each petStore.items as pet}
                            <tr class="hover:bg-slate-50 transition-colors group">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                            {#if pet.type === "cat"}
                                                <Cat size={16} />
                                            {:else}
                                                <Dog size={16} />
                                            {/if}
                                        </div>
                                        <span class="font-medium text-slate-800">{pet.name}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-600 capitalize">{pet.type || 'dog'}</td>
                                <td class="px-4 py-3 text-sm text-slate-600">{pet.breed || '-'}</td>
                                <td class="px-4 py-3 text-sm text-slate-600">{pet.guardian || '-'}</td>
                                <td class="px-4 py-3 text-sm text-slate-600">{pet.vetName || '-'}</td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onclick={() => editPet(pet)}
                                            class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onclick={() => removePet(pet.id as number)}
                                            class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
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
        bind:open={showAddForm}
        title={newPet.id ? "Update Their Care Plan" : "Protect Your Companion"}
        description={newPet.id
            ? "Keep their information current so their next caregiver has everything they need."
            : "Your pet depends on you completely. This information ensures they'll be cared for by someone who truly understands them—their routines, their quirks, and their needs."}
        maxWidth="max-w-lg"
        on:close={() => resetForm()}
    >
        <div class="space-y-4">
            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5"
                    >Name</label
                >
                <input
                    type="text"
                    bind:value={newPet.name}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Barnaby"
                />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5"
                        >Type</label
                    >
                    <select
                        bind:value={newPet.type}
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label
                        class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5"
                        >Breed / Species</label
                    >
                    <input
                        type="text"
                        bind:value={newPet.breed}
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. Golden Retriever"
                    />
                </div>
            </div>

            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5"
                    >Their Next Loving Home</label
                >
                <input
                    type="text"
                    bind:value={newPet.guardian}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Who will love them next?"
                />
                <p class="text-xs text-slate-400 mt-1.5 leading-relaxed px-1">
                    Choose someone who already knows and loves them, if
                    possible. This person will receive all the care
                    details you provide here.
                </p>
            </div>

            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5"
                    >Vet Name</label
                >
                <input
                    type="text"
                    bind:value={newPet.vetName}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Dr. Name"
                />
            </div>
            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5"
                    >Vet Phone</label
                >
                <input
                    type="text"
                    bind:value={newPet.vetPhone}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="(xxx) xxx-xxxx"
                />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5"
                        >Their Daily Routine</label
                    >
                    <input
                        type="text"
                        bind:value={newPet.foodInstructions}
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Food brand, amounts, schedule"
                    />
                </div>
                <div>
                    <label
                        class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5"
                        >Health & Medications</label
                    >
                    <input
                        type="text"
                        bind:value={newPet.medicalNeeds}
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Any ongoing care needs"
                    />
                </div>
            </div>

            <div class="pt-2 border-t border-slate-100">
                <UniversalUploader
                    bind:value={newPet.documents}
                    label="Care Records & Photos"
                    mode="any"
                    module="pets"
                    hideBorder
                />
            </div>

            <div class="pt-2">
                <SmartTextarea
                    bind:value={newPet.notes}
                    context="pet"
                    placeholder="Share a favorite memory, tribute, or special quirks..."
                    label="Tribute & Notes"
                    minHeight="100px"
                />
            </div>

            <!-- Custom Fields -->
            <div class="pt-4 mt-4 border-t border-slate-100">
                <CustomFieldsManager
                    entityType="pet"
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
                onclick={savePet}
                disabled={!newPet.name}
                class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {newPet.id ? "Save changes" : "Record detail"}
            </button>
        </div>
    </Modal>
</div>
{/if}
