<script lang="ts">
    import { ArrowRight, Sparkles } from "lucide-svelte";
    import { fly } from "svelte/transition";

    export let title: string;
    export let description: string;
    export let actionLabel: string = "Resolve Now";
    export let actionLink: string = "#";
    export let type: "critical" | "insight" | "encourage" = "critical";
</script>

<div
    class="relative group rounded-3xl p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-transparent backdrop-blur-md overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)]"
    in:fly={{ y: 20, duration: 1000, delay: 500 }}
>
    <!-- Inner Glass -->
    <div
        class="bg-slate-950/40 h-full w-full rounded-3xl p-8 flex flex-col items-start gap-4 relative z-10"
    >
        <!-- Badge -->
        <div
            class="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10 flex items-center gap-2
            {type === 'critical'
                ? 'bg-rose-500/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]'}"
        >
            <Sparkles size={10} />
            {type === "critical" ? "Critical Priority" : "Insight"}
        </div>

        <!-- Content -->
        <div>
            <h2
                class="text-3xl font-serif font-bold text-white mb-2 leading-tight"
            >
                {title}
            </h2>
            <p
                class="text-slate-300 font-medium text-lg leading-relaxed max-w-xl"
            >
                {description}
            </p>
        </div>

        <!-- Action Button -->
        <a
            href={actionLink}
            class="mt-4 px-8 py-3 rounded-xl bg-white text-slate-950 font-bold flex items-center gap-2 group-hover:bg-indigo-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
            {actionLabel}
            <ArrowRight
                size={18}
                class="group-hover:translate-x-1 transition-transform"
            />
        </a>
    </div>

    <!-- Shine Effect -->
    <div
        class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
    ></div>
</div>
