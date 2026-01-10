<script lang="ts">
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import RevealTransition from "$lib/components/RevealTransition.svelte";
    import EstateCard from "$lib/components/EstateCard.svelte";
    import { Plus, ShieldCheck } from "lucide-svelte";

    // Mock Data (matches functionality of legacy demo mode)
    const user = { firstName: "Demo", lastName: "Admin" };
    const estates = [
        {
            id: "estate_1",
            name: "The Anderson Legacy",
            description: "Primary residence and investment portfolio.",
            status: "ACTIVE",
        },
        {
            id: "estate_2",
            name: "Highland Trust",
            description: "Family vacation property and trust assets.",
            status: "ACTIVE",
        },
    ];
</script>

<div class="min-h-screen bg-background pb-20">
    <LivingBlueprintHeader
        title={`Welcome, ${user.firstName}`}
        subtitle="Your legacy command center is ready. Review the status of your active estates below."
        tier="preparation"
    />

    <div class="container mx-auto px-6 py-12">
        <RevealTransition delay={0.2} type="fade">
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-serif text-primary">Active Estates</h2>
                <button
                    class="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors font-blueprint text-sm tracking-wider"
                >
                    <Plus size={16} />
                    INITIATE NEW ESTATE
                </button>
            </div>

            {#if estates.length === 0}
                <div
                    class="bg-card border border-dashed border-border p-12 rounded-lg text-center"
                >
                    <div
                        class="inline-flex items-center justify-center size-16 rounded-full bg-secondary/10 text-secondary mb-4"
                    >
                        <ShieldCheck size={32} />
                    </div>
                    <h3 class="text-lg font-medium mb-2">
                        No Active Estates Found
                    </h3>
                    <p class="text-muted-foreground max-w-sm mx-auto mb-6">
                        Begin by initializing a new estate plan or importing an
                        existing one.
                    </p>
                </div>
            {:else}
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {#each estates as estate (estate.id)}
                        <EstateCard {estate} />
                    {/each}
                </div>
            {/if}
        </RevealTransition>
    </div>
</div>
