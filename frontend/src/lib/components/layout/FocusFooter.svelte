<script lang="ts">
    import { ArrowLeft, CircleCheck } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { goto } from "$app/navigation";

    // We can add props later for "Next Step" logic
</script>

<div
    class="fixed bottom-0 left-0 lg:left-80 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex items-center justify-between z-40 transition-all duration-300"
    in:slide={{ axis: "y", duration: 300 }}
>
    <div class="flex items-center gap-3">
        <div class="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
        <span
            class="text-xs font-bold uppercase tracking-widest text-slate-500"
        >
            Focus Mode Active
        </span>
    </div>

    <div class="flex items-center gap-4">
        <button
            onclick={() => goto("/wizard")}
            class="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
            <CircleCheck size={16} />
            <span>Complete & Return</span>
        </button>
    </div>
</div>
