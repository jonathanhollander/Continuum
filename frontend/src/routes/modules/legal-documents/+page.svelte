<script lang="ts">
    import DocumentVault from "$lib/components/archetypes/DocumentVault.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { Files } from "lucide-svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";

    let viewMode = $state<ViewMode>('card');
</script>

<div class="max-w-6xl mx-auto p-8">
    <LivingBlueprintHeader
        title="Document Vault"
        subtitle="The secure home for your legal life"
        tier="legal"
        detailedDescription="A central, secure home for the documents that define your legal and personal wishes. From wills to trusts, ensure the blueprints of your legacy are accessible."
        whyMatters="Searching for a will or trust document can delay estate settlement by months. Centralizing them here provides your family with a clear roadmap when they need it most."
    >
        <svelte:fragment slot="actions">
            <DataViewToggle module="legal-documents" onchange={(mode) => viewMode = mode} />
        </svelte:fragment>
    </LivingBlueprintHeader>

    <!-- Legal Disclaimer -->
    <div class="mb-8">
        <LegalDisclaimer />
    </div>

    <!-- Concierge Layer -->
    <div class="mb-8">
        <AIPromptBar context="legal_explainer" />
    </div>

    <!-- The Vault -->
    <DocumentVault module={{ id: "legal-vault" }} {viewMode} />
</div>
