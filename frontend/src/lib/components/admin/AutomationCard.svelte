<script lang="ts">
    import type { AutomationRule } from "$lib/stores/automation";
    import { Bell, SquareCheck, TriangleAlert, Activity } from "lucide-svelte";

    export let rule: AutomationRule;
    export let onToggle: (id: string) => void;

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
    class="bg-white p-6 rounded-xl border border-gray-100 flex items-start justify-between group hover:border-[#4A7C74]/30 transition-all"
>
    <div class="flex gap-4">
        <div
            class="w-12 h-12 rounded-full {rule.enabled
                ? 'bg-[#4A7C74]/10 text-[#4A7C74]'
                : 'bg-gray-100 text-gray-400'} flex items-center justify-center transition-colors"
        >
            <svelte:component this={getIcon(rule.type)} size={24} />
        </div>
        <div>
            <h3 class="font-bold text-[#304743] text-lg mb-1">{rule.name}</h3>
            <p class="text-gray-500 text-sm">{rule.description}</p>
        </div>
    </div>

    <button
        class="w-12 h-6 rounded-full transition-colors relative {rule.enabled
            ? 'bg-[#4A7C74]'
            : 'bg-gray-200'}"
        on:click={() => onToggle(rule.id)}
    >
        <span
            class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {rule.enabled
                ? 'translate-x-6'
                : ''}"
        />
    </button>
</div>
