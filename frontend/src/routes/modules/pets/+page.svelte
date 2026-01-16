<script lang="ts">
    import { fade, slide } from "svelte/transition";
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
    } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { petStore, type PetEntry } from "$lib/stores/petStore";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore";
    import { activityLog } from "$lib/stores/activityLog";

    let showAddForm = false;
    let newPet: Partial<PetEntry> = {
        type: "dog",
        name: "",
        breed: "",
        guardian:
            $estateProfile.spouseName || $estateProfile.executorName || "",
        vetName: "",
        vetPhone: "",
        foodInstructions: "",
        medicalNeeds: "",
        notes: "",
    };

    function savePet() {
        if (!newPet.name) return;

        if (newPet.id) {
            petStore.updatePet(newPet.id, newPet);
            activityLog.logEvent({
                module: "Pet Care",
                action: "UPDATE",
                entityType: "Pet",
                entityId: newPet.id,
                entityName: newPet.name,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            petStore.addPet(newPet as Omit<PetEntry, "id">);
            // We don't have the ID immediately for the log if it's generated in store,
            // but for simplicity we log the create action.
            activityLog.logEvent({
                module: "Pet Care",
                action: "CREATE",
                entityType: "Pet",
                entityId: crypto.randomUUID(), // Temp ID for log since store handles true ID
                entityName: newPet.name || "Unknown",
                userContext: $estateProfile.ownerName || "User",
            });
        }

        resetForm();
    }

    function editPet(pet: PetEntry) {
        newPet = { ...pet };
        showAddForm = true;
    }

    function resetForm() {
        showAddForm = false;
        newPet = {
            type: "dog",
            name: "",
            breed: "",
            guardian:
                $estateProfile.spouseName || $estateProfile.executorName || "",
            vetName: "",
            vetPhone: "",
            foodInstructions: "",
            medicalNeeds: "",
            notes: "",
        };
    }

    function removePet(id: string) {
        if (!confirm("Remove this pet?")) return;
        petStore.removePet(id);
    }
</script>

<div class="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-12 flex justify-between items-end">
        <div>
            <div
                class="inline-flex items-center justify-center p-3 bg-orange-100 text-orange-700 rounded-full mb-4"
            >
                <Dog size={32} />
            </div>
            <h1 class="font-serif font-bold text-4xl text-[#304743] mb-2">
                Pet Care Plan
            </h1>
            <p class="text-lg text-muted-foreground">
                Because they are family too. Ensure they are loved and cared
                for, no matter what.
            </p>
        </div>
        <button
            class="bg-[#304743] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#2a3f3b] transition-colors flex items-center gap-2"
            on:click={() => (showAddForm = !showAddForm)}
        >
            <Plus size={20} /> Add Pet
        </button>
    </div>

    <!-- Pet Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each $petStore as PetEntry[] as pet}
            <div
                class="bg-white rounded-3xl border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all"
            >
                <!-- Pet Header -->
                <div
                    class="h-32 bg-gradient-to-br from-orange-100 to-amber-50 relative p-6 group"
                >
                    <div
                        class="absolute top-4 left-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <button
                            on:click|stopPropagation={() => editPet(pet)}
                            class="p-2 bg-white/50 hover:bg-white text-blue-400 hover:text-blue-600 rounded-full"
                            title="Edit Pet"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            on:click|stopPropagation={() => removePet(pet.id)}
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
                    <h3 class="text-3xl font-serif font-bold text-[#304743]">
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

                    {#if pet.medicalNeeds}
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

        <!-- Empty State / Add Placeholder -->
        {#if $petStore.length === 0}
            <div class="col-span-full space-y-4">
                {#each getSmartSamples($language).pets || [] as sample}
                    <GhostRow
                        name={sample.name}
                        subtitle={`${sample.breed} • ${sample.guardian}`}
                        type="Pet"
                        onClick={() => {
                            newPet = {
                                ...newPet,
                                name: sample.name,
                                breed: sample.breed,
                                type: sample.type as "dog" | "cat" | "other",
                                guardian: sample.guardian,
                            };
                            showAddForm = true;
                        }}
                    >
                        <svelte:fragment slot="icon">
                            {#if sample.type === "cat"}
                                <Cat size={20} class="text-slate-400" />
                            {:else}
                                <Dog size={20} class="text-slate-400" />
                            {/if}
                        </svelte:fragment>
                    </GhostRow>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Add Pet Modal -->
    {#if showAddForm}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                transition:slide
            >
                <div
                    class="p-6 border-b border-gray-100 flex justify-between items-center"
                >
                    <h3 class="font-serif font-bold text-2xl text-[#304743]">
                        Add a Pet
                    </h3>
                    <button
                        on:click={resetForm}
                        class="text-gray-400 hover:text-gray-600"
                    >
                        <span class="sr-only">Close</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div class="p-6 space-y-4">
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Name</label
                        >
                        <input
                            type="text"
                            bind:value={newPet.name}
                            class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#304743]/20"
                            placeholder="e.g. Barnaby"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Type</label
                            >
                            <select
                                bind:value={newPet.type}
                                class="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white"
                            >
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Breed / Species</label
                            >
                            <input
                                type="text"
                                bind:value={newPet.breed}
                                class="w-full px-4 py-2 rounded-xl border border-gray-200"
                                placeholder="e.g. Golden Retriever"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Designated Guardian</label
                        >
                        <input
                            type="text"
                            bind:value={newPet.guardian}
                            class="w-full px-4 py-2 rounded-xl border border-gray-200"
                            placeholder="Who will take them?"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Vet Name</label
                        >
                        <input
                            type="text"
                            bind:value={newPet.vetName}
                            class="w-full px-4 py-2 rounded-xl border border-gray-200"
                            placeholder="Dr. Name"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Vet Phone</label
                        >
                        <input
                            type="text"
                            bind:value={newPet.vetPhone}
                            class="w-full px-4 py-2 rounded-xl border border-gray-200"
                            placeholder="(xxx) xxx-xxxx"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Food Instructions</label
                            >
                            <input
                                type="text"
                                bind:value={newPet.foodInstructions}
                                class="w-full px-4 py-2 rounded-xl border border-gray-200"
                                placeholder="Brand & Amount"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Medical Needs</label
                            >
                            <input
                                type="text"
                                bind:value={newPet.medicalNeeds}
                                class="w-full px-4 py-2 rounded-xl border border-gray-200"
                                placeholder="Dosage & Frequency"
                            />
                        </div>
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
                </div>

                <div class="p-6 bg-gray-50 flex justify-end gap-3">
                    <button
                        on:click={() => (showAddForm = false)}
                        class="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                        >Cancel</button
                    >
                    <button
                        on:click={savePet}
                        disabled={!newPet.name}
                        class="px-6 py-2 rounded-xl font-bold bg-[#304743] text-white hover:bg-[#20302d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {newPet.id ? "Update Pet" : "Save Pet"}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
