<script lang="ts">
    import { pulse, pulseStore } from "$lib/stores/pulse.svelte";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import {
        Heart,
        Shield,
        Activity,
        Clock,
        Users,
        ArrowRight,
        Settings,
        CheckCircle2,
        AlertTriangle,
    } from "lucide-svelte";

    // State for the check-in interaction
    let checkinNote = $state("");
    let isCheckingIn = $state(false);

    onMount(() => {
        pulse.init();
    });

    async function handleCheckin() {
        if (isCheckingIn) return;
        isCheckingIn = true;
        const success = await pulse.checkin(checkinNote);
        if (success) {
            checkinNote = "";
        }
        isCheckingIn = false;
    }

    // Helper for status colors
    const statusColors = {
        active: "bg-emerald-50 text-emerald-700 border-emerald-200",
        grace: "bg-amber-50 text-amber-700 border-amber-200",
        escalated: "bg-rose-50 text-rose-700 border-rose-200",
        disabled: "bg-slate-50 text-slate-700 border-slate-200",
        not_configured: "bg-slate-50 text-slate-700 border-slate-200",
    };

    const statusLabels = {
        active: "Active & Monitoring",
        grace: "Grace Period",
        escalated: "Escalation Active",
        disabled: "Disabled",
        not_configured: "Not Configured",
    };
</script>

<div class="max-w-4xl mx-auto space-y-8 p-6">
    <!-- Header Section -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <h1
                class="text-3xl font-serif text-slate-900 mb-1 flex items-center gap-3"
            >
                <Shield class="w-8 h-8 text-indigo-600" />
                Digital Guardian
            </h1>
            <p class="text-slate-600">
                Your automated well-being monitor. We check if you're okay so
                your loved ones don't have to worry.
            </p>
        </div>
        <a href="/pulse/settings" class="btn btn-outline gap-2">
            <Settings class="w-4 h-4" />
            Configure
        </a>
    </div>

    <!-- Main Status Card -->
    <div
        class="card bg-white shadow-xl border border-slate-100 overflow-hidden relative"
    >
        <!-- Background Pulse Effect -->
        <div
            class="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"
        ></div>

        <div class="card-body p-8 relative z-10">
            <div
                class="flex flex-col items-center justify-center text-center space-y-6"
            >
                <!-- Status Indicator -->
                <div class="relative">
                    {#if pulse.status === "active"}
                        <div
                            class="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"
                        ></div>
                    {/if}
                    <div
                        class={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${statusColors[pulse.status].replace("bg-", "border-").split(" ")[2] || "border-slate-200"} bg-white shadow-sm`}
                    >
                        <Activity
                            class={`w-10 h-10 ${statusColors[pulse.status].split(" ")[1] || "text-slate-400"}`}
                        />
                    </div>
                </div>

                <div class="space-y-2">
                    <h2 class="text-2xl font-medium text-slate-900">
                        {statusLabels[pulse.status]}
                    </h2>
                    {#if pulse.status === "active" && pulse.next_nudge}
                        <p
                            class="text-slate-500 flex items-center justify-center gap-2"
                        >
                            <Clock class="w-4 h-4" />
                            Next check-in expected by {new Date(
                                pulse.next_nudge,
                            ).toLocaleString(undefined, {
                                weekday: "long",
                                hour: "numeric",
                                minute: "2-digit",
                            })}
                        </p>
                    {:else if pulse.status === "grace"}
                        <p
                            class="text-amber-600 flex items-center justify-center gap-2 font-medium"
                        >
                            <AlertTriangle class="w-4 h-4" />
                            We haven't heard from you properly. Please check in.
                        </p>
                    {:else}
                        <p class="text-slate-500">
                            Configure your check-in frequency in settings.
                        </p>
                    {/if}
                </div>

                <!-- Action Area -->
                <div
                    class="w-full max-w-md bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4"
                >
                    <div class="form-control">
                        <input
                            type="text"
                            placeholder="Add a note (optional)..."
                            class="input input-bordered w-full bg-white"
                            bind:value={checkinNote}
                        />
                    </div>
                    <button
                        class="btn btn-primary w-full gap-2 text-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
                        onclick={handleCheckin}
                        disabled={isCheckingIn}
                    >
                        {#if isCheckingIn}
                            <span class="loading loading-spinner"></span>
                        {:else}
                            <Heart class="w-5 h-5 fill-current" />
                        {/if}
                        I'm Okay - Check In
                    </button>
                    <p class="text-xs text-center text-slate-400">
                        This will reset your safety timer and notify purely
                        based on your settings.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Info Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Last Check-in -->
        <div
            class="card bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
        >
            <div class="card-body p-6">
                <h3
                    class="card-title text-base text-slate-500 flex items-center gap-2"
                >
                    <Clock class="w-4 h-4" />
                    Last Verified
                </h3>
                <p class="text-xl font-medium text-slate-900 mt-2">
                    {#if pulse.lastCheckin}
                        {new Date(pulse.lastCheckin).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                        )}
                        <span class="text-sm text-slate-400 ml-1">
                            {new Date(pulse.lastCheckin).toLocaleTimeString(
                                undefined,
                                { hour: "numeric", minute: "2-digit" },
                            )}
                        </span>
                    {:else}
                        Never
                    {/if}
                </p>
            </div>
        </div>

        <!-- Guardian Network -->
        <div
            class="card bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
        >
            <div class="card-body p-6">
                <h3
                    class="card-title text-base text-slate-500 flex items-center gap-2"
                >
                    <Users class="w-4 h-4" />
                    Guardian Network
                </h3>
                <div class="mt-2 text-slate-900">
                    <a
                        href="/pulse/contacts"
                        class="link link-hover text-indigo-600 font-medium flex items-center gap-1 group"
                    >
                        Manage Contacts
                        <ArrowRight
                            class="w-4 h-4 transition-transform group-hover:translate-x-1"
                        />
                    </a>
                </div>
            </div>
        </div>

        <!-- Safety Vault -->
        <div
            class="card bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
        >
            <div class="card-body p-6">
                <h3
                    class="card-title text-base text-slate-500 flex items-center gap-2"
                >
                    <Shield class="w-4 h-4" />
                    Safety Vault
                </h3>
                <div class="mt-2 text-slate-900">
                    <a
                        href="/pulse/vault"
                        class="link link-hover text-indigo-600 font-medium flex items-center gap-1 group"
                    >
                        Manage Secure Items
                        <ArrowRight
                            class="w-4 h-4 transition-transform group-hover:translate-x-1"
                        />
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
