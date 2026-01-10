<script lang="ts">
    import GlobalSetupWizard from "$lib/components/onboarding/GlobalSetupWizard.svelte";
    import { fade } from "svelte/transition";
</script>

<div
    class="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/5"
    in:fade
>
    <GlobalSetupWizard />
</div>
