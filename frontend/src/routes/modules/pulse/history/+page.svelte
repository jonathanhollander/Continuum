<script lang="ts">
    import { onMount } from "svelte";
    import { Clock, Smartphone, Mail, HeartHandshake } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import { apiGet } from "$lib/api/client";

    let history = $state<any[]>([]);
    let loading = $state(true);
    let filterMethod = $state("all");

    // Stored methods (routers/pulse.py): manual (dashboard tap), magic_link (email link),
    // guardian_snooze / guardian_confirmation (a guardian checked on the owner).
    const filters = [
        { id: "all", label: "All", methods: [] as string[] },
        { id: "manual", label: "Manual", methods: ["manual", "biometric"] },
        { id: "email", label: "Email link", methods: ["magic_link", "email_link"] },
        { id: "guardian", label: "Guardian", methods: ["guardian_snooze", "guardian_confirmation"] },
    ];
    function getFilteredHistory() {
        const f = filters.find((x) => x.id === filterMethod);
        if (!f || f.id === "all") return history;
        return history.filter((h) => f.methods.includes(h.method));
    }

    const isGuardian = (method: string) => method?.startsWith("guardian_");
    // "Marked OK by Gil" / "Confirmed by Gil" -> "Gil"
    const guardianName = (note: string | null) =>
        (note ?? "").split(" by ").slice(1).join(" by ") || "A guardian";

    function getLabel(checkin: any) {
        if (isGuardian(checkin.method)) return `${guardianName(checkin.note)} checked on you`;
        if (checkin.method === "magic_link") return "You checked in from your email link";
        return "You checked in";
    }
    // Notes the owner wrote; the app's own markers are left out
    function getNote(checkin: any) {
        if (isGuardian(checkin.method)) return null;
        const note = (checkin.note ?? "").trim();
        return note && note !== "Manual Dashboard Tap" && note !== "One-Click Link" ? note : null;
    }

    onMount(async () => {
        try {
            history = await apiGet('/api/pulse/history?limit=50');
        } catch (e) {
            console.error("Failed to load check-in history", e);
        } finally {
            loading = false;
        }
    });

    function getMethodIcon(method: string) {
        switch (method) {
            case "manual":
                return Smartphone;
            case "biometric":
                return Smartphone;
            case "magic_link":
            case "email_link":
                return Mail;
            case "guardian_snooze":
            case "guardian_confirmation":
                return HeartHandshake;
            default:
                return Clock;
        }
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-serif text-slate-100 flex items-center gap-2">
            <Clock class="text-teal-400" />
            Check-in History
        </h1>
        <a
            href="/modules/pulse"
            class="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >Back to Wellness Check-in</a
        >
    </div>

    <!-- Filters -->
    <div
        class="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center"
    >
        <span
            class="text-xs text-slate-500 font-bold uppercase tracking-widest"
            >Show:</span
        >

        {#each filters as f (f.id)}
            <button
                onclick={() => (filterMethod = f.id)}
                class="px-3 py-1 rounded-full text-xs font-medium transition-colors {filterMethod ===
                f.id
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'}"
            >
                {f.label}
            </button>
        {/each}
    </div>

    {#if loading}
        <div class="space-y-4">
            {#each Array(3) as _}
                <div
                    class="h-16 bg-slate-900/50 rounded-xl animate-pulse"
                ></div>
            {/each}
        </div>
    {:else if getFilteredHistory().length > 0}
        <div class="space-y-4">
            {#each getFilteredHistory() as checkin (checkin.id)}
                {@const Icon = getMethodIcon(checkin.method)}
                <div
                    class="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                    in:fade
                >
                    <div class="flex items-center gap-4">
                        <div
                            class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center {isGuardian(
                                checkin.method,
                            )
                                ? 'text-teal-400'
                                : 'text-slate-400'}"
                        >
                            <Icon
                                class="w-5 h-5"
                            />
                        </div>
                        <div>
                            <div class="text-slate-200 font-medium">
                                {getLabel(checkin)}
                            </div>
                            {#if getNote(checkin)}
                                <div class="text-sm text-slate-400">
                                    Note: {getNote(checkin)}
                                </div>
                            {/if}
                            <div class="text-xs text-slate-500 font-mono">
                                {new Date(checkin.timestamp).toLocaleString(
                                    undefined,
                                    { dateStyle: "full", timeStyle: "short" },
                                )}
                            </div>
                        </div>
                    </div>
                    <div
                        class="text-xs font-bold text-teal-500 uppercase tracking-wider bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20"
                    >
                        Received
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div
            class="text-center py-12 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800/50 dashed"
        >
            <Clock class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Your check-ins will gather here.</p>
        </div>
    {/if}
</div>
