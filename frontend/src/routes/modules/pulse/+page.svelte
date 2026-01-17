<script lang="ts">
    import { pulse } from "$lib/stores/pulse";
    import { onMount } from "svelte";
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
    } from "lucide-svelte";
    import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";
    import PetalDrift from "$lib/components/pulse/PetalDrift.svelte";

    const USER_ID = 1;
    let petals: PetalDrift;

    let localStatus = $state({
        checkingIn: false,
        lastSuccess: false,
        safetyTimer: null as any,
        safetyInput: 30,
        showSafetyConfig: false,
        purpose: "Walking home",
    });

    onMount(async () => {
        pulse.init(USER_ID);
        fetchSafetyStatus();
        const interval = setInterval(fetchSafetyStatus, 10000);
        return () => clearInterval(interval);
    });

    async function fetchSafetyStatus() {
        const baseUrl =
            import.meta.env.VITE_API_BASE || "http://localhost:8000";
        try {
            const res = await fetch(
                `${baseUrl}/api/pulse/safety/status?user_id=${USER_ID}`,
            );
            if (res.ok) {
                localStatus.safetyTimer = await res.json();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function checkIn() {
        localStatus.checkingIn = true;
        try {
            const success = await pulse.checkin(
                USER_ID,
                5,
                "Manual Dashboard Tap",
            );
            if (success) {
                localStatus.lastSuccess = true;
                petals?.trigger();
                setTimeout(() => {
                    localStatus.lastSuccess = false;
                }, 3000);
            }
        } finally {
            localStatus.checkingIn = false;
        }
    }

    async function startSafety() {
        const baseUrl =
            import.meta.env.VITE_API_BASE || "http://localhost:8000";
        try {
            const res = await fetch(
                `${baseUrl}/api/pulse/safety/start?user_id=${USER_ID}&minutes=${localStatus.safetyInput}&purpose=${localStatus.purpose}`,
                {
                    method: "POST",
                },
            );
            if (res.ok) {
                localStatus.safetyTimer = await res.json();
                localStatus.showSafetyConfig = false;
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function cancelSafety() {
        const baseUrl =
            import.meta.env.VITE_API_BASE || "http://localhost:8000";
        try {
            const res = await fetch(
                `${baseUrl}/api/pulse/safety/cancel?user_id=${USER_ID}`,
                { method: "POST" },
            );
            if (res.ok) localStatus.safetyTimer = null;
        } catch (e) {
            console.error(e);
        }
    }

    function getTimeRemaining(expiry: string) {
        const diff = new Date(expiry).getTime() - new Date().getTime();
        if (diff <= 0) return "EXPIRED";
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
        <!-- Pulse Button Architecture -->
        <div class="relative group cursor-pointer mb-8" onclick={checkIn}>
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
                class="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-slate-900 border-2 border-slate-800 shadow-[0_0_50px_-10px_rgba(20,184,166,0.2)] flex flex-col items-center justify-center transition-all duration-700 active:scale-95 group-hover:border-teal-500/40"
            >
                {#if localStatus.checkingIn}
                    <Loader2 class="w-12 h-12 text-teal-500 animate-spin" />
                    <span
                        class="text-xs font-bold text-teal-400 mt-4 uppercase tracking-[0.3em]"
                        >Synching...</span
                    >
                {:else if localStatus.lastSuccess}
                    <CheckCircle2
                        class="w-12 h-12 text-emerald-400 transition-all scale-125"
                    />
                    <span
                        class="text-xs font-bold text-emerald-300 mt-4 uppercase tracking-[0.3em]"
                        >Verified</span
                    >
                {:else}
                    <div
                        class="w-16 h-1 bg-teal-500/50 rounded-full mb-6 group-hover:bg-teal-400 transition-colors"
                    ></div>
                    <span
                        class="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] mb-2"
                        >Pulse Check</span
                    >
                    <h2 class="text-3xl font-serif text-white tracking-wide">
                        I'm Here
                    </h2>
                    <div
                        class="w-16 h-1 bg-teal-500/50 rounded-full mt-6 group-hover:bg-teal-400 transition-colors"
                    ></div>
                {/if}
            </button>
        </div>

        <div class="space-y-2">
            <h1 class="text-2xl font-serif text-white flex items-center gap-3">
                {$pulse.status === "active"
                    ? "Heartbeat Active"
                    : "Seeking Connection"}
                {#if $pulse.status === "active"}
                    <span
                        class="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping"
                    ></span>
                {/if}
            </h1>
            <p
                class="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed italic"
            >
                Your inner circle is standing by. Next scheduled nudge in {$pulse.next_nudge ||
                    "--:--"}.
            </p>
        </div>
    </div>

    <!-- QUICK ACTIONS MESH -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- SAFETY TIMER CARD (Fidelity Update) -->
        <div
            class="bg-indigo-950/20 border border-indigo-500/20 rounded-[2rem] p-8 backdrop-blur-md relative overflow-hidden group"
        >
            <div
                class="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity"
            >
                <Navigation class="w-24 h-24 text-indigo-400" />
            </div>

            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center"
                >
                    <Zap class="w-5 h-5 text-indigo-400" />
                </div>
                <h3 class="font-medium text-slate-100">Safety Timer</h3>
            </div>

            {#if localStatus.safetyTimer}
                <div class="space-y-4">
                    <div class="text-center py-4">
                        <div
                            class="text-4xl font-mono text-indigo-400 tracking-tighter mb-1"
                        >
                            {getTimeRemaining(
                                localStatus.safetyTimer.expires_at,
                            )}
                        </div>
                        <p
                            class="text-[10px] text-indigo-300/60 uppercase tracking-widest uppercase"
                        >
                            Immediate Escalation on Zero
                        </p>
                    </div>
                    <button
                        onclick={cancelSafety}
                        class="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <XCircle class="w-4 h-4" /> Cancel Monitoring
                    </button>
                </div>
            {:else if localStatus.showSafetyConfig}
                <div class="space-y-4" in:slide>
                    <select
                        bind:value={localStatus.purpose}
                        class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300"
                    >
                        <option>Walking home</option>
                        <option>Meeting stranger</option>
                        <option>Health check</option>
                    </select>
                    <div class="flex items-center gap-4">
                        <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            bind:value={localStatus.safetyInput}
                            class="flex-1 h-1.5 bg-slate-800 accent-indigo-500 rounded-lg cursor-pointer"
                        />
                        <span class="text-xs font-bold text-indigo-400 w-12"
                            >{localStatus.safetyInput}m</span
                        >
                    </div>
                    <button
                        onclick={startSafety}
                        class="w-full bg-indigo-500 hover:bg-indigo-400 text-slate-950 py-3 rounded-2xl text-xs font-bold transition-all"
                    >
                        Activate Immediate Guard
                    </button>
                </div>
            {:else}
                <p class="text-sm text-slate-500 leading-relaxed mb-6">
                    Activate high-frequency monitoring for short durations.
                    Notifies responders immediately if expired.
                </p>
                <button
                    onclick={() => (localStatus.showSafetyConfig = true)}
                    class="w-full bg-slate-900 border border-slate-800 text-slate-300 py-3 rounded-2xl text-xs font-bold hover:border-indigo-500/50 hover:text-white transition-all"
                >
                    Start Safety Timer
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
                    View heartbeats and notes sent from your Guardians.
                </p>
            </div>
            <div class="pt-6">
                <span
                    class="text-[10px] text-teal-500 font-bold uppercase tracking-widest border border-teal-500/20 px-3 py-1 rounded-full"
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
                    Visualize exactly what data your guardians can see and when.
                </p>
            </div>
            <div class="pt-6">
                <span
                    class="text-[10px] text-amber-500 font-bold uppercase tracking-widest border border-amber-500/20 px-3 py-1 rounded-full"
                    >Secure Disclosure</span
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
                Estate Readiness Influence
            </h3>
            <div class="text-5xl md:text-7xl font-serif text-white mb-2">
                85<span class="text-teal-500">%</span>
            </div>
            <p class="text-sm text-slate-400 max-w-sm">
                The Pulse adds <span class="text-teal-400 font-bold">+15%</span>
                to your overall estate verification score by ensuring active presence.
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
