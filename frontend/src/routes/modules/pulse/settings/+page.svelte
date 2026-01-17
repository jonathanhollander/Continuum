<script lang="ts">
    import { pulse } from "$lib/stores/pulse";
    import { onMount } from "svelte";
    import {
        Shield,
        Activity,
        Clock,
        Users,
        Plus,
        Trash2,
        Ghost,
        Smartphone,
        Loader2,
        Settings2,
        BellRing,
    } from "lucide-svelte";

    const USER_ID = 1;

    let saving = $state(false);
    let connectingBio = $state(false);

    let settings = $state({
        enabled: false,
        frequency_days: 2,
        grace_period_hours: 24,
        biometric_extension_enabled: false,
        location_vault_enabled: false,
        ghost_mode_until: null as string | null,
    });

    let tiers = $state<any[]>([]);
    let contacts = $state<any[]>([]);

    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const [settingsRes, tiersRes, contactsRes] = await Promise.all([
                fetch(`${baseUrl}/api/pulse/settings?user_id=${USER_ID}`),
                fetch(`${baseUrl}/api/pulse/tiers?user_id=${USER_ID}`),
                fetch(`${baseUrl}/api/pulse/contacts?user_id=${USER_ID}`),
            ]);

            if (settingsRes.ok) {
                settings = await settingsRes.json();
                pulse.update((s) => ({ ...s, enabled: settings.enabled }));
            }
            if (tiersRes.ok) tiers = await tiersRes.json();
            if (contactsRes.ok) contacts = await contactsRes.json();

            if (tiers.length === 0) {
                tiers = [
                    {
                        id: 1,
                        tier_number: 1,
                        delay_hours: 0,
                        notification_method: "email",
                    },
                    {
                        id: 2,
                        tier_number: 2,
                        delay_hours: 6,
                        notification_method: "both",
                    },
                    {
                        id: 3,
                        tier_number: 3,
                        delay_hours: 12,
                        notification_method: "both",
                    },
                    {
                        id: 4,
                        tier_number: 4,
                        delay_hours: 24,
                        notification_method: "both",
                    },
                ];
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function saveSettings() {
        saving = true;
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(
                `${baseUrl}/api/pulse/settings?user_id=${USER_ID}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(settings),
                },
            );
            if (res.ok) {
                pulse.update((s) => ({ ...s, enabled: settings.enabled }));
                pulse.init(USER_ID);
            }
        } finally {
            saving = false;
        }
    }

    async function updateContact(contact: any) {
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(
                `${baseUrl}/api/pulse/contacts/${contact.id}?user_id=${USER_ID}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(contact),
                },
            );
        } catch (e) {
            console.error(e);
        }
    }

    function toggleGhostMode() {
        if (settings.ghost_mode_until) {
            settings.ghost_mode_until = null;
        } else {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            settings.ghost_mode_until = date.toISOString();
        }
        saveSettings();
    }

    function toggleBiometric() {
        if (!settings.biometric_extension_enabled) {
            connectingBio = true;
            setTimeout(() => {
                settings.biometric_extension_enabled = true;
                connectingBio = false;
                saveSettings();
            }, 1500);
        } else {
            settings.biometric_extension_enabled = false;
            saveSettings();
        }
    }

    function getContactsForTier(tierId: number) {
        return contacts.filter((c) => c.tier_id === tierId);
    }

    async function addContact(tierId: number) {
        const name = prompt("Contact Name:");
        if (!name) return;
        const email = prompt("Contact Email:");
        if (!email) return;

        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(
                `${baseUrl}/api/pulse/contacts?user_id=${USER_ID}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        email,
                        tier_id: tierId,
                        user_id: USER_ID,
                    }),
                },
            );
            if (res.ok) contacts = [...contacts, await res.json()];
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteContact(contactId: number) {
        if (!confirm("Remove this contact?")) return;
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            await fetch(
                `${baseUrl}/api/pulse/contacts/${contactId}?user_id=${USER_ID}`,
                { method: "DELETE" },
            );
            contacts = contacts.filter((c) => c.id !== contactId);
        } catch (e) {
            console.error(e);
        }
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 pb-32">
    <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-serif text-slate-100 flex items-center gap-2">
            <Activity class="text-teal-400" />
            Pulse Configuration
        </h1>
        <a
            href="/modules/pulse"
            class="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >Back to Dashboard</a
        >
    </div>

    <div class="space-y-8">
        <!-- GLOBAL STATUS -->
        <div
            class="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 flex items-center justify-between backdrop-blur-sm"
        >
            <div>
                <h3 class="text-lg font-medium text-white">Active Heartbeat</h3>
                <p class="text-slate-400 text-sm">
                    Enable the automated wellness check-in system.
                </p>
            </div>
            <button
                class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors {settings.enabled
                    ? 'bg-teal-500'
                    : 'bg-slate-700'}"
                onclick={() => {
                    settings.enabled = !settings.enabled;
                    saveSettings();
                }}
            >
                <span
                    class="translate-x-1 inline-block h-6 w-6 transform rounded-full bg-white transition-transform {settings.enabled
                        ? 'translate-x-7'
                        : 'translate-x-1'}"
                ></span>
            </button>
        </div>

        <!-- ESCALATION PROTOCOL (PER-CONTACT INDIVIDUALIZATION) -->
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3
                    class="text-lg font-medium text-slate-200 flex items-center gap-2"
                >
                    <Users class="w-5 h-5 text-slate-400" />
                    Escalation Protocol
                </h3>
                <div
                    class="text-[10px] uppercase tracking-widest text-slate-500 font-bold"
                >
                    Individual Nudge Settings Active
                </div>
            </div>

            <div class="space-y-6">
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
                                <span
                                    class="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700"
                                    >+{tier.delay_hours}h default</span
                                >
                            </div>
                            <button
                                onclick={() => addContact(tier.id)}
                                class="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1 font-bold"
                            >
                                <Plus class="w-3 h-3" /> Add Guardian
                            </button>
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
            </div>
        </div>

        <!-- SPECIAL MODES -->
        <div class="grid md:grid-cols-2 gap-6 pb-20">
            <div
                class="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden"
            >
                <div class="flex items-center gap-2 mb-4 relative z-10">
                    <Ghost
                        class="w-5 h-5 {settings.ghost_mode_until
                            ? 'text-purple-400'
                            : 'text-slate-400'}"
                    />
                    <h3 class="text-lg font-medium text-slate-200">
                        Ghost Mode
                    </h3>
                </div>
                <p
                    class="text-sm text-slate-400 mb-6 relative z-10 leading-relaxed"
                >
                    Pause all alerts for 7 days. Your inner circle receives a
                    "Status: Resting" notification without an alert trigger.
                </p>
                {#if settings.ghost_mode_until}
                    <div
                        class="absolute inset-x-0 bottom-0 h-1 bg-purple-500/30"
                    ></div>
                    <p
                        class="text-[10px] text-purple-300 font-mono mb-3 relative z-10 tracking-widest uppercase"
                    >
                        Active until: {new Date(
                            settings.ghost_mode_until,
                        ).toLocaleDateString()}
                    </p>
                {/if}
                <button
                    onclick={toggleGhostMode}
                    class="w-full py-2.5 rounded-xl border transition-all text-sm font-bold relative z-10 {settings.ghost_mode_until
                        ? 'bg-purple-900/30 border-purple-500/50 text-purple-200 scale-[0.98]'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'}"
                >
                    {settings.ghost_mode_until
                        ? "Deactivate"
                        : "Activate (7 Days)"}
                </button>
            </div>

            <div
                class="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 space-y-4 backdrop-blur-sm"
            >
                <div class="flex items-center gap-2">
                    <Shield class="w-5 h-5 text-indigo-400" />
                    <h3 class="text-lg font-medium text-slate-200">
                        Vault Integration
                    </h3>
                </div>
                <p class="text-sm text-slate-400 leading-relaxed">
                    Automatically decrypt specific files and instructions for
                    your Guardians when an escalation Tier exceeds 24 hours.
                </p>
                <div
                    class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800"
                >
                    <div class="text-xs text-slate-400 font-medium">
                        Automatic Release
                    </div>
                    <button
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {settings.location_vault_enabled
                            ? 'bg-indigo-500'
                            : 'bg-slate-700'}"
                        onclick={() => {
                            settings.location_vault_enabled =
                                !settings.location_vault_enabled;
                            saveSettings();
                        }}
                    >
                        <span
                            class="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform {settings.location_vault_enabled
                                ? 'translate-x-6'
                                : 'translate-x-1'}"
                        ></span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
