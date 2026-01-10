<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    export let count = 20;
    export let color = "#4F46E5";

    let particles: {
        id: number;
        x: number;
        y: number;
        size: number;
        vx: number;
        vy: number;
        alpha: number;
    }[] = [];

    onMount(() => {
        for (let i = 0; i < count; i++) {
            particles.push({
                id: i,
                x: 50,
                y: 50,
                size: Math.random() * 8 + 4,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                alpha: 1,
            });
        }

        let frame: number;
        const update = () => {
            particles = particles
                .map((p) => ({
                    ...p,
                    x: p.x + p.vx,
                    y: p.y + p.vy,
                    vy: p.vy + 0.2, // gravity
                    alpha: p.alpha - 0.02,
                }))
                .filter((p) => p.alpha > 0);

            if (particles.length > 0) {
                frame = requestAnimationFrame(update);
            }
        };

        frame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frame);
    });
</script>

<div class="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
    {#each particles as p (p.id)}
        <div
            class="absolute rounded-full"
            style:left="{p.x}%"
            style:top="{p.y}%"
            style:width="{p.size}px"
            style:height="{p.size}px"
            style:background-color={color}
            style:opacity={p.alpha}
            style:transform="translate(-50%, -50%)"
        ></div>
    {/each}
</div>
