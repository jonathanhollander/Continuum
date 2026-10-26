<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { API_BASE_URL } from "$lib/config";
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
        // The page could not be reached (network), as opposed to a link that no longer opens
        offline: false,
        data: null as any,
        actionSuccess: null as "snoozed" | "acknowledged" | null,
        actionError: null as string | null,
    });

    // The API sends UTC with "Z"; a time without a zone is still read as UTC, never local
    function parseUtc(ts: string): Date {
        return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + "Z");
    }

    onMount(async () => {
        const token = $page.params.token;
        try {
            const baseUrl = API_BASE_URL;
            const res = await fetch(`${baseUrl}/api/pulse/portal/${token}`);
            if (res.ok) {
                state.data = await res.json();
            } else {
                // Same wording as /pulse/portal for a link that no longer opens
                state.error =
                    "This link may have expired or been replaced. The person who shared it can send you a new one.";
            }
        } catch (e) {
            console.error(e);
            state.offline = true;
            state.error = "Let's try opening this page again in a moment.";
        } finally {
            state.loading = false;
        }
    });

    async function handleAction(action: "snooze" | "acknowledge") {
        const token = $page.params.token;
        state.actionError = null;
        try {
            const baseUrl = API_BASE_URL;
            const res = await fetch(
                `${baseUrl}/api/pulse/respond/${token}?action=${action}`,
                {
                    method: "POST",
                },
            );
            if (res.ok) {
                const result = await res.json();
                state.actionSuccess = result.status;
            } else {
                state.actionError =
                    res.status === 401 || res.status === 404
                        ? "We couldn't record that just now. This link may have expired; please try again in a little while."
                        : "We couldn't record that just now. Please try again in a little while.";
            }
        } catch (e) {
            state.actionError =
                "We couldn't record that just now. Please try again in a little while.";
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
                    Checking in on {state.data?.user_name || "your loved one"}
                </h1>
            </div>

            {#if state.loading}
                <div
                    class="bg-slate-900/40 rounded-2xl p-12 text-center border border-slate-800"
                >
                    <div
                        class="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                    ></div>
                </div>
            {:else if state.error}
                <div
                    class="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-8 text-center backdrop-blur-md"
                >
                    <Shield class="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    {#if !state.offline}
                        <h2 class="text-lg font-medium text-white mb-2">
                            This link has rested
                        </h2>
                    {/if}
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
                        {state.actionSuccess === "snoozed"
                            ? "Thank you, it's recorded"
                            : "Thank you"}
                    </h2>
                    <p class="text-slate-300">
                        {#if state.actionSuccess === "snoozed"}
                            We'll pause further alerts for a while; thank you
                            for checking on {state.data.user_name}. This
                            appears in their check-in history.
                        {:else}
                            Thank you for looking in on {state.data.user_name}.
                            It means a great deal to have you close.
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
                                    {state.data.user_status === "active"
                                        ? "Checked in recently"
                                        : "It has been quiet for a little while"}
                                </h3>
                                <p
                                    class="text-sm text-amber-200/70 mt-1 leading-relaxed"
                                >
                                    {#if state.data.last_checkin}
                                        {state.data.user_name}'s last check-in was {parseUtc(
                                            state.data.last_checkin,
                                        ).toLocaleDateString()} at {parseUtc(
                                            state.data.last_checkin,
                                        ).toLocaleTimeString()}.
                                    {:else}
                                        We're waiting to hear from {state.data.user_name}.
                                    {/if}
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
                                        I've spoken with {state.data.user_name} and they're well
                                    </div>
                                    <div class="text-slate-500 text-xs mt-0.5">
                                        Pauses further alerts for a while
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
                                        I've seen this
                                    </div>
                                    <div class="text-slate-500 text-xs mt-0.5">
                                        I'm looking in on them
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>

                    {#if state.actionError}
                        <p
                            class="text-sm text-amber-300 text-center leading-relaxed"
                            role="status"
                        >
                            {state.actionError}
                        </p>
                    {/if}

                    <div class="p-6 text-center">
                        <p class="text-xs text-slate-500 leading-relaxed">
                            When you mark {state.data.user_name} as OK, it appears
                            in their check-in history.
                        </p>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
