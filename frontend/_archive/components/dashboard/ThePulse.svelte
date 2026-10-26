<script lang="ts">
    import { onMount } from "svelte";
    import { quintOut, elasticOut } from "svelte/easing";
    import { fade, scale } from "svelte/transition";

    export let status: "secure" | "active" | "critical" | "standby" = "active";
    export let score: number = 0;

    // Qualitative state based on progress (Option C)
    // Instead of showing "78%", show meaningful states
    $: qualitativeState = getQualitativeState(score, status);

    function getQualitativeState(score: number, status: string): string {
        if (status === "standby" || score === 0) return "Ready";
        if (score < 25) return "Beginning";
        if (score < 50) return "Growing";
        if (score < 75) return "Building";
        if (score < 90) return "Strong";
        return "Solid";
    }

    // Pulse Configuration based on status. Colours are the app.css tokens; the orb label
    // uses the token's paired text colour (background flips with the theme, as each fill does).
    // "critical" is a gentle "worth a look": the warning tone, no glow, at the same calm pace.
    const glowOf = (token: string, pct: number, px: number) =>
        `box-shadow: 0 0 ${px}px color-mix(in srgb, var(${token}) ${pct}%, transparent)`;
    $: config =
        status === "secure"
            ? {
                  color: "bg-success",
                  text: "text-background",
                  glow: glowOf("--color-success", 30, 100),
                  duration: "duration-[4000ms]",
                  scale: "scale-100",
              }
            : status === "critical"
              ? {
                    color: "bg-warning",
                    text: "text-background",
                    glow: "",
                    duration: "duration-[4000ms]",
                    scale: "scale-100",
                }
              : status === "standby"
                ? {
                      color: "bg-muted-foreground",
                      text: "text-background",
                      glow: glowOf("--color-muted-foreground", 30, 80),
                      duration: "duration-[5000ms]",
                      scale: "scale-100",
                  }
                : {
                      color: "bg-primary",
                      text: "text-primary-foreground",
                      glow: glowOf("--color-primary", 30, 100),
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
        style="animation-duration: 4s"
    ></div>

    <div
        class="absolute w-48 h-48 rounded-full opacity-40 blur-xl animate-pulse delay-75 {config.color}"
        style="animation-duration: 4s"
    ></div>

    <!-- Core Orb -->
    <div
        class="relative w-32 h-32 rounded-full {config.color} flex items-center justify-center transition-all bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm border border-white/20 z-10"
        style={config.glow}
    >
        <div class="{config.text} font-bold text-lg font-serif tracking-tight text-center px-2">
            {qualitativeState}
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
