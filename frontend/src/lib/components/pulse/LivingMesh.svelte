<script lang="ts">
    import { onMount } from "svelte";

    // Props using Svelte 5 $props() rune is simpler if we define it as:
    let { status = "active" } = $props<{
        status?: "active" | "grace" | "alert" | "disabled";
    }>();

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;
    let time = 0;
    let animationFrame: number;

    // Configuration for different states
    const palettes = {
        active: {
            bg: "#0f172a", // Slate 900
            mesh: ["#14b8a6", "#0d9488", "#0f766e"], // Teal 500/600/700
            speed: 0.002,
        },
        grace: {
            bg: "#1e1b4b", // Indigo 950
            mesh: ["#f59e0b", "#d97706", "#b45309"], // Amber 500/600/700
            speed: 0.004,
        },
        alert: {
            bg: "#450a0a", // Red 950
            mesh: ["#f43f5e", "#e11d48", "#be123c"], // Rose 500/600/700
            speed: 0.008,
        },
        disabled: {
            bg: "#18181b", // Zinc 950
            mesh: ["#52525b", "#3f3f46", "#27272a"], // Zinc 600/700/800
            speed: 0.001,
        },
    };

    onMount(() => {
        ctx = canvas.getContext("2d");
        resize();
        window.addEventListener("resize", resize);
        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrame);
        };
    });

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function animate() {
        if (!ctx || !canvas) return;

        const currentPalette = palettes[status] || palettes.active;

        // Clear and fill background
        ctx.fillStyle = currentPalette.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update time
        time += currentPalette.speed;

        // Draw mesh waves
        drawMesh(ctx, canvas.width, canvas.height, currentPalette.mesh, time);

        animationFrame = requestAnimationFrame(animate);
    }

    function drawMesh(
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        colors: string[],
        t: number,
    ) {
        colors.forEach((color, i) => {
            ctx.beginPath();
            ctx.moveTo(0, h);

            for (let x = 0; x <= w; x += 10) {
                // Superposition of sine waves for organic look
                // Different frequencies and amplitudes for each layer
                const y =
                    h / 2 +
                    Math.sin(x * 0.003 + t + i) * 100 +
                    Math.sin(x * 0.01 + t * 2 + i) * 50 +
                    Math.sin(x * 0.005 - t + i) * 20;

                ctx.lineTo(x, y);
            }

            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.15; // Transparency for layering
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        // Add "Digital Dust" particles
        drawDust(ctx, w, h, t);
    }

    // Simple particle system
    function drawDust(
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        t: number,
    ) {
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 30; i++) {
            const x = (i * 137.5 + t * 20) % w; // Pseudo-random positions
            const y = (i * 293.2 + Math.sin(t + i) * 50) % h;
            const size = (Math.sin(t * 3 + i) + 2) * 0.5;

            ctx.globalAlpha = 0.3 * size;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
</script>

<canvas
    bind:this={canvas}
    class="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
></canvas>
