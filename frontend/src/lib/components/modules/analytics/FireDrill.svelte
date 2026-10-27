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
    import { focusTrap } from "$lib/actions/focusTrap";

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
            color: "text-primary",
        },
        {
            id: "executor_aware",
            category: "legal",
            icon: Shield,
            question:
                "Does your designated Executor know they have been assigned this role?",
            color: "text-primary",
        },
        {
            id: "passwords",
            category: "financial",
            icon: Briefcase,
            question:
                "Is your master password or password manager accessible to a trusted person?",
            color: "text-success",
        },
        {
            id: "beneficiaries",
            category: "financial",
            icon: Briefcase,
            question:
                "Have you reviewed your insurance and account beneficiaries in the last 12 months?",
            color: "text-success",
        },
        {
            id: "heirlooms",
            category: "legacy",
            icon: Heart,
            question:
                "Have you told the stories behind your most cherished heirlooms?",
            color: "text-gold-text",
        },
        {
            id: "wishes",
            category: "legacy",
            icon: Heart,
            question:
                "Are your funeral wishes written down so your family knows them?",
            color: "text-gold-text",
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
            return "You answered Yes to all six questions. Review the actual instructions and documents with the people involved to confirm access.";
        if (p >= 60)
            return "You answered Yes to some of these questions. Revisit the questions you answered No to and check the arrangements with the people involved.";
        return "Use the questions you answered No to as your review list. Your answers stay with this visit only.";
    }
</script>

<div
    role="dialog"
    aria-modal="true"
    aria-label="The Fire Drill"
    use:focusTrap={{ onEscape: close }}
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md surface-dark"
    transition:fade
>
    <div
        class="bg-background text-foreground border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        in:fly={{ y: 20, duration: 400 }}
    >
        <!-- Close Button -->
        <button
            on:click={close}
            aria-label="Close"
            class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
            <X size={20} />
        </button>

        {#if step < questions.length}
            <!-- Question Step -->
            <div class="p-8">
                <p class="text-sm text-muted-foreground text-center mb-4">Six self-reported checks. Your answers stay with this visit only.</p>
                <!-- Progress -->
                <div class="flex items-center gap-2 mb-8">
                    {#each questions as q, i}
                        <div
                            class={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-card"}`}
                        ></div>
                    {/each}
                </div>

                <div class="mb-4 flex justify-center">
                    <div
                        class={`p-4 rounded-full bg-card ${questions[step].color}`}
                    >
                        <svelte:component
                            this={questions[step].icon}
                            size={32}
                        />
                    </div>
                </div>

                <h3
                    class="text-xl font-bold text-center text-foreground mb-8 min-h-[80px]"
                >
                    {questions[step].question}
                </h3>

                <div class="grid grid-cols-2 gap-4">
                    <button
                        on:click={() => answer(false)}
                        class="p-4 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 font-bold"
                    >
                        <CircleX size={18} />
                        No
                    </button>
                    <button
                        on:click={() => answer(true)}
                        class="p-4 rounded-xl border border-primary/30 bg-primary-soft text-primary-hover hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 font-bold"
                    >
                        <CircleCheck size={18} />
                        Yes
                    </button>
                </div>
            </div>
        {:else}
            <!-- Results Screen -->
            <div class="p-8 text-center bg-primary/5 h-full">
                <div class="mb-6 flex justify-center">
                    <div
                        class={`p-6 rounded-full ${percentage >= 80 ? "bg-success/15 text-success" : percentage >= 50 ? "bg-gold/15 text-gold-text" : "bg-warning-soft text-warning"}`}
                    >
                        <Flame size={48} />
                    </div>
                </div>
                <h2 class="text-3xl font-serif font-bold text-foreground mb-2">
                    Your Drill Answers
                </h2>
                <div class="text-5xl font-bold text-foreground mb-4">
                    {score} / {total}
                </div>
                <p class="text-sm text-muted-foreground mb-4">Questions answered Yes</p>
                <p class="text-muted-foreground mb-8 max-w-sm mx-auto">
                    {getMessage(percentage)}
                </p>

                <button
                    on:click={close}
                    class="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                >
                    Return to Recorded Information
                    <ArrowRight size={18} />
                </button>
            </div>
        {/if}
    </div>
</div>
