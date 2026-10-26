<script lang="ts">
    // The owner's preview of a recipient's start page: the same component and the same
    // server-filtered payload as the link, read with the owner's session (card D2).
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth";
    import { captureSession, assertCurrentSession } from '$lib/services/sessionOwnership';
    import RecipientStartPage from "$lib/components/recipient/RecipientStartPage.svelte";
    import RecipientPageState from "$lib/components/recipient/RecipientPageState.svelte";
    import { fetchRecipientPreview, ownerFileFetcher, LinkClosed, type RecipientView } from "$lib/services/recipientService";

    const contactId = $page.params.contactId ?? "";
    let view = $state<RecipientView | null>(null);
    let phase = $state<"loading" | "closed" | "retry" | "ready" | "signin">("loading");

    async function load() {
        phase = "loading";
        try {
            view = await fetchRecipientPreview(contactId);
            phase = "ready";
        } catch (e) {
            phase = e instanceof LinkClosed ? "closed" : "retry";
        }
    }
    async function refreshView() {
        const owner = captureSession();
        const fresh = await fetchRecipientPreview(contactId);
        assertCurrentSession(owner);
        view = fresh;
        return fresh;
    }
    // Wait for the session to load; the preview reads with the owner's own token.
    let loadedFor: string | null = null;
    $effect(() => {
        if ($auth.loading) return;
        if (!$auth.token) {
            phase = "signin";
            return;
        }
        if (loadedFor === null) {
            loadedFor = $auth.token;
            load();
        }
    });
</script>

<svelte:head><title>{view ? `Preview for ${view.recipient.name}` : "Preview"} · Continuum</title></svelte:head>

{#if phase === "ready" && view}
    <RecipientStartPage {view} {refreshView} fetchBlob={ownerFileFetcher} />
{:else}
    <RecipientPageState state={phase} onretry={load} />
{/if}
