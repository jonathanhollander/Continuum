<script>
    // Pure CSS/SVG spatial background
</script>

<div
    class="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-slate-950"
>
    <!-- Deep Space Gradient base -->
    <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"
    ></div>

    <!-- Horizon Glow -->
    <div
        class="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-indigo-900/10 via-slate-900/0 to-transparent opacity-50"
    ></div>

    <!-- The Grid Floor -->
    <div class="perspective-grid absolute inset-0 opacity-20"></div>

    <!-- Floating Aurora Elements -->
    <div
        class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-drift"
    ></div>
    <div
        class="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px] animate-drift-delayed"
    ></div>
</div>

<style>
    .perspective-grid {
        background-image: linear-gradient(
                to right,
                rgba(99, 102, 241, 0.1) 1px,
                transparent 1px
            ),
            linear-gradient(
                to bottom,
                rgba(99, 102, 241, 0.1) 1px,
                transparent 1px
            );
        background-size: 60px 60px;
        transform: perspective(100vh) rotateX(60deg) translateY(-100px) scale(2);
        transform-origin: center top;
        mask-image: linear-gradient(
            to bottom,
            transparent,
            black 40%,
            transparent
        );
        /* Fade out at top and very bottom */
    }

    @keyframes drift {
        0%,
        100% {
            transform: translate(0, 0);
        }
        50% {
            transform: translate(20px, 40px);
        }
    }
    @keyframes drift-delayed {
        0%,
        100% {
            transform: translate(0, 0);
        }
        50% {
            transform: translate(-30px, -20px);
        }
    }
    .animate-drift {
        animation: drift 20s ease-in-out infinite;
    }
    .animate-drift-delayed {
        animation: drift-delayed 25s ease-in-out infinite reverse;
    }
</style>
