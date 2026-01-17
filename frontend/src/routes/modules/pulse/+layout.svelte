<script lang="ts">
    import "../../../app.css";
    import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";
    import { pulse } from "$lib/stores/pulse";

    // Map store status to LivingMesh props
    function getMeshStatus(status: string) {
        if (status === "grace_period") return "grace";
        if (status === "active" || status === "disabled") return status; // disabled handled by mesh
        return "alert";
    }
</script>

<div
    class="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans"
>
    <!-- Warm Technology Atmosphere -->
    <LivingMesh status={getMeshStatus($pulse.status)} />

    <!-- Content Layer -->
    <div class="relative z-10 transition-colors duration-1000">
        <slot />
    </div>
</div>
