<script lang="ts">
    import { page } from "$app/stores";
    // Force refresh
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import * as registryRaw from "$lib/data/registry.json";
    import ModuleContent from "$lib/components/ModuleContent.svelte";
    import AssetManager from "$lib/components/archetypes/AssetManager.svelte";
    import ContactDirectory from "$lib/components/archetypes/ContactDirectory.svelte";
    import TaskDashboard from "$lib/components/archetypes/TaskDashboard.svelte";
    import DocumentVault from "$lib/components/archetypes/DocumentVault.svelte";

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
            tier={module.role === "owner" ? "preparation" : "executor"}
        />

        <div class="container mx-auto px-6 py-12">
            <div class="max-w-4xl mx-auto space-y-12">
                <!-- Status Card -->
                <div
                    class="bg-card border border-border p-8 rounded-lg shadow-sm"
                >
                    <h2 class="font-serif text-2xl mb-4 text-primary">
                        Module Configuration
                    </h2>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-muted-foreground block mb-1"
                                >ID</span
                            >
                            <span class="font-mono">{module.id}</span>
                        </div>
                        <div>
                            <span class="text-muted-foreground block mb-1"
                                >Role Access</span
                            >
                            <span class="uppercase tracking-wider font-bold"
                                >{module.role}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Smart Module Router -->
                {#if module.id.includes("financial") || module.id.includes("property") || module.id.includes("insurance") || module.id.includes("subscription") || module.id.includes("asset") || module.id.includes("vehicle") || module.id.includes("estate")}
                    <AssetManager {module} />
                {:else if module.id.includes("contact") || module.id.includes("beneficiar")}
                    <ContactDirectory {module} />
                {:else if module.id.includes("task") || module.id.includes("checklist") || module.id.includes("guide")}
                    <TaskDashboard {module} />
                {:else if module.id.includes("legal") || module.id.includes("letter") || module.id.includes("file") || module.id.includes("keepsake") || module.id.includes("document")}
                    <DocumentVault {module} />
                {:else}
                    <!-- Fallback to Generic Guide -->
                    <ModuleContent {module} />
                {/if}
            </div>
        </div>
    {:else}
        <div class="container mx-auto px-6 py-20 text-center">
            <h1 class="text-4xl font-serif text-destructive mb-4">
                Module Not Found
            </h1>
            <p class="text-muted-foreground">
                The requested module ID "{moduleId}" does not exist in the
                registry.
            </p>
            <a
                href="/catalog"
                class="inline-block mt-8 text-primary hover:underline"
                >Return to Catalog</a
            >
        </div>
    {/if}
</div>
