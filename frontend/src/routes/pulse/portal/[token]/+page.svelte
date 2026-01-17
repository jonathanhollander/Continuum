<script lang="ts">
    import { pulse } from "$lib/stores/pulse";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import {
        ShieldCheck,
        Clock,
        MapPin,
        Heart,
        ShieldAlert,
        MessageSquare,
        Activity,
        Lock,
        Unlock,
        FileText,
        Cat,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";

    let state = $state({
        loading: true,
        error: null as string | null,
        data: null as any,
        hugSent: false,
        vaultItems: [] as any[],
    });

    onMount(async () => {
        const token = $page.params.token;
        await fetchPortal(token);
    });

    async function fetchPortal(token: string) {
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(`${baseUrl}/api/pulse/portal/${token}`);
            if (res.ok) {
                state.data = await res.json();

                // If not active, try to fetch vault (simulated disclosure)
                if (state.data.user_status !== "active") {
                    const vRes = await fetch(
                        `${baseUrl}/api/pulse/vault?user_id=${state.data.user_id}`,
                    );
                    if (vRes.ok) state.vaultItems = await vRes.json();
                }
            } else {
                state.error = "Invalid or expired access token.";
            }
        } finally {
            state.loading = false;
        }
    }

    async function sendHug() {
        const token = $page.params.token;
        const baseUrl =
            import.meta.env.VITE_API_BASE || "http://localhost:8000";
        await fetch(`${baseUrl}/api/pulse/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: state.data.user_id,
                contact_id: state.data.contact_id,
                message: "I am thinking of you! Sending a virtual hug.",
            }),
        });
        state.hugSent = true;
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
                class="bg-slate-900/60 border border-rose-500/30 rounded-3xl p-12 text-center backdrop-blur-xl"
            >
                <ShieldAlert class="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h2 class="text-2xl font-serif text-white mb-2">
                    Access Denied
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
                            class="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl animate-pulse"
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
                            class="flex items-center justify-center md:justify-start gap-3"
                        >
                            <div
                                class="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-[10px] uppercase font-bold tracking-[0.2em] text-teal-400"
                            >
                                {state.data.user_status === "active"
                                    ? "Heartbeat Active"
                                    : "Seeking Connection"}
                            </div>
                            <div
                                class="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest"
                            >
                                <Activity class="w-3 h-3 text-emerald-500" /> Online
                            </div>
                        </div>
                        <h1 class="text-3xl md:text-4xl font-serif text-white">
                            Status for {state.data.user_name}
                        </h1>
                        <p
                            class="text-slate-400 text-sm leading-relaxed max-w-md"
                        >
                            {#if state.data.user_status === "active"}
                                Everything looks normal. A check-in was
                                successfully recorded earlier today. You can
                                send a gentle ping to let them know you're
                                thinking of them.
                            {:else}
                                A scheduled check-in was missed. We are
                                monitoring the situation and notifying the inner
                                circle in priority order.
                            {/if}
                        </p>
                    </div>

                    <!-- Actions -->
                    <div class="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                        <button
                            onclick={sendHug}
                            disabled={state.hugSent}
                            class="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                        >
                            <Heart
                                class="w-5 h-5 {state.hugSent
                                    ? 'fill-current'
                                    : ''}"
                            />
                            {state.hugSent ? "Hug Received" : "Send a Hug"}
                        </button>
                        <a
                            href="/pulse/respond/{$page.params.token}"
                            class="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-2xl transition-all text-center border border-slate-700"
                        >
                            Acknowledge Status
                        </a>
                    </div>
                </div>
            </div>

            <!-- CARDS GRID -->
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Pulse Heartbeat (Mock Memories) -->
                <div
                    class="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md"
                >
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400"
                        >
                            <Heart class="w-5 h-5" />
                        </div>
                        <h3 class="font-medium text-slate-100">
                            Legacy Heartbeat
                        </h3>
                    </div>
                    <div
                        class="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative mb-4 border border-slate-800"
                    >
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10"
                        ></div>
                        <div class="absolute bottom-4 left-4 right-4 z-20">
                            <p
                                class="text-[10px] text-teal-300 font-bold uppercase tracking-widest mb-1"
                            >
                                Random Memory Share
                            </p>
                            <p class="text-xs text-slate-300 italic">
                                "Remembering the trip to the lake house, summer
                                2024."
                            </p>
                        </div>
                        <div
                            class="absolute inset-0 flex items-center justify-center opacity-20"
                        >
                            <ShieldCheck class="w-20 h-20" />
                        </div>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed">
                        This memory was automatically shared as part of today's
                        successful health pulse.
                    </p>
                </div>

                <!-- Emergency Docs (Simulated Safe Pass) -->
                <div
                    class="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md"
                >
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400"
                        >
                            <FileText class="w-5 h-5" />
                        </div>
                        <h3 class="font-medium text-slate-100">
                            Safe-Pass Access
                        </h3>
                    </div>

                    {#if state.data.user_status === "active"}
                        <div class="space-y-4">
                            <div
                                class="p-4 rounded-2xl border border-dashed border-slate-800 text-center"
                            >
                                <Lock
                                    class="w-8 h-8 text-slate-700 mx-auto mb-2"
                                />
                                <p
                                    class="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed"
                                >
                                    Documents Encrypted.<br />Lock expires
                                    during Tier 4 escalation.
                                </p>
                            </div>
                            <div class="text-[10px] text-slate-600 italic">
                                Expected contents: Advance Directives, DNR
                                Instructions, Physician Info.
                            </div>
                        </div>
                    {:else}
                        <div class="space-y-3" in:fade>
                            <button
                                class="w-full bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700 group hover:border-teal-500/50 transition-colors"
                            >
                                <div class="flex items-center gap-3">
                                    <FileText class="w-5 h-5 text-teal-400" />
                                    <span class="text-sm font-medium"
                                        >Medical Directives.pdf</span
                                    >
                                </div>
                                <Unlock
                                    class="w-4 h-4 text-slate-600 group-hover:text-teal-400"
                                />
                            </button>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- VAULT DISCLOSURE (Gate codes / Pet care) -->
            {#if state.vaultItems.length > 0}
                <div
                    class="bg-indigo-950/20 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-md"
                    in:slide
                >
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400"
                        >
                            <Unlock class="w-5 h-5" />
                        </div>
                        <h3 class="font-medium text-slate-100 italic">
                            Emergency Protocols Unlocked
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
