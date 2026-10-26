<script lang="ts">
    import { page } from "$app/stores";
    // Force refresh
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import * as registryRaw from "$lib/data/registry.json";
    import ModuleContent from "$lib/components/ModuleContent.svelte";

    // Robustly extract the array
    const registryData = (registryRaw as any).default || registryRaw;
    const registry = Array.isArray(registryData)
        ? registryData
        : Object.values(registryData).filter((x) => typeof x === "object");

    const moduleId = $derived($page.params.id);
    const module = $derived(registry.find((m) => m.id === moduleId));
</script>

<div class="min-h-screen bg-background pb-20">
    {#if module}
        <LivingBlueprintHeader
            title={module.title}
            subtitle={module.description}
        />

        <div class="container mx-auto px-6 py-12">
            <div class="max-w-4xl mx-auto space-y-12">
                <!-- Asset ids (financial, property, subscription...) and contacts each have their own page
                     under /modules; vault ids go to /modules/legal-documents in +page.ts. -->
                {#key module.id}
                    <ModuleContent {module} />
                {/key}
            </div>
        </div>
    {:else}
        <div class="container mx-auto px-6 py-20 text-center">
            <h1 class="text-4xl font-serif text-foreground mb-4">
                That page may have moved
            </h1>
            <p class="text-muted-foreground">
                Every module lives in the catalog, ready whenever you are.
            </p>
            <a
                href="/catalog"
                class="inline-block mt-8 text-primary hover:underline"
                >Return to Catalog</a
            >
        </div>
    {/if}
</div>
