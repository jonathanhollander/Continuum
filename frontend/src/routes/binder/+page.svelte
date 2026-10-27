<script lang="ts">
    // The Red Binder: the readable packet, built from the one export snapshot
    // (GET /api/export/snapshot). Print saves it as a PDF; the download copy is a zip
    // with this same packet, the actual files and a manifest.
    import { Printer, Archive, Loader2 } from "lucide-svelte";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import { goto } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";
    import { SvelteMap } from "svelte/reactivity";
    import { captureSession, assertCurrentSession, isCurrentSession, SessionChangedError } from "$lib/services/sessionOwnership";
    import {
        fetchSnapshot,
        buildPacket,
        packetHTML,
        loadAttachmentFiles,
        buildDownloadCopy,
        saveBlob,
        fileCoverage,
        fileCoverageLabel,
        downloadCopyStatus,
        packetRecordId,
        fileFieldLabel,
        type Packet,
        type Snapshot,
    } from "$lib/services/exportService";

    let snapshot = $state<Snapshot | null>(null);
    let packet = $state<Packet | null>(null);
    const files = new SvelteMap<string, Blob>();
    const urls = new SvelteMap<string, string>();
    let loading = $state(true);
    let note = $state<string | null>(null);
    let busy = $state<string | null>(null);
    let downloadNote = $state<string | null>(null);
    let gone = false;
    const coverage = $derived(snapshot && packet ? fileCoverage(snapshot, packet, files) : null);

    let html = $derived(packet ? packetHTML(packet, (a) => urls.get(a.key) ?? null, coverage ?? undefined) : "");

    function showFiles(got: Map<string, Blob>) {
        if (gone) return;
        for (const [key, blob] of got) {
            files.set(key, blob);
            if (!urls.has(key)) urls.set(key, URL.createObjectURL(blob));
        }
    }

    async function load() {
        loading = true;
        note = null;
        downloadNote = null;
        for (const url of urls.values()) URL.revokeObjectURL(url);
        urls.clear();
        files.clear();
        try {
            snapshot = await fetchSnapshot();
            packet = buildPacket(snapshot, "full");
            showFiles(await loadAttachmentFiles(snapshot, packet.attachments, undefined, () => {}, () => {}));
        } catch (e: any) {
            note = e?.message || "Your records are safe in your account. You can gather your binder again whenever you're ready.";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        document.body.classList.add("binder-print");
        load();
    });
    onDestroy(() => {
        gone = true;
        if (typeof document !== "undefined") document.body.classList.remove("binder-print");
        for (const u of urls.values()) URL.revokeObjectURL(u);
    });

    const day = () => new Date().toISOString().slice(0, 10);

    function printBinder() {
        window.print();
    }

    async function retryFile(key: string) {
        if (!snapshot || !packet || busy) return;
        busy = "files";
        try {
            showFiles(await loadAttachmentFiles(snapshot, packet.attachments.filter((a) => a.key === key), undefined, () => {}, () => {}));
            downloadNote = fileCoverageLabel(fileCoverage(snapshot, packet, files));
        } catch (e: any) {
            downloadNote = e instanceof SessionChangedError ? "The account changed. Open the packet from the account you want to use."
                : e?.message || "You can try gathering this file again.";
        } finally {
            busy = null;
        }
    }

    async function downloadCopy() {
        if (!snapshot) return;
        const owner = captureSession();
        busy = "zip";
        try {
            const copy = await buildDownloadCopy(snapshot, (message) => downloadNote = message, files, undefined, owner);
            assertCurrentSession(owner);
            if (gone) return;
            showFiles(files);
            saveBlob(copy, `Continuum_download_copy_${day()}.zip`);
            downloadNote = downloadCopyStatus(fileCoverage(snapshot, packet!, files));
        } catch (e: any) {
            downloadNote = e instanceof SessionChangedError ? "The account changed. Open the packet from the account you want to use."
                : e?.message || "Your binder is right here. You can save a download copy again whenever you're ready.";
        } finally {
            if (isCurrentSession(owner)) showFiles(files);
            busy = null;
        }
    }
</script>

<div class="min-h-screen bg-muted p-8 print:bg-white print:p-0">
    <div class="max-w-4xl mx-auto mb-8 print:hidden">
        <div class="mb-4">
            <h1 class="font-serif font-bold text-3xl text-primary-deep dark:text-primary-hover">The Red Binder</h1>
            <p class="text-muted-foreground">
                Your legacy and practical records, financial history and recorded executor steps, in one place to print or keep.
            </p>
        </div>
        {#if packet && packet.sections.length > 0}
            <div class="flex flex-wrap items-center gap-3">
                <button
                    onclick={printBinder}
                    class="bg-primary-deep hover:bg-primary-deep/90 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    <Printer size={18} /> Print or save as PDF
                </button>
                <button
                    onclick={downloadCopy}
                    disabled={busy !== null}
                    data-testid="download-copy"
                    class="bg-card hover:bg-muted text-primary-deep dark:text-primary-hover border border-border px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-60"
                >
                    {#if busy === "zip"}<Loader2 size={18} class="animate-spin" />{:else}<Archive size={18} />{/if}
                    Download full record and files
                </button>
            </div>
            <p class="mt-3 text-sm text-muted-foreground">The ZIP includes the readable record and available original files. Extract it, open <code>packet.html</code> and keep the <code>files</code> folder beside it. Use <code>packet.pdf</code> for a printable copy; review the file list for anything missing.</p>
        {/if}
    </div>

    {#if note}
        <div class="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-card border border-border text-foreground flex items-center justify-between print:hidden">
            <span>{note}</span>
            <button onclick={load} class="text-primary-deep dark:text-primary-hover font-semibold underline">Try again</button>
        </div>
    {/if}
    {#if downloadNote}
        <p class="max-w-4xl mx-auto mb-6 text-sm text-foreground print:hidden" role="status" data-testid="binder-download-note">{downloadNote}</p>
    {/if}
    {#if !loading && coverage?.issues.length}
        <section class="max-w-4xl mx-auto mb-6 p-5 rounded-xl bg-card border border-border space-y-3 print:hidden" aria-label="Files to revisit" data-testid="binder-file-issues">
            <h2 class="font-semibold">{fileCoverageLabel(coverage)}</h2>
            <ul class="space-y-4">
                {#each coverage.issues as issue (issue.key)}
                    <li class="text-sm space-y-1">
                        <p class="font-semibold">{issue.filename}</p>
                        {#each issue.records as record (`${record.section}:${record.id}:${record.field}`)}
                            <a class="block text-primary-deep dark:text-primary-hover underline" href={`#${packetRecordId(record.section, record.id)}`}>{record.title} · {fileFieldLabel(record.field)}</a>
                        {/each}
                        {#if issue.kind === "retry"}
                            <button onclick={() => retryFile(issue.key)} disabled={busy !== null} class="font-semibold text-primary-deep dark:text-primary-hover underline disabled:opacity-60">Try this file again</button>
                        {:else}
                            <p>The original record names this file. You can review its details in the record.</p>
                        {/if}
                    </li>
                {/each}
            </ul>
        </section>
    {/if}

    <div class="max-w-4xl mx-auto shadow-xl border border-border print:shadow-none print:border-none {!loading && packet && packet.sections.length > 0 ? 'bg-white' : 'bg-card'}">
        {#if loading}
            <div class="p-20 flex items-center justify-center gap-3 text-muted-foreground min-h-[600px]">
                <Loader2 size={22} class="animate-spin" /> Gathering your binder...
            </div>
        {:else if packet && packet.sections.length > 0}
            <!-- packetHTML escapes every recorded value -->
            {@html html}
        {:else if !note}
            <div class="p-20 flex items-center justify-center min-h-[600px]">
                <EmptyStateGuide type="binder" onAdd={() => goto("/")} />
            </div>
        {/if}
    </div>
</div>

<style>
    @media print {
        @page {
            margin: 12mm;
            size: auto;
        }
        :global(body.binder-print) {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        /* The app shell's <main> is a scroll box, which clips a long packet after a
           few printed pages; print the whole packet, without the sidebar and top bar. */
        :global(body.binder-print main) {
            overflow: visible !important;
        }
        :global(body.binder-print aside),
        :global(body.binder-print header) {
            display: none !important;
        }
    }
</style>
