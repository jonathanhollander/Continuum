<script lang="ts">
    // Select Guardian dialog: places one existing contact in a Pulse tier (sets tier_id).
    // Shared by the Escalation Plan, Trusted Contacts and Pulse Configuration pages.
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { Check, X } from "lucide-svelte";
    import { focusTrap } from "$lib/actions/focusTrap";
    import { portal } from "$lib/actions/portal";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import { pulseTierNumber } from "./pulseTiers";

    let {
        tiers,
        tierId = null,
        onclose,
        onsaved,
    }: {
        tiers: any[];
        tierId?: number | null;
        onclose: () => void;
        onsaved: () => void | Promise<void>;
    } = $props();

    const gentleRetry = "Your circle is safe in your account. You can try again whenever you're ready.";

    // The shared contacts store (SyncManager), so tiers set elsewhere show here at once. Its cached
    // list shows straight away; the sync below refreshes it.
    const globalContacts = $derived(contactSync.items as any[]);
    let loaded = $state(false);
    let error = $state<string | null>(null);
    let saving = $state(false);
    let selectedContactId = $state<number | null>(null);
    // svelte-ignore state_referenced_locally
    let targetTierId = $state<number | null>(tierId ?? tiers[0]?.id ?? null);

    const targetTierNumber = $derived(
        tiers.find((t) => t.id === targetTierId)?.tier_number ?? null,
    );

    onMount(async () => {
        await contactSync.sync();
        if (contactSync.status === "error") error = gentleRetry;
        loaded = true;
    });

    async function promoteContact() {
        if (!selectedContactId || !targetTierId) return;
        saving = true;
        error = null;
        try {
            // Through the shared contacts SyncManager, so Family & Contacts shows the tier at once.
            // On failure it rolls back and shows its own gentle message; the dialog stays open.
            if (!contactSync.items.some((c) => String(c.id) === String(selectedContactId))) {
                await contactSync.sync();
            }
            await contactSync.update(selectedContactId, { tierId: targetTierId });
            await onsaved();
            onclose();
        } catch (e) {
            console.error(e);
        } finally {
            saving = false;
        }
    }
</script>

<div
    use:portal
    role="dialog"
    aria-modal="true"
    aria-labelledby="guardian-dialog-title"
    use:focusTrap={{ onEscape: onclose }}
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    transition:fade
>
    <div
        class="bg-background border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
    >
        <div
            class="p-4 border-b border-border flex justify-between items-center bg-muted/50"
        >
            <h3 id="guardian-dialog-title" class="font-bold text-foreground">
                Choose a guardian
            </h3>
            <button onclick={onclose} aria-label="Close">
                <X class="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
        </div>
        <div class="p-6">
            <label class="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                Choose a trusted contact to add to
                <select
                    bind:value={targetTierId}
                    class="bg-card border border-border rounded-lg px-2 py-1 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50"
                >
                    {#each tiers as t (t.id)}
                        <option value={t.id}>Tier {t.tier_number}</option>
                    {/each}
                </select>
            </label>

            {#if loaded && globalContacts.length === 0 && !error}
                <div
                    class="text-center py-6 bg-card/50 rounded-xl border border-dashed border-border"
                >
                    <a
                        href="/modules/contacts"
                        class="text-primary text-sm font-bold hover:underline"
                        >Add someone in Family & Contacts</a
                    >
                </div>
            {:else if loaded || globalContacts.length > 0}
                <div class="space-y-3 max-h-[300px] overflow-y-auto mb-6">
                    {#each globalContacts as contact (contact.id)}
                        {@const current = pulseTierNumber(
                            { tier_id: contact.tierId, call_tier: contact.callTier },
                            tiers,
                        )}
                        <label
                            class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all {selectedContactId ===
                            contact.id
                                ? 'bg-primary/10 border-primary/50'
                                : 'bg-card/50 border-border hover:border-muted-foreground/40'}"
                        >
                            <input
                                type="radio"
                                name="guardian"
                                value={contact.id}
                                bind:group={selectedContactId}
                                class="sr-only"
                            />
                            <div
                                class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground"
                            >
                                {(contact.name ?? "").charAt(0)}
                            </div>
                            <div class="flex-1">
                                <div class="text-sm font-bold text-foreground">
                                    {contact.name}
                                </div>
                                <div class="text-xs text-muted-foreground break-all">
                                    {#if contact.email}
                                        {contact.email}
                                    {:else}
                                        <span class="text-warning">Add an email so we can reach {contact.name}</span>
                                    {/if}
                                </div>
                            </div>
                            {#if selectedContactId === contact.id}
                                <Check class="w-4 h-4 text-primary" />
                            {/if}
                            {#if current && current !== targetTierNumber}
                                <span
                                    class="text-[10px] uppercase bg-background text-muted-foreground px-1.5 py-0.5 rounded"
                                >
                                    Tier {current}
                                </span>
                            {/if}
                        </label>
                    {/each}
                </div>

                <button
                    disabled={!selectedContactId || saving}
                    onclick={promoteContact}
                    class="w-full py-3 font-bold rounded-xl transition-colors {selectedContactId
                        ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                        : 'bg-card/60 text-muted-foreground border border-border cursor-not-allowed'}"
                >
                    Add them to my circle
                </button>
            {/if}

            {#if error}
                <p class="mt-4 text-sm text-warning" role="alert">{error}</p>
            {/if}

            <div class="mt-4 pt-4 border-t border-border text-center">
                <a
                    href="/modules/contacts"
                    class="text-xs text-muted-foreground hover:text-foreground"
                    >Open Family & Contacts</a
                >
            </div>
        </div>
    </div>
</div>
