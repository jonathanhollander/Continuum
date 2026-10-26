<script lang="ts">
    // PDF preview of the packet. Built from the same export snapshot as the binder
    // and the download copy (lib/services/exportService.ts).
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import {
        createPDFBlob,
        fetchSnapshot,
        buildDownloadCopy,
        buildPacket,
        fileCoverage,
        fileCoverageLabel,
        fileFieldLabel,
        packetRecordId,
        downloadCopyStatus,
        saveBlob,
        type FileCoverage,
        type ExportScope,
        type Snapshot,
    } from "$lib/services/exportService";
    import { Download, ArrowLeft, Loader2, Archive } from "lucide-svelte";

    let pdfUrl = $state<string | null>(null);
    let loading = $state(true);
    let progress = $state("Gathering your records...");
    let note = $state<string | null>(null);
    let blob = $state<Blob | null>(null);
    let snapshot = $state<Snapshot | null>(null);
    let packing = $state(false);
    let copyNote = $state<string | null>(null);
    let copyCoverage = $state<FileCoverage | null>(null);
    const copyFiles = new Map<string, Blob>();

    const SCOPE_LABELS: Record<ExportScope, string> = {
        full: "Everything",
        insurance: "Assets and insurance",
        medical: "Medical",
    };

    let scope = $derived(
        (["full", "insurance", "medical"].includes($page.url.searchParams.get("scope") ?? "")
            ? $page.url.searchParams.get("scope")
            : "full") as ExportScope,
    );
    let includeImages = $derived($page.url.searchParams.get("images") === "true");

    async function generate() {
        loading = true;
        note = null;
        copyNote = null;
        copyCoverage = null;
        copyFiles.clear();
        try {
            snapshot = await fetchSnapshot();
            blob = await createPDFBlob(scope, includeImages, (m) => (progress = m), snapshot);
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            pdfUrl = URL.createObjectURL(blob);
        } catch (e) {
            console.error(e);
            note = (e as Error)?.message || "Your records are safe in your account. You can prepare your packet again whenever you're ready.";
        } finally {
            loading = false;
        }
    }

    onMount(generate);
    onDestroy(() => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    });

    const day = () => new Date().toISOString().slice(0, 10);

    function downloadPDF() {
        if (blob) saveBlob(blob, `Continuum_packet_${day()}.pdf`);
    }

    async function downloadCopy() {
        if (!snapshot) return;
        packing = true;
        try {
            const copy = await buildDownloadCopy(snapshot, (m) => (copyNote = m), copyFiles);
            copyCoverage = fileCoverage(snapshot, buildPacket(snapshot, "full"), copyFiles);
            saveBlob(copy, `Continuum_download_copy_${day()}.zip`);
            copyNote = downloadCopyStatus(copyCoverage);
        } catch (e) {
            copyNote = (e as Error)?.message || "Your packet is right here. You can save a download copy again whenever you're ready.";
        } finally {
            packing = false;
        }
    }
</script>

<div class="flex flex-col h-[calc(100vh-5rem)] bg-muted">
    <header class="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div class="flex items-center gap-4">
            <button
                onclick={() => goto("/")}
                class="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                title="Back to Dashboard"
                aria-label="Back to Dashboard"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 class="font-serif text-xl text-foreground">Packet preview</h1>
                <p class="text-xs text-muted-foreground">
                    {SCOPE_LABELS[scope]}{includeImages ? " · with photos" : ""}
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            {#if loading}
                <div class="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 size={16} class="animate-spin" />
                    {progress}
                </div>
            {:else if blob}
                <button
                    onclick={downloadCopy}
                    disabled={packing}
                    class="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-60"
                >
                    {#if packing}<Loader2 size={18} class="animate-spin" />{:else}<Archive size={18} />{/if}
                    {copyCoverage?.issues.length ? "Try files and save copy" : "Download copy"}
                </button>
                <button
                    onclick={downloadPDF}
                    class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-sm"
                >
                    <Download size={18} />
                    Download PDF
                </button>
            {/if}
        </div>
    </header>

    {#if copyNote}
        <section class="bg-card border-b border-border px-6 py-4 max-h-64 overflow-y-auto text-sm space-y-2" data-testid="preview-download-status" aria-label="Download status">
            <p role="status">{copyNote}</p>
            {#if copyCoverage?.issues.length}
                <p class="font-semibold">{fileCoverageLabel(copyCoverage)}</p>
                <ul class="space-y-2">
                    {#each copyCoverage.issues as issue (issue.key)}
                        <li>
                            <p class="font-semibold">{issue.filename}</p>
                            {#each issue.records as record (`${record.section}:${record.id}:${record.field}`)}
                                <a class="block text-primary-hover underline" href={`/binder#${packetRecordId(record.section, record.id)}`}>{record.title} · {fileFieldLabel(record.field)}</a>
                            {/each}
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    {/if}

    <main class="flex-1 relative overflow-hidden">
        {#if loading}
            <div class="absolute inset-0 flex items-center justify-center bg-muted">
                <div class="text-center">
                    <Loader2 size={40} class="animate-spin text-primary mx-auto mb-4" />
                    <p class="text-muted-foreground font-medium">Preparing your packet...</p>
                    <p class="text-muted-foreground text-sm mt-1">The pages are put together here in your browser.</p>
                </div>
            </div>
        {:else if note}
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="bg-card p-8 rounded-xl shadow-lg border border-border max-w-lg text-center">
                    <p class="text-foreground mb-6">{note}</p>
                    <button onclick={generate} class="text-primary-hover font-semibold underline">Try again</button>
                </div>
            </div>
        {:else if pdfUrl}
            <iframe src={pdfUrl} title="PDF Preview" class="w-full h-full border-none"></iframe>
        {/if}
    </main>
</div>
