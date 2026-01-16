<script lang="ts">
    import { fade, slide, fly } from "svelte/transition";
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
    } from "lucide-svelte";
    import {
        medicalStore,
        type MedicalDirective,
    } from "$lib/stores/medicalStore";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { estateProfile } from "$lib/stores/estateStore";
    import { activityLog } from "$lib/stores/activityLog";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";

    let showAddForm = false;
    let editMode = false;
    let newDirective: Partial<MedicalDirective> = {
        type: "healthcare_proxy",
        title: "",
        locationOfOriginal: "",
        primaryContact: "",
        contactPhone: "",
        summary: "",
    };

    let showProfileEdit = false;
    let tempProfile = {
        organDonor: $medicalStore.organDonor,
        bloodType: $medicalStore.bloodType,
        allergies: $medicalStore.allergies,
    };

    function saveProfile() {
        medicalStore.updateProfile(tempProfile);
        showProfileEdit = false;
        activityLog.logEvent({
            module: "Health & Medical",
            action: "UPDATE",
            entityType: "Medical Profile",
            entityId: "profile",
            entityName: "Health Data",
            userContext: $estateProfile.ownerName || "User",
        });
    }

    function saveDirective() {
        if (!newDirective.title) return;

        if (newDirective.id) {
            medicalStore.updateDirective(newDirective.id, newDirective);
            activityLog.logEvent({
                module: "Health & Medical",
                action: "UPDATE",
                entityType: "Medical Directive",
                entityId: newDirective.id,
                entityName: newDirective.title,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            medicalStore.addDirective(
                newDirective as Omit<MedicalDirective, "id">,
            );
            activityLog.logEvent({
                module: "Health & Medical",
                action: "CREATE",
                entityType: "Medical Directive",
                entityId: crypto.randomUUID(),
                entityName: newDirective.title,
                userContext: $estateProfile.ownerName || "User",
            });
        }

        resetForm();
    }

    function editDirective(dir: MedicalDirective) {
        newDirective = { ...dir };
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
    }

    function removeDirective(id: string) {
        if (
            !confirm(
                "Remove this directive? This should only be done if the document is revoked.",
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

<div class="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
    <!-- Header -->
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h1
                class="text-3xl font-bold text-gray-900 flex items-center gap-3"
            >
                <div class="p-3 bg-red-100 text-red-600 rounded-2xl">
                    <Heart size={32} />
                </div>
                Medical & Health Safety Net
            </h1>
            <p class="text-gray-500 mt-2">
                Critical directives and emergency instructions.
            </p>
            <div class="mt-4">
                <LegalDisclaimer
                    variant="inline"
                    title="Medical Disclaimer"
                    message="Advance Directives and DNR orders often require specific state-mandated forms, witness signatures, or notarization to be legally binding. Use this module to organize your intent, but verify compliance with local healthcare laws."
                />
            </div>
        </div>
        <button
            on:click={() => (showAddForm = true)}
            class="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
        >
            <Plus size={20} />
            Add Directive
        </button>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Life Saving Profile -->
        <div class="lg:col-span-1 space-y-8">
            <section
                class="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden overflow-hidden overflow-hidden"
            >
                <div class="p-6 bg-red-50 border-b border-red-100">
                    <h2
                        class="text-lg font-bold text-red-900 flex items-center gap-2"
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
                                        {$medicalStore.bloodType || "Not Set"}
                                    </p>
                                </div>
                                <div
                                    class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold"
                                >
                                    {$medicalStore.bloodType?.includes("+")
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
                                    {$medicalStore.allergies || "None reported"}
                                </p>
                            </div>

                            <div
                                class="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100"
                            >
                                {#if $medicalStore.organDonor}
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
                                on:click={() => {
                                    tempProfile = { ...$medicalStore };
                                    showProfileEdit = true;
                                }}
                                class="w-full py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
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
                                    class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
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
                                    class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
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
                                    on:click={saveProfile}
                                    class="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold text-sm"
                                    >Save</button
                                >
                                <button
                                    on:click={() => (showProfileEdit = false)}
                                    class="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
                                    >Cancel</button
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
                class="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4"
            >
                <Shield class="text-blue-600 mt-1 shrink-0" size={24} />
                <div>
                    <h3 class="font-bold text-blue-900">Legal Directives</h3>
                    <p class="text-sm text-blue-800 mt-1">
                        Ensure your healthcare proxies and living wills are
                        registered. These documents speak for you when you
                        cannot.
                    </p>
                </div>
            </div>

            {#each $medicalStore.directives as dir}
                <div
                    class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex gap-4">
                            <div
                                class="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-red-50 group-hover:text-red-500 transition-colors"
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
                                on:click={() => editDirective(dir)}
                                class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                on:click={() => removeDirective(dir.id)}
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

            {#if $medicalStore.directives.length === 0}
                <!-- GHOST ROWS -->
                <div class="mb-6 space-y-4">
                    {#each getSmartSamples($language).medical || [] as sample}
                        <GhostRow
                            name={sample.title}
                            subtitle={sample.summary}
                            type={sample.type === "dnr" ? "DNR" : "Proxy"}
                            onClick={() => {
                                newDirective = {
                                    ...newDirective,
                                    title: sample.title,
                                    summary: sample.summary,
                                    type:
                                        sample.type === "dnr"
                                            ? "dnr"
                                            : "healthcare_proxy",
                                };
                                showAddForm = true;
                            }}
                        >
                            <svelte:fragment slot="icon">
                                <FileText size={20} class="text-slate-400" />
                            </svelte:fragment>
                        </GhostRow>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- Add/Edit Modal -->
{#if showAddForm}
    <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        transition:fade
    >
        <div
            class="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
            transition:fly={{ y: 20 }}
        >
            <div
                class="p-8 border-b border-gray-100 flex justify-between items-center"
            >
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">
                        {newDirective.id
                            ? "Edit Directive"
                            : "Add New Directive"}
                    </h2>
                    <p class="text-gray-500">
                        Document your medical preferences.
                    </p>
                </div>
                <button
                    on:click={resetForm}
                    class="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                >
                    <Plus size={24} class="rotate-45" />
                </button>
            </div>

            <form
                on:submit|preventDefault={saveDirective}
                class="p-8 space-y-6"
            >
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Directive Type</label
                        >
                        <select
                            bind:value={newDirective.type}
                            class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="healthcare_proxy"
                                >Healthcare Proxy</option
                            >
                            <option value="living_will">Living Will</option>
                            <option value="dnr">DNR Order</option>
                            <option value="palliative_care"
                                >Palliative Care</option
                            >
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Title</label
                        >
                        <input
                            type="text"
                            bind:value={newDirective.title}
                            placeholder="e.g. Living Will 2024"
                            class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>

                <div>
                    <label
                        class="block text-xs font-bold uppercase text-gray-500 mb-1"
                        >Summary of Wishes</label
                    >
                    <textarea
                        bind:value={newDirective.summary}
                        placeholder="Key points of this directive..."
                        class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                        rows="3"
                    ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Primary Proxy/Contact</label
                        >
                        <input
                            type="text"
                            bind:value={newDirective.primaryContact}
                            placeholder="Name"
                            class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Contact Phone</label
                        >
                        <input
                            type="text"
                            bind:value={newDirective.contactPhone}
                            placeholder="(xxx) xxx-xxxx"
                            class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>

                <div>
                    <label
                        class="block text-xs font-bold uppercase text-gray-500 mb-1"
                        >Location of Original Document</label
                    >
                    <input
                        type="text"
                        bind:value={newDirective.locationOfOriginal}
                        placeholder="e.g. Top drawer in office safe"
                        class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <div class="flex gap-4 pt-4">
                    <button
                        type="button"
                        on:click={resetForm}
                        class="flex-1 py-4 px-6 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="flex-1 py-4 px-6 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 border-b-4 border-red-800 active:border-b-0 active:mt-1"
                    >
                        {newDirective.id ? "Save Changes" : "Add Directive"}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
