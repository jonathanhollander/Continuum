<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import {
        Lightbulb,
        Info,
        Key,
        ShieldCheck,
        ArrowLeft,
    } from "lucide-svelte";

    export let title: string = "The Architect";
    export let blueprint: string = "Setting Foundation";
    export let why: string = "To ensure stability.";
    export let tip: string = "Start small.";
    export let backLink: string = "/wizard";
    export let backLabel: string = "Return";
</script>

<div
    class="h-full w-80 bg-slate-900/50 backdrop-blur-md border-r border-white/10 flex flex-col p-8 relative"
>
    <!-- Back / Escape -->
    <a
        href={backLink}
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 text-sm font-bold uppercase tracking-widest"
    >
        <ArrowLeft size={14} />
        {backLabel}
    </a>

    <!-- Identity -->
    <div class="mb-8">
        <div
            class="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-2"
        >
            System Architect
        </div>
        <h2 class="text-3xl font-serif font-bold text-white leading-none">
            {title}
        </h2>
    </div>

    <!-- The Content Rail -->
    <div class="space-y-8 relative">
        <!-- Visual Line -->
        <div
            class="absolute left-1.5 top-2 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 to-transparent"
        ></div>

        <!-- Blueprint -->
        <div
            class="pl-8 relative group"
            in:fly={{ y: 20, duration: 600, delay: 100 }}
        >
            <div
                class="absolute left-0 top-1 w-3 h-3 rounded-full bg-indigo-500 border border-slate-900 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            ></div>
            <h3
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            >
                Current Blueprint
            </h3>
            <p class="text-slate-200 text-lg leading-snug font-medium">
                {blueprint}
            </p>
        </div>

        <!-- The Why -->
        <div
            class="pl-8 relative group"
            in:fly={{ y: 20, duration: 600, delay: 200 }}
        >
            <div
                class="absolute left-0 top-1 w-3 h-3 rounded-full bg-emerald-500 border border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            ></div>
            <h3
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            >
                Why This Matters
            </h3>
            <p class="text-slate-300 text-sm leading-relaxed">
                {why}
            </p>
        </div>

        <!-- Pro Tip -->
        <div
            class="pl-8 relative group"
            in:fly={{ y: 20, duration: 600, delay: 300 }}
        >
            <div
                class="absolute left-0 top-1 w-3 h-3 rounded-full bg-amber-500 border border-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            ></div>
            <h3
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            >
                Architect's Tip
            </h3>
            <p
                class="text-amber-200/80 text-sm italic border-l-2 border-amber-500/30 pl-3 py-1"
            >
                "{tip}"
            </p>
        </div>
    </div>

    <!-- Footer Status -->
    <div class="mt-auto flex items-center gap-3 opacity-50">
        <ShieldCheck size={16} class="text-emerald-400" />
        <span class="text-[10px] uppercase tracking-widest text-slate-500"
            >Secure Environment Active</span
        >
    </div>
</div>
