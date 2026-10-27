<script lang="ts">
    import DocumentVault from "$lib/components/archetypes/DocumentVault.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { Files } from "lucide-svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
</script>

<div class="max-w-6xl mx-auto p-8">
    <LivingBlueprintHeader
        title="Document Vault"
        subtitle="Copies, original locations, and review details"
        detailedDescription="Add the documents your family may need, such as a will, trust, deed, or policy. Record the title, where the original is kept, and any signing or review dates. You can attach a digital copy or record the physical location."
        whyMatters="Specific locations and recognizable titles help your family find the intended version. Review dates help you keep the recorded details current."
    />


    <!-- Legal Disclaimer -->
    <div class="mb-8">
        <LegalDisclaimer />
    </div>

    <!-- Concierge Layer -->
    <div class="mb-8">
        <AIPromptBar context="legal_explainer" />
    </div>

    <!-- The Vault -->
    <DocumentVault module={{ id: "legal-vault" }} />
</div>
