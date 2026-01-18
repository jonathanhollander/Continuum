<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import {
        createPDFBlob,
        type ExportScope,
    } from "$lib/services/exportService";
    import { Download, ArrowLeft, Loader2 } from "lucide-svelte";

    let pdfUrl = $state<string | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let blob = $state<Blob | null>(null);

    // Read params
    let scope = $derived(
        ($page.url.searchParams.get("scope") as ExportScope) || "full",
    );
    let includeImages = $derived(
        $page.url.searchParams.get("images") === "true",
    );

    onMount(async () => {
        try {
            loading = true;
            // Generate the PDF Blob
            blob = await createPDFBlob(scope, includeImages);
            pdfUrl = URL.createObjectURL(blob);
        } catch (e) {
            console.error(e);
            error = (e as Error).message;
        } finally {
            loading = false;
        }
    });

    function downloadPDF() {
        if (!blob || !pdfUrl) return;

        const filename = "Continuum_export.pdf";
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function goBack() {
        goto("/");
    }
</script>

<div class="flex flex-col h-screen bg-slate-50">
    <!-- Header -->
    <header
        class="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10"
    >
        <div class="flex items-center gap-4">
            <button
                onclick={goBack}
                class="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                title="Back to Dashboard"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 class="font-serif text-xl text-slate-800">
                    Export Preview
                </h1>
                <p class="text-xs text-slate-500">
                    Scope: <span class="capitalize">{scope}</span> • Images: {includeImages
                        ? "Yes"
                        : "No"}
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            {#if loading}
                <div class="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 size={16} class="animate-spin" />
                    Generating...
                </div>
            {:else if error}
                <div class="text-red-500 text-sm font-medium">
                    Generation Failed
                </div>
            {:else}
                <button
                    onclick={downloadPDF}
                    class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Download size={18} />
                    Download PDF
                </button>
            {/if}
        </div>
    </header>

    <!-- Content -->
    <main class="flex-1 relative overflow-hidden">
        {#if loading}
            <div
                class="absolute inset-0 flex items-center justify-center bg-slate-50"
            >
                <div class="text-center">
                    <Loader2
                        size={40}
                        class="animate-spin text-emerald-500 mx-auto mb-4"
                    />
                    <p class="text-slate-500 font-medium">
                        Generating your estate report...
                    </p>
                    <p class="text-slate-400 text-sm mt-1">
                        This happens locally in your browser.
                    </p>
                </div>
            </div>
        {:else if error}
            <div class="absolute inset-0 flex items-center justify-center">
                <div
                    class="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-lg text-center"
                >
                    <div class="text-red-500 text-xl font-bold mb-2">
                        Error Generating PDF
                    </div>
                    <p class="text-slate-600 mb-6">{error}</p>
                    <button
                        onclick={goBack}
                        class="text-slate-500 hover:text-slate-800 underline"
                        >Return to Dashboard</button
                    >
                </div>
            </div>
        {:else if pdfUrl}
            <iframe
                src={pdfUrl}
                title="PDF Preview"
                class="w-full h-full border-none"
            ></iframe>
        {/if}
    </main>
</div>
