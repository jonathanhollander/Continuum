<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import {
        Users,
        Phone,
        Mail,
        CircleAlert,
        CircleCheck,
        Clock,
        Plus,
        User,
        Shield,
        Trash2,
        Loader2,
    } from "lucide-svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import { onMount } from "svelte";
    import ContactRow from "$lib/components/modules/contacts/ContactRow.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import * as registryRaw from "$lib/data/registry.json";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";

    // Registry Data Handling
    const registryData = (registryRaw as any).default || registryRaw;
    const registry = Array.isArray(registryData) ? registryData : [];
    const module = registry.find((m) => m.id === "contacts");
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import { conciergeEngine } from "$lib/stores/conciergeEngine";
    import {
        familyStore,
        type FamilyMember,
        type FamilyRole,
    } from "$lib/stores/familyStore.svelte";
    import { contextStore } from "$lib/stores/contextStore.svelte";
    import {
        contacts as contactsText,
        getEmptyStateMessage,
        getActionLabel,
    } from "$lib/utils/contextualMessages";
    import ContextualMessage from "$lib/components/ContextualMessage.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";

    let activeTab = $state("call-list");
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let viewMode = $state<ViewMode>('card');
    let isLoading = $state(true);

    // Use familyStore as source of truth
    let contacts = $derived(familyStore.members);

    let showAddModal = $state(false);
    let showAffirmation = $state(false);


    // Form State
    let newContact = $state<Partial<FamilyMember>>({
        role: "Family",
        notes: "",
        relation: "",
    });

    // Helper to get tier name from ID (mock logic for now or we fetch tiers map)
    // Tweak: We will filter based on tier_id existence for "Call List"
    // Derived: Pulse Tiers (Simulated filtering based on naming convention for now since backend returns flat list)
    // We assume the API returns contacts with a 'tier' string field like "1_Immediate" if not "tier_id"
    // Adjusting based on `GhostRow` usage which sets `tier: "2_SameDay"`
    let tier1 = $derived(
        contacts.filter(
            (c: FamilyMember) => c.tier?.startsWith("1") || c.tierId === 1,
        ),
    );
    let tier2 = $derived(
        contacts.filter(
            (c: FamilyMember) => c.tier?.startsWith("2") || c.tierId === 2,
        ),
    );
    let tier3 = $derived(
        contacts.filter(
            (c: FamilyMember) => c.tier?.startsWith("3") || c.tierId === 3,
        ),
    );

    let callList = $derived(
        contacts.filter((c: FamilyMember) => c.tier || c.tierId),
    );

    // AI Intake Integration
    $effect(() => {
        const rawData = $conciergeEngine.lastExtractedData;
        if (!rawData) return;

        // Unified normalization for various AI output flavors
        const data =
            rawData.family_member ||
            rawData.Contact ||
            rawData.contact ||
            rawData;

        // Map keys flexibly (handle 'Relationship' vs 'relation' etc)
        const name = data.name || data.Name;
        const relation =
            data.relation ||
            data.relationship ||
            data.Relationship ||
            data.Relation;
        const phone = data.phone || data.Phone;
        const email = data.email || data.Email;
        const notes = data.notes || data.Notes;

        if (name || relation || phone) {
            if (!showAddModal) showAddModal = true;
            newContact = {
                ...newContact,
                name: name || newContact.name,
                relation: relation || newContact.relation,
                role: (relation || newContact.role) as FamilyRole,
                phone: phone || newContact.phone,
                email: email || newContact.email,
                notes: notes || newContact.notes,
            };
        }
    });

    onMount(async () => {
        // Initial sync
        await familyStore.sync();
        isLoading = false;
    });

    async function addContact() {
        if (!newContact.name) return;

        // Default values for new contact
        const contactToAdd: Omit<FamilyMember, "id"> = {
            name: newContact.name,
            role: newContact.role || "Friend",
            relation: newContact.relation || "",
            phone: newContact.phone,
            email: newContact.email,
            notes: newContact.notes,
            isExecutor: false,
            isBeneficiary: false,
            isEmergencyContact: false,
            tierId: null, // Don't enforce tier until selected
            tier: "1_Immediate", // Simulation default
            notificationStatus: "Pending",
            avatar: newContact.avatar,
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };

        // familyStore handles generation of ID and Sync
        await familyStore.addMember(contactToAdd);

        showAddModal = false;
        newContact = { role: "Family", notes: "", relation: "" };
        parsedCustomAttributes = {};
        showAffirmation = true;
    }

    async function deleteContact(id: number | string) {
        if (
            !confirm(
                "Remove this contact? You can always add them back later if needed.",
            )
        )
            return;
        familyStore.removeMember(id);
    }

    function updateStatus(id: number | string, status: string) {
        familyStore.updateMember(id, { notificationStatus: status });
    }
</script>

{#if module}
    <LivingBlueprintHeader
        title={module.title}
        subtitle={contextStore.isExecutor
            ? "Important contacts and relationships to notify or consult"
            : contextStore.isFamily
              ? "Family and friends connected to the estate"
              : module.description}
        tier={module.role === "owner" ? "preparation" : "executor"}
        detailedDescription="This is more than a contact list—it's your circle of trust. Identify who should be notified and who can help with specific aspects of your estate, from lawyers to close friends."
        whyMatters="In a crisis, your family needs to know exactly who to turn to. Having updated contact information for your support network removes the panic of 'who do I call?'"
    />
{/if}

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
    <div class="flex justify-end items-center gap-4 mb-8">
        <DataViewToggle module="contacts" onchange={(mode) => viewMode = mode} />
        <button
            onclick={() => (showAddModal = true)}
            class="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
        >
            <Plus size={18} />
            <ContextualMessage
                variants={{
                    planning: "Share contact details",
                    executor: "Share contact details",
                    family: "Share contact details",
                }}
            />
        </button>
    </div>

    <!-- Affirmation Message -->
    <Affirmation module="contacts" bind:show={showAffirmation} />

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div
            class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
        >
            <div>
                <div class="text-xs font-bold uppercase text-slate-400">
                    Total Network
                </div>
                <div class="text-2xl font-bold text-slate-800">
                    {contacts.length}
                </div>
            </div>
            <Users class="text-slate-200" size={32} />
        </div>
        <div
            class="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between"
        >
            <div>
                <div class="text-xs font-bold uppercase text-rose-400">
                    Pending Immediate
                </div>
                <div class="text-2xl font-bold text-rose-700">
                    {tier1.filter((c) =>
                        ["Pending", "Called", "LeftMsg"].includes(
                            c.notificationStatus,
                        ),
                    ).length}
                </div>
            </div>
            <CircleAlert class="text-rose-300" size={32} />
        </div>
        <div
            class="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between"
        >
            <div>
                <div class="text-xs font-bold uppercase text-green-600">
                    Notifications Confirmed
                </div>
                <div class="text-2xl font-bold text-green-700">
                    {contacts.filter((c) => c.notificationStatus === "Notified")
                        .length}
                </div>
            </div>
            <CircleCheck class="text-green-300" size={32} />
        </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b border-slate-200 pb-1">
        <button
            onclick={() => (activeTab = "call-list")}
            class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
            {activeTab === 'call-list'
                ? 'border-rose-500 text-rose-600 bg-rose-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
        >
            The Call List
        </button>
        <button
            onclick={() => (activeTab = "directory")}
            class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
            {activeTab === 'directory'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
        >
            Full Directory
        </button>
    </div>

    <!-- Content -->
    <div class="min-h-[500px]">
        {#if contacts.length === 0}
            <EmptyState
                title={contextStore.isExecutor
                    ? "Contact Directory Empty"
                    : contextStore.isFamily
                      ? "No Contacts Yet"
                      : "Your circle of trust"}
                whyMatters={contextStore.isExecutor
                    ? "<strong>Contact information is essential for estate administration.</strong> If no contacts were recorded, you may need to gather this information from other sources such as phone records, address books, or family members.<br/><br/>Building this directory will help ensure all necessary parties are properly notified and consulted."
                    : contextStore.isFamily
                      ? "<strong>Contact information will be helpful for coordinating with family and friends.</strong> This directory will be populated as information becomes available.<br/><br/>If you have contact details to contribute, you can add them here."
                      : "<strong>These are the people who should be notified, who can help, who need to know.</strong> Without this list, your family won't know who your lawyer is, who has your keys, or who should be at your bedside.<br/><br/>Creating this directory is a gift to whoever handles your affairs—they won't have to search through old emails or guess who matters to you. Each person you add here removes one more burden from their shoulders."}
                encouragement={contextStore.isExecutor
                    ? "Begin gathering contact information at your own pace."
                    : contextStore.isFamily
                      ? "Add contacts as information becomes available."
                      : "Start with just one person—maybe your executor, spouse, or closest friend. You can build this over time."}
                icon={Users}
                iconClass="text-primary"
                ctaLabel={getActionLabel("add")}
                onAction={() => (showAddModal = true)}
            />
        {:else if activeTab === "call-list"}
            <div in:fade class="space-y-8 max-w-4xl mx-auto">
                <div
                    class="bg-primary/5 p-4 rounded-xl text-primary text-sm flex gap-3 border border-primary/10"
                >
                    <Shield class="shrink-0" size={20} />
                    <p>
                        <strong>Caller Strategy:</strong> This specific order is
                        designed to prevent bad news from spreading via social media
                        before key people are informed directly.
                    </p>
                </div>

                <!-- TIER 1 -->
                <div class="space-y-4">
                    <div
                        class="flex items-center gap-2 text-rose-600 border-b border-rose-100 pb-2"
                    >
                        <CircleAlert size={20} />
                        <h2 class="font-bold text-lg">
                            Tier 1: Immediate Notification
                        </h2>
                        <span
                            class="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full"
                            >Call Now</span
                        >
                    </div>
                    {#if tier1.length === 0}
                        <div
                            class="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200"
                        >
                            No immediate contacts set.
                        </div>
                    {/if}

                    {#each tier1 as contact}
                        <ContactRow {contact} {updateStatus} />
                    {/each}
                </div>

                <!-- TIER 2 -->
                <div class="space-y-4 pt-4">
                    <div
                        class="flex items-center gap-2 text-orange-600 border-b border-orange-100 pb-2"
                    >
                        <Clock size={20} />
                        <h2 class="font-bold text-lg">
                            Tier 2: Same Day (Inner Circle)
                        </h2>
                    </div>
                    {#if tier2.length === 0}
                        <div
                            class="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200"
                        >
                            No Tier 2 contacts found.
                        </div>
                    {/if}

                    {#each tier2 as contact}
                        <ContactRow {contact} {updateStatus} />
                    {/each}
                </div>
                <!-- TIER 3 -->
                <div class="space-y-4 pt-4">
                    <div
                        class="flex items-center gap-2 text-slate-600 border-b border-slate-100 pb-2"
                    >
                        <Mail size={20} />
                        <h2 class="font-bold text-lg">
                            Tier 3: Service Notice
                        </h2>
                    </div>
                    {#if tier3.length === 0}
                        <div
                            class="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200"
                        >
                            No Tier 3 contacts found.
                        </div>
                    {/if}
                    {#each tier3 as contact}
                        <ContactRow {contact} {updateStatus} />
                    {/each}
                </div>
            </div>
        {:else}
            <!-- Directory View -->
            {#if viewMode === 'card'}
                <!-- Card Grid -->
                <div
                    in:fade
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {#each contacts as contact}
                        <div
                            class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all group relative"
                        >
                            <button
                                onclick={() => deleteContact(contact.id)}
                                class="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div class="flex items-center gap-3 mb-4">
                                <div
                                    class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
                                >
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 class="font-bold text-slate-800 text-lg">
                                        {contact.name}
                                    </h3>
                                    <div
                                        class="text-xs text-slate-500 font-bold uppercase flex items-center gap-1"
                                    >
                                        {contact.role}
                                        {#if contact.relation}• {contact.relation}{/if}
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2 text-sm text-slate-600">
                                {#if contact.phone}
                                    <div
                                        class="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"
                                    >
                                        <Phone size={14} class="text-slate-400" />
                                        {contact.phone}
                                    </div>
                                {/if}
                                {#if contact.email}
                                    <div
                                        class="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"
                                    >
                                        <Mail size={14} class="text-slate-400" />
                                        {contact.email}
                                    </div>
                                {/if}
                            </div>

                            <div
                                class="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center"
                            >
                                <span
                                    class="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500"
                                    >{contact.tier?.split("_")[1] || "Unassigned"}</span
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <!-- Table View -->
                <div in:fade class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Name</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Role</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Phone</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Email</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Tier</th>
                                <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            {#each contacts as contact}
                                <tr class="hover:bg-slate-50 transition-colors group">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                <User size={16} />
                                            </div>
                                            <span class="font-medium text-slate-800">{contact.name}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-slate-600">
                                        {contact.role}{#if contact.relation} ({contact.relation}){/if}
                                    </td>
                                    <td class="px-4 py-3 text-sm text-slate-600">{contact.phone || '-'}</td>
                                    <td class="px-4 py-3 text-sm text-slate-600">{contact.email || '-'}</td>
                                    <td class="px-4 py-3">
                                        <span class="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">
                                            {contact.tier?.split("_")[1] || "Unassigned"}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <button
                                            onclick={() => deleteContact(contact.id)}
                                            class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Add Modal -->
    <Modal
        bind:open={showAddModal}
        title="Who should we include?"
        description="This person matters to you. By adding them here, you're ensuring they'll be included when the time comes—whether that means being notified, consulted, or simply remembered."
        maxWidth="max-w-lg"
    >
        <div class="space-y-4">
            <div class="relative group">
                <input
                    bind:value={newContact.name}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 transition-all {$conciergeEngine
                        .lastExtractedData?.name ||
                    $conciergeEngine.lastExtractedData?.family_member
                        ?.name
                        ? 'amber-glow border-amber-500/50'
                        : 'focus:border-primary focus:ring-2 focus:ring-primary/20'} outline-none"
                    placeholder="Full Name"
                />
                {#if $conciergeEngine.lastExtractedData?.name || $conciergeEngine.lastExtractedData?.family_member?.name}
                    <div
                        class="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm animate-bounce"
                    >
                        AI
                    </div>
                {/if}
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="relative group">
                    <input
                        bind:value={newContact.relation}
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 transition-all outline-none {$conciergeEngine
                            .lastExtractedData?.relationship ||
                        $conciergeEngine.lastExtractedData
                            ?.family_member?.relationship
                            ? 'amber-glow border-amber-500/50'
                            : 'focus:border-primary focus:ring-2 focus:ring-primary/20'}"
                        placeholder="Relation (e.g. Spouse)"
                    />
                </div>
                <select
                    bind:value={newContact.role}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white transition-all outline-none {$conciergeEngine
                        .lastExtractedData?.relationship ||
                    $conciergeEngine.lastExtractedData?.family_member
                        ?.relationship
                        ? 'amber-glow border-amber-500/50'
                        : 'focus:border-primary focus:ring-2 focus:ring-primary/20'}"
                >
                    <option>Family</option>
                    <option>Friend</option>
                    <option>Medical</option>
                    <option>Legal</option>
                    <option>Financial</option>
                    <option>Other</option>
                    <option>Pet</option>
                </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <input
                    bind:value={newContact.phone}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 transition-all outline-none {$conciergeEngine
                        .lastExtractedData?.phone ||
                    $conciergeEngine.lastExtractedData?.family_member
                        ?.phone
                        ? 'amber-glow border-amber-500/50'
                        : 'focus:border-primary focus:ring-2 focus:ring-primary/20'}"
                    placeholder="Phone"
                />
                <input
                    bind:value={newContact.email}
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 transition-all outline-none {$conciergeEngine
                        .lastExtractedData?.email ||
                    $conciergeEngine.lastExtractedData?.family_member
                        ?.email
                        ? 'amber-glow border-amber-500/50'
                        : 'focus:border-primary focus:ring-2 focus:ring-primary/20'}"
                    placeholder="Email"
                />
            </div>

            <div
                class="bg-primary/5 p-4 rounded-xl border border-primary/10"
            >
                <label
                    for="contact-tier"
                    class="block text-xs font-bold uppercase text-primary mb-2"
                    >When Should They Know?</label
                >
                <select
                    id="contact-tier"
                    bind:value={newContact.tier}
                    class="w-full px-4 py-3 rounded-xl border border-primary/20 bg-white shadow-sm focus:border-primary outline-none"
                >
                    <option value="1_Immediate"
                        >First Call — Someone who should hear it from
                        family, not others</option
                    >
                    <option value="2_SameDay"
                        >Same Day — Close enough to be told directly</option
                    >
                    <option value="3_Service"
                        >Extended Circle — Can learn through
                        announcement</option
                    >
                    <option value="4_DNR">No Notification Needed</option
                    >
                </select>
                <p class="text-xs text-indigo-500 mt-2">
                    Think about how they'd want to hear the news. The
                    people closest to you deserve to be told directly,
                    not find out on social media.
                </p>
            </div>

            <div class="space-y-1">
                <SmartTextarea
                    bind:value={newContact.notes}
                    context="contact"
                    placeholder="Private notes for the caller (e.g. 'Be gentle, they are fragile')"
                    label="Caller Notes"
                    minHeight="100px"
                />
            </div>

            <!-- Custom Fields -->
            <div class="pt-4 mt-4 border-t border-slate-100">
                <CustomFieldsManager
                    entityType="contact"
                    bind:data={parsedCustomAttributes}
                />
            </div>

            <!-- Footer buttons -->
            <div class="-mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-6">
                <button
                    onclick={() => (showAddModal = false)}
                    class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    Not right now
                </button>
                <button
                    onclick={addContact}
                    class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                    Include this person
                </button>
            </div>
        </div>
    </Modal>
</div>
{/if}
