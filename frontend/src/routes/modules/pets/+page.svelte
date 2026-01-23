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
    import Affirmation from "$lib/components/Affirmation.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { t, language } from "$lib/stores/localization.ts";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { petStore, type PetEntry } from "$lib/stores/petStore.svelte.ts";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte.ts";
    import { activityLog } from "$lib/stores/activityLog.svelte.ts";

    let showAddForm = $state(false);
    let showAffirmation = $state(false);
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
        notes: "",
    });

    function savePet() {
        if (!newPet.name) return;

        if (newPet.id) {
            petStore.updatePet(newPet.id, newPet);
            activityLog.logEvent({
                module: "Pet Care",
                action: "UPDATE",
                entityType: "Pet",
                entityId: newPet.id as string,
                entityName: newPet.name,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            petStore.addPet(newPet as Omit<PetEntry, "id">);
            activityLog.logEvent({
                module: "Pet Care",
                action: "CREATE",
                entityType: "Pet",
                entityId: crypto.randomUUID(),
                entityName: newPet.name || "Unknown",
                userContext: $estateProfile.ownerName || "User",
            });
        }

        resetForm();
        showAffirmation = true;
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
                $estateProfile.spouse_name ||
                $estateProfile.executor_name ||
                "",
            vetName: "",
            vetPhone: "",
            foodInstructions: "",
            medicalNeeds: "",
            notes: "",
        };
    }

    function removePet(id: number) {
        if (
            !confirm(
                "Remove this pet? You can add them back anytime if needed.",
            )
        )
            return;
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
                Care for Your Companions
            </h1>
            <p class="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Your pets depend on you completely. This plan ensures they'll be
                loved and cared for by someone you trust, no matter what
                happens. It's one of the kindest things you can do for them—and
                for the person who steps in to help.
            </p>
        </div>
        <button
            class="bg-[#304743] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#2a3f3b] transition-colors flex items-center gap-2"
            onclick={() => (showAddForm = !showAddForm)}
        >
            <Plus size={20} /> Add Pet
        </button>
    </div>

    <!-- Affirmation Message -->
    <Affirmation module="pets" bind:show={showAffirmation} />

    <!-- Pet Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each petStore.items as pet}
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
                            onclick={(e) => {
                                e.stopPropagation();
                                editPet(pet);
                            }}
                            class="p-2 bg-white/50 hover:bg-white text-blue-400 hover:text-blue-600 rounded-full"
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
                    iconClass="text-orange-500"
                    ctaLabel="Protect your companion"
                    onAction={() => (showAddForm = true)}
                />
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
                    class="p-6 border-b border-gray-100 flex justify-between items-start"
                >
                    <div class="flex-1 pr-4">
                        <h3
                            class="font-serif font-bold text-2xl text-[#304743]"
                        >
                            {newPet.id
                                ? "Update Their Care Plan"
                                : "Protect Your Companion"}
                        </h3>
                        <p class="text-gray-500 text-sm mt-2 leading-relaxed">
                            {newPet.id
                                ? "Keep their information current so their next caregiver has everything they need."
                                : "Your pet depends on you completely. This information ensures they'll be cared for by someone who truly understands them—their routines, their quirks, and their needs."}
                        </p>
                    </div>
                    <button
                        onclick={resetForm}
                        class="text-gray-400 hover:text-gray-600 mt-1"
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
                            >Their Next Loving Home</label
                        >
                        <input
                            type="text"
                            bind:value={newPet.guardian}
                            class="w-full px-4 py-2 rounded-xl border border-gray-200"
                            placeholder="Who will love them next?"
                        />
                        <p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
                            Choose someone who already knows and loves them, if
                            possible. This person will receive all the care
                            details you provide here.
                        </p>
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
                                >Their Daily Routine</label
                            >
                            <input
                                type="text"
                                bind:value={newPet.foodInstructions}
                                class="w-full px-4 py-2 rounded-xl border border-gray-200"
                                placeholder="Food brand, amounts, schedule"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Health & Medications</label
                            >
                            <input
                                type="text"
                                bind:value={newPet.medicalNeeds}
                                class="w-full px-4 py-2 rounded-xl border border-gray-200"
                                placeholder="Any ongoing care needs"
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
                        onclick={() => (showAddForm = false)}
                        class="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                        >Not right now</button
                    >
                    <button
                        onclick={savePet}
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
