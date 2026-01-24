<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import { LucideHeart, LucideArrowRight } from "lucide-svelte";
    import { userRole } from "$lib/stores/conciergeStore.svelte";

    interface Props {
        message?: string;
        compact?: boolean;
    }

    let {
        message = "Building a legacy is a brave act of love. If you need a moment of support, we're here.",
        compact = false,
    }: Props = $props();

    const isExecutor = $derived($userRole === "executor");

    // Adjust message for executors
    const bannerMessage = $derived(
        isExecutor
            ? "Caring for a loved one's estate is a profound responsibility. Be gentle with yourself."
            : message,
    );
</script>

<div
    in:fly={{ y: -20, duration: 800 }}
    class="relative overflow-hidden p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-primary/5 via-primary/10 to-slate-500/5 border border-white/10 backdrop-blur-sm group transition-all duration-500 hover:border-primary/20"
>
    <!-- Background Glow -->
    <div
        class="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700"
    ></div>
    <div
        class="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/10 transition-all duration-700"
    ></div>

    <div class="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div
            class="w-14 h-14 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-all duration-500"
        >
            <LucideHeart class="w-7 h-7 text-primary" />
        </div>

        <div class="flex-1 text-center md:text-left">
            <h4 class="text-lg font-medium text-slate-100 mb-1">
                We're sitting with you
            </h4>
            <p class="text-slate-400 leading-relaxed max-w-2xl">
                {bannerMessage}
            </p>
        </div>

        <a
            href="/resources/grief-support"
            class="shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all group/btn"
        >
            <span class="text-sm font-medium">Visit the Sanctuary</span>
            <LucideArrowRight
                class="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"
            />
        </a>
    </div>
</div>
