<script lang="ts">
    import { ChevronRight } from "lucide-svelte";

    export let blocks: any[] = [];
</script>

<div class="space-y-6 animate-in slide-in-from-right duration-300">
    {#each blocks as block}
        {#if block.type === "heading_1"}
            <h1
                class="text-3xl font-serif font-bold text-[#304743] mt-8 mb-4 border-b pb-2"
            >
                {block.content}
            </h1>
        {:else if block.type === "heading_2"}
            <h2
                class="text-xl font-bold text-[#304743] mt-6 mb-3 flex items-center gap-2"
            >
                <ChevronRight size={16} class="text-[#D4AF37]" />
                {block.content}
            </h2>
        {:else if block.type === "heading_3"}
            <h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">
                {block.content}
            </h3>
        {:else if block.type === "paragraph"}
            <p class="text-gray-600 leading-relaxed text-base">
                {@html block.content.replace(
                    /\*\*(.*?)\*\*/g,
                    "<strong>$1</strong>",
                )}
            </p>
        {:else if block.type === "callout"}
            <div
                class="p-4 rounded-xl border flex items-start gap-4 my-4
                {block.color === 'red_background'
                    ? 'bg-red-50 border-red-100 text-red-900'
                    : block.color === 'blue_background'
                      ? 'bg-blue-50 border-blue-100 text-blue-900'
                      : block.color === 'yellow_background'
                        ? 'bg-amber-50 border-amber-100 text-amber-900'
                        : 'bg-gray-50 border-gray-100 text-gray-700'}"
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
                    class="w-1.5 h-1.5 rounded-full bg-[#4A7C74] mt-2.5 shrink-0"
                ></div>
                <p class="text-gray-700 leading-relaxed">
                    {@html block.content.replace(
                        /\*\*(.*?)\*\*/g,
                        "<strong>$1</strong>",
                    )}
                </p>
            </div>
        {:else if block.type === "numbered_list_item"}
            <div class="flex items-start gap-3 pl-2 group">
                <span
                    class="font-bold text-[#D4AF37] text-sm mt-0.5 w-4 text-right"
                    >.</span
                >
                <p class="text-gray-700 leading-relaxed">
                    {@html block.content.replace(
                        /\*\*(.*?)\*\*/g,
                        "<strong>$1</strong>",
                    )}
                </p>
            </div>
        {:else if block.type === "to_do"}
            <label
                class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
            >
                <input
                    type="checkbox"
                    checked={block.to_do.checked}
                    class="mt-1 w-5 h-5 rounded border-gray-300 text-[#4A7C74] focus:ring-[#4A7C74]"
                />
                <span class="text-gray-700 text-sm leading-relaxed">
                    {@html block.to_do.rich_text[0].text.content}
                </span>
            </label>
        {:else if block.type === "quote"}
            <blockquote
                class="border-l-4 border-[#D4AF37] pl-4 py-2 my-4 italic text-gray-600 bg-gray-50/50 rounded-r-lg"
            >
                " {@html block.content} "
            </blockquote>
        {/if}
    {/each}
</div>
