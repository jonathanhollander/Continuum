<script lang="ts">
	// Card X259: the gentle page for an old, renamed or mistyped address (and any other
	// routing error). It renders inside the root layout, so signed-in people keep the
	// sidebar and header; the wording stays positive and true (owner rule).
	import { page } from "$app/stores";
	import { auth } from "$lib/stores/auth";
	import { dict } from "$lib/stores/conciergeStore.svelte";
	import { Compass, ArrowRight } from "lucide-svelte";

	let signedIn = $derived(!!($auth.user || $auth.token));
	let isNotFound = $derived($page.status === 404);
	let homeHref = $derived(signedIn ? "/dashboard" : "/");
	let homeLabel = $derived(signedIn ? $dict.errorPage.toDashboard : $dict.errorPage.toHome);
</script>

<svelte:head>
	<title>Continuum</title>
</svelte:head>

<div class="min-h-[70vh] flex items-center justify-center p-6 font-sans">
	<div
		class="max-w-md w-full bg-card text-card-foreground border border-border rounded-3xl p-10 text-center shadow-sm"
	>
		<div
			class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-soft mb-6"
		>
			<Compass class="w-8 h-8 text-primary" aria-hidden="true" />
		</div>

		<h1 class="text-2xl font-serif text-foreground mb-3">
			{$dict.errorPage.title}
		</h1>

		<p class="text-muted-foreground leading-relaxed mb-8">
			{#if !isNotFound}
				{$dict.errorPage.reload}
			{/if}
			{signedIn ? $dict.errorPage.savedSafe : $dict.errorPage.homeNear}
		</p>

		<a
			href={homeHref}
			class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-colors"
		>
			{homeLabel}
			<ArrowRight class="w-4 h-4" aria-hidden="true" />
		</a>
	</div>
</div>
