<script lang="ts">
    // A product screenshot in a quiet window frame, for the marketing2 pages.
    let {
        src,
        alt,
        caption = "",
        width,
        height,
        fit = "",
        class: klass = "",
    }: {
        src: string;
        alt: string;
        caption?: string;
        width: number;
        height: number;
        fit?: string;
        class?: string;
    } = $props();
</script>

<figure class="shot {klass}">
    <div class="shot-frame">
        <div class="shot-bar" aria-hidden="true">
            <span></span><span></span><span></span>
        </div>
        <img
            {src}
            {alt}
            {width}
            {height}
            loading="lazy"
            decoding="async"
            class="block w-full h-auto {fit}"
        />
    </div>
    {#if caption}
        <figcaption class="mt-4 text-sm text-white/50 text-center font-serif italic">
            {caption}
        </figcaption>
    {/if}
</figure>

<style>
    .shot-frame {
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: #111214;
        box-shadow:
            0 30px 80px -30px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(0, 0, 0, 0.4),
            0 0 60px -20px color-mix(in srgb, var(--color-primary) 35%, transparent);
        transition:
            transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.7s ease;
    }
    .shot-frame:hover {
        transform: translateY(-6px);
        box-shadow:
            0 40px 90px -30px rgba(0, 0, 0, 0.85),
            0 0 0 1px rgba(0, 0, 0, 0.4),
            0 0 80px -16px color-mix(in srgb, var(--color-primary) 45%, transparent);
    }
    @media (prefers-reduced-motion: reduce) {
        .shot-frame {
            transition: none;
        }
        .shot-frame:hover {
            transform: none;
        }
    }
    .shot-frame img {
        filter: brightness(0.93);
    }
    .shot-bar {
        display: flex;
        gap: 6px;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .shot-bar span {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.14);
    }
</style>
