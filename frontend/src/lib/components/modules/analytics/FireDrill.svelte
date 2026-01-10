<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import {
        Shield,
        Briefcase,
        Heart,
        CircleCheck,
        CircleX,
        ArrowRight,
        X,
        Flame,
    } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    let step = 0;
    let results: Record<string, boolean> = {};

    const questions = [
        {
            id: "legal_documents",
            category: "legal",
            icon: Shield,
            question:
                "Do you have a physical copy of your Will located in a fireproof safe?",
            color: "text-indigo-400",
        },
        {
            id: "executor_aware",
            category: "legal",
            icon: Shield,
            question:
                "Does your designated Executor know they have been assigned this role?",
            color: "text-indigo-400",
        },
        {
            id: "passwords",
            category: "financial",
            icon: Briefcase,
            question:
                "Is your master password or password manager accessible to a trusted person?",
            color: "text-emerald-400",
        },
        {
            id: "beneficiaries",
            category: "financial",
            icon: Briefcase,
            question:
                "Have you reviewed your insurance and account beneficiaries in the last 12 months?",
            color: "text-emerald-400",
        },
        {
            id: "heirlooms",
            category: "legacy",
            icon: Heart,
            question:
                "Have you told the stories behind your most cherished heirlooms?",
            color: "text-rose-400",
        },
        {
            id: "wishes",
            category: "legacy",
            icon: Heart,
            question:
                "Are your funeral wishes documented explicitly to avoid family conflict?",
            color: "text-rose-400",
        },
    ];

    function answer(yes: boolean) {
        results[questions[step].id] = yes;
        if (step < questions.length - 1) {
            step++;
        } else {
            finish();
        }
    }

    function finish() {
        step = questions.length; // Show result screen
    }

    function close() {
        dispatch("close");
    }

    $: score = Object.values(results).filter(Boolean).length;
    $: total = questions.length;
    $: percentage = Math.round((score / total) * 100);

    function getMessage(p: number) {
        if (p === 100)
            return "Immaculate Preparedness. You require no intervention.";
        if (p >= 60)
            return "Solid Foundation. Address the gaps to reach total peace of mind.";
        return "Critical Vulnerabilities. Your estate wants for basic protections.";
    }
</script>

<div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
    transition:fade
>
    <div
        class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        in:fly={{ y: 20, duration: 400 }}
    >
        <!-- Close Button -->
        <button
            on:click={close}
            class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
            <X size={20} />
        </button>

        {#if step < questions.length}
            <!-- Question Step -->
            <div class="p-8">
                <!-- Progress -->
                <div class="flex items-center gap-2 mb-8">
                    {#each questions as q, i}
                        <div
                            class={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-indigo-500" : "bg-slate-800"}`}
                        />
                    {/each}
                </div>

                <div class="mb-4 flex justify-center">
                    <div
                        class={`p-4 rounded-full bg-slate-800 ${questions[step].color}`}
                    >
                        <svelte:component
                            this={questions[step].icon}
                            size={32}
                        />
                    </div>
                </div>

                <h3
                    class="text-xl font-bold text-center text-white mb-8 min-h-[80px]"
                >
                    {questions[step].question}
                </h3>

                <div class="grid grid-cols-2 gap-4">
                    <button
                        on:click={() => answer(false)}
                        class="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2 font-bold"
                    >
                        <CircleX size={18} />
                        No
                    </button>
                    <button
                        on:click={() => answer(true)}
                        class="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 font-bold"
                    >
                        <CircleCheck size={18} />
                        Yes
                    </button>
                </div>
            </div>
        {:else}
            <!-- Results Screen -->
            <div class="p-8 text-center bg-indigo-900/10 h-full">
                <div class="mb-6 flex justify-center">
                    <div
                        class={`p-6 rounded-full ${percentage >= 80 ? "bg-emerald-500/20 text-emerald-400" : percentage >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-rose-500/20 text-rose-400"}`}
                    >
                        <Flame size={48} />
                    </div>
                </div>
                <h2 class="text-3xl font-serif font-bold text-white mb-2">
                    Fire Drill Complete
                </h2>
                <div class="text-5xl font-bold text-white mb-4">
                    {score} / {total}
                </div>
                <p class="text-slate-300 mb-8 max-w-sm mx-auto">
                    {getMessage(percentage)}
                </p>

                <button
                    on:click={close}
                    class="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                    Return to Status
                    <ArrowRight size={18} />
                </button>
            </div>
        {/if}
    </div>
</div>
