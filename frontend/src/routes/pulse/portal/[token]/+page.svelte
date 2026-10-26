<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { API_BASE_URL } from "$lib/config";
    import {
        ShieldCheck,
        Clock,
        Heart,
        ShieldAlert,
        Activity,
        Lock,
        Unlock,
        Cat,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";

    let state = $state({
        loading: true,
        error: null as string | null,
        data: null as any,
        hugSent: false,
        hugError: false,
        vaultItems: [] as any[],
    });

    // The API sends naive UTC timestamps (no "Z"); read them as UTC, not local time
    function parseUtc(ts: string): Date {
        return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + "Z");
    }

    let lastCheckinText = $derived(
        state.data?.last_checkin
            ? parseUtc(state.data.last_checkin).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
              })
            : null,
    );

    onMount(async () => {
        const token = $page.params.token;
        if (token) {
            await fetchPortal(token);
        } else {
            state.error = "Invalid or missing token.";
            state.loading = false;
        }
    });

    async function fetchPortal(token: string) {
        try {
            const baseUrl = API_BASE_URL;
            const res = await fetch(`${baseUrl}/api/pulse/portal/${token}`);
            if (res.ok) {
                state.data = await res.json();

                // Vault opens only once escalation reaches this guardian's tier
                if (state.data.show_sensitive) {
                    const vRes = await fetch(
                        `${baseUrl}/api/pulse/portal/${token}/vault`,
                    );
                    if (vRes.ok) state.vaultItems = await vRes.json();
                }
            } else {
                state.error =
                    "This link may have expired or been replaced. The person who shared it can send you a new one.";
            }
        } catch (e) {
            state.error =
                "We couldn't reach the page just now. Please try again in a little while.";
        } finally {
            state.loading = false;
        }
    }

    async function sendHug() {
        const token = $page.params.token;
        const baseUrl = API_BASE_URL;
        state.hugError = false;
        try {
            const res = await fetch(`${baseUrl}/api/pulse/nudge/${token}`, {
                method: "POST",
            });
            if (res.ok) state.hugSent = true;
            else state.hugError = true;
        } catch (e) {
            state.hugError = true;
        }
    }
</script>

<div
    class="min-h-screen relative overflow-hidden font-sans text-slate-100 pb-20"
>
    <LivingMesh status={state.data?.user_status || "disabled"} />

    <div
        class="relative z-10 max-w-4xl mx-auto p-4 md:p-8 space-y-8 pt-12 md:pt-20"
    >
        {#if state.loading}
            <div class="flex flex-col items-center justify-center py-40">
                <div
                    class="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"
                ></div>
            </div>
        {:else if state.error}
            <div
                class="bg-slate-900/60 border border-rose-500/30 rounded-2xl p-12 text-center backdrop-blur-xl"
            >
                <ShieldAlert class="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h2 class="text-2xl font-serif text-white mb-2">
                    This link isn't active
                </h2>
                <p class="text-slate-400">{state.error}</p>
            </div>
        {:else if state.data}
            <!-- RELIEF HERO -->
            <div
                class="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden"
            >
                <div class="flex flex-col md:flex-row items-center gap-10">
                    <!-- Status Ring -->
                    <div class="relative">
                        <div
                            class="absolute inset-0 {state.data.user_status ===
                            'active'
                                ? 'bg-teal-500/20'
                                : 'bg-amber-500/20'} rounded-full blur-2xl animate-pulse"
                        ></div>
                        <div
                            class="w-32 h-32 md:w-40 md:h-40 border-4 border-slate-800 rounded-full flex items-center justify-center relative z-10"
                        >
                            {#if state.data.user_status === "active"}
                                <ShieldCheck
                                    class="w-12 h-12 md:w-16 md:h-16 text-teal-400"
                                />
                            {:else}
                                <Clock
                                    class="w-12 h-12 md:w-16 md:h-16 text-amber-400"
                                />
                            {/if}
                        </div>
                    </div>

                    <div class="flex-1 text-center md:text-left space-y-4">
                        <div
                            class="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-2"
                        >
                            <div
                                class="px-3 py-1 rounded-full whitespace-nowrap text-[10px] uppercase font-bold tracking-[0.2em] {state
                                    .data.user_status === 'active'
                                    ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                                    : 'bg-amber-500/20 border border-amber-500/30 text-amber-300'}"
                            >
                                {state.data.user_status === "active"
                                    ? "Checked in recently"
                                    : "Hasn't checked in for a little while"}
                            </div>
                            <div
                                class="flex items-center gap-2 whitespace-nowrap text-[10px] text-slate-500 uppercase font-bold tracking-widest"
                            >
                                <Activity class="w-3 h-3 text-slate-500" />
                                {lastCheckinText
                                    ? `Last check-in ${lastCheckinText}`
                                    : "No check-ins yet"}
                            </div>
                        </div>
                        <h1 class="text-3xl md:text-4xl font-serif text-white">
                            Status for {state.data.user_name}
                        </h1>
                        <p
                            class="text-slate-400 text-sm leading-relaxed max-w-md"
                        >
                            {#if state.data.user_status === "active"}
                                {state.data.user_name} checked in recently, on
                                {lastCheckinText}. All is well for now. You can
                                send a hug to let them know you're thinking of
                                them.
                            {:else if lastCheckinText}
                                {state.data.user_name} hasn't checked in for a
                                little while. Their last check-in was on
                                {lastCheckinText}. A hug or a quick hello from
                                you may help.
                            {:else}
                                {state.data.user_name} hasn't checked in yet. A
                                hug or a quick hello from you may help.
                            {/if}
                        </p>
                    </div>

                    <!-- Actions -->
                    <div class="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                        <button
                            onclick={sendHug}
                            disabled={state.hugSent}
                            class="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-teal-300 text-slate-950 font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                        >
                            <Heart
                                class="w-5 h-5 {state.hugSent
                                    ? 'fill-current'
                                    : ''}"
                            />
                            {state.hugSent ? "Hug sent" : "Send a Hug"}
                        </button>
                        {#if state.hugError}
                            <p class="text-xs text-amber-300 text-center max-w-[16rem]">
                                We couldn't send your hug just now. This link may
                                have expired; please try again in a little while.
                            </p>
                        {/if}
                        <a
                            href="/pulse/respond/{$page.params.token}"
                            class="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-2xl transition-all text-center border border-slate-700"
                        >
                            Acknowledge Status
                        </a>
                    </div>
                </div>
            </div>

            <!-- SHARED NOTES: the owner's Pulse vault, opened only once escalation reaches this guardian's tier -->
            {#if state.vaultItems.length === 0}
                <div
                    class="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-md"
                >
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"
                        >
                            <Lock class="w-5 h-5" />
                        </div>
                        <h3 class="font-medium text-slate-100">
                            Notes shared with you
                        </h3>
                    </div>
                    <p class="text-sm text-slate-400 leading-relaxed">
                        {#if state.data.show_sensitive}
                            {state.data.user_name} hasn't left any notes here
                            for you yet.
                        {:else}
                            If {state.data.user_name} has left notes for you,
                            they'll appear here only if they're ever needed.
                            There's nothing you need to do right now.
                        {/if}
                    </p>
                </div>
            {/if}

            <!-- VAULT DISCLOSURE (Gate codes / Pet care) -->
            {#if state.vaultItems.length > 0}
                <div
                    class="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-md"
                    in:slide
                >
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400"
                        >
                            <Unlock class="w-5 h-5" />
                        </div>
                        <h3 class="font-medium text-slate-100 italic">
                            Notes {state.data.user_name} shared with you
                        </h3>
                    </div>

                    <div class="grid md:grid-cols-2 gap-4">
                        {#each state.vaultItems as item}
                            <div
                                class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800"
                            >
                                <div class="flex items-center gap-3 mb-3">
                                    {#if item.name
                                        .toLowerCase()
                                        .includes("pet") || item.name
                                            .toLowerCase()
                                            .includes("cat")}
                                        <Cat class="w-4 h-4 text-amber-400" />
                                    {:else}
                                        <Lock class="w-4 h-4 text-indigo-400" />
                                    {/if}
                                    <span
                                        class="text-sm font-bold text-slate-200"
                                        >{item.name}</span
                                    >
                                </div>
                                <div
                                    class="bg-slate-950 p-4 rounded-xl font-mono text-xs text-teal-400 border border-teal-500/10"
                                >
                                    {item.content}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>
