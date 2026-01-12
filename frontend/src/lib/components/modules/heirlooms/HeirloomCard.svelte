<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { Gift, Heart, QrCode, User, ZoomIn } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    let { heirloom, onPrintQr } = $props<{
        heirloom: {
            id: string | number;
            name: string;
            image?: string;
            recipient: string;
            story: string;
            value?: string;
        };
        onPrintQr?: (id: string | number) => void;
    }>();

    let isExpanded = $state(false);
</script>

<div
    class="group bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 relative"
>
    <!-- Card Image Area -->
    <div class="h-48 w-full bg-stone-100 relative overflow-hidden">
        {#if heirloom.image}
            <img
                src={heirloom.image}
                alt={heirloom.name}
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
        {:else}
            <div class="flex items-center justify-center h-full text-stone-300">
                <Gift size={48} />
            </div>
        {/if}

        <!-- Recipient Badge -->
        <div
            class="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#304743] shadow-sm flex items-center gap-1.5"
        >
            <User size={12} class="text-[#4A7C74]" />
            For {heirloom.recipient}
        </div>
    </div>

    <!-- Content -->
    <div class="p-6">
        <h3 class="font-serif font-bold text-xl text-[#304743] mb-2">
            {heirloom.name}
        </h3>

        <p
            class="text-sm text-muted-foreground leading-relaxed mb-4 transition-[max-height] duration-500 ease-in-out"
            class:line-clamp-3={!isExpanded}
        >
            {heirloom.story}
        </p>

        <div
            class="flex items-center justify-between pt-4 border-t border-stone-100"
        >
            <button
                onclick={() => (isExpanded = !isExpanded)}
                class="text-xs font-bold text-stone-400 hover:text-[#4A7C74] flex items-center gap-1 transition-colors"
            >
                <ZoomIn size={14} />
                {isExpanded ? "Hide Story" : "View Story"}
            </button>

            <!-- Digital Heirloom QR Trigger -->
            <button
                onclick={() => onPrintQr?.(heirloom.id)}
                class="p-2 bg-stone-50 rounded-lg text-stone-400 hover:text-[#304743] hover:bg-stone-100 transition-colors"
                title="Generate Digital Heirloom QR"
            >
                <QrCode size={16} />
            </button>
        </div>
    </div>

    <!-- Hidden Deep Value Reveal -->
    <div
        class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity"
    >
        <div
            class="bg-[#4A7C74] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1"
        >
            <Heart size={10} class="fill-current" />
            SENTIMENTAL
        </div>
    </div>
</div>
