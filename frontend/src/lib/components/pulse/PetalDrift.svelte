<script lang="ts">
    import { onMount } from "svelte";

    let canvas: HTMLCanvasElement;
    let particles: Particle[] = [];
    let animationFrame: number;
    let running = false;

    class Particle {
        x: number;
        y: number;
        size: number;
        speedX: number;
        speedY: number;
        rotation: number;
        rotationSpeed: number;
        color: string;
        life: number;
        opacity: number;

        constructor(w: number, h: number) {
            this.x = w / 2;
            this.y = h / 2;
            this.size = Math.random() * 8 + 4; // Organic varied size
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            this.speedX = Math.cos(angle) * speed;
            this.speedY = Math.sin(angle) * speed;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 5;
            // Soft petal colors (Teal, Sage, White, Soft Pink)
            const colors = ["#ccfbf1", "#d1fae5", "#fce7f3", "#ffffff"];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.life = 1.0;
            this.opacity = Math.random() * 0.5 + 0.5;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.speedY += 0.05; // Gravity
            this.speedX *= 0.99; // Air resistance
            this.rotation += this.rotationSpeed;
            this.life -= 0.005; // Decay
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.globalAlpha = this.life * this.opacity;
            ctx.fillStyle = this.color;

            // Draw Organic Peal Shape (roughly oval/teardrop)
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    export function trigger() {
        if (!canvas) return;
        running = true;
        // Spawn particles
        for (let i = 0; i < 60; i++) {
            particles.push(new Particle(canvas.width, canvas.height));
        }
        if (!animationFrame) loop();
    }

    function loop() {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles = particles.filter((p) => p.life > 0);
        particles.forEach((p) => {
            p.update();
            p.draw(ctx);
        });

        if (particles.length > 0) {
            animationFrame = requestAnimationFrame(loop);
        } else {
            running = false;
            animationFrame = 0;
        }
    }

    onMount(() => {
        resize();
        window.addEventListener("resize", resize);
        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrame);
        };
    });

    function resize() {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }
</script>

<canvas bind:this={canvas} class="fixed inset-0 pointer-events-none z-[100]"
></canvas>
