<script lang="ts">
    import type { AutomationRule } from "$lib/stores/automationStore.svelte";
    import { Bell, SquareCheck, TriangleAlert, Activity } from "lucide-svelte";

    export let rule: AutomationRule;
    export let onToggle: (id: string | number) => void;

    function getIcon(type: string) {
        switch (type) {
            case "notification":
                return Bell;
            case "task":
                return SquareCheck;
            case "alert":
                return TriangleAlert;
            default:
                return Activity;
        }
    }
</script>

<div
    class="bg-card p-6 rounded-xl border border-border flex items-start justify-between group hover:border-primary/40 transition-all"
>
    <div class="flex gap-4">
        <div
            class="w-12 h-12 rounded-full {rule.enabled
                ? 'bg-primary-soft text-primary'
                : 'bg-background text-muted-foreground'} flex items-center justify-center transition-colors"
        >
            <svelte:component this={getIcon(rule.type)} size={24} />
        </div>
        <div>
            <h3 class="font-bold text-foreground text-lg mb-1">{rule.name}</h3>
            <p class="text-muted-foreground text-sm">{rule.description}</p>
        </div>
    </div>

    <button role="switch" aria-checked={rule.enabled} aria-label={rule.name}
        class="w-12 h-6 rounded-full transition-colors relative {rule.enabled
            ? 'bg-primary'
            : 'bg-border'}"
        on:click={() => onToggle(rule.id)}
    >
        <span
            class="absolute top-1 left-1 w-4 h-4 rounded-full transition-transform {rule.enabled
                ? 'translate-x-6 bg-primary-foreground'
                : 'bg-muted-foreground'}"
        ></span>
    </button>
</div>
