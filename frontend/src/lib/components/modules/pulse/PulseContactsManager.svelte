<script lang="ts">
    import { onMount } from "svelte";
    import {
        Users,
        Plus,
        Trash2,
        Check,
        Pencil,
        Settings2,
        BellRing,
    } from "lucide-svelte";
    import GuardianPicker from "./GuardianPicker.svelte";
    import { pulseTierNumber } from "./pulseTiers";
    import { apiGet, apiPut } from "$lib/api/client";
    import { contactSync } from "$lib/stores/familyStore.svelte";

    let {
        userId = 1,
        showHeader = true,
        viewMode = "escalation" as "contacts" | "escalation",
    } = $props();

    let tiers = $state<any[]>([]);
    // The people come from the shared contacts store (SyncManager), so a tier set on Family &
    // Contacts or in the picker shows here at once. Each row in the field names this page reads
    // (pulseTierNumber takes tier_id / call_tier).
    const contacts = $derived(
        contactSync.items.map((c: any) => ({
            id: c.id,
            name: c.name ?? "",
            email: c.email,
            tier_id: c.tierId ?? null,
            call_tier: c.callTier ?? null,
            individual_delay_hours: c.individualDelayHours ?? null,
            notify_on_safety_timer: !!c.notifyOnSafetyTimer,
        })),
    );
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
            const [tiersData] = await Promise.all([
                apiGet("/api/pulse/tiers"),
                contactSync.sync(),
            ]);
            tiers = tiersData;
            if (contactSync.status === "error") error = gentleRetry;
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

    // Delay and safety-timer edits: saved quietly (no affirmation) through the shared contacts
    // store, which this list reads; on failure it rolls back and shows its own gentle message.
    async function updateContact(contactId: number | string, updates: Record<string, unknown>) {
        try {
            await contactSync.update(contactId, updates, false);
        } catch (e) {
            console.error(e);
        }
    }

    function delayValue(raw: string) {
        return raw === "" || raw == null ? null : Number(raw);
    }

    // Select Guardian dialog; pickerTierId is the tier it opens on.
    let showAddGuardianModal = $state(false);
    let pickerTierId = $state<number | null>(null);

    function openAddGuardianModal(tierId: number | null) {
        pickerTierId = tierId;
        showAddGuardianModal = true;
    }

    // Takes the person off Pulse only: their Family & Contacts entry stays. A Pulse tier comes from
    // tier_id or, failing that, the call tier 1-3 (pulseTierNumber), so both are cleared; "Kept
    // private" stays as it is. Saved through the shared contacts SyncManager, so the contacts page
    // shows it at once; on failure that store rolls back and shows its own gentle message.
    async function deleteContact(contactId: number) {
        if (!confirm("Remove this contact from your Pulse network? You can add them back later.")) return;
        const contact = contacts.find((c) => c.id === contactId);
        const updates: Record<string, unknown> = { tierId: null };
        if (contact?.call_tier && contact.call_tier !== "4_DNR") updates.tier = null;
        try {
            if (!contactSync.items.some((c) => String(c.id) === String(contactId))) await contactSync.sync();
            await contactSync.update(contactId, updates);
        } catch (e) {
            console.error(e);
        }
    }

    function getContactsForTier(tierNumber: number) {
        return contacts.filter((c) => pulseTierNumber(c, tiers) === tierNumber);
    }

    // Everyone with a Pulse tier, in tier order (Trusted Contacts list).
    const guardians = $derived(
        contacts
            .map((c) => ({ c, n: pulseTierNumber(c, tiers) }))
            .filter((g) => g.n !== null)
            .sort((a, b) => (a.n as number) - (b.n as number)),
    );

    let tierDelayBefore: number | null = null;
    function startTierEdit(tier: any) {
        tierDelayBefore = tier.delay_hours;
        editingTierId = tier.id;
    }
    function cancelTierEdit(tier: any) {
        if (tierDelayBefore !== null) tier.delay_hours = tierDelayBefore;
        editingTierId = null;
    }
    function focusOnMount(node: HTMLInputElement) {
        node.focus();
        node.select();
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
            {#if viewMode === "escalation"}
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
                <button
                    onclick={loadData}
                    class="bg-teal-500/10 text-teal-400 hover:text-teal-300 hover:bg-teal-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >Initialize Protocols</button
                >
            </div>
        {:else if (viewMode === "contacts" ? guardians.length : contacts.length) === 0 && !error}
            <!-- EMPTY STATE -->
            <div
                class="text-center py-16 bg-slate-900/30 rounded-[2rem] border border-slate-800 border-dashed backdrop-blur-sm"
            >
                <div
                    class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <Users class="w-8 h-8 text-slate-500" />
                </div>
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
                    onclick={() => openAddGuardianModal(tiers[0]?.id ?? null)}
                    class="inline-flex items-center gap-2 bg-teal-500 text-slate-950 px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-400 transition-colors"
                >
                    <Plus class="w-4 h-4" /> Add First Guardian
                </button>
            </div>
        {:else if viewMode === "contacts"}
            <!-- TRUSTED CONTACTS: the people, each with their tier; the tier boxes live on the Escalation Plan -->
            <div class="flex items-center justify-between gap-4">
                <a
                    href="/modules/pulse/escalation"
                    class="text-sm text-teal-400 hover:text-teal-300 transition-colors font-bold"
                    >Escalation Plan</a
                >
                <button
                    onclick={() => openAddGuardianModal(tiers[0]?.id ?? null)}
                    class="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1 font-bold"
                >
                    <Plus class="w-3 h-3" /> Add Guardian
                </button>
            </div>
            <ul class="space-y-2">
                {#each guardians as { c: contact, n } (contact.id)}
                    <li
                        class="bg-slate-950/30 border border-slate-800/50 rounded-xl p-4 flex items-center gap-3"
                    >
                        <div
                            class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-teal-400 border border-teal-500/20"
                        >
                            {contact.name.charAt(0)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm text-slate-200 font-medium">
                                {contact.name}
                            </div>
                            <div
                                class="text-[10px] text-slate-500 font-mono uppercase tracking-tighter"
                            >
                                {contact.email}
                            </div>
                        </div>
                        <span
                            class="text-xs font-bold text-teal-500 uppercase tracking-wider"
                            >Tier {n}</span
                        >
                        <button
                            onclick={() => deleteContact(contact.id)}
                            aria-label="Remove {contact.name}"
                            class="text-slate-600 hover:text-rose-400 transition-colors"
                        >
                            <Trash2 class="w-4 h-4" />
                        </button>
                    </li>
                {/each}
            </ul>
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
                                        aria-label={`Tier ${tier.tier_number} hours`}
                                        class="w-12 bg-slate-900 border border-teal-500/50 rounded px-1 py-0.5 text-xs text-white"
                                        bind:value={tier.delay_hours}
                                        use:focusOnMount
                                        onkeydown={(e) => {
                                            if (e.key === "Enter") updateTier(tier);
                                            if (e.key === "Escape") {
                                                e.stopPropagation();
                                                cancelTierEdit(tier);
                                            }
                                        }}
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
                            {:else}
                                <button
                                    type="button"
                                    aria-label={`Tier ${tier.tier_number}: +${tier.delay_hours}h default`}
                                    class="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-2 cursor-pointer hover:border-teal-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 transition-colors"
                                    onclick={() => startTierEdit(tier)}
                                >
                                    +{tier.delay_hours}h default
                                    <Pencil class="w-2 h-2" />
                                </button>
                            {/if}
                        </div>
                        <button
                            onclick={() => openAddGuardianModal(tier.id)}
                            class="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1 font-bold"
                        >
                            <Plus class="w-3 h-3" /> Add Guardian
                        </button>
                    </div>
                    <div class="p-2 space-y-2">
                        {#each getContactsForTier(tier.tier_number) as contact (contact.id)}
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
                                <div
                                    class="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/50"
                                >
                                    <div class="space-y-2">
                                        <label
                                            for="delay-{contact.id}"
                                            class="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                                        >
                                            <Settings2 class="w-3 h-3" /> Custom
                                            Delay (h)
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <input
                                                id="delay-{contact.id}"
                                                type="number"
                                                value={contact.individual_delay_hours ?? ""}
                                                onchange={(e) =>
                                                    updateContact(contact.id, {
                                                        individualDelayHours: delayValue(e.currentTarget.value),
                                                    })}
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
                                        <div
                                            class="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                                        >
                                            <BellRing class="w-3 h-3" /> Safety
                                            Timer
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button
                                                onclick={() =>
                                                    updateContact(contact.id, {
                                                        notifyOnSafetyTimer: !contact.notify_on_safety_timer,
                                                    })}
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
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    {#if showAddGuardianModal}
        <GuardianPicker
            {tiers}
            tierId={pickerTierId}
            onclose={() => (showAddGuardianModal = false)}
            onsaved={loadData}
        />
    {/if}
</div>
