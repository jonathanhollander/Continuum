<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { CheckCircle2, Shield, Activity, Loader2 } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";
    import PetalDrift from "$lib/components/pulse/PetalDrift.svelte";

    let state = $state({
        loading: true,
        error: null as string | null,
        success: false,
    });

    let petals: PetalDrift;

    onMount(async () => {
        const token = $page.params.token;
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(`${baseUrl}/api/pulse/verify/${token}`);

            if (res.ok) {
                state.success = true;
                setTimeout(() => petals?.trigger(), 500);
            } else {
                const err = await res.json();
                state.error = err.detail || "Invalid or expired link.";
            }
        } catch (e) {
            state.error = "Connection timeout. Please verify you are online.";
        } finally {
            state.loading = false;
        }
    });
</script>

<PetalDrift bind:this={petals} />

<div
    class="min-h-screen relative overflow-hidden font-sans text-slate-100 flex items-center justify-center p-6"
>
    <LivingMesh status={state.success ? "active" : "disabled"} />

    <div
        class="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 text-center shadow-2xl relative z-10"
    >
        <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-950/50 border border-slate-700 mb-6"
        >
            <Shield class="w-8 h-8 text-teal-400" />
        </div>

        {#if state.loading}
            <div class="space-y-4">
                <Loader2 class="w-10 h-10 text-teal-500 animate-spin mx-auto" />
                <h2 class="text-xl font-serif">Sending Signal...</h2>
                <p class="text-slate-400 text-sm">
                    Verifying your secure heartbeat link.
                </p>
            </div>
        {:else if state.error}
            <div class="space-y-4" in:fade>
                <div
                    class="text-rose-400 font-bold uppercase tracking-widest text-xs"
                >
                    Error
                </div>
                <h2 class="text-2xl font-serif text-white">Link Inactive</h2>
                <p class="text-slate-400 text-sm leading-relaxed">
                    {state.error}
                </p>
                <div class="pt-4">
                    <a
                        href="https://continuum.estate"
                        class="text-teal-400 hover:underline text-sm font-medium"
                        >Return to Home</a
                    >
                </div>
            </div>
        {:else if state.success}
            <div class="space-y-6" in:fade>
                <div
                    class="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30"
                >
                    <CheckCircle2 class="w-3 h-3" /> Confirmed
                </div>

                <h2 class="text-3xl font-serif text-white">Signal Received</h2>

                <div class="py-4">
                    <p class="text-slate-300 leading-relaxed">
                        Your wellness has been recorded. Your Guardians have
                        been notified that all systems are nominal.
                    </p>
                </div>

                <div class="pt-2">
                    <div
                        class="h-1 w-24 bg-teal-500/30 rounded-full mx-auto overflow-hidden"
                    >
                        <div
                            class="h-full bg-teal-400 w-full animate-progress-reveal"
                        ></div>
                    </div>
                    <p
                        class="text-slate-500 text-[10px] font-mono mt-4 uppercase tracking-[0.2em]"
                    >
                        Next Pulse in 48h
                    </p>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    @keyframes progress-reveal {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(0);
        }
    }
    .animate-progress-reveal {
        animation: progress-reveal 1.5s ease-out forwards;
    }
</style>
