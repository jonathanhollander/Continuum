<script lang="ts">
    // An heirloom photo: a stored file ("/api/media/12/download") is fetched with the
    // sign-in and shown from the shared object URL; older data: URLs and typed addresses show as they are.
    import { blobUrlFor } from "$lib/components/ui/MediaView.svelte";
    import { mediaIdFromRef } from "$lib/services/mediaService";

    let { src, alt, class: className = "" } = $props<{ src: string; alt: string; class?: string }>();

    let mediaId = $derived(mediaIdFromRef(src));
    let shown = $state<string | null>(null);

    $effect(() => {
        const id = mediaId;
        const plain = src;
        if (id === null) {
            shown = plain || null;
            return;
        }
        let cancelled = false;
        shown = null;
        blobUrlFor(id).then(
            (url) => { if (!cancelled) shown = url; },
            () => undefined,
        );
        return () => { cancelled = true; };
    });
</script>

{#if shown}
    <img src={shown} {alt} class={className} />
{/if}
