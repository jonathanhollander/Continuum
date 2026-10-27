<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api/client";
    import { CheckCircle2, Shield, Activity, Loader2 } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";
    import PetalDrift from "$lib/components/pulse/PetalDrift.svelte";

    // Opening this page only reads the link (mail scanners pre-open links); the check-in is
    // recorded when the owner presses the button (POST).
    let state = $state({
        loading: true,
        sending: false,
        error: null as string | null,
        success: false,
        userName: "",
        frequencyDays: 0,
    });

    let petals: PetalDrift;
    const RESTED =
        "This link has rested. You can check in from your Wellness Check-in page any time.";
    const RETRY = "Let's try again in a little while.";

    onMount(async () => {
        const token = $page.params.token;
        try {
            const res = await apiFetch(`/api/pulse/verify/${token}`);
            if (res.ok) {
                const data = await res.json();
                state.userName = data.user_name || "";
                state.frequencyDays = data.frequency_days || 0;
            } else {
                state.error = res.status === 404 ? RESTED : RETRY;
            }
        } catch (e) {
            state.error = RETRY;
        } finally {
            state.loading = false;
        }
    });

    async function checkIn() {
        const token = $page.params.token;
        state.sending = true;
        try {
            const res = await apiFetch(`/api/pulse/verify/${token}`, {
                method: "POST",
            });
            if (res.ok) {
                const data = await res.json();
                state.frequencyDays = data.frequency_days || state.frequencyDays;
                state.success = true;
                setTimeout(() => petals?.trigger(), 500);
            } else {
                state.error = res.status === 404 ? RESTED : RETRY;
            }
        } catch (e) {
            state.error = RETRY;
        } finally {
            state.sending = false;
        }
    }
</script>

<PetalDrift bind:this={petals} />

<div
    class="surface-dark min-h-screen relative overflow-hidden font-sans text-foreground flex items-center justify-center p-6"
>
    <LivingMesh status={state.success ? "active" : "disabled"} />

    <div
        class="max-w-md w-full bg-background/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 text-center shadow-2xl relative z-10"
    >
        <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-950/50 border border-border mb-6"
        >
            <Shield class="w-8 h-8 text-primary" />
        </div>

        {#if state.loading}
            <div class="space-y-4">
                <Loader2 class="w-10 h-10 text-primary animate-spin mx-auto" />
                <h2 class="text-xl font-serif">Opening your check-in.</h2>
            </div>
        {:else if state.error}
            <div class="space-y-4" in:fade>
                <h2 class="text-2xl font-serif text-foreground">This link has rested</h2>
                <p class="text-muted-foreground text-sm leading-relaxed">
                    {state.error}
                </p>
                <div class="pt-4">
                    <a
                        href="https://continuum.estate"
                        class="text-primary hover:underline text-sm font-medium"
                        >Return to Home</a
                    >
                </div>
            </div>
        {:else if state.success}
            <div class="space-y-6" in:fade>
                <div
                    class="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-primary/30"
                >
                    <CheckCircle2 class="w-3 h-3" /> Received
                </div>

                <h2 class="text-3xl font-serif text-foreground">Your check-in is saved.</h2>

                <div class="py-4">
                    <p class="text-slate-300 leading-relaxed">
                        Thank you for checking in. Your recorded check-in time
                        starts the next check-in interval.
                    </p>
                </div>

                <div class="pt-2">
                    <div
                        class="h-1 w-24 bg-primary/30 rounded-full mx-auto overflow-hidden"
                    >
                        <div
                            class="h-full bg-primary w-full animate-progress-reveal"
                        ></div>
                    </div>
                    <p
                        class="text-muted-foreground text-[10px] font-mono mt-4 uppercase tracking-[0.2em]"
                    >
                        Your next gentle check-in is in about {state.frequencyDays}
                        {state.frequencyDays === 1 ? "day" : "days"}
                    </p>
                </div>
            </div>
        {:else}
            <div class="space-y-6" in:fade>
                <h2 class="text-3xl font-serif text-foreground">
                    {state.userName ? `Hello, ${state.userName}` : "Hello"}
                </h2>
                <p class="text-slate-300 leading-relaxed">
                    Record your check-in to start the next check-in interval.
                </p>
                <button
                    onclick={checkIn}
                    disabled={state.sending}
                    class="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-primary-foreground font-bold px-8 py-4 rounded-2xl transition-all"
                >
                    {state.sending ? "Saving your check-in..." : "I'm here and well"}
                </button>
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
