<script lang="ts">
    import { fly } from "svelte/transition";
    import type { ComponentType } from "svelte";
    import { LucideExternalLink, LucidePlay } from "lucide-svelte";

    interface Props {
        title: string;
        description: string;
        type: "article" | "video";
        duration?: string;
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
        category,
        icon: Icon,
        color,
        delay = 0,
    } = $props<Props>();
</script>

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
        {#if type === "video"}
            <div
                class="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"
            >
                <LucidePlay class="w-3 h-3" />
                {duration}
            </div>
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
            <Icon class="w-4 h-4" />
            <span>{type === "article" ? "Reading" : "Watch"}</span>
        </div>
        <div
            class="text-{color}-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            {type === "article" ? "Read More" : "Play Now"}
            <LucideExternalLink class="w-3 h-3" />
        </div>
    </div>
</div>
