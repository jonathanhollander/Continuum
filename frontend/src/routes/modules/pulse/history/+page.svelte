<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Clock, Smartphone, Mail, HeartHandshake } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import { apiGet } from "$lib/api/client";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";

    let history = $state<any[]>([]);
    let loading = $state(true);
    let error = $state("");
    let readVersion = 0;
    const retryNotice = "You can try loading this view again whenever you're ready.";
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

    const isGuardian = (method: string) => ["guardian_snooze", "guardian_confirmation"].includes(method);
    // "Marked OK by Gil" / "Confirmed by Gil" -> "Gil"
    const guardianName = (note: string | null) =>
        (note ?? "").split(" by ").slice(1).join(" by ") || "A guardian";

    function getLabel(checkin: any) {
        if (isGuardian(checkin.method)) return `${guardianName(checkin.note)} checked on you`;
        if (checkin.method === "pulse_enabled") return "You turned on wellness check-ins";
        if (checkin.method === "magic_link" || checkin.method === "email_link") return "You checked in from your email link";
        if (checkin.method === "manual" || checkin.method === "biometric") return "You checked in";
        return "Recorded Pulse action";
    }
    // Notes the owner wrote; the app's own markers are left out
    function getNote(checkin: any) {
        if (isGuardian(checkin.method)) return null;
        const note = (checkin.note ?? "").trim();
        return note && note !== "Manual Dashboard Tap" && note !== "One-Click Link" ? note : null;
    }

    onMount(() => { loadHistory(); });
    onDestroy(() => { readVersion++; });
    async function loadHistory() {
        const owner = captureSession();
        const version = ++readVersion;
        loading = true;
        error = "";
        try {
            if (!isCurrentSession(owner)) throw new Error("Session changed");
            const saved = await apiGet('/api/pulse/history?limit=50');
            if (version === readVersion && isCurrentSession(owner)) history = saved;
        } catch {
            if (version === readVersion) error = retryNotice;
        } finally {
            if (version === readVersion) {
                loading = false;
                if (!isCurrentSession(owner)) {
                    history = [];
                    error = retryNotice;
                }
            }
        }
    }

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
        <h1 class="text-2xl font-serif text-foreground flex items-center gap-2">
            <Clock class="text-primary" />
            Check-in History
        </h1>
        <a
            href="/modules/pulse"
            class="text-sm text-primary hover:text-primary-hover transition-colors"
            >Back to Wellness Check-in</a
        >
    </div>

    <!-- Filters -->
    <div
        class="bg-background/50 p-4 rounded-xl border border-border flex flex-wrap gap-4 items-center"
    >
        <span
            class="text-xs text-muted-foreground font-bold uppercase tracking-widest"
            >Show:</span
        >

        {#each filters as f (f.id)}
            <button
                onclick={() => (filterMethod = f.id)}
                class="px-3 py-1 rounded-full text-xs font-medium transition-colors {filterMethod ===
                f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'}"
            >
                {f.label}
            </button>
        {/each}
    </div>

    {#if error}
        <div role="alert" class="rounded-xl border border-border bg-card p-5 space-y-3">
            <p class="text-sm text-foreground">{error}</p>
            <button onclick={loadHistory} class="text-sm text-primary underline">Try again</button>
        </div>
    {:else if loading}
        <div class="space-y-4" role="status" aria-label="Opening your check-in history">
            {#each Array(3) as _}
                <div
                    class="h-16 bg-background/50 rounded-xl animate-pulse"
                ></div>
            {/each}
        </div>
    {:else if getFilteredHistory().length > 0}
        <div class="space-y-4">
            {#each getFilteredHistory() as checkin (checkin.id)}
                {@const Icon = getMethodIcon(checkin.method)}
                <div
                    class="bg-background/50 border border-border rounded-xl p-4 flex items-center justify-between hover:bg-card/80 transition-colors"
                    in:fade
                >
                    <div class="flex items-center gap-4">
                        <div
                            class="w-10 h-10 rounded-full bg-card flex items-center justify-center {isGuardian(
                                checkin.method,
                            )
                                ? 'text-primary'
                                : 'text-muted-foreground'}"
                        >
                            <Icon
                                class="w-5 h-5"
                            />
                        </div>
                        <div>
                            <div class="text-foreground font-medium">
                                {getLabel(checkin)}
                            </div>
                            {#if getNote(checkin)}
                                <div class="text-sm text-muted-foreground">
                                    Note: {getNote(checkin)}
                                </div>
                            {/if}
                            <div class="text-xs text-muted-foreground font-mono">
                                {new Date(checkin.timestamp).toLocaleString(
                                    undefined,
                                    { dateStyle: "full", timeStyle: "short" },
                                )}
                            </div>
                        </div>
                    </div>
                    <div
                        class="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
                    >
                        Recorded
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div
            class="text-center py-12 text-muted-foreground bg-background/30 rounded-2xl border border-border/50 dashed"
        >
            <Clock class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Your check-ins will gather here.</p>
        </div>
    {/if}
</div>
