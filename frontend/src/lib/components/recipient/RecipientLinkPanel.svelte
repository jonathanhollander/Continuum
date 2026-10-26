<script lang="ts">
    // Owner controls for a recipient's start page (card D2), shown in the contact's edit modal:
    // mark the person as a recipient, leave them a note, create, copy or close their link,
    // and preview the page they see. Saved straight to /api/recipient (owner-only fields).
    import { Link2, Eye, Copy, Check, Loader2 } from "lucide-svelte";
    import {
        getLinkState,
        updateRecipient,
        createLink,
        revokeLink,
        linkUrl,
        type RecipientLinkState,
    } from "$lib/services/recipientService";

    let { contactId, name = "" }: { contactId: string | number | null; name?: string } = $props();

    // Only a saved contact (a server id) can hold a link.
    const id = $derived(contactId !== null && /^\d+$/.test(String(contactId)) ? String(contactId) : null);
    const who = $derived((name || "").trim().split(/\s+/)[0] || "them");

    let link = $state<RecipientLinkState | null>(null);
    let note = $state("");
    let busy = $state<string | null>(null);
    let message = $state<string | null>(null);
    let copied = $state(false);
    // An earlier visit to this contact must not settle into a newly opened panel.
    let generation = 0;
    const isCurrent = (contact: string | null, version: number) => id === contact && generation === version;

    $effect(() => {
        const current = id;
        const version = ++generation;
        link = null;
        note = "";
        busy = null;
        message = null;
        copied = false;
        if (!current) return;
        getLinkState(current)
            .then((s) => {
                if (!isCurrent(current, version)) return;
                link = s;
                note = s.note;
            })
            .catch(() => {
                if (isCurrent(current, version)) message = "Your sharing settings are kept safe. Refreshing the page shows them again.";
            });
        return () => { generation++; };
    });

    async function run(kind: string, task: (contact: string) => Promise<RecipientLinkState>, done: string) {
        const current = id;
        const version = generation;
        if (!current || busy !== null) return;
        const draft = note;
        // Flag/link operations save their own fields, so an already-edited note stays a draft.
        const keepDraft = kind !== "note" && note !== link?.note;
        busy = kind;
        message = null;
        try {
            const saved = await task(current);
            if (!isCurrent(current, version)) return;
            link = saved;
            // A response confirms the submitted words, never words typed while it was pending.
            if (!keepDraft && note === draft) note = saved.note;
            message = done;
        } catch {
            if (isCurrent(current, version)) message = "Your sharing settings are just as they were. You can try again whenever you're ready.";
        } finally {
            if (isCurrent(current, version)) busy = null;
        }
    }

    const toggle = (on: boolean) =>
        run("flag", (contact) => updateRecipient(contact, { is_recipient: on }), on ? `${who} now has a start page of their own.` : `${who}'s start page is put away.`);
    // The note shows its own saved state (card U8), so the modal's footer only closes; it also
    // saves when the field is left, so a note typed before closing the modal is kept.
    function saveNote() {
        const draft = note;
        return run("note", (contact) => updateRecipient(contact, { note: draft }), "");
    }
    const noteChanged = $derived(!!link && note !== link.note);
    const make = () => run("create", (contact) => createLink(contact), "Their link is ready to share.");
    const close = () => run("revoke", (contact) => revokeLink(contact), "The link is closed. A fresh one is a click away.");

    async function copy() {
        const current = id;
        const version = generation;
        if (!link?.path) return;
        try {
            await navigator.clipboard.writeText(linkUrl(link.path));
            if (!isCurrent(current, version)) return;
            copied = true;
            setTimeout(() => { if (isCurrent(current, version)) copied = false; }, 2000);
        } catch {
            if (isCurrent(current, version)) message = "The link is shown above, ready to copy by hand.";
        }
    }
</script>

{#if id && link}
    <div class="pt-4 mt-4 border-t border-border space-y-3" data-testid="recipient-panel">
        <label class="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card cursor-pointer">
            <input
                type="checkbox"
                checked={link.is_recipient}
                disabled={busy !== null}
                onchange={(e) => toggle((e.currentTarget as HTMLInputElement).checked)}
                class="mt-1 accent-primary"
                data-testid="recipient-flag"
            />
            <span class="text-sm text-foreground">
                <span class="font-bold">A start page for {who}</span><br />
                <span class="text-xs text-muted-foreground">A private page with your note, first steps, the people to call, where the originals are kept, and the letters and messages meant for them.</span>
            </span>
        </label>

        {#if link.is_recipient}
            <div class="space-y-2">
                <label for="recipient-note" class="block text-xs font-bold uppercase text-muted-foreground">A note for {who}</label>
                <textarea
                    id="recipient-note"
                    bind:value={note}
                    onblur={() => {
                        if (noteChanged && busy === null) saveNote();
                    }}
                    rows="3"
                    placeholder="The first words they'll read on their page"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:border-primary outline-none"
                    data-testid="recipient-note-input"
                ></textarea>
                {#if noteChanged}
                    <button
                        onclick={saveNote}
                        disabled={busy !== null}
                        aria-busy={busy === "note"}
                        class="px-4 py-2 rounded-xl text-sm font-semibold border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-50"
                        data-testid="recipient-note-save"
                    >{busy === "note" ? "Saving..." : "Save this note"}</button>
                {:else if link.note}
                    <p class="inline-flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="recipient-note-saved">
                        <Check class="w-4 h-4 text-primary" /> Your note is saved.
                    </p>
                {/if}
            </div>

            {#if link.path}
                <div class="flex items-center gap-2">
                    <input readonly aria-label="Link" value={linkUrl(link.path)} class="flex-1 min-w-0 px-3 py-2 rounded-xl border border-border bg-muted text-xs text-muted-foreground" data-testid="recipient-link" />
                    <button onclick={copy} class="px-3 py-2 rounded-xl border border-border text-muted-foreground hover:bg-muted" title="Copy the link">
                        {#if copied}<Check class="w-4 h-4" />{:else}<Copy class="w-4 h-4" />{/if}
                    </button>
                </div>
            {/if}

            <div class="flex flex-wrap gap-2">
                {#if link.path}
                    <button onclick={close} disabled={busy !== null} class="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted" data-testid="recipient-revoke">Close this link</button>
                {:else}
                    <button onclick={make} disabled={busy !== null} class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90" data-testid="recipient-create">
                        {#if busy === "create"}<Loader2 class="w-4 h-4 animate-spin" />{:else}<Link2 class="w-4 h-4" />{/if}
                        Create {who}'s link
                    </button>
                {/if}
                <a href={`/for/preview/${id}`} target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted" data-testid="recipient-preview">
                    <Eye class="w-4 h-4" /> Preview their page
                </a>
            </div>
        {/if}

        {#if message}<p class="text-xs text-muted-foreground" data-testid="recipient-message">{message}</p>{/if}
    </div>
{/if}
