<script lang="ts">
    import { pulse } from "$lib/stores/pulse.svelte";
    import { estateAudit } from "$lib/stores/auditStore.svelte";
    import { apiGet, apiPost } from "$lib/api/client";
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import {
        Activity,
        Shield,
        Clock,
        AlertCircle,
        CheckCircle2,
        Loader2,
        Zap,
        Navigation,
        XCircle,
        Settings,
        Users,
    } from "lucide-svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import { pulseTierNumber } from "$lib/components/modules/pulse/pulseTiers";

    const gentleRetry = "Let's try that once more in a moment.";

    // Guardians (a Pulse tier) and the people told when a safety timer ends, from the shared
    // contacts store (notifyOnSafetyTimer is the "Told when I start a timer" switch on the
    // Escalation Plan).
    const guardians = $derived(
        (contactSync.items as any[]).filter(
            (c) => c.tierId || pulseTierNumber({ call_tier: c.callTier }, []) !== null,
        ),
    );
    // pulse_logic.trigger_safety_timer_alert tells every contact with this switch on
    const timerPeople = $derived(
        (contactSync.items as any[]).filter((c) => c.notifyOnSafetyTimer).map((c) => c.name),
    );
    import PetalDrift from "$lib/components/pulse/PetalDrift.svelte";

    let petals: PetalDrift;

    let localStatus = $state({
        checkingIn: false,
        lastSuccess: false,
        safetyTimer: null as any,
        safetyInput: 30,
        showSafetyConfig: false,
        purpose: "Walking home",
    });

    onMount(() => {
        pulse.init();
        contactSync.sync();
        fetchSafetyStatus();
        const interval = setInterval(fetchSafetyStatus, 10000);
        // Ticks the countdown each second between status refreshes
        const tick = setInterval(() => (now = Date.now()), 1000);
        return () => {
            clearInterval(interval);
            clearInterval(tick);
        };
    });

    async function fetchSafetyStatus() {
        try {
            const data = await apiGet("/api/pulse/safety/status");
            localStatus.safetyTimer = data;
        } catch (e) {
            console.error(e);
        }
    }

    async function checkIn() {
        localStatus.checkingIn = true;
        try {
            const success = await pulse.checkin("Manual Dashboard Tap");
            if (success) {
                localStatus.lastSuccess = true;
                petals?.trigger();
                setTimeout(() => {
                    localStatus.lastSuccess = false;
                }, 3000);
            } else {
                notifications.showError(gentleRetry);
            }
        } finally {
            localStatus.checkingIn = false;
        }
    }

    async function startSafety() {
        try {
            const params = new URLSearchParams({
                minutes: localStatus.safetyInput.toString(),
                purpose: localStatus.purpose,
            });
            const data = await apiPost(
                `/api/pulse/safety/start?${params.toString()}`,
            );
            localStatus.safetyTimer = data;
            localStatus.showSafetyConfig = false;
        } catch (e) {
            console.error(e);
            notifications.showError(gentleRetry);
        }
    }

    async function cancelSafety() {
        try {
            await apiPost("/api/pulse/safety/cancel");
            localStatus.safetyTimer = null;
        } catch (e) {
            console.error(e);
            notifications.showError(gentleRetry);
        }
    }

    let now = $state(Date.now());

    const statusLabels: Record<string, string> = {
        active: "Heartbeat Active",
        grace: "Grace Period",
        disabled: "Resting for now",
        not_configured: "Ready when you are",
    };

    // null once the timer has ended
    function getTimeRemaining(expiry: string) {
        const diff = new Date(expiry).getTime() - now;
        if (diff <= 0) return null;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
</script>

<PetalDrift bind:this={petals} />

<div class="max-w-5xl mx-auto p-4 md:p-10 space-y-12 pb-32">
    <!-- HERO: BREATHING PULSE -->
    <div
        class="relative flex flex-col items-center justify-center py-12 md:py-20 text-center"
    >
        <h1 class="font-serif text-4xl text-white mb-10">Wellness Check-in</h1>
        <!-- Pulse Button Architecture -->
        <div
            class="relative group cursor-pointer mb-8"
            role="button"
            tabindex="0"
            onclick={checkIn}
            onkeydown={(e) => {
                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    checkIn();
                }
            }}
        >
            <!-- Breathing Rings -->
            <div
                class="absolute inset-0 bg-teal-500/20 rounded-full blur-3xl scale-125 animate-pulse-slow"
            ></div>
            <div
                class="absolute inset-0 border-2 border-teal-500/10 rounded-full scale-[1.15] animate-ripple-slow"
            ></div>
            <div
                class="absolute inset-0 border border-teal-500/5 rounded-full scale-[1.3] animate-ripple-delayed"
            ></div>

            <button
                class="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-slate-900 border-2 border-slate-800 shadow-[0_0_50px_-10px_rgba(var(--color-primary),0.2)] flex flex-col items-center justify-center transition-all duration-700 active:scale-95 group-hover:border-teal-500/40"
            >
                {#if localStatus.checkingIn}
                    <Loader2 class="w-12 h-12 text-teal-400 animate-spin" />
                    <span
                        class="text-xs font-bold text-teal-400 mt-4 uppercase tracking-[0.3em]"
                        >Letting them know...</span
                    >
                {:else if localStatus.lastSuccess}
                    <CheckCircle2
                        class="w-12 h-12 text-teal-400 transition-all scale-125"
                    />
                    <span
                        class="text-xs font-bold text-teal-400 mt-4 uppercase tracking-[0.3em]"
                        >Received, thank you</span
                    >
                {:else}
                    <div
                        class="w-16 h-1 bg-teal-500/50 rounded-full mb-6 group-hover:bg-teal-500 transition-colors"
                    ></div>
                    <span
                        class="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] mb-2"
                        >Pulse Check</span
                    >
                    <h2 class="text-3xl font-serif text-white tracking-wide">
                        I'm Here
                    </h2>
                    <div
                        class="w-16 h-1 bg-teal-500/50 rounded-full mt-6 group-hover:bg-teal-500 transition-colors"
                    ></div>
                {/if}
            </button>
        </div>

        <div class="space-y-2">
            <h2 class="text-2xl font-serif text-white flex items-center justify-center gap-3">
                {statusLabels[pulse.status] ?? statusLabels.disabled}
                {#if pulse.status === "active"}
                    <span
                        class="inline-block w-2 h-2 bg-teal-500 rounded-full animate-ping"
                    ></span>
                {/if}
            </h2>
            <p
                class="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed italic"
            >
                {#if pulse.status === "active"}
                    {#if guardians.length > 0}Your inner circle is standing by.{/if}
                    {#if pulse.next_nudge}
                        Your next gentle nudge is {new Date(
                            pulse.next_nudge,
                        ).toLocaleString(undefined, {
                            weekday: "long",
                            hour: "numeric",
                            minute: "2-digit",
                        })}.{/if}
                {:else if pulse.status === "grace"}
                    Whenever you're ready, a check-in lets your circle know
                    you're well.
                {:else if pulse.status === "disabled"}
                    Whenever you'd like check-ins to begin again,
                    <a
                        href="/modules/pulse/settings"
                        class="text-teal-400 hover:text-teal-300 not-italic"
                        >your settings are here</a
                    >.
                {:else}
                    <a
                        href="/modules/pulse/settings"
                        class="text-teal-400 hover:text-teal-300 not-italic"
                        >Choose how often we check in</a
                    >, and we'll gently keep watch from there.
                {/if}
            </p>
            {#if pulse.guardianCheckin}
                <p class="text-teal-400 text-sm max-w-sm mx-auto">
                    {pulse.guardianCheckin.by} checked on you on {new Date(
                        pulse.guardianCheckin.at,
                    ).toLocaleString()}.
                </p>
            {/if}
            <div class="flex items-center justify-center gap-6 pt-4 text-sm">
                <a
                    href="/modules/pulse/settings"
                    class="text-teal-400 hover:text-teal-300 flex items-center gap-1.5"
                    ><Settings class="w-4 h-4" /> Configure</a
                >
                <a
                    href="/modules/pulse/contacts"
                    class="text-teal-400 hover:text-teal-300 flex items-center gap-1.5"
                    ><Users class="w-4 h-4" /> Manage Contacts</a
                >
            </div>
        </div>
    </div>

    <!-- QUICK ACTIONS MESH -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- SAFETY TIMER CARD (Fidelity Update) -->
        <div
            class="bg-slate-950/20 border border-slate-800/50 rounded-[2rem] p-8 backdrop-blur-md relative overflow-hidden group hover:border-teal-500/30 transition-all"
        >
            <div
                class="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity"
            >
                <Navigation class="w-24 h-24 text-teal-400" />
            </div>

            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center"
                >
                    <Zap class="w-5 h-5 text-teal-400" />
                </div>
                <h3 class="font-medium text-slate-100">Safety Timer</h3>
            </div>

            {#if localStatus.safetyTimer}
                <div class="space-y-4">
                    <div class="text-center py-4">
                        {#if getTimeRemaining(localStatus.safetyTimer.expires_at)}
                            <div
                                class="text-4xl font-mono text-teal-400 tracking-tighter mb-1"
                            >
                                {getTimeRemaining(
                                    localStatus.safetyTimer.expires_at,
                                )}
                            </div>
                        {:else}
                            <div class="text-lg font-serif text-teal-400 mb-1">
                                Your check-in time has arrived
                            </div>
                        {/if}
                        <p
                            class="text-[10px] text-teal-400/60 uppercase tracking-widest"
                        >
                            Your circle is told shortly after the timer ends
                        </p>
                    </div>
                    <button
                        onclick={cancelSafety}
                        class="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <XCircle class="w-4 h-4" /> I'm safe, end timer
                    </button>
                </div>
            {:else if localStatus.showSafetyConfig}
                <div class="space-y-4" in:slide>
                    <select
                        aria-label="Purpose"
                        bind:value={localStatus.purpose}
                        class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300"
                    >
                        <option>Walking home</option>
                        <option>Meeting someone new</option>
                        <option>Health check</option>
                    </select>
                    <div class="flex items-center gap-4">
                        <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            aria-label="Minutes"
                            bind:value={localStatus.safetyInput}
                            class="flex-1 h-1.5 bg-slate-800 accent-teal-500 rounded-lg cursor-pointer"
                        />
                        <span class="text-xs font-bold text-teal-400 w-12"
                            >{localStatus.safetyInput}m</span
                        >
                    </div>
                    {#if timerPeople.length > 0}
                        <p class="text-xs text-slate-400 leading-relaxed" data-testid="timer-people">
                            If the time passes, we gently tell {timerPeople.join(", ")}.
                            <a href="/modules/pulse/escalation" class="text-teal-400 hover:text-teal-300">Choose who</a>
                        </p>
                    {:else}
                        <p class="text-xs text-slate-400 leading-relaxed" data-testid="timer-people">
                            <a href="/modules/pulse/escalation" class="text-teal-400 hover:text-teal-300">Choose who is told</a>
                            on your Escalation Plan, with "Told when I start a timer".
                        </p>
                    {/if}
                    <button
                        onclick={startSafety}
                        class="w-full bg-teal-500 hover:bg-teal-500/90 text-white py-3 rounded-2xl text-xs font-bold transition-all"
                    >
                        Begin the timer
                    </button>
                </div>
            {:else}
                <p class="text-sm text-slate-500 leading-relaxed mb-6">
                    Share a short walk or visit with your circle. If the time
                    passes, the people you chose are gently told.
                </p>
                <button
                    onclick={() => (localStatus.showSafetyConfig = true)}
                    class="w-full bg-slate-900 border border-slate-800 text-slate-300 py-3 rounded-2xl text-xs font-bold hover:border-teal-500/50 hover:text-white transition-all"
                >
                    Begin a safety timer
                </button>
            {/if}
        </div>

        <!-- MESSAGES HUD -->
        <a
            href="/modules/pulse/messages"
            class="bg-slate-950/40 border border-slate-800 rounded-[2rem] p-8 hover:border-teal-500/30 transition-all flex flex-col justify-between group"
        >
            <div>
                <div class="flex items-center gap-3 mb-4">
                    <div
                        class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800"
                    >
                        <Activity
                            class="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors"
                        />
                    </div>
                    <h3 class="font-medium text-slate-100 italic">
                        Message Hub
                    </h3>
                </div>
                <p class="text-sm text-slate-500 leading-relaxed">
                    Read the notes and check-ins from your guardians.
                </p>
            </div>
            <div class="pt-6">
                <span
                    class="text-[10px] text-teal-400 font-bold uppercase tracking-widest border border-teal-500/20 px-3 py-1 rounded-full"
                    >Explore Connection</span
                >
            </div>
        </a>

        <!-- TRANSPARENCY HUB -->
        <a
            href="/modules/pulse/transparency"
            class="bg-slate-950/40 border border-slate-800 rounded-[2rem] p-8 hover:border-amber-500/30 transition-all flex flex-col justify-between group"
        >
            <div>
                <div class="flex items-center gap-3 mb-4">
                    <div
                        class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800"
                    >
                        <Shield
                            class="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors"
                        />
                    </div>
                    <h3 class="font-medium text-slate-100 italic">
                        Transparency
                    </h3>
                </div>
                <p class="text-sm text-slate-500 leading-relaxed">
                    See what your guardians can see, and when
                </p>
            </div>
            <div class="pt-6">
                <span
                    class="text-[10px] text-amber-500 font-bold uppercase tracking-widest border border-amber-500/20 px-3 py-1 rounded-full"
                    >What is shared</span
                >
            </div>
        </a>
    </div>

    <!-- ECOSYSTEM SCORE integration simplified -->
    <div
        class="bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] p-8 md:p-12 text-center backdrop-blur-sm relative overflow-hidden"
    >
        <div
            class="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent"
        ></div>
        <div class="relative z-10 flex flex-col items-center">
            <h3
                class="text-xs font-bold text-slate-500 uppercase tracking-[0.4em] mb-4"
            >
                Estate Readiness
            </h3>
            {#if estateAudit.percentage > 0}
                <div class="text-5xl md:text-7xl font-serif text-white mb-2" data-testid="pulse-readiness">
                    {estateAudit.percentage}<span class="text-teal-400">%</span>
                </div>
            {:else}
                <div class="text-3xl md:text-4xl font-serif text-white mb-2" data-testid="pulse-readiness">
                    Ready when you are
                </div>
            {/if}
            <p class="text-sm text-slate-400 max-w-sm">
                Each part of your plan you add brings this closer to complete,
                and your check-ins keep the people you trust reassured.
            </p>
        </div>
    </div>
</div>

<style>
    @keyframes pulse-slow {
        0%,
        100% {
            transform: scale(1);
            opacity: 0.1;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.3;
        }
    }
    @keyframes ripple-slow {
        0% {
            transform: scale(1);
            opacity: 0;
        }
        50% {
            opacity: 0.1;
        }
        100% {
            transform: scale(1.4);
            opacity: 0;
        }
    }
    @keyframes ripple-delayed {
        0% {
            transform: scale(1);
            opacity: 0;
        }
        50% {
            opacity: 0.05;
        }
        100% {
            transform: scale(1.6);
            opacity: 0;
        }
    }
    .animate-pulse-slow {
        animation: pulse-slow 6s ease-in-out infinite;
    }
    .animate-ripple-slow {
        animation: ripple-slow 4s ease-out infinite;
    }
    .animate-ripple-delayed {
        animation: ripple-delayed 4s ease-out infinite 2s;
    }
</style>
