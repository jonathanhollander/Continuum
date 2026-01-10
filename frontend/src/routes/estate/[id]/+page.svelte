<script lang="ts">
    import { page } from "$app/stores";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import RevealTransition from "$lib/components/RevealTransition.svelte";
    import MechanicalIcon from "$lib/components/MechanicalIcon.svelte";
    import { ShieldCheck, Calendar, FileText } from "lucide-svelte";
    import { fade } from "svelte/transition";

    // Mock Data
    const id = $page.params.id;
    const estate = {
        id: id,
        name: "The Anderson Legacy",
        description: "Primary residence and investment portfolio.",
        createdAt: new Date(),
        tasks: [
            {
                id: "t1",
                title: "Locate Will and Testament",
                status: "COMPLETED",
                priority: "Critical",
            },
            {
                id: "t2",
                title: "Notify Financial Institutions",
                status: "IN_PROGRESS",
                priority: "High",
            },
            {
                id: "t3",
                title: "Secure Primary Residence",
                status: "NOT_STARTED",
                priority: "Medium",
            },
        ],
    };

    // Mock Smart Guidance Logic
    const guidance = {
        headline: "Immediate Action Required",
        subtext:
            "Based on the recent creation of this estate, the highest priority is securing legal documentation.",
        priority: "critical",
    };

    // Icon mapping helper
    const getIcon = (name: string) => {
        // Return SVG paths for MechanicalIcon
        if (name === "chronos")
            return `<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />`;
        return "";
    };
</script>

<div class="min-h-screen bg-background pb-20">
    <LivingBlueprintHeader
        title={estate.name}
        subtitle="Executor Control Center"
        tier="executor"
    />

    <div class="container mx-auto px-6 py-12 space-y-8">
        <!-- Smart Guidance Section -->
        <RevealTransition delay={0.1}>
            <div
                class="border border-primary/20 bg-primary/5 rounded-lg p-6 relative overflow-hidden"
            >
                <div class="absolute top-0 right-0 p-4 opacity-10">
                    <MechanicalIcon class="size-32" urgency="normal">
                        {@html getIcon("chronos")}
                    </MechanicalIcon>
                </div>

                <div class="relative z-10">
                    <div
                        class="flex items-center gap-3 mb-2 font-blueprint text-sm text-primary uppercase tracking-widest"
                    >
                        <MechanicalIcon class="size-4" urgency="urgent">
                            <circle cx="12" cy="12" r="10" />
                        </MechanicalIcon>
                        STATUS: {guidance.priority}
                    </div>
                    <h2 class="text-3xl font-serif text-foreground mb-2">
                        {guidance.headline}
                    </h2>
                    <p class="text-muted-foreground text-lg max-w-2xl">
                        {guidance.subtext}
                    </p>
                </div>
            </div>
        </RevealTransition>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealTransition delay={0.2} type="fade">
                <div
                    class="bg-card border border-border p-6 rounded-lg flex items-start justify-between group hover:border-primary/50 transition-colors"
                >
                    <div>
                        <p
                            class="text-sm font-blueprint text-muted-foreground uppercase tracking-wider mb-1"
                        >
                            Tasks Pending
                        </p>
                        <div class="text-4xl font-serif font-bold text-primary">
                            {estate.tasks.filter(
                                (t) => t.status !== "COMPLETED",
                            ).length}
                        </div>
                    </div>
                    <div
                        class="text-muted-foreground group-hover:text-primary transition-colors"
                    >
                        <FileText size={24} />
                    </div>
                </div>
            </RevealTransition>

            <RevealTransition delay={0.3} type="fade">
                <div
                    class="bg-card border border-border p-6 rounded-lg flex items-start justify-between group hover:border-primary/50 transition-colors"
                >
                    <div>
                        <p
                            class="text-sm font-blueprint text-muted-foreground uppercase tracking-wider mb-1"
                        >
                            Documents
                        </p>
                        <div class="text-4xl font-serif font-bold text-primary">
                            0
                        </div>
                        <p class="text-xs text-muted-foreground mt-2">
                            Vault Empty
                        </p>
                    </div>
                    <div
                        class="text-muted-foreground group-hover:text-primary transition-colors"
                    >
                        <ShieldCheck size={24} />
                    </div>
                </div>
            </RevealTransition>

            <RevealTransition delay={0.4} type="fade">
                <div
                    class="bg-card border border-border p-6 rounded-lg flex items-start justify-between group hover:border-primary/50 transition-colors"
                >
                    <div>
                        <p
                            class="text-sm font-blueprint text-muted-foreground uppercase tracking-wider mb-1"
                        >
                            Days Active
                        </p>
                        <div class="text-4xl font-serif font-bold text-primary">
                            {Math.floor(
                                (Date.now() - estate.createdAt.getTime()) /
                                    (1000 * 60 * 60 * 24),
                            )}
                        </div>
                    </div>
                    <div
                        class="text-muted-foreground group-hover:text-primary transition-colors"
                    >
                        <Calendar size={24} />
                    </div>
                </div>
            </RevealTransition>
        </div>

        <!-- Task List -->
        <div>
            <h3 class="text-xl font-serif mb-4">Immediate Actions</h3>
            {#if estate.tasks.length === 0}
                <div
                    class="p-8 border border-dashed border-border rounded text-center text-muted-foreground"
                >
                    No tasks assigned yet.
                </div>
            {:else}
                <div class="space-y-3">
                    {#each estate.tasks as task (task.id)}
                        <div
                            class="flex items-center justify-between p-4 bg-card border border-border rounded hover:bg-accent/5 transition-colors"
                        >
                            <span class="font-medium">{task.title}</span>
                            <span
                                class="text-xs font-blueprint uppercase px-2 py-1 bg-secondary/10 text-secondary rounded"
                            >
                                {task.status}
                            </span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>
