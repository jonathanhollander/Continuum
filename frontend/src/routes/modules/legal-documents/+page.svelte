<script lang="ts">
    import DocumentVault from "$lib/components/archetypes/DocumentVault.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { Files } from "lucide-svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
</script>

<div class="max-w-6xl mx-auto p-8">
    <div class="mb-8">
        <h1
            class="font-serif font-bold text-4xl text-[#304743] flex items-center gap-3"
        >
            <div class="p-3 bg-[#4A7C74]/10 rounded-xl text-[#4A7C74]">
                <Files size={32} />
            </div>
            Document Vault
        </h1>
        <p class="text-muted-foreground mt-2 ml-16 max-w-xl">
            The secure home for your legal life. Organize your Will, Trust, and
            vital records so your family isn't left searching.
        </p>
    </div>

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
