<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import {
        AlertTriangle,
        Clock,
        CheckCircle2,
        Shield,
        Info,
        PauseCircle,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";

    let state = $state({
        loading: true,
        error: null as string | null,
        data: null as any,
        actionSuccess: null as "snoozed" | "acknowledged" | null,
    });

    onMount(async () => {
        const token = $page.params.token;
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(`${baseUrl}/api/pulse/portal/${token}`);
            if (res.ok) {
                state.data = await res.json();
            } else {
                state.error = "Invalid responder token.";
            }
        } finally {
            state.loading = false;
        }
    });

    async function handleAction(action: "snooze" | "acknowledge") {
        const token = $page.params.token;
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(
                `${baseUrl}/api/pulse/respond/${token}?action=${action}`,
                {
                    method: "POST",
                },
            );
            if (res.ok) {
                const result = await res.json();
                state.actionSuccess = result.status;
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

<div class="min-h-screen relative overflow-hidden font-sans text-slate-200">
    <LivingMesh
        status={state.data?.user_status === "active" ? "active" : "grace"}
    />

    <div
        class="relative z-10 flex min-h-screen items-center justify-center p-4"
    >
        <div class="max-w-md w-full space-y-6">
            <div class="text-center mb-8">
                <div
                    class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-md mb-4 text-amber-400"
                >
                    <AlertTriangle class="w-6 h-6" />
                </div>
                <h1 class="text-xl font-serif text-white tracking-wide">
                    Pulse Alert Response
                </h1>
                <p class="text-slate-400 text-sm">
                    Action needed for {state.data?.user_name || "User"}
                </p>
            </div>

            {#if state.loading}
                <div
                    class="bg-slate-900/40 rounded-3xl p-12 text-center border border-slate-800"
                >
                    <div
                        class="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                    ></div>
                </div>
            {:else if state.error}
                <div
                    class="bg-rose-950/20 border border-rose-900/50 rounded-3xl p-8 text-center backdrop-blur-md"
                >
                    <Shield class="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 class="text-lg font-medium text-white mb-2">
                        Link Inactive
                    </h2>
                    <p class="text-slate-400 text-sm">{state.error}</p>
                </div>
            {:else if state.actionSuccess}
                <div
                    class="bg-slate-900/80 border border-teal-500/30 rounded-[2.5rem] p-10 text-center backdrop-blur-xl shadow-2xl"
                    in:fade
                >
                    <CheckCircle2
                        class="w-16 h-16 text-teal-400 mx-auto mb-6"
                    />
                    <h2 class="text-2xl font-serif text-white mb-4">
                        Action Confirmed
                    </h2>
                    <p class="text-slate-300">
                        {#if state.actionSuccess === "snoozed"}
                            You have successfully snoozed the alert. The timer
                            has been reset while you verify {state.data
                                .user_name}'s status locally.
                        {:else}
                            Thank you. Your acknowledgment has been recorded in
                            the system log.
                        {/if}
                    </p>
                </div>
            {:else if state.data}
                <div class="space-y-4" in:slide>
                    <!-- Alert Context -->
                    <div
                        class="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-md"
                    >
                        <div class="flex gap-4">
                            <Clock class="w-10 h-10 text-amber-400 shrink-0" />
                            <div>
                                <h3 class="font-medium text-amber-200">
                                    Missed Pulse Update
                                </h3>
                                <p
                                    class="text-sm text-amber-200/70 mt-1 leading-relaxed"
                                >
                                    {state.data.user_name} missed their scheduled
                                    check-in {new Date(
                                        state.data.last_checkin,
                                    ).toLocaleDateString()} at {new Date(
                                        state.data.last_checkin,
                                    ).toLocaleTimeString()}.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Responder Actions -->
                    <div class="grid grid-cols-1 gap-4">
                        <button
                            onclick={() => handleAction("snooze")}
                            class="bg-slate-800/80 hover:bg-slate-700 hover:border-teal-500/50 border border-slate-700 transition-all rounded-2xl p-6 text-left group"
                        >
                            <div class="flex items-center gap-4">
                                <PauseCircle
                                    class="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform"
                                />
                                <div>
                                    <div
                                        class="text-slate-100 font-medium text-sm"
                                    >
                                        I've confirmed they are OK
                                    </div>
                                    <div class="text-slate-500 text-xs mt-0.5">
                                        Snooze alerts for 48 hours
                                    </div>
                                </div>
                            </div>
                        </button>

                        <button
                            onclick={() => handleAction("acknowledge")}
                            class="bg-slate-800/80 hover:bg-slate-700 hover:border-slate-500 border border-slate-700 transition-all rounded-2xl p-6 text-left"
                        >
                            <div class="flex items-center gap-4">
                                <Info class="w-6 h-6 text-slate-400" />
                                <div>
                                    <div
                                        class="text-slate-300 font-medium text-sm"
                                    >
                                        Acknowledged
                                    </div>
                                    <div class="text-slate-500 text-xs mt-0.5">
                                        I am aware and coordinating check-in
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div class="p-6 text-center">
                        <p class="text-xs text-slate-500 leading-relaxed">
                            Acting on behalf of {state.data.user_name} will be logged
                            for transparency within the Inner Circle.
                        </p>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
