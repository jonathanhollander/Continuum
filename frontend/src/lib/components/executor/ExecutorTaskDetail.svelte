<script lang="ts">
    import { ChevronRight } from "lucide-svelte";
    import { executorSteps } from "$lib/stores/executorStepsStore.svelte";

    let { blocks = [], stepId = "" }: { blocks?: any[]; stepId?: string } = $props();

    // Per block: its checkbox position within the step (to_do), or its number in a numbered run.
    let marks = $derived.by(() => {
        let todo = 0;
        let num = 0;
        return blocks.map((b) => {
            if (b.type === "to_do") return todo++;
            num = b.type === "numbered_list_item" ? num + 1 : 0;
            return num;
        });
    });
</script>

<div class="space-y-6 animate-in slide-in-from-right duration-300">
    {#each blocks as block, i}
        {#if block.type === "heading_1"}
            <h1
                class="text-3xl font-serif font-bold text-foreground mt-8 mb-4 border-b pb-2"
            >
                {block.content}
            </h1>
        {:else if block.type === "heading_2"}
            <h2
                class="text-xl font-bold text-foreground mt-6 mb-3 flex items-center gap-2"
            >
                <ChevronRight size={16} class="text-gold-text" />
                {block.content}
            </h2>
        {:else if block.type === "heading_3"}
            <h3 class="text-lg font-bold text-foreground mt-4 mb-2">
                {block.content}
            </h3>
        {:else if block.type === "paragraph"}
            <p class="text-muted-foreground leading-relaxed text-base">
                {@html block.content.replace(
                    /\*\*(.*?)\*\*/g,
                    "<strong>$1</strong>",
                )}
            </p>
        {:else if block.type === "callout"}
            <div
                class="p-4 rounded-xl border flex items-start gap-4 my-4
                {block.color === 'red_background'
                    ? 'bg-warning-soft border-warning/20 text-foreground'
                    : block.color === 'blue_background'
                      ? 'bg-info/10 border-info/20 text-foreground'
                      : block.color === 'yellow_background'
                        ? 'bg-warning-soft border-warning/20 text-foreground'
                        : 'bg-muted border-border text-foreground'}"
            >
                <div class="text-xl shrink-0">
                    {block.icon?.replace("emoji:", "") || "💡"}
                </div>
                <div class="text-sm font-medium leading-relaxed">
                    {@html block.content.replace(
                        /\*\*(.*?)\*\*/g,
                        "<strong>$1</strong>",
                    )}
                </div>
            </div>
        {:else if block.type === "bulleted_list_item"}
            <div class="flex items-start gap-3 pl-2">
                <div
                    class="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"
                ></div>
                <p class="text-foreground leading-relaxed">
                    {@html block.content.replace(
                        /\*\*(.*?)\*\*/g,
                        "<strong>$1</strong>",
                    )}
                </p>
            </div>
        {:else if block.type === "numbered_list_item"}
            <div class="flex items-start gap-3 pl-2 group">
                <span
                    class="font-bold text-gold-text text-sm mt-0.5 w-4 text-right"
                    >{marks[i]}.</span
                >
                <p class="text-foreground leading-relaxed">
                    {@html block.content.replace(
                        /\*\*(.*?)\*\*/g,
                        "<strong>$1</strong>",
                    )}
                </p>
            </div>
        {:else if block.type === "to_do"}
            <label
                class="flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
            >
                <input
                    type="checkbox"
                    data-testid="sub-step"
                    checked={stepId
                        ? executorSteps.isSubDone(stepId, marks[i])
                        : block.to_do.checked}
                    onchange={() =>
                        stepId &&
                        executorSteps.toggleSub(stepId, marks[i]).catch(() => {})}
                    class="mt-1 w-5 h-5 rounded border-muted-foreground text-primary focus:ring-primary"
                />
                <span class="text-foreground text-sm leading-relaxed">
                    {@html block.to_do.rich_text[0].text.content}
                </span>
            </label>
        {:else if block.type === "quote"}
            <blockquote
                class="border-l-4 border-gold pl-4 py-2 my-4 italic text-muted-foreground bg-muted/50 rounded-r-lg"
            >
                " {@html block.content} "
            </blockquote>
        {/if}
    {/each}
</div>
