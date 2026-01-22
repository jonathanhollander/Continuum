<script lang="ts">
    import { fly } from "svelte/transition";
    import type { ComponentType } from "svelte";
    import { LucideExternalLink, LucidePlay, LucideBookOpen } from "lucide-svelte";

    interface Props {
        title: string;
        description: string;
        type: "article" | "video" | "external" | "guide";
        duration?: string;
        url?: string;
        category: string;
        icon: ComponentType;
        color: string;
        delay?: number;
    }

    let {
        title,
        description,
        type,
        duration,
        url,
        category,
        icon: Icon,
        color,
        delay = 0,
    } = $props<Props>();

    function getTypeLabel(t: string): string {
        switch (t) {
            case "article":
                return "A gentle read";
            case "video":
                return "A quiet moment";
            case "external":
                return "Professional support";
            case "guide":
                return "A helpful guide";
            default:
                return "When you're ready";
        }
    }

    function getActionLabel(t: string): string {
        switch (t) {
            case "article":
                return "When you're ready";
            case "video":
                return "Watch when ready";
            case "external":
                return "Visit resource";
            case "guide":
                return "Read guide";
            default:
                return "Explore";
        }
    }
</script>

{#if type === "external" && url}
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        in:fly={{ y: 20, delay, duration: 600 }}
        class="group relative block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-{color}-500/10 cursor-pointer"
    >
        <div class="flex items-start justify-between mb-4">
            <div
                class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-{color}-500/10 text-{color}-400 border border-{color}-500/20"
            >
                {category}
            </div>
            <LucideExternalLink class="w-4 h-4 text-slate-500" />
        </div>

        <h3
            class="text-lg font-medium mb-2 group-hover:text-white transition-colors"
        >
            {title}
        </h3>
        <p class="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-6">
            {description}
        </p>

        <div class="flex items-center justify-between text-xs font-medium">
            <div class="flex items-center gap-2 text-slate-500">
                {#if Icon}
                    <Icon class="w-4 h-4" />
                {/if}
                <span>{getTypeLabel(type)}</span>
            </div>
            <div
                class="text-{color}-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                {getActionLabel(type)}
                <LucideExternalLink class="w-3 h-3" />
            </div>
        </div>
    </a>
{:else}
    <div
        in:fly={{ y: 20, delay, duration: 600 }}
        class="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-{color}-500/10 cursor-pointer"
    >
        <div class="flex items-start justify-between mb-4">
            <div
                class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-{color}-500/10 text-{color}-400 border border-{color}-500/20"
            >
                {category}
            </div>
            {#if type === "video" && duration}
                <div
                    class="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"
                >
                    <LucidePlay class="w-3 h-3" />
                    {duration}
                </div>
            {:else if type === "guide"}
                <LucideBookOpen class="w-4 h-4 text-slate-500" />
            {/if}
        </div>

        <h3
            class="text-lg font-medium mb-2 group-hover:text-white transition-colors"
        >
            {title}
        </h3>
        <p class="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-6">
            {description}
        </p>

        <div class="flex items-center justify-between text-xs font-medium">
            <div class="flex items-center gap-2 text-slate-500">
                {#if Icon}
                    <Icon class="w-4 h-4" />
                {/if}
                <span>{getTypeLabel(type)}</span>
            </div>
            <div
                class="text-{color}-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                {getActionLabel(type)}
                <LucideExternalLink class="w-3 h-3" />
            </div>
        </div>
    </div>
{/if}
