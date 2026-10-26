<script lang="ts">
    // A recipient's start page, opened from the owner's link with no sign-in (card D2).
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import RecipientStartPage from "$lib/components/recipient/RecipientStartPage.svelte";
    import RecipientPageState from "$lib/components/recipient/RecipientPageState.svelte";
    import { fetchRecipientView, sharedFileFetcher, LinkClosed, type RecipientView } from "$lib/services/recipientService";

    const token = $page.params.token ?? "";
    let view = $state<RecipientView | null>(null);
    let phase = $state<"loading" | "closed" | "retry" | "ready">("loading");

    async function load() {
        phase = "loading";
        try {
            view = await fetchRecipientView(token);
            phase = "ready";
        } catch (e) {
            phase = e instanceof LinkClosed ? "closed" : "retry";
        }
    }
    onMount(load);
</script>

<svelte:head><title>{view ? `For ${view.recipient.name}` : "A page kept for you"} · Continuum</title></svelte:head>

{#if phase === "ready" && view}
    <RecipientStartPage {view} fetchBlob={sharedFileFetcher(token)} />
{:else}
    <RecipientPageState state={phase} onretry={load} />
{/if}
