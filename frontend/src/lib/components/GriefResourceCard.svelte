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
        tone?: "primary" | "gold";
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
        tone: toneName = "primary",
        delay = 0,
    }: Props = $props();

    // Written-out classes (Tailwind only generates classes it can read in full), on the
    // site tokens: one accent (primary) plus gold. This card sits on a dark surface in both
    // themes, so the accent text uses the on-dark member of each family.
    const tones = {
        primary: {
            badge: "bg-primary-on-dark/10 border-primary-on-dark/20 text-primary-on-dark",
            action: "text-primary-on-dark",
            glow: "hover:shadow-primary-on-dark/10",
        },
        gold: {
            badge: "bg-gold/10 border-gold/20 text-gold",
            action: "text-gold",
            glow: "hover:shadow-gold/10",
        },
    } as const;
    const tone = $derived(tones[toneName] ?? tones.primary);

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
        class="group relative block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl {tone.glow} cursor-pointer"
    >
        <div class="flex items-start justify-between mb-4">
            <div
                class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border {tone.badge}"
            >
                {category}
            </div>
            <LucideExternalLink class="w-4 h-4 text-muted-foreground" />
        </div>

        <h3
            class="text-lg font-medium mb-2 group-hover:text-white transition-colors"
        >
            {title}
        </h3>
        <p class="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
            {description}
        </p>

        <div class="flex items-center justify-between text-xs font-medium">
            <div class="flex items-center gap-2 text-muted-foreground">
                {#if Icon}
                    <Icon class="w-4 h-4" />
                {/if}
                <span>{getTypeLabel(type)}</span>
            </div>
            <div
                class="{tone.action} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                {getActionLabel(type)}
                <LucideExternalLink class="w-3 h-3" />
            </div>
        </div>
    </a>
{:else}
    <div
        in:fly={{ y: 20, delay, duration: 600 }}
        class="group relative p-6 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 {type === 'guide' ? `hover:border-white/20 hover:shadow-xl ${tone.glow} cursor-pointer` : ''}"
    >
        <div class="flex items-start justify-between mb-4">
            <div
                class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border {tone.badge}"
            >
                {category}
            </div>
            {#if type === "video" && duration}
                <div
                    class="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono"
                >
                    <LucidePlay class="w-3 h-3" />
                    {duration}
                </div>
            {:else if type === "guide"}
                <LucideBookOpen class="w-4 h-4 text-muted-foreground" />
            {/if}
        </div>

        <h3
            class="text-lg font-medium mb-2 {type === 'guide' ? 'group-hover:text-white' : ''} transition-colors"
        >
            {title}
        </h3>
        <p class="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
            {description}
        </p>

        <div class="flex items-center justify-between text-xs font-medium">
            <div class="flex items-center gap-2 text-muted-foreground">
                {#if Icon}
                    <Icon class="w-4 h-4" />
                {/if}
                <span>{getTypeLabel(type)}</span>
            </div>
            {#if type === "guide"}
                <div
                    class="{tone.action} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {getActionLabel(type)}
                    <LucideExternalLink class="w-3 h-3" />
                </div>
            {/if}
        </div>
    </div>
{/if}
