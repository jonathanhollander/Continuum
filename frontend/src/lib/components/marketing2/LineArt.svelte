<script lang="ts">
    // Small hand-drawn line illustrations for marketing2 sections that have no photo or screenshot.
    // Teal lines (--color-primary) with gold accents (--color-gold); decorative only.
    let {
        name,
        class: klass = "",
    }: { name: "table" | "envelope" | "folder"; class?: string } = $props();
</script>

<svg
    viewBox="0 0 240 140"
    class="line-art {klass}"
    aria-hidden="true"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
>
    {#if name === "table"}
        <!-- A kitchen table under a lamp: a warm cup and a folded note -->
        <g class="teal">
            <path d="M120 0 V20" />
            <path d="M102 34 Q120 14 138 34 Z" />
            <path d="M18 100 H222" />
            <path d="M38 100 V136 M202 100 V136" />
            <path d="M58 72 h28 v20 a8 8 0 0 1 -8 8 h-12 a8 8 0 0 1 -8 -8 z" />
            <path d="M86 78 a7 7 0 0 1 0 14" />
            <path d="M134 100 L150 64 H188 L172 100 Z" />
            <path d="M188 64 L200 100" />
        </g>
        <g class="gold">
            <circle cx="120" cy="40" r="3" class="fill-gold" />
            <path d="M67 64 c-4 -5 4 -8 0 -14 M77 64 c-4 -5 4 -8 0 -14" />
            <path d="M152 76 H178 M148 84 H170 M145 91 H160" />
        </g>
    {:else if name === "envelope"}
        <!-- A photograph, a letter with a heart seal, and a key: memories beside practical things -->
        <g class="teal">
            <g transform="rotate(-8 64 54)">
                <rect x="34" y="28" width="62" height="50" rx="2" class="fill-bg" />
                <path d="M40 70 L56 52 L66 62 L76 50 L90 70" />
            </g>
            <rect x="60" y="46" width="112" height="72" rx="4" class="fill-bg" />
            <path d="M60 50 L116 88 L172 50" />
            <circle cx="186" cy="96" r="14" class="fill-bg" />
            <circle cx="186" cy="96" r="5" />
            <path d="M196 106 L224 132 M212 121 L207 127 M218 127 L213 133" />
        </g>
        <g class="gold">
            <circle cx="78" cy="40" r="4" />
            <path
                d="M116 96 c-6 -5 -10 -8 -10 -12 a5 5 0 0 1 10 -2 a5 5 0 0 1 10 2 c0 4 -4 7 -10 12 z"
            />
        </g>
    {:else if name === "folder"}
        <!-- A signed document and the open folder where the family will find it -->
        <g class="teal">
            <rect x="34" y="22" width="66" height="90" rx="3" />
            <path d="M46 40 H88 M46 50 H88 M46 60 H80 M46 70 H86" />
            <path d="M140 54 h26 l8 8 h44 v56 h-78 z" />
            <path d="M140 72 H218" />
        </g>
        <g class="gold">
            <circle cx="84" cy="94" r="8" />
            <path d="M80 101 L77 112 M88 101 L91 112" />
            <path d="M104 60 C 118 36, 132 36, 148 64" stroke-dasharray="2 5" />
            <path d="M160 92 H198 M160 102 H186" />
        </g>
    {/if}
</svg>

<style>
    .line-art {
        stroke-width: 1.5;
        overflow: visible;
    }
    .teal {
        stroke: color-mix(in srgb, var(--color-primary) 85%, white 15%);
    }
    .gold {
        stroke: var(--color-gold);
        opacity: 0.85;
    }
    .fill-bg {
        fill: #0a0a0b;
    }
    .fill-gold {
        fill: var(--color-gold);
    }
</style>
