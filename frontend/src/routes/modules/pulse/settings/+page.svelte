<script lang="ts">
    import { pulse } from "$lib/stores/pulse.svelte";
    import { onMount } from "svelte";
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
    // True once the server's settings have arrived. Until then the page holds defaults, and a save
    // would post all six of them over the person's saved choices, so the controls wait for it.
    let loaded = $state(false);

    onMount(() => {
        loadSettings();
        loadTiers();
    });

    const settingsNotice = "Your saved check-in choices are still on your account. Let's try loading them again.";

    // Settings and tiers load on their own, so one slow or failed read leaves the other in place.
    async function loadSettings() {
        const settingsData = await pulse.loadSettings();
        if (settingsData) {
            settings = settingsData as typeof settings;
            loaded = true;
        } else {
            notifications.showError(settingsNotice, () => loadSettings());
        }
    }

    async function loadTiers() {
        try {
            tiers = await apiGet("/api/pulse/tiers");
        } catch (e) {
            console.error(e);
            notifications.showError("Your escalation plan is still on your account. Let's try loading it again.", () => loadTiers());
        }
    }

    // Saves only the choices this page edits; the rest of the row (check-in token, safety timer,
    // message, schedule) stays as the server has it, even if it changed since the page loaded.
    // `undo` puts back the change the caller just made when the save fails, so the page never
    // shows a setting the server did not keep.
    async function saveSettings(undo?: () => void) {
        if (!loaded) {
            undo?.();
            notifications.showError(settingsNotice, () => loadSettings());
            return;
        }
        saving = true;
        try {
            await apiPost("/api/pulse/settings", {
                enabled: settings.enabled,
                frequency_days: settings.frequency_days,
                grace_period_hours: settings.grace_period_hours,
                ghost_mode_until: settings.ghost_mode_until,
                biometric_extension_enabled: settings.biometric_extension_enabled,
                location_vault_enabled: settings.location_vault_enabled,
            });
            pulse.showEnabled(settings.enabled);
            pulse.init();
        } catch (e) {
            console.error(e);
            undo?.();
            notifications.showError("You can try again whenever you're ready.");
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

    // How often we check in and the grace period: whole numbers in the ranges the server
    // accepts (routers/pulse.py _SETTINGS_INT_FIELDS); saved when the field is left.
    function saveNumber(field: "frequency_days" | "grace_period_hours", raw: string, low: number, high: number) {
        const before = settings[field];
        const value = Math.round(Number(raw));
        if (raw === "" || !Number.isFinite(value) || value < low || value > high) {
            settings[field] = before;
            notifications.showError(
                field === "frequency_days"
                    ? "Choose how often we check in as a whole number of days, from 1 to 365."
                    : "Choose the grace period as a whole number of hours, from 0 to 720 (30 days).",
            );
            return;
        }
        if (value === before) return;
        settings[field] = value;
        saveSettings(() => (settings[field] = before));
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 pb-32">
    <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-serif text-foreground flex items-center gap-2">
            <Activity class="text-primary" />
            Your Check-in Settings
        </h1>
        <a
            href="/modules/pulse"
            class="text-sm text-primary hover:text-primary-hover transition-colors"
            >Back to Wellness Check-in</a
        >
    </div>

    <div class="space-y-8">
        <!-- GLOBAL STATUS -->
        <div
            class="bg-background/50 p-6 rounded-2xl border border-border/50 flex items-center justify-between backdrop-blur-sm"
        >
            <div>
                <h3 class="text-lg font-medium text-foreground">Active Heartbeat</h3>
                <p class="text-muted-foreground text-sm">
                    Turn on gentle wellness check-ins.
                </p>
            </div>
            <button
                class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:opacity-50 {settings.enabled
                    ? 'bg-primary'
                    : 'bg-slate-700'}"
                role="switch"
                aria-checked={settings.enabled}
                aria-label="Active Heartbeat"
                disabled={!loaded}
                onclick={() => {
                    settings.enabled = !settings.enabled;
                    saveSettings(() => (settings.enabled = !settings.enabled));
                }}
            >
                {#if loaded}
                    <span
                        class="translate-x-1 inline-block h-6 w-6 transform rounded-full bg-white transition-transform {settings.enabled
                            ? 'translate-x-7'
                            : 'translate-x-1'}"
                    ></span>
                {/if}
            </button>
        </div>

        <!-- HOW OFTEN: frequency_days and grace_period_hours (pulse_logic reads both) -->
        <div
            class="bg-background/50 p-6 rounded-2xl border border-border/50 grid md:grid-cols-2 gap-6 backdrop-blur-sm"
        >
            <div class="space-y-2">
                <label for="pulse-frequency" class="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock class="w-4 h-4 text-primary" /> How often we check in
                </label>
                <div class="flex items-center gap-2">
                    <input
                        id="pulse-frequency"
                        type="number"
                        min="1"
                        max="365"
                        step="1"
                        value={loaded ? settings.frequency_days : ""}
                        disabled={!loaded}
                        onchange={(e) => saveNumber("frequency_days", e.currentTarget.value, 1, 365)}
                        class="w-24 bg-slate-950/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                    <span class="text-sm text-muted-foreground">days</span>
                </div>
            </div>
            <div class="space-y-2">
                <label for="pulse-grace" class="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock class="w-4 h-4 text-primary" /> Grace period
                </label>
                <div class="flex items-center gap-2">
                    <input
                        id="pulse-grace"
                        type="number"
                        min="0"
                        max="720"
                        step="1"
                        value={loaded ? settings.grace_period_hours : ""}
                        disabled={!loaded}
                        onchange={(e) => saveNumber("grace_period_hours", e.currentTarget.value, 0, 720)}
                        class="w-24 bg-slate-950/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                    <span class="text-sm text-muted-foreground">hours</span>
                </div>
            </div>
        </div>

        <!-- ESCALATION PROTOCOL: the tier boxes live on the Escalation Plan page -->
        <div class="space-y-4" id="contacts-section">
            <div class="flex items-center justify-between">
                <h3
                    class="text-lg font-medium text-foreground flex items-center gap-2"
                >
                    <Users class="w-5 h-5 text-muted-foreground" />
                    Who we reach out to
                </h3>
            </div>

            <div
                class="bg-background/50 p-6 rounded-2xl border border-border/50 flex items-center justify-between gap-4 backdrop-blur-sm"
            >
                <a
                    href="/modules/pulse/escalation"
                    class="text-sm text-primary hover:text-primary-hover transition-colors font-bold"
                    >Escalation Plan</a
                >
                <button
                    onclick={() => (showGuardianPicker = true)}
                    disabled={tiers.length === 0}
                    class="text-xs text-primary hover:text-primary-hover flex items-center gap-1 font-bold"
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
                class="bg-background/50 p-6 rounded-2xl border border-border/50 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden"
            >
                <div class="flex items-center gap-2 mb-4 relative z-10">
                    <Ghost
                        class="w-5 h-5 {settings.ghost_mode_until
                            ? 'text-purple-400'
                            : 'text-muted-foreground'}"
                    />
                    <h3 class="text-lg font-medium text-foreground">
                        Rest Mode
                    </h3>
                </div>
                <p
                    class="text-sm text-muted-foreground mb-6 relative z-10 leading-relaxed"
                >
                    Rest for 7 days. Your circle is told you are resting, and
                    alerts wait until you return.
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
                    disabled={!loaded}
                    class="w-full py-2.5 rounded-xl border transition-all text-sm font-bold relative z-10 {settings.ghost_mode_until
                        ? 'bg-purple-900/30 border-purple-500/50 text-purple-200 scale-[0.98]'
                        : 'bg-card border-border text-slate-300 hover:bg-slate-700 hover:border-slate-600'}"
                >
                    {settings.ghost_mode_until
                        ? "Return from rest"
                        : "Rest for 7 days"}
                </button>
            </div>

            <div
                class="bg-background/50 p-6 rounded-2xl border border-border/50 space-y-4 backdrop-blur-sm"
            >
                <div class="flex items-center gap-2">
                    <Shield class="w-5 h-5 text-indigo-400" />
                    <h3 class="text-lg font-medium text-foreground">
                        Notes for your guardians
                    </h3>
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    Share the notes in <a href="/modules/pulse/vault" class="text-primary hover:text-primary-hover">your vault</a>
                    with your guardians once an escalation reaches the tier you
                    set for each one.
                </p>
                <div
                    class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800"
                >
                    <div class="text-xs text-muted-foreground font-medium">
                        Automatic Release
                    </div>
                    <button
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 {settings.location_vault_enabled
                            ? 'bg-indigo-500'
                            : 'bg-slate-700'}"
                        role="switch"
                        aria-checked={settings.location_vault_enabled}
                        aria-label="Automatic Release"
                        disabled={!loaded}
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
                        {#if loaded}
                            <span
                                class="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform {settings.location_vault_enabled
                                    ? 'translate-x-6'
                                    : 'translate-x-1'}"
                            ></span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
