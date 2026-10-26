<script lang="ts">
    import { Eye, Lock, Users, FileText, Clock, Phone, MessageSquare, RefreshCw } from "lucide-svelte";
    import { onMount, onDestroy } from "svelte";
    import { apiGet } from "$lib/api/client";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";

    interface GuardianChoice { id: number; name: string; tier_number: number | null; link_state: "ready" | "prepared" | "rested"; }
    interface PortalView { user_name: string; user_phone: string | null; user_status: "active" | "grace"; last_checkin: string | null; notes: { message: string; sent_at: string }[]; }
    interface GuardianPreview {
        contact_id: number; contact_name: string; tier_number: number | null;
        link_state: GuardianChoice["link_state"]; view: PortalView | null;
        vault: { name: string; content: string }[];
        planned: {
            release_enabled: boolean; pulse_enabled: boolean; frequency_days: number;
            grace_period_hours: number; personal_wait_hours: number | null;
            tier_waits: { tier_number: number; hours: number }[];
            private_vault: { id: number; name: string; unlock_condition: string }[];
        };
    }
    let guardians = $state<GuardianChoice[]>([]);
    let selectedContactId = $state<number | null>(null);
    let preview = $state<GuardianPreview | null>(null);
    let loading = $state(true);
    let error = $state("");
    let requestVersion = 0;

    onMount(() => { loadPreview(); });
    onDestroy(() => { requestVersion++; });
    async function loadPreview(contactId: number | null = selectedContactId) {
        const owner = captureSession();
        const version = ++requestVersion;
        selectedContactId = contactId;
        loading = true;
        error = "";
        preview = null;
        try {
            if (!isCurrentSession(owner)) throw new Error("Session changed");
            const query = contactId === null ? "" : `?contact_id=${encodeURIComponent(contactId)}`;
            const result = await apiGet<{ guardians: GuardianChoice[]; preview: GuardianPreview | null }>(`/api/pulse/transparency${query}`);
            if (version !== requestVersion || !isCurrentSession(owner)) return;
            guardians = result.guardians;
            preview = result.preview;
            selectedContactId = preview?.contact_id ?? null;
        } catch {
            if (version === requestVersion) error = "You can try loading this view again whenever you're ready.";
        } finally {
            if (version === requestVersion) {
                loading = false;
                if (!isCurrentSession(owner)) {
                    guardians = [];
                    selectedContactId = null;
                    preview = null;
                    error = "You can try loading this view again whenever you're ready.";
                }
            }
        }
    }
    function formatTime(value: string) { return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
    function waitOrigin(tier: number) { return tier === 1 ? "the grace period ends" : `Tier ${tier - 1} is reached`; }
    function releaseRule(condition: string) {
        const match = condition.match(/^tier_(\d+)_/);
        return match ? `Saved release rule: Tier ${match[1]}` : "Review the release rule in your vault";
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 pb-32 space-y-6">
    <div class="flex items-start justify-between gap-6">
        <div>
            <h1 class="text-2xl font-serif text-foreground flex items-center gap-2"><Eye class="text-primary" /> What your guardians can see</h1>
            <p class="text-muted-foreground text-sm mt-2 max-w-xl">Choose a person to see their current portal view, from the same saved records.</p>
        </div>
        <a href="/modules/pulse" class="text-sm text-primary hover:text-primary-hover shrink-0">Back to Wellness Check-in</a>
    </div>

    {#if guardians.length > 0}
        <div class="bg-background/50 border border-border rounded-xl p-4 flex items-end gap-4">
            <div class="flex-1 space-y-2">
                <label for="guardian-preview-person" class="text-sm font-medium text-foreground flex items-center gap-2"><Users class="w-4 h-4 text-primary" /> Guardian</label>
                <select id="guardian-preview-person" value={selectedContactId ?? ""} disabled={loading}
                    onchange={(event) => loadPreview(Number(event.currentTarget.value))}
                    class="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-primary disabled:opacity-60">
                    {#each guardians as guardian (guardian.id)}
                        <option value={guardian.id}>{guardian.name}{guardian.tier_number ? ` · Tier ${guardian.tier_number}` : ""}</option>
                    {/each}
                </select>
            </div>
            <button onclick={() => loadPreview()} disabled={loading} class="inline-flex items-center gap-2 rounded-lg border border-primary/40 px-3 py-2.5 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"><RefreshCw class="w-4 h-4" /> Refresh view</button>
        </div>
    {/if}

    {#if error}
        <div role="alert" class="rounded-xl border border-border bg-card p-5 space-y-3">
            <p class="text-sm text-foreground">{error}</p>
            <button onclick={() => loadPreview()} class="text-sm text-primary underline">Try again</button>
        </div>
    {:else if loading}
        <p role="status" class="rounded-xl border border-border bg-background/40 p-8 text-sm text-muted-foreground">Opening this guardian view…</p>
    {:else if preview}
        <section aria-labelledby="current-view-title" class="rounded-2xl border border-border bg-background/50 p-6 space-y-6" data-testid="guardian-current-view">
            <div class="flex items-center justify-between gap-4">
                <h2 id="current-view-title" class="text-lg font-serif text-foreground">Current view for {preview.contact_name}</h2>
                <a href="/modules/contacts" class="text-xs text-primary hover:underline">Saved contact</a>
            </div>
            {#if preview.view}
                {@const view = preview.view}
                <dl class="grid sm:grid-cols-2 gap-4 text-sm">
                    <div><dt class="text-muted-foreground mb-1">Your name</dt><dd class="text-foreground">{view.user_name}</dd></div>
                    <div><dt class="text-muted-foreground mb-1">Check-in status</dt><dd class="text-foreground">{view.user_status === "active" ? "Checked in recently" : "Waiting for a check-in"}</dd></div>
                    {#if view.last_checkin}
                        <div><dt class="text-muted-foreground mb-1 flex items-center gap-1.5"><Clock class="w-4 h-4" /> Last check-in</dt><dd class="text-foreground">{formatTime(view.last_checkin)}</dd></div>
                    {/if}
                    {#if view.user_phone}
                        <div><dt class="text-muted-foreground mb-1 flex items-center gap-1.5"><Phone class="w-4 h-4" /> Your phone</dt><dd class="text-foreground">{view.user_phone} <a href="/settings" class="text-xs text-primary hover:underline ml-2">Saved profile</a></dd></div>
                    {/if}
                </dl>
                {#if view.notes.length > 0}
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-foreground flex items-center gap-2"><MessageSquare class="w-4 h-4 text-primary" /> Messages for {preview.contact_name}</h3>
                        <ul class="space-y-3" data-testid="shared-messages">
                            {#each view.notes as note}
                                <li class="rounded-lg border border-border bg-card p-4">
                                    <p class="text-sm text-foreground whitespace-pre-wrap">{note.message}</p>
                                    <div class="mt-2 text-xs text-muted-foreground flex items-center justify-between gap-3"><span>{formatTime(note.sent_at)}</span><a href="/modules/pulse/messages" class="text-primary hover:underline">Saved message</a></div>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                <div class="space-y-3">
                    <h3 class="text-sm font-medium text-foreground flex items-center gap-2"><FileText class="w-4 h-4 text-primary" /> Shared vault notes</h3>
                    {#if preview.vault.length > 0}
                        <ul class="space-y-3" data-testid="shared-vault-notes">
                            {#each preview.vault as item}
                                <li class="rounded-lg border border-primary/20 bg-primary/5 p-4" data-vault-name={item.name}>
                                    <h4 class="font-medium text-sm text-foreground">{item.name}</h4>
                                    <p class="mt-1 text-sm text-foreground whitespace-pre-wrap">{item.content}</p>
                                    <a href="/modules/pulse/vault" class="mt-2 inline-block text-xs text-primary hover:underline">Saved vault record</a>
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <p class="text-sm text-muted-foreground">Shared vault notes appear here when the saved release rules open them.</p>
                    {/if}
                </div>
            {:else}
                <p class="text-sm text-muted-foreground">{preview.link_state === "rested" ? "This portal link has rested. The saved contact details are in Family & Contacts." : "You can prepare this person's portal link on your Escalation Plan."}</p>
                <a href="/modules/pulse/escalation" class="text-sm text-primary hover:underline">Escalation Plan</a>
            {/if}
        </section>

        <details class="rounded-2xl border border-border bg-background/40 p-6" data-testid="planned-release-details">
            <summary class="cursor-pointer text-sm font-medium text-foreground">Saved timing and release choices · for your reference</summary>
            <div class="mt-5 space-y-5 text-sm">
                <p class="text-muted-foreground">These choices explain the current view above. Your check-in closes released vault notes again.</p>
                <p class="text-foreground">Check-ins: {preview.planned.pulse_enabled ? "On" : "Resting"}. Automatic Release: {preview.planned.release_enabled ? "On" : "Resting"}. <a href="/modules/pulse/settings" class="text-primary hover:underline">Saved settings</a></p>
                <p class="text-foreground">Saved check-in interval: {preview.planned.frequency_days} {preview.planned.frequency_days === 1 ? "day" : "days"}, with {preview.planned.grace_period_hours} hours of grace.</p>
                {#if preview.planned.tier_waits.length > 0}
                    <ul class="space-y-1 text-muted-foreground">
                        {#each preview.planned.tier_waits as tier}<li>Tier {tier.tier_number} alert wait: {tier.hours} hours after {waitOrigin(tier.tier_number)}.</li>{/each}
                    </ul>
                {/if}
                {#if preview.planned.personal_wait_hours !== null && preview.tier_number}
                    <p class="text-foreground" data-testid="personal-wait">Personal alert wait: {preview.planned.personal_wait_hours} hours after {waitOrigin(preview.tier_number)}.</p>
                {/if}
                <p class="text-muted-foreground">Vault access follows the reached tier and accepted personal alerts. Automatic Release applies to every vault note. <a href="/modules/pulse/escalation" class="text-primary hover:underline">Saved escalation plan</a></p>
                {#if preview.planned.private_vault.length > 0}
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-foreground flex items-center gap-2"><Lock class="w-4 h-4 text-muted-foreground" /> Vault notes kept for later</h3>
                        <ul class="space-y-2" data-testid="private-vault-records">
                            {#each preview.planned.private_vault as item (item.id)}
                                <li class="rounded-lg border border-border bg-card p-3" data-private-vault-name={item.name}><a href="/modules/pulse/vault" class="text-primary hover:underline">{item.name}</a><p class="text-xs text-muted-foreground mt-1">{releaseRule(item.unlock_condition)}</p></li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        </details>
    {:else}
        <div class="rounded-2xl border border-dashed border-border bg-background/40 p-8 text-sm text-muted-foreground space-y-3"><p>You can choose a guardian on your Escalation Plan, then open their view here.</p><a href="/modules/pulse/escalation" class="text-primary hover:underline">Escalation Plan</a></div>
    {/if}
</div>
