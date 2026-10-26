<script lang="ts">
    // Loading, closed and retry states for the recipient start page and its preview (card D2).
    import { Loader2 } from "lucide-svelte";
    import { page } from "$app/stores";

    let { state, onretry }: { state: "loading" | "closed" | "retry" | "signin" | "ready"; onretry: () => void } = $props();
</script>

<div class="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-8" data-testid="recipient-state" data-state={state}>
    <div class="max-w-lg text-center space-y-5">
        {#if state === "loading" || state === "ready"}
            <Loader2 class="w-8 h-8 animate-spin text-primary-deep mx-auto" />
            <p class="text-stone-600">Gathering everything for you…</p>
        {:else if state === "closed"}
            <div class="w-24 h-2 bg-[#D4AF37] rounded-full mx-auto"></div>
            <h1 class="font-serif text-4xl text-primary-deep">This page is closed for now</h1>
            <p class="text-stone-600 leading-relaxed">
                The executor, or the person who shared it, can open it again for you.
                We're here when you come back.
            </p>
        {:else if state === "signin"}
            <h1 class="font-serif text-4xl text-primary-deep">Your preview opens once you're signed in</h1>
            <a href={`/login?redirect=${encodeURIComponent($page.url.pathname)}`} class="inline-block px-5 py-3 rounded-xl bg-primary-deep text-white font-semibold">Sign in to continue</a>
        {:else}
            <h1 class="font-serif text-4xl text-primary-deep">This is taking a moment</h1>
            <p class="text-stone-600">Everything is kept safe. You can try again whenever you like.</p>
            <button onclick={onretry} class="px-5 py-3 rounded-xl bg-primary-deep text-white font-semibold">Try again</button>
        {/if}
    </div>
</div>
