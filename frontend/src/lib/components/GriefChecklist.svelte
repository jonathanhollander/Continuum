<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import {
        LucideCheckCircle2,
        LucideCircle,
        LucideClock,
        LucideAlertCircle,
    } from "lucide-svelte";

    interface ChecklistItem {
        id: string;
        text: string;
        description: string;
        priority: "immediate" | "soon" | "later";
        done: boolean;
    }

    let items = $state<ChecklistItem[]>([
        {
            id: "1",
            text: "Contact a funeral home",
            description:
                "They will help with the early care of your loved one and guide you through the first legal steps.",
            priority: "immediate",
            done: false,
        },
        {
            id: "2",
            text: "Let close family and friends know",
            description:
                "A trusted friend can help you make these calls.",
            priority: "immediate",
            done: false,
        },
        {
            id: "3",
            text: "Locate important documents",
            description:
                "Look for a will, birth certificate, and any pre-arranged funeral plans.",
            priority: "soon",
            done: false,
        },
        {
            id: "4",
            text: "Arrange for pet and home care",
            description:
                "When you can, see that any animals are fed and the home is secure.",
            priority: "soon",
            done: false,
        },
        {
            id: "5",
            text: "Take a moment for yourself",
            description:
                "This is a profound moment. It is okay to pause, breathe, and just be.",
            priority: "immediate",
            done: false,
        },
    ]);

    let activePriority = $state<"immediate" | "soon" | "later">("immediate");

    const filteredItems = $derived(
        items.filter((item) => item.priority === activePriority),
    );

    function toggleItem(id: string) {
        const item = items.find((i) => i.id === id);
        if (item) item.done = !item.done;
    }
</script>

<div class="space-y-6">
    <!-- Gentle intro -->
    <p class="text-sm text-muted-foreground italic leading-relaxed">
        When you're ready, these small steps may help. Move at your own pace.
    </p>

    <div class="flex items-center gap-4 mb-8">
        <button
            onclick={() => (activePriority = "immediate")}
            class="px-4 py-2 rounded-xl text-sm font-medium transition-all {activePriority ===
            'immediate'
                ? 'bg-primary/20 text-primary-hover border border-primary/30'
                : 'bg-white/5 text-muted-foreground hover:text-foreground'}"
        >
            Right now
        </button>
        <button
            onclick={() => (activePriority = "soon")}
            class="px-4 py-2 rounded-xl text-sm font-medium transition-all {activePriority ===
            'soon'
                ? 'bg-primary/20 text-primary-hover border border-primary/30'
                : 'bg-white/5 text-muted-foreground hover:text-foreground'}"
        >
            In the Coming Days
        </button>
    </div>

    <div class="space-y-4">
        {#each filteredItems as item (item.id)}
            <div
                in:fly={{ y: 20, duration: 500 }}
                class="p-6 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 {item.done
                    ? 'bg-white/[0.02]'
                    : ''}"
            >
                <div class="flex gap-4">
                    <button role="checkbox" aria-checked={item.done} aria-label={item.text}
                        onclick={() => toggleItem(item.id)}
                        class="shrink-0 mt-1"
                    >
                        {#if item.done}
                            <LucideCheckCircle2
                                class="w-6 h-6 text-success"
                            />
                        {:else}
                            <LucideCircle class="w-6 h-6 text-muted-foreground" />
                        {/if}
                    </button>

                    <div>
                        <h4
                            class="text-lg font-medium {item.done
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'}"
                        >
                            {item.text}
                        </h4>
                        <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    {#if activePriority === "immediate"}
        <div
            class="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start"
        >
            <LucideAlertCircle class="w-6 h-6 text-amber-400 shrink-0 mt-1" />
            <p class="text-sm text-amber-200/70 leading-relaxed italic">
                "The first 24 hours can feel like a blur. Try to focus only on
                these few things. Everything else can wait."
            </p>
        </div>
    {/if}
</div>
