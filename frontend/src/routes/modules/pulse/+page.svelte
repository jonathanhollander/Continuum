<script lang="ts">
    import { pulse, pulseStatus, type PulseAlertState } from "$lib/stores/pulse.svelte";
    import { estateAudit } from "$lib/stores/auditStore.svelte";
    import { auditReadiness } from "$lib/utils/auditReadiness.svelte";
    import AuditSourceStatus from "$lib/components/AuditSourceStatus.svelte";
    let auditSources = $derived(auditReadiness());
    import { apiGet, apiPost } from "$lib/api/client";
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
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
        Settings,
        Users,
    } from "lucide-svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import { pulseTierNumber } from "$lib/components/modules/pulse/pulseTiers";

    const gentleRetry = "You can try again whenever you're ready.";

    // Guardians (a Pulse tier) and the people told when a safety timer ends, from the shared
    // contacts store (notifyOnSafetyTimer is the "Told when I start a timer" switch on the
    // Escalation Plan).
    const guardians = $derived(
        (contactSync.items as any[]).filter(
            (c) => c.tierId || pulseTierNumber({ call_tier: c.callTier }, []) !== null,
        ),
    );
    // pulse_logic.trigger_safety_timer_alert tells every contact with this switch on
    const timerPeople = $derived(
        (contactSync.items as any[]).filter((c) => c.notifyOnSafetyTimer).map((c) => c.name),
    );
    import PetalDrift from "$lib/components/pulse/PetalDrift.svelte";

    let petals: PetalDrift;

    let localStatus = $state({
        checkingIn: false,
        lastSuccess: false,
        safetyTimer: null as any,
        safetyInput: 30,
        showSafetyConfig: false,
        purpose: "Walking home",
    });

    onMount(() => {
        pulse.init();
        contactSync.sync();
        fetchSafetyStatus();
        const interval = setInterval(fetchSafetyStatus, 10000);
        // Ticks the countdown each second between status refreshes
        const tick = setInterval(() => (now = Date.now()), 1000);
        return () => {
            clearInterval(interval);
            clearInterval(tick);
        };
    });

    async function fetchSafetyStatus() {
        try {
            const data = await apiGet("/api/pulse/safety/status");
            localStatus.safetyTimer = data;
        } catch (e) {
            console.error(e);
        }
    }

    async function checkIn() {
        localStatus.checkingIn = true;
        try {
            const success = await pulse.checkin("Manual Dashboard Tap");
            if (success) {
                localStatus.lastSuccess = true;
                petals?.trigger();
                setTimeout(() => {
                    localStatus.lastSuccess = false;
                }, 3000);
            } else {
                notifications.showError(gentleRetry);
            }
        } finally {
            localStatus.checkingIn = false;
        }
    }

    async function startSafety() {
        try {
            const params = new URLSearchParams({
                minutes: localStatus.safetyInput.toString(),
                purpose: localStatus.purpose,
            });
            const data = await apiPost(
                `/api/pulse/safety/start?${params.toString()}`,
            );
            localStatus.safetyTimer = data;
            localStatus.showSafetyConfig = false;
        } catch (e) {
            console.error(e);
            notifications.showError(gentleRetry);
        }
    }

    async function cancelSafety() {
        try {
            await apiPost("/api/pulse/safety/cancel");
            localStatus.safetyTimer = null;
        } catch (e) {
            console.error(e);
            notifications.showError(gentleRetry);
        }
    }

    let now = $state(Date.now());

    // Global stage progression is separate from each guardian's recorded email outcome.
    const tierReached = $derived.by(() => {
        const s = pulseStatus.current;
        return s?.escalationTier ? { tier: s.escalationTier, at: s.escalationAt ?? null } : null;
    });
    const tierActivity = $derived(pulseStatus.current?.tierActivity ?? []);
    const outcomeLabels: Record<PulseAlertState, string> = {
        provider_accepted: "Email provider accepted for sending",
        saved_local: "Prepared in the local outbox",
        failed: "Delivery needs attention",
        awaiting_attempt: "Awaiting an alert attempt",
        recorded: "Saved alert records",
    };

    const statusLabels: Record<string, string> = {
        active: "Heartbeat Active",
        grace: "Grace Period",
        disabled: "Resting for now",
        not_configured: "Ready when you are",
    };

    // null once the timer has ended
    function getTimeRemaining(expiry: string) {
        const diff = new Date(expiry).getTime() - now;
        if (diff <= 0) return null;
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
        <h1 class="font-serif text-4xl text-foreground mb-10">Wellness Check-in</h1>
        <!-- Pulse Button Architecture -->
        <div
            class="relative group cursor-pointer mb-8"
            role="button"
            tabindex="0"
            onclick={checkIn}
            onkeydown={(e) => {
                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    checkIn();
                }
            }}
        >
            <!-- Breathing Rings -->
            <div
                class="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-125 animate-pulse-slow"
            ></div>
            <div
                class="absolute inset-0 border-2 border-primary/10 rounded-full scale-[1.15] animate-ripple-slow"
            ></div>
            <div
                class="absolute inset-0 border border-primary/5 rounded-full scale-[1.3] animate-ripple-delayed"
            ></div>

            <button
                class="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-background border-2 border-border shadow-[0_0_50px_-10px_color-mix(in_srgb,var(--color-primary)_20%,transparent)] flex flex-col items-center justify-center transition-all duration-700 active:scale-95 group-hover:border-primary/40"
            >
                {#if localStatus.checkingIn}
                    <Loader2 class="w-12 h-12 text-primary animate-spin" />
                    <span
                        class="text-xs font-bold text-primary mt-4 uppercase tracking-[0.3em]"
                        >Saving your check-in...</span
                    >
                {:else if localStatus.lastSuccess}
                    <CheckCircle2
                        class="w-12 h-12 text-primary transition-all scale-125"
                    />
                    <span
                        class="text-xs font-bold text-primary mt-4 uppercase tracking-[0.3em]"
                        >Check-in saved</span
                    >
                {:else}
                    <div
                        class="w-16 h-1 bg-primary/50 rounded-full mb-6 group-hover:bg-primary transition-colors"
                    ></div>
                    <span
                        class="text-sm font-bold text-muted-foreground uppercase tracking-[0.4em] mb-2"
                        >Pulse Check</span
                    >
                    <h2 class="text-3xl font-serif text-foreground tracking-wide">
                        I'm Here
                    </h2>
                    <div
                        class="w-16 h-1 bg-primary/50 rounded-full mt-6 group-hover:bg-primary transition-colors"
                    ></div>
                {/if}
            </button>
        </div>

        <div class="space-y-2">
            <h2 class="text-2xl font-serif text-foreground flex items-center justify-center gap-3">
                {statusLabels[pulse.status] ?? statusLabels.disabled}
                {#if pulse.status === "active"}
                    <span
                        class="inline-block w-2 h-2 bg-primary rounded-full animate-ping"
                    ></span>
                {/if}
            </h2>
            <p
                class="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed italic"
            >
                {#if pulse.status === "active"}
                    {#if guardians.length > 0}Review the people in your Trusted Contacts.{/if}
                    {#if pulse.next_nudge}
                        Your next gentle nudge is {new Date(
                            pulse.next_nudge,
                        ).toLocaleString(undefined, {
                            weekday: "long",
                            hour: "numeric",
                            minute: "2-digit",
                        })}.{/if}
                {:else if pulse.status === "grace"}
                    Record a check-in whenever you're ready to start the next check-in interval.
                {:else if pulse.status === "disabled"}
                    Whenever you'd like check-ins to begin again,
                    <a
                        href="/modules/pulse/settings"
                        class="text-primary hover:text-primary-hover not-italic"
                        >your settings are here</a
                    >.
                {:else}
                    <a
                        href="/modules/pulse/settings"
                        class="text-primary hover:text-primary-hover not-italic"
                        >Choose how often we check in</a
                    >, then review the people and waits on your Escalation Plan.
                {/if}
            </p>
            {#if pulse.guardianCheckin}
                <p class="text-primary text-sm max-w-sm mx-auto">
                    {pulse.guardianCheckin.by} checked on you on {new Date(
                        pulse.guardianCheckin.at,
                    ).toLocaleString()}.
                </p>
            {/if}
            {#if tierReached}
                <p class="text-warning text-sm max-w-sm mx-auto" data-testid="pulse-stage-reached">
                    Tier {tierReached.tier} reached{tierReached.at
                        ? ` on ${new Date(tierReached.at).toLocaleString()}`
                        : ""}.
                    <a href="#pulse-alert-activity" class="text-primary hover:underline">View alert activity</a>
                </p>
            {/if}
            <div class="flex items-center justify-center gap-6 pt-4 text-sm">
                <a
                    href="/modules/pulse/settings"
                    class="text-primary hover:text-primary-hover flex items-center gap-1.5"
                    ><Settings class="w-4 h-4" /> Your Check-in Settings</a
                >
                <a
                    href="/modules/pulse/contacts"
                    class="text-primary hover:text-primary-hover flex items-center gap-1.5"
                    ><Users class="w-4 h-4" /> Trusted Contacts</a
                >
            </div>
        </div>
    </div>

    {#if tierActivity.length > 0}
        <section id="pulse-alert-activity" aria-labelledby="alert-activity-title" class="space-y-4 scroll-mt-24" data-testid="pulse-tier-activity">
            <div>
                <h2 id="alert-activity-title" class="font-serif text-2xl text-foreground">Alert activity</h2>
                <p class="text-sm text-muted-foreground mt-2">Stages and saved email attempts since your last check-in. Open a stage to see the people and their records.</p>
            </div>
            {#each tierActivity as stage (stage.tierNumber)}
                <details open={stage.tierNumber === tierReached?.tier} class="rounded-2xl border border-border bg-background/40 p-5" data-stage-number={stage.tierNumber}>
                    <summary class="cursor-pointer text-foreground">
                        <span class="font-medium">{stage.reachedAt ? `Tier ${stage.tierNumber} reached` : `Personal Tier ${stage.tierNumber} alerts`}</span>
                        {#if stage.reachedAt}<span class="text-xs text-muted-foreground ml-2">{new Date(stage.reachedAt).toLocaleString()}</span>{/if}
                        <span class="mt-3 flex flex-wrap gap-2 text-xs">
                            {#each stage.outcomes.filter((outcome) => outcome.count > 0) as outcome}
                                <span class="rounded-lg border border-border bg-card px-2.5 py-1.5" data-outcome-count={outcome.state}>{outcome.count} {outcome.count === 1 ? "person" : "people"} · {outcomeLabels[outcome.state]}</span>
                            {/each}
                        </span>
                    </summary>
                    <div class="mt-5 space-y-5">
                        {#each stage.outcomes.filter((outcome) => outcome.count > 0) as outcome}
                            <div class="space-y-2" data-outcome={outcome.state}>
                                <h3 class="text-sm font-medium text-foreground">{outcomeLabels[outcome.state]}</h3>
                                <ul class="space-y-3">
                                    {#each stage.contacts.filter((contact) => contact.state === outcome.state) as contact (contact.contactId)}
                                        <li class="rounded-lg border border-border bg-card p-4 text-sm" data-contact-id={contact.contactId}>
                                            <div class="flex flex-wrap items-baseline justify-between gap-2">
                                                <span class="font-medium text-foreground">{contact.contactName}</span>
                                                <span class="text-xs text-muted-foreground" data-recorded-attempts>{contact.attempts} {contact.attempts === 1 ? "recorded attempt" : "recorded attempts"}</span>
                                            </div>
                                            {#if contact.state === "failed"}
                                                <p class="mt-2 text-xs text-muted-foreground">{contact.retryAvailable ? "Retry available on the saved alert schedule." : "A call or message can help you reach them directly."}</p>
                                            {/if}
                                            {#if contact.sourceMessages.length > 0}
                                                <details class="mt-3">
                                                    <summary class="cursor-pointer text-xs text-primary">Saved message records</summary>
                                                    <ul class="mt-3 space-y-3">
                                                        {#each contact.sourceMessages as source (source.id)}
                                                            <li class="border-t border-border pt-3 space-y-1" data-source-message-id={source.id}>
                                                                <p class="text-xs text-foreground">{source.message.replace(/^\[System Alert Tier \d+\] /, "")}</p>
                                                                <a href={`/modules/pulse/messages?contact_id=${contact.contactId}&message_id=${source.id}#pulse-message-${source.id}`} class="text-xs text-primary hover:underline">Saved message #{source.id} · {new Date(source.sentAt).toLocaleString()}</a>
                                                            </li>
                                                        {/each}
                                                    </ul>
                                                </details>
                                            {:else}
                                                <a href="/modules/pulse/escalation" class="mt-2 inline-block text-xs text-primary hover:underline">Saved alert schedule</a>
                                            {/if}
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/each}
                        {#if stage.contacts.length === 0}
                            <p class="text-sm text-muted-foreground">Choose the people for this stage on your <a href="/modules/pulse/escalation" class="text-primary hover:underline">Escalation Plan</a>.</p>
                        {/if}
                    </div>
                </details>
            {/each}
        </section>
    {/if}

    <!-- QUICK ACTIONS MESH -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- SAFETY TIMER CARD (Fidelity Update) -->
        <div
            class="bg-card/60 border border-border/50 rounded-[2rem] p-8 backdrop-blur-md relative overflow-hidden group hover:border-primary/30 transition-all"
        >
            <div
                class="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity"
            >
                <Navigation class="w-24 h-24 text-primary" />
            </div>

            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
                >
                    <Zap class="w-5 h-5 text-primary" />
                </div>
                <h3 class="font-medium text-foreground">Safety Timer</h3>
            </div>

            {#if localStatus.safetyTimer}
                <div class="space-y-4">
                    <div class="text-center py-4">
                        {#if getTimeRemaining(localStatus.safetyTimer.expires_at)}
                            <div
                                class="text-4xl font-mono text-primary tracking-tighter mb-1"
                            >
                                {getTimeRemaining(
                                    localStatus.safetyTimer.expires_at,
                                )}
                            </div>
                        {:else}
                            <div class="text-lg font-serif text-primary mb-1">
                                Your check-in time has arrived
                            </div>
                        {/if}
                        <p
                            class="text-[10px] text-primary uppercase tracking-widest"
                        >
                            Pulse attempts alerts after the timer ends
                        </p>
                    </div>
                    <button
                        onclick={cancelSafety}
                        class="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <XCircle class="w-4 h-4" /> I'm safe, end timer
                    </button>
                </div>
            {:else if localStatus.showSafetyConfig}
                <div class="space-y-4" in:slide>
                    <select
                        aria-label="Purpose"
                        bind:value={localStatus.purpose}
                        class="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground"
                    >
                        <option>Walking home</option>
                        <option>Meeting someone new</option>
                        <option>Health check</option>
                    </select>
                    <div class="flex items-center gap-4">
                        <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            aria-label="Minutes"
                            bind:value={localStatus.safetyInput}
                            class="flex-1 h-1.5 bg-card accent-primary rounded-lg cursor-pointer"
                        />
                        <span class="text-xs font-bold text-primary w-12"
                            >{localStatus.safetyInput}m</span
                        >
                    </div>
                    {#if timerPeople.length > 0}
                        <p class="text-xs text-muted-foreground leading-relaxed" data-testid="timer-people">
                            If the timer expires, Pulse attempts an email alert to {timerPeople.join(", ")}.
                            <a href="/modules/pulse/escalation" class="text-primary hover:text-primary-hover">Choose who</a>
                        </p>
                    {:else}
                        <p class="text-xs text-muted-foreground leading-relaxed" data-testid="timer-people">
                            <a href="/modules/pulse/escalation" class="text-primary hover:text-primary-hover">Choose who is told</a>
                            on your Escalation Plan using the Safety Timer choice.
                        </p>
                    {/if}
                    <button
                        onclick={startSafety}
                        class="w-full bg-primary hover:bg-primary-hover text-primary-foreground py-3 rounded-2xl text-xs font-bold transition-all"
                    >
                        Begin the timer
                    </button>
                </div>
            {:else}
                <p class="text-sm text-muted-foreground leading-relaxed mb-6">
                    Set a timer for a short walk or visit. If it expires, Pulse attempts
                    an email alert to the safety timer contacts you chose.
                </p>
                <button
                    onclick={() => (localStatus.showSafetyConfig = true)}
                    class="w-full bg-background border border-border text-foreground py-3 rounded-2xl text-xs font-bold hover:border-primary/50 hover:text-foreground transition-all"
                >
                    Begin a safety timer
                </button>
            {/if}
        </div>

        <!-- MESSAGES HUD -->
        <a
            href="/modules/pulse/messages"
            class="bg-card/60 border border-border rounded-[2rem] p-8 hover:border-primary/30 transition-all flex flex-col justify-between group"
        >
            <div>
                <div class="flex items-center gap-3 mb-4">
                    <div
                        class="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border"
                    >
                        <Activity
                            class="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                        />
                    </div>
                    <h3 class="font-medium text-foreground italic">
                        Message Hub
                    </h3>
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    Save practical notes for each guardian's portal, read their replies, and review recorded alert attempts.
                </p>
            </div>
            <div class="pt-6">
                <span
                    class="text-[10px] text-primary font-bold uppercase tracking-widest border border-primary/20 px-3 py-1 rounded-full"
                    >Review and save notes</span
                >
            </div>
        </a>

        <!-- TRANSPARENCY HUB -->
        <a
            href="/modules/pulse/transparency"
            class="bg-card/60 border border-border rounded-[2rem] p-8 hover:border-warning/30 transition-all flex flex-col justify-between group"
        >
            <div>
                <div class="flex items-center gap-3 mb-4">
                    <div
                        class="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border"
                    >
                        <Shield
                            class="w-5 h-5 text-muted-foreground group-hover:text-warning transition-colors"
                        />
                    </div>
                    <h3 class="font-medium text-foreground italic">
                        Transparency
                    </h3>
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    See what your guardians can see, and when
                </p>
            </div>
            <div class="pt-6">
                <span
                    class="text-[10px] text-warning font-bold uppercase tracking-widest border border-warning/20 px-3 py-1 rounded-full"
                    >What is shared</span
                >
            </div>
        </a>
    </div>

    <!-- ECOSYSTEM SCORE integration simplified -->
    <div
        class="bg-background/40 border border-border/50 rounded-[2.5rem] p-8 md:p-12 text-center backdrop-blur-sm relative overflow-hidden"
    >
        <div
            class="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"
        ></div>
        <div class="relative z-10 flex flex-col items-center">
            <h3
                class="text-xs font-bold text-muted-foreground uppercase tracking-[0.4em] mb-4"
            >
                Record coverage score
            </h3>
            <AuditSourceStatus state={auditSources} />
            {#if auditSources.canScore && estateAudit.percentage > 0}
                <div class="text-5xl md:text-7xl font-serif text-foreground mb-2" data-testid="pulse-readiness">
                    {estateAudit.percentage}<span class="text-primary">%</span>
                </div>
            {:else if auditSources.canScore}
                <div class="text-3xl md:text-4xl font-serif text-foreground mb-2" data-testid="pulse-readiness">
                    Add records to begin
                </div>
            {/if}
            <p class="text-sm text-muted-foreground max-w-sm">
                Points for recorded information across accounts, insurance, contacts, medical wishes,
                digital accounts and personal records. Review the source records for accuracy,
                legal requirements, access and handover details. Pulse check-in status is shown separately.
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
