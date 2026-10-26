<script lang="ts">
    import { onMount } from "svelte";
    import { focusTrap } from "$lib/actions/focusTrap";
    import {
        Users,
        Plus,
        Trash2,
        Check,
        Pencil,
        Settings2,
        BellRing,
        X,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { apiGet, apiPut } from "$lib/api/client";
    import { contactSync } from "$lib/stores/familyStore.svelte";

    let {
        userId = 1,
        showHeader = true,
        viewMode = "combined" as "combined" | "contacts" | "escalation",
    } = $props();

    let tiers = $state<any[]>([]);
    let contacts = $state<any[]>([]);
    let editingTierId = $state<number | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    const gentleRetry = "Let's try that once more in a moment.";

    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        loading = true;
        error = null;
        try {
            const [tiersData, contactsData] = await Promise.all([
                apiGet("/api/pulse/tiers"),
                apiGet("/api/pulse/contacts"),
            ]);
            tiers = tiersData;
            contacts = contactsData;
        } catch (e: any) {
            console.error(e);
            error = e?.message || gentleRetry;
        } finally {
            loading = false;
        }
    }

    async function updateTier(tier: any) {
        try {
            await apiPut(`/api/pulse/tiers/${tier.id}`, tier);
            editingTierId = null;
        } catch (e) {
            console.error(e);
            alert(gentleRetry);
        }
    }

    // Send only the fields this page edits, so stored legacy values elsewhere on the row stay untouched.
    async function updateContact(contact: any) {
        try {
            await apiPut(`/api/pulse/contacts/${contact.id}`, {
                individual_delay_hours:
                    contact.individual_delay_hours === "" ||
                    contact.individual_delay_hours == null
                        ? null
                        : Number(contact.individual_delay_hours),
                notify_on_safety_timer: !!contact.notify_on_safety_timer,
            });
            contacts = [...contacts];
        } catch (e) {
            console.error(e);
            alert(gentleRetry);
        }
    }

    let showAddGuardianModal = $state(false);
    let globalContacts = $state<any[]>([]);
    let targetTierId = $state<number | null>(null);
    let selectedContactId = $state<number | null>(null);

    async function openAddGuardianModal(tierId: number) {
        targetTierId = tierId;
        try {
            globalContacts = await apiGet("/api/contacts");
            showAddGuardianModal = true;
        } catch (e) {
            console.error(e);
            alert(gentleRetry);
        }
    }

    async function promoteContact() {
        if (!selectedContactId || !targetTierId) return;
        try {
            await apiPut(`/api/contacts/${selectedContactId}`, {
                tier_id: targetTierId,
            });
            await loadData();
            showAddGuardianModal = false;
            selectedContactId = null;
        } catch (e) {
            console.error(e);
            alert(gentleRetry);
        }
    }

    async function deleteContact(contactId: number) {
        if (!confirm("Remove this contact from your Pulse network? You can add them back later.")) return;
        // Through the shared contacts SyncManager, so its saved copy drops this person too;
        // otherwise its next sync would see the server empty and upload them again.
        // On failure it shows its own gentle message and keeps the person listed.
        await contactSync.delete(contactId);
        if (contactSync.status !== "error") {
            contacts = contacts.filter((c) => c.id !== contactId);
        }
    }

    function getContactsForTier(tierId: number) {
        return contacts.filter((c) => c.tier_id === tierId);
    }
</script>

<div class="space-y-4" id="contacts-section">
    {#if showHeader}
        <div class="flex items-center justify-between">
            <h3
                class="text-lg font-medium text-slate-200 flex items-center gap-2"
            >
                <Users class="w-5 h-5 text-slate-400" />
                {viewMode === "escalation"
                    ? "Escalation Protocol"
                    : "Trusted Contacts"}
            </h3>
            {#if viewMode !== "contacts"}
                <div
                    class="text-[10px] uppercase tracking-widest text-slate-500 font-bold"
                >
                    Individual Nudge Settings Active
                </div>
            {/if}
        </div>
    {/if}

    {#if error}
        <div
            class="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm flex items-center gap-3"
        >
            <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div>
                <strong>Your circle is taking a moment to load.</strong>
                <br />
                <span class="text-xs opacity-75">{gentleRetry}</span>
            </div>
            <button
                onclick={loadData}
                class="ml-auto text-xs bg-red-500/20 px-3 py-1 rounded hover:bg-red-500/30 transition-colors"
                >Try again</button
            >
        </div>
    {/if}

    <div class="space-y-6">
        {#if loading}
            <div
                class="h-40 bg-slate-900/50 rounded-2xl animate-pulse flex items-center justify-center"
            >
                <span class="text-slate-500 text-sm font-medium animate-bounce"
                    >Loading Protocols...</span
                >
            </div>
        {:else if tiers.length === 0 && !error}
            <div
                class="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed"
            >
                <p class="text-slate-500 mb-4 font-medium">
                    No Escalation Tiers Found
                </p>
                <button
                    onclick={loadData}
                    class="bg-teal-500/10 text-teal-400 hover:text-teal-300 hover:bg-teal-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >Initialize Protocols</button
                >
            </div>
        {:else if contacts.length === 0 && !loading && !error}
            <!-- EMPTY STATE: NO CONTACTS -->
            <div
                class="text-center py-16 bg-slate-900/30 rounded-[2rem] border border-slate-800 border-dashed backdrop-blur-sm"
            >
                <div
                    class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <Users class="w-8 h-8 text-slate-500" />
                </div>

                {#if viewMode === "escalation"}
                    <h3 class="text-xl font-serif text-slate-200 mb-2">
                        No Guardians Configured
                    </h3>
                    <p
                        class="text-slate-400 max-w-sm mx-auto mb-8 text-sm leading-relaxed"
                    >
                        You need to add Trusted Contacts before you can
                        configure their escalation logic.
                    </p>
                    <a
                        href="/modules/pulse/contacts"
                        class="inline-flex items-center gap-2 bg-teal-500 text-slate-950 px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-400 transition-colors"
                    >
                        <Users class="w-4 h-4" /> Go to Trusted Contacts
                    </a>
                {:else}
                    <h3 class="text-xl font-serif text-slate-200 mb-2">
                        Build Your Circle
                    </h3>
                    <p
                        class="text-slate-400 max-w-sm mx-auto mb-8 text-sm leading-relaxed"
                    >
                        Add your first Trusted Contact to start protecting your
                        legacy.
                    </p>
                    <button
                        onclick={() => openAddGuardianModal(tiers[0]?.id || 1)}
                        class="inline-flex items-center gap-2 bg-teal-500 text-slate-950 px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-400 transition-colors"
                    >
                        <Plus class="w-4 h-4" /> Add First Guardian
                    </button>
                {/if}
            </div>
        {:else}
            {#each tiers as tier (tier.id)}
                <div
                    class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm"
                >
                    <div
                        class="bg-slate-800/30 px-6 py-3 flex justify-between items-center border-b border-slate-800"
                    >
                        <div class="flex items-center gap-3">
                            <span
                                class="text-xs font-bold text-teal-500 uppercase tracking-wider"
                                >Tier {tier.tier_number}</span
                            >
                            {#if editingTierId === tier.id}
                                <div class="flex items-center gap-2">
                                    <input
                                        type="number"
                                        aria-label="hours"
                                        class="w-12 bg-slate-900 border border-teal-500/50 rounded px-1 py-0.5 text-xs text-white"
                                        bind:value={tier.delay_hours}
                                    />
                                    <span class="text-[10px] text-slate-500"
                                        >hours</span
                                    >
                                    <button
                                        onclick={() => updateTier(tier)}
                                        aria-label="Save"
                                        class="text-emerald-400 hover:text-emerald-300"
                                    >
                                        <Check class="w-3 h-3" />
                                    </button>
                                </div>
                            {:else if viewMode !== "contacts"}
                                <button
                                    type="button"
                                    class="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-2 cursor-pointer hover:border-teal-500/30 transition-colors"
                                    onclick={() => (editingTierId = tier.id)}
                                >
                                    +{tier.delay_hours}h default
                                    <Pencil class="w-2 h-2" />
                                </button>
                            {:else}
                                <span
                                    class="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700"
                                >
                                    +{tier.delay_hours}h delay
                                </span>
                            {/if}
                        </div>
                        {#if viewMode !== "escalation"}
                            <button
                                onclick={() => openAddGuardianModal(tier.id)}
                                class="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1 font-bold"
                            >
                                <Plus class="w-3 h-3" /> Add Guardian
                            </button>
                        {/if}
                    </div>
                    <div class="p-2 space-y-2">
                        {#each getContactsForTier(tier.id) as contact (contact.id)}
                            <div
                                class="bg-slate-950/30 border border-slate-800/50 rounded-xl p-4 group"
                            >
                                <div
                                    class="flex justify-between items-start mb-4"
                                >
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-teal-400 border border-teal-500/20"
                                        >
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm text-slate-200 font-medium"
                                            >
                                                {contact.name}
                                            </div>
                                            <div
                                                class="text-[10px] text-slate-500 font-mono uppercase tracking-tighter"
                                            >
                                                {contact.email}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onclick={() =>
                                            deleteContact(contact.id)}
                                        aria-label="Remove {contact.name}"
                                        class="text-slate-600 hover:text-rose-400 transition-colors"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                </div>

                                <!-- Individual Controls -->
                                {#if viewMode !== "escalation"}
                                    <div
                                        class="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/50"
                                    >
                                        <div class="space-y-2">
                                            <label
                                                class="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                                            >
                                                <Settings2 class="w-3 h-3" /> Custom
                                                Delay (h)
                                            </label>
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <input
                                                    type="number"
                                                    aria-label="Custom Delay (h)"
                                                    bind:value={
                                                        contact.individual_delay_hours
                                                    }
                                                    onchange={() =>
                                                        updateContact(contact)}
                                                    placeholder={tier.delay_hours.toString()}
                                                    class="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-teal-400 focus:outline-none focus:border-teal-500/50"
                                                />
                                                <span
                                                    class="text-[10px] text-slate-600 italic"
                                                    >Overrides Tier</span
                                                >
                                            </div>
                                        </div>
                                        <div class="space-y-2">
                                            <label
                                                class="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                                            >
                                                <BellRing class="w-3 h-3" /> Safety
                                                Timer
                                            </label>
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <button
                                                    onclick={() => {
                                                        contact.notify_on_safety_timer =
                                                            !contact.notify_on_safety_timer;
                                                        updateContact(contact);
                                                    }}
                                                    class="text-[10px] px-2 py-1 rounded border transition-colors {contact.notify_on_safety_timer
                                                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                                                        : 'bg-slate-800 border-slate-700 text-slate-500'}"
                                                >
                                                    {contact.notify_on_safety_timer
                                                        ? "Active Responder"
                                                        : "Standard Only"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <div
                                class="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] text-center py-6"
                            >
                                Tier {tier.tier_number} Empty
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
    <!-- ADD GUARDIAN MODAL -->
    {#if showAddGuardianModal}
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guardian-dialog-title"
            use:focusTrap={{ onEscape: () => (showAddGuardianModal = false) }}
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div
                    class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950/50"
                >
                    <h3 id="guardian-dialog-title" class="font-bold text-slate-200">Select Guardian</h3>
                    <button onclick={() => (showAddGuardianModal = false)} aria-label="Close">
                        <X class="w-5 h-5 text-slate-500 hover:text-white" />
                    </button>
                </div>
                <div class="p-6">
                    <p class="text-sm text-slate-400 mb-4">
                        Choose a trusted contact to add to <strong
                            >Tier {tiers.find((t) => t.id === targetTierId)
                                ?.tier_number}</strong
                        >.
                    </p>

                    {#if globalContacts.length === 0}
                        <div
                            class="text-center py-6 bg-slate-800/50 rounded-xl border border-dashed border-slate-700"
                        >
                            <p class="text-slate-500 text-sm mb-3">
                                You have no contacts yet.
                            </p>
                            <a
                                href="/modules/contacts"
                                class="text-teal-400 text-sm font-bold hover:underline"
                                >Go to Family & Contacts</a
                            >
                        </div>
                    {:else}
                        <div
                            class="space-y-3 max-h-[300px] overflow-y-auto mb-6"
                        >
                            {#each globalContacts as contact}
                                <label
                                    class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all {selectedContactId ===
                                    contact.id
                                        ? 'bg-teal-500/10 border-teal-500/50'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}"
                                >
                                    <input
                                        type="radio"
                                        name="guardian"
                                        value={contact.id}
                                        bind:group={selectedContactId}
                                        class="sr-only"
                                    />
                                    <div
                                        class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300"
                                    >
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div class="flex-1">
                                        <div
                                            class="text-sm font-bold text-slate-200"
                                        >
                                            {contact.name}
                                        </div>
                                        <div class="text-xs text-slate-500">
                                            {contact.role}
                                        </div>
                                    </div>
                                    {#if selectedContactId === contact.id}
                                        <Check class="w-4 h-4 text-teal-400" />
                                    {/if}
                                    <!-- Show existing tier badge if any -->
                                    {#if contact.tier_id && contact.tier_id !== targetTierId}
                                        <span
                                            class="text-[9px] uppercase bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded"
                                        >
                                            Moved
                                        </span>
                                    {/if}
                                </label>
                            {/each}
                        </div>

                        <button
                            disabled={!selectedContactId}
                            onclick={promoteContact}
                            class="w-full py-3 bg-teal-500 text-slate-950 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-400 transition-colors"
                        >
                            Confirm Guardian
                        </button>
                    {/if}

                    <div
                        class="mt-4 pt-4 border-t border-slate-800 text-center"
                    >
                        <a
                            href="/modules/contacts"
                            class="text-xs text-slate-500 hover:text-slate-300"
                            >Manage Global Contacts</a
                        >
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
