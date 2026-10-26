<script lang="ts">
    import "../../../app.css";
    import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";
    import { pulse } from "$lib/stores/pulse.svelte";

    // /api/pulse/status sends active | grace | disabled | not_configured (routers/pulse.py get_status)
    function getMeshStatus(status: string) {
        if (status === "active" || status === "grace") return status;
        return "disabled"; // off, or not set up yet
    }
</script>

<div
    class="surface-dark min-h-screen bg-slate-950 text-foreground relative overflow-hidden font-sans"
>
    <!-- Warm Technology Atmosphere -->
    <LivingMesh status={getMeshStatus(pulse.status)} />

    <!-- Content Layer -->
    <div class="relative z-10 transition-colors duration-1000">
        <slot />
    </div>
</div>
