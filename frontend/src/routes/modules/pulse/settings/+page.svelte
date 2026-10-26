<script lang="ts">
    import { pulse } from "$lib/stores/pulse.svelte";
    import { onMount } from "svelte";
    import {
        startRegistration,
        startAuthentication,
    } from "@simplewebauthn/browser";
    import {
        Shield,
        Activity,
        Clock,
        Users,
        Plus,
        Ghost,
    } from "lucide-svelte";
    import { apiGet, apiPost } from "$lib/api/client";
    import { notifications } from "$lib/stores/notificationStore";
    import GuardianPicker from "$lib/components/modules/pulse/GuardianPicker.svelte";

    let saving = $state(false);
    let connectingBio = $state(false);
    let showGuardianPicker = $state(false);

    let settings = $state({
        enabled: false,
        frequency_days: 2,
        grace_period_hours: 24,
        biometric_extension_enabled: false,
        location_vault_enabled: false,
        ghost_mode_until: null as string | null,
    });

    let tiers = $state<any[]>([]);

    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        try {
            const [settingsData, tiersData] = await Promise.all([
                apiGet("/api/pulse/settings"),
                apiGet("/api/pulse/tiers"),
            ]);

            settings = settingsData;
            pulse.showEnabled(settings.enabled);
            tiers = tiersData;
        } catch (e) {
            console.error(e);
        }
    }

    // Saves only the choices this page edits; the rest of the row (check-in token, safety timer,
    // message, schedule) stays as the server has it, even if it changed since the page loaded.
    // `undo` puts back the change the caller just made when the save fails, so the page never
    // shows a setting the server did not keep.
    async function saveSettings(undo?: () => void) {
        saving = true;
        try {
            await apiPost("/api/pulse/settings", {
                enabled: settings.enabled,
                ghost_mode_until: settings.ghost_mode_until,
                biometric_extension_enabled: settings.biometric_extension_enabled,
                location_vault_enabled: settings.location_vault_enabled,
            });
            pulse.showEnabled(settings.enabled);
            pulse.init();
        } catch (e) {
            console.error(e);
            undo?.();
            notifications.showError("Let's try that once more in a moment.");
        } finally {
            saving = false;
        }
    }

    function toggleGhostMode() {
        const before = settings.ghost_mode_until;
        if (settings.ghost_mode_until) {
            settings.ghost_mode_until = null;
        } else {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            settings.ghost_mode_until = date.toISOString();
        }
        saveSettings(() => (settings.ghost_mode_until = before));
    }

    async function toggleBiometric() {
        if (settings.biometric_extension_enabled) {
            // Disable simply
            settings.biometric_extension_enabled = false;
            await saveSettings(() => (settings.biometric_extension_enabled = true));
            return;
        }

        // Start Real Enrollment Flow
        try {
            connectingBio = true;

            // 1. Get Options
            const options = await apiPost(
                "/api/pulse/auth/webauthn/register/start",
            );

            // 2. Browser Interaction
            const attResp = await startRegistration(options);

            // 3. Verify
            await apiPost("/api/pulse/auth/webauthn/register/finish", attResp);

            settings.biometric_extension_enabled = true;
            await saveSettings(() => (settings.biometric_extension_enabled = false));
        } catch (e) {
            console.error("WebAuthn Failed", e);
            alert("Could not register biometric device. See console.");
        } finally {
            connectingBio = false;
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
                role="switch"
                aria-checked={settings.enabled}
                aria-label="Active Heartbeat"
                onclick={() => {
                    settings.enabled = !settings.enabled;
                    saveSettings(() => (settings.enabled = !settings.enabled));
                }}
            >
                <span
                    class="translate-x-1 inline-block h-6 w-6 transform rounded-full bg-white transition-transform {settings.enabled
                        ? 'translate-x-7'
                        : 'translate-x-1'}"
                ></span>
            </button>
        </div>

        <!-- ESCALATION PROTOCOL: the tier boxes live on the Escalation Plan page -->
        <div class="space-y-4" id="contacts-section">
            <div class="flex items-center justify-between">
                <h3
                    class="text-lg font-medium text-slate-200 flex items-center gap-2"
                >
                    <Users class="w-5 h-5 text-slate-400" />
                    Escalation Protocol
                </h3>
            </div>

            <div
                class="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 flex items-center justify-between gap-4 backdrop-blur-sm"
            >
                <a
                    href="/modules/pulse/escalation"
                    class="text-sm text-teal-400 hover:text-teal-300 transition-colors font-bold"
                    >Escalation Plan</a
                >
                <button
                    onclick={() => (showGuardianPicker = true)}
                    disabled={tiers.length === 0}
                    class="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1 font-bold"
                >
                    <Plus class="w-3 h-3" /> Add Guardian
                </button>
            </div>
        </div>

        {#if showGuardianPicker}
            <GuardianPicker
                {tiers}
                onclose={() => (showGuardianPicker = false)}
                onsaved={() => {}}
            />
        {/if}

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
                        role="switch"
                        aria-checked={settings.location_vault_enabled}
                        aria-label="Automatic Release"
                        onclick={() => {
                            settings.location_vault_enabled =
                                !settings.location_vault_enabled;
                            saveSettings(
                                () =>
                                    (settings.location_vault_enabled =
                                        !settings.location_vault_enabled),
                            );
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
