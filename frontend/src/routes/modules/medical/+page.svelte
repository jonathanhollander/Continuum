<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { onMount } from "svelte";
    import {
        Heart,
        Shield,
        FileText,
        Phone,
        Plus,
        Trash2,
        Pencil,
        Activity,
        CircleAlert,
        CircleCheck,
        User,
        Loader2,
    } from "lucide-svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import {
        medicalStore,
        type MedicalDirective,
    } from "$lib/stores/medicalStore.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import GriefSupportBanner from "$lib/components/GriefSupportBanner.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";

    let showAddForm = $state(false);
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let editMode = $state(false);
    let showAffirmation = $state(false);
    let isLoading = $state(true);
    let viewMode = $state<ViewMode>('card');
    let newDirective: Partial<MedicalDirective> = $state({
        type: "healthcare_proxy",
        title: "",
        locationOfOriginal: "",
        primaryContact: "",
        contactPhone: "",
        summary: "",
    });

    let showProfileEdit = $state(false);
    let tempProfile = $state({
        organDonor: medicalStore.profile.organDonor,
        bloodType: medicalStore.profile.bloodType,
        allergies: medicalStore.profile.allergies,
    });

    // Reactive profile derived from store subscription for display
    let currentProfile = $state(medicalStore.profile);

    // Sync medical data on mount and update reactive profile
    onMount(async () => {
        await medicalStore.sync();
        isLoading = false;
        // Subscribe to store changes to update reactive profile
        return medicalStore.subscribe(() => {
            currentProfile = medicalStore.profile;
        });
    });

    function saveProfile() {
        medicalStore.updateProfile(tempProfile);
        showProfileEdit = false;
        showAffirmation = true;
        activityLog.logEvent({
            module: "Health & Medical",
            action: "UPDATE",
            entityType: "Medical Profile",
            entityId: "profile",
            entityName: "Health Data",
            userContext: estateProfile.current.ownerName || "User",
        });
    }

    function saveDirective() {
        if (!newDirective.title) return;

        const directiveData = {
            ...newDirective,
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };

        if (newDirective.id) {
            medicalStore.updateDirective(newDirective.id, directiveData);
            activityLog.logEvent({
                module: "Health & Medical",
                action: "UPDATE",
                entityType: "Medical Directive",
                entityId: String(newDirective.id),
                entityName: newDirective.title || "",
                userContext: estateProfile.current.ownerName || "User",
            });
        } else {
            medicalStore.addDirective(
                directiveData as Omit<MedicalDirective, "id">,
            );
            activityLog.logEvent({
                module: "Health & Medical",
                action: "CREATE",
                entityType: "Medical Directive",
                entityId: crypto.randomUUID(),
                entityName: newDirective.title || "",
                userContext: estateProfile.current.ownerName || "User",
            });
        }

        showAffirmation = true;
        resetForm();
    }

    function editDirective(dir: MedicalDirective) {
        newDirective = { ...dir };
        try {
            parsedCustomAttributes = JSON.parse(dir.custom_attributes || "{}");
        } catch {
            parsedCustomAttributes = {};
        }
        showAddForm = true;
    }

    function resetForm() {
        showAddForm = false;
        newDirective = {
            type: "healthcare_proxy",
            title: "",
            locationOfOriginal: "",
            primaryContact: "",
            contactPhone: "",
            summary: "",
        };
        parsedCustomAttributes = {};
    }

    function removeDirective(id: string | number) {
        if (
            !confirm(
                "Remove this directive? This should only be done if the document has been revoked.",
            )
        )
            return;
        medicalStore.removeDirective(id);
    }

    const typeLabels: Record<string, string> = {
        healthcare_proxy: "Healthcare Proxy",
        living_will: "Living Will",
        dnr: "DNR Orders",
        palliative_care: "Palliative care",
        other: "Other Directive",
    };
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
    <!-- Header -->
    <LivingBlueprintHeader
        title="Your Voice at the End of Life"
        subtitle="Ensure your values are honored when you can't speak for yourself"
        tier="preparation"
        detailedDescription="Your voice in healthcare decisions matters, even when you can't speak for yourself. Document your directives and medical history to guide your advocates."
        whyMatters="Medical uncertainty places a heavy burden on families. Clear directives relieve them of agonizing guessing games and ensure your care aligns with your values."
    >
        <button
            onclick={() => (showAddForm = true)}
            class="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
        >
            <Plus size={20} />
            Save my medical wishes
        </button>
    </LivingBlueprintHeader>

    <!-- View Toggle -->
    <div class="flex justify-end mb-4">
        <DataViewToggle module="medical" onchange={(mode) => viewMode = mode} />
    </div>

    <div class="max-w-3xl">
        <GriefSupportBanner compact={true} />
    </div>

    <!-- Affirmation Message -->
    <Affirmation module="medical" bind:show={showAffirmation} />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Life Saving Profile -->
        <div class="lg:col-span-1 space-y-8">
            <section
                class="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden"
            >
                <div class="p-6 bg-primary/5 border-b border-primary/10">
                    <h2
                        class="text-lg font-bold text-primary flex items-center gap-2"
                    >
                        <Activity size={20} />
                        Emergency Profile
                    </h2>
                </div>
                <div class="p-6 space-y-6">
                    {#if !showProfileEdit}
                        <div class="space-y-4">
                            <div
                                class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"
                            >
                                <div>
                                    <p
                                        class="text-xs font-bold uppercase text-gray-400"
                                    >
                                        Blood Type
                                    </p>
                                    <p class="text-xl font-bold text-gray-900">
                                        {medicalStore.profile.bloodType ||
                                            "Not Set"}
                                    </p>
                                </div>
                                <div
                                    class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold"
                                >
                                    {medicalStore.profile.bloodType?.includes(
                                        "+",
                                    )
                                        ? "+"
                                        : "-"}
                                </div>
                            </div>

                            <div
                                class="p-4 bg-orange-50 rounded-2xl border border-orange-100"
                            >
                                <p
                                    class="text-xs font-bold uppercase text-orange-400 mb-1"
                                >
                                    Critical Allergies
                                </p>
                                <p class="text-sm font-medium text-orange-900">
                                    {medicalStore.profile.allergies ||
                                        "None reported"}
                                </p>
                            </div>

                            <div
                                class="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100"
                            >
                                {#if currentProfile.organDonor}
                                    <CircleCheck
                                        class="text-blue-600"
                                        size={20}
                                    />
                                    <p class="text-sm font-bold text-blue-900">
                                        Organ Donor Enrollment Active
                                    </p>
                                {:else}
                                    <CircleAlert
                                        class="text-blue-400"
                                        size={20}
                                    />
                                    <p class="text-sm font-bold text-blue-900">
                                        Organ Donor Status Unknown
                                    </p>
                                {/if}
                            </div>

                            <button
                                onclick={() => {
                                    tempProfile = { ...medicalStore.profile };
                                    showProfileEdit = true;
                                }}
                                class="w-full py-3 text-primary hover:bg-primary/5 rounded-xl transition-colors font-bold text-sm"
                            >
                                Update Profile
                            </button>
                        </div>
                    {:else}
                        <div class="space-y-4" in:slide>
                            <div>
                                <label
                                    class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                    >Blood Type</label
                                >
                                <select
                                    bind:value={tempProfile.bloodType}
                                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                >
                                    <option value="">Unknown</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                    >Critical Allergies</label
                                >
                                <textarea
                                    bind:value={tempProfile.allergies}
                                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    rows="3"
                                    placeholder="Latex, Penicillin, Peanuts..."
                                ></textarea>
                            </div>
                            <div class="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    bind:checked={tempProfile.organDonor}
                                    id="donor-check"
                                />
                                <label
                                    for="donor-check"
                                    class="text-sm font-medium text-gray-700"
                                    >Enrolled Organ Donor</label
                                >
                            </div>
                            <div class="flex gap-2">
                                <button
                                    onclick={saveProfile}
                                    class="flex-1 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
                                    >Save my updates</button
                                >
                                <button
                                    onclick={() => (showProfileEdit = false)}
                                    class="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
                                    >Not right now</button
                                >
                            </div>
                        </div>
                    {/if}
                </div>
            </section>
        </div>

        <!-- Directives List -->
        <div class="lg:col-span-2 space-y-6">
            <div
                class="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4"
            >
                <Shield class="text-primary mt-1 shrink-0" size={24} />
                <div>
                    <h3 class="font-bold text-primary text-lg">
                        Your End-of-Life Voice
                    </h3>
                    <p class="text-sm text-primary/80 mt-1 leading-relaxed">
                        Providing clear guidance for your medical care is a gift
                        to your family. It removes the burden of uncertainty and
                        ensures your wishes are honored with dignity.
                    </p>
                </div>
            </div>

            {#each medicalStore.directives as dir}
                <div
                    class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex gap-4">
                            <div
                                class="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-primary/5 group-hover:text-primary transition-colors"
                            >
                                <FileText size={24} />
                            </div>
                            <div>
                                <span
                                    class="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                >
                                    {typeLabels[dir.type]}
                                </span>
                                <h3
                                    class="text-xl font-bold text-gray-900 mt-1"
                                >
                                    {dir.title}
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">
                                    {dir.summary}
                                </p>
                            </div>
                        </div>

                        <div class="flex gap-1">
                            <button
                                onclick={() => editDirective(dir)}
                                class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                onclick={() => removeDirective(dir.id)}
                                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div class="mt-6 grid grid-cols-2 gap-4">
                        <div
                            class="p-4 bg-gray-50 rounded-2xl border border-gray-100"
                        >
                            <span
                                class="text-[10px] font-black uppercase text-gray-400 block mb-1"
                                >Primary Contact / Proxy</span
                            >
                            <p class="text-sm font-bold text-gray-900">
                                {dir.primaryContact}
                            </p>
                            <p
                                class="text-xs text-gray-500 flex items-center gap-1 mt-1"
                            >
                                <Phone size={12} />
                                {dir.contactPhone}
                            </p>
                        </div>
                        <div
                            class="p-4 bg-gray-50 rounded-2xl border border-gray-100"
                        >
                            <span
                                class="text-[10px] font-black uppercase text-gray-400 block mb-1"
                                >Location of Original</span
                            >
                            <p class="text-sm font-bold text-gray-900">
                                {dir.locationOfOriginal}
                            </p>
                        </div>
                    </div>
                </div>
            {/each}

            {#if medicalStore.directives.length === 0}
                <EmptyState
                    title="Your healthcare wishes matter"
                    whyMatters="<strong>Without advance directives, doctors and family members must guess what you would want during a medical crisis.</strong> This creates agonizing decisions for loved ones who are already suffering.<br/><br/>Documenting your healthcare wishes—whether it's a healthcare proxy, living will, or DNR—gives them clarity, legal authority, and peace of mind. They'll know they're honoring your choices, not making impossible decisions on your behalf."
                    encouragement="When you're ready, start with just one directive. You can always add more later."
                    icon={Shield}
                    iconClass="text-primary"
                    ctaLabel="Share my wishes"
                    onAction={() => (showAddForm = true)}
                />
                <!-- GHOST ROWS (Hidden, keeping for reference) -->
                <div class="mb-6 space-y-4 hidden">
                    {#each getSmartSamples($language).medical || [] as sample}
                        <GhostRow
                            name={sample.title}
                            subtitle={sample.summary}
                            type={sample.type === "dnr" ? "DNR" : "Proxy"}
                            onclick={() => {
                                newDirective = {
                                    ...newDirective,
                                    title: sample.title,
                                    type: sample.type as any,
                                    locationOfOriginal:
                                        sample.locationOfOriginal,
                                    summary: sample.summary,
                                };
                                showAddForm = true;
                            }}
                        >
                            {#snippet icon()}
                                <div
                                    class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"
                                >
                                    <FileText size={20} />
                                </div>
                            {/snippet}
                        </GhostRow>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- Add/Edit Modal -->
<Modal
    bind:open={showAddForm}
    title={newDirective.id ? "Share Your Voice" : "Who should hear your voice?"}
    description="These choices reflect your values and ensure you're cared for exactly as you wish. It's okay to take your time."
    maxWidth="max-w-lg"
>
    <form
        onsubmit={(e) => {
            e.preventDefault();
            saveDirective();
        }}
        class="space-y-6"
    >
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >Directive Type</label
                >
                <select
                    bind:value={newDirective.type}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                    <option value="healthcare_proxy">Healthcare Proxy</option>
                    <option value="living_will">Living Will</option>
                    <option value="dnr">DNR Order</option>
                    <option value="palliative_care">Palliative Care</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >Title</label
                >
                <input
                    type="text"
                    bind:value={newDirective.title}
                    placeholder="e.g. Living Will 2024"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
            </div>
        </div>

        <div>
            <label
                class="block text-xs font-bold uppercase text-slate-500 mb-1"
                >Summary of Wishes</label
            >
            <textarea
                bind:value={newDirective.summary}
                placeholder="Key points of this directive..."
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                rows="3"
            ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >Primary Proxy/Contact</label
                >
                <input
                    type="text"
                    bind:value={newDirective.primaryContact}
                    placeholder="e.g. Dr. Sarah Chen"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
            </div>
            <div>
                <label
                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                    >Contact Phone</label
                >
                <input
                    type="text"
                    bind:value={newDirective.contactPhone}
                    placeholder="e.g. +1 (555) 000-0000"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
            </div>
        </div>

        <div>
            <label
                class="block text-xs font-bold uppercase text-slate-500 mb-1"
                >Location of Original Document</label
            >
            <input
                type="text"
                bind:value={newDirective.locationOfOriginal}
                placeholder="e.g. Safe deposit box at First National Bank"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
        </div>

        <!-- Custom Fields -->
        <div class="pt-4 mt-4 border-t border-slate-100">
            <CustomFieldsManager
                entityType="medical"
                bind:data={parsedCustomAttributes}
            />
        </div>

        <div class="flex gap-4 pt-4">
            <button
                type="button"
                onclick={resetForm}
                class="flex-1 py-3 px-6 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
                Not right now
            </button>
            <button
                type="submit"
                class="flex-1 py-3 px-6 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
                {newDirective.id
                    ? "Save my updates"
                    : "Include this directive"}
            </button>
        </div>
    </form>
</Modal>
{/if}
