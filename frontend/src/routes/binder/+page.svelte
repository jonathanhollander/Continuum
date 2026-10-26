<script lang="ts">
    // The Red Binder: the readable packet, built from the one export snapshot
    // (GET /api/export/snapshot). Print saves it as a PDF; the download copy is a zip
    // with this same packet, the actual files and a manifest.
    import { Printer, FileDown, Archive, Loader2 } from "lucide-svelte";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import { goto } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";
    import {
        fetchSnapshot,
        buildPacket,
        packetHTML,
        createPDFBlob,
        loadAttachmentFiles,
        buildDownloadCopy,
        saveBlob,
        type Packet,
        type Snapshot,
    } from "$lib/services/exportService";

    let snapshot = $state<Snapshot | null>(null);
    let packet = $state<Packet | null>(null);
    let files = $state<Map<string, Blob>>(new Map());
    let urls = $state<Map<string, string>>(new Map());
    let loading = $state(true);
    let note = $state<string | null>(null);
    let busy = $state<string | null>(null);

    let html = $derived(packet ? packetHTML(packet, (a) => urls.get(a.key) ?? null) : "");

    async function load() {
        loading = true;
        note = null;
        try {
            snapshot = await fetchSnapshot();
            packet = buildPacket(snapshot, "full");
            files = await loadAttachmentFiles(snapshot, packet.attachments);
            const next = new Map<string, string>();
            for (const [k, b] of files) next.set(k, URL.createObjectURL(b));
            urls = next;
        } catch (e: any) {
            note = e?.message || "Your binder is taking a moment to gather. You can try again shortly.";
        } finally {
            loading = false;
        }
    }

    onMount(load);
    onDestroy(() => {
        for (const u of urls.values()) URL.revokeObjectURL(u);
    });

    const day = () => new Date().toISOString().slice(0, 10);

    function printBinder() {
        window.print();
    }

    async function downloadPDF() {
        if (!packet) return;
        busy = "pdf";
        try {
            saveBlob(await createPDFBlob("full", true, () => {}, snapshot ?? undefined), `Continuum_binder_${day()}.pdf`);
        } finally {
            busy = null;
        }
    }

    async function downloadCopy() {
        if (!snapshot) return;
        busy = "zip";
        try {
            saveBlob(await buildDownloadCopy(snapshot, () => {}, files), `Continuum_download_copy_${day()}.zip`);
        } catch (e: any) {
            note = e?.message || "The download copy is taking a moment. You can try again shortly.";
        } finally {
            busy = null;
        }
    }
</script>

<div class="min-h-screen bg-stone-100 p-8 print:bg-white print:p-0">
    <div class="max-w-4xl mx-auto mb-8 flex justify-between items-center gap-6 print:hidden">
        <div>
            <h1 class="font-serif font-bold text-3xl text-[#304743]">The Red Binder</h1>
            <p class="text-stone-500">
                Everything you have recorded, in one place to print or keep.
            </p>
        </div>
        {#if packet && packet.sections.length > 0}
            <div class="flex items-center gap-3 shrink-0">
                <button
                    onclick={printBinder}
                    class="bg-[#304743] hover:bg-[#2A3F3B] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    <Printer size={18} /> Print or save as PDF
                </button>
                <button
                    onclick={downloadPDF}
                    disabled={busy !== null}
                    class="bg-white hover:bg-stone-50 text-[#304743] border border-stone-300 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-60"
                >
                    {#if busy === "pdf"}<Loader2 size={18} class="animate-spin" />{:else}<FileDown size={18} />{/if}
                    PDF file
                </button>
                <button
                    onclick={downloadCopy}
                    disabled={busy !== null}
                    data-testid="download-copy"
                    class="bg-white hover:bg-stone-50 text-[#304743] border border-stone-300 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-60"
                >
                    {#if busy === "zip"}<Loader2 size={18} class="animate-spin" />{:else}<Archive size={18} />{/if}
                    Download copy
                </button>
            </div>
        {/if}
    </div>

    {#if note}
        <div class="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-white border border-stone-200 text-stone-700 flex items-center justify-between print:hidden">
            <span>{note}</span>
            <button onclick={load} class="text-[#304743] font-semibold underline">Try again</button>
        </div>
    {/if}

    <div class="max-w-4xl mx-auto bg-white shadow-xl border border-stone-200 print:shadow-none print:border-none">
        {#if loading}
            <div class="p-20 flex items-center justify-center gap-3 text-stone-500 min-h-[600px]">
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
        :global(body) {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        /* The app shell's <main> is a scroll box, which clips a long packet after a
           few printed pages; print the whole packet, without the sidebar and top bar. */
        :global(main) {
            overflow: visible !important;
        }
        :global(aside),
        :global(body header) {
            display: none !important;
        }
    }
</style>
