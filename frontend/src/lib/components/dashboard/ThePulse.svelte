<script lang="ts">
    import { onMount } from "svelte";
    import { quintOut, elasticOut } from "svelte/easing";
    import { fade, scale } from "svelte/transition";

    export let status: "secure" | "active" | "critical" | "standby" = "active";
    export let score: number = 0;

    // Pulse Configuration based on status
    $: config =
        status === "secure"
            ? {
                  color: "bg-emerald-500",
                  glow: "shadow-[0_0_100px_rgba(16,185,129,0.3)]",
                  duration: "duration-[4000ms]",
                  scale: "scale-100",
              }
            : status === "critical"
              ? {
                    color: "bg-rose-500",
                    glow: "shadow-[0_0_120px_rgba(244,63,94,0.5)]",
                    duration: "duration-[1000ms]",
                    scale: "scale-110",
                }
              : status === "standby"
                ? {
                      color: "bg-cyan-400",
                      glow: "shadow-[0_0_80px_rgba(34,211,238,0.4)]",
                      duration: "duration-[5000ms]",
                      scale: "scale-100",
                  }
                : {
                      color: "bg-primary",
                      glow: "shadow-[0_0_100px_rgba(var(--color-primary),0.3)]",
                      duration: "duration-[3000ms]",
                      scale: "scale-105",
                  };
</script>

<div class="relative w-96 h-96 flex items-center justify-center">
    <!-- Outer Atmosphere (Static Glow) -->
    <div
        class="absolute inset-0 rounded-full opacity-20 blur-3xl transition-all ease-in-out {config.duration} {config.color} {config.scale}"
    ></div>

    <!-- The Breathing Layers -->
    <div
        class="absolute w-64 h-64 rounded-full opacity-30 blur-2xl animate-pulse {config.color}"
        style="animation-duration: {status === 'critical' ? '1.5s' : '4s'}"
    ></div>

    <div
        class="absolute w-48 h-48 rounded-full opacity-40 blur-xl animate-pulse delay-75 {config.color}"
        style="animation-duration: {status === 'critical' ? '1.5s' : '4s'}"
    ></div>

    <!-- Core Orb -->
    <div
        class="relative w-32 h-32 rounded-full {config.color} {config.glow} flex items-center justify-center transition-all bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm border border-white/20 z-10"
    >
        <div class="text-white font-bold text-3xl font-serif tracking-tighter">
            {status === "standby" ? "Ready" : `${score}%`}
        </div>
    </div>

    <!-- Orbiting Particles (CSS Animation) -->
    <div class="absolute inset-0 animate-spin-slow opacity-30">
        <div
            class="absolute top-10 left-1/2 w-2 h-2 {config.color} rounded-full blur-[1px]"
        ></div>
        <div
            class="absolute bottom-20 right-1/4 w-1.5 h-1.5 {config.color} rounded-full blur-[1px]"
        ></div>
    </div>
    <div class="absolute inset-0 animate-spin-reverse-slower opacity-20">
        <div
            class="absolute bottom-10 left-1/2 w-3 h-3 {config.color} rounded-full blur-[2px]"
        ></div>
    </div>
</div>

<style>
    @keyframes spin-slow {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    @keyframes spin-reverse-slower {
        from {
            transform: rotate(360deg);
        }
        to {
            transform: rotate(0deg);
        }
    }
    .animate-spin-slow {
        animation: spin-slow 20s linear infinite;
    }
    .animate-spin-reverse-slower {
        animation: spin-reverse-slower 35s linear infinite;
    }
</style>
