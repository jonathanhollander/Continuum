<script lang="ts">
    // The recipient's start page (card D2). One component for both the link (/for/<token>)
    // and the owner's preview (/for/preview/<contactId>), so the two always match. Everything
    // comes from the token-scoped snapshot (D1's builder, filtered on the server); files come
    // through the given fetcher, and the download copy is D1's zip built from the same files.
    import { onDestroy, tick, untrack } from "svelte";
    import { slide } from "svelte/transition";
    import { SvelteMap, SvelteSet } from "svelte/reactivity";
    import { Archive, Loader2, Phone, Mail, ChevronDown } from "lucide-svelte";
    import {
        buildPacket,
        packetHTML,
        loadAttachmentFiles,
        buildDownloadCopy,
        saveBlob,
        isExecutorContact,
        fileCoverage,
        fileCoverageLabel,
        downloadCopyStatus,
        packetRecordId,
        fileFieldLabel,
        type SnapshotAttachment,
    } from "$lib/services/exportService";
    import { milestoneLabel } from "$lib/utils/milestones";
    import type { RecipientView } from "$lib/services/recipientService";

    let {
        view,
        fetchBlob,
    }: {
        view: RecipientView;
        fetchBlob: (a: SnapshotAttachment) => Promise<Blob>;
    } = $props();

    const snapshot = $derived(view.snapshot);
    const packet = $derived(buildPacket(view.snapshot, "full"));
    const rows = (k: string): any[] => snapshot.sections[k] ?? [];
    const recipient = $derived(view.recipient);
    const firstName = $derived((recipient.name || "").trim().split(/\s+/)[0] || recipient.name);
    // With no name given, the neutral wording; `OwnerName` opens a sentence (card X144).
    const ownerName = $derived(packet.ownerName || "the person who shared this");
    const OwnerName = $derived(packet.ownerName || "The person who shared this");

    // Files (card X104): each one is fetched when it comes into view (or when the full record or
    // the download copy needs it). Successful bytes are reused; failed reads remain retryable.
    const files = new SvelteMap<string, Blob>();
    const urls = new SvelteMap<string, string>();
    const asked = new Map<string, Promise<void>>();
    const failed = new SvelteSet<string>();
    let gone = false;
    let busy = $state<string | null>(null);
    let downloadNote = $state<string | null>(null);
    let showFull = $state(false);

    const coverage = $derived(fileCoverage(snapshot, packet, files));
    const fileIssues = $derived(coverage.issues.filter((issue) => issue.kind === "reference" || failed.has(issue.key)));
    const liveCoverage = $derived({ ...coverage, issues: fileIssues });

    function showFiles(got: Map<string, Blob>) {
        if (gone) return;
        for (const [key, blob] of got) {
            files.set(key, blob);
            failed.delete(key);
            if (!urls.has(key)) urls.set(key, URL.createObjectURL(blob));
        }
    }

    function want(list: SnapshotAttachment[]): Promise<void> {
        return Promise.all(
            list.map((a) => {
                if (files.has(a.key)) return Promise.resolve();
                let p = asked.get(a.key);
                if (!p) {
                    failed.delete(a.key);
                    p = loadAttachmentFiles(snapshot, [a], fetchBlob, () => {}, (file) => {
                        if (!gone) failed.add(file.key);
                    }).then(showFiles).finally(() => asked.delete(a.key));
                    asked.set(a.key, p);
                }
                return p;
            }),
        ).then(() => {});
    }

    /** Asks for a file once its place on the page is near the screen. */
    function inView(node: HTMLElement, a: SnapshotAttachment) {
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    io.disconnect();
                    want([a]);
                }
            },
            { rootMargin: "200px 0px" },
        );
        io.observe(node);
        return { destroy: () => io.disconnect() };
    }

    $effect(() => {
        if (showFull) untrack(() => want(packet.attachments));
    });
    onDestroy(() => {
        gone = true;
        for (const u of urls.values()) URL.revokeObjectURL(u);
    });

    const byRecord = $derived.by(() => {
        const m = new Map<string, SnapshotAttachment[]>();
        for (const a of snapshot.attachments) {
            for (const r of a.records) {
                const k = `${r.section}:${r.id}`;
                const list = m.get(k) ?? [];
                if (!list.some((file) => file.key === a.key)) list.push(a);
                m.set(k, list);
            }
        }
        return m;
    });
    const filesFor = (section: string, id: any) => byRecord.get(`${section}:${id}`) ?? [];

    // People to reach, in the owner's call order. "Kept private" stays in the full record only.
    const TIERS: Record<string, [number, string]> = {
        "1_Immediate": [1, "First call"],
        "2_SameDay": [2, "Same day"],
        "3_Service": [3, "Extended circle"],
    };
    const people = $derived(
        rows("contacts")
            .filter((c) => c.id !== recipient.id && c.call_tier !== "4_DNR")
            .sort((a, b) => (TIERS[a.call_tier]?.[0] ?? 9) - (TIERS[b.call_tier]?.[0] ?? 9)),
    );
    const firstCalls = $derived(
        people.filter((c) => c.call_tier === "1_Immediate").length
            ? people.filter((c) => c.call_tier === "1_Immediate")
            : people.filter((c) => c.is_emergency_contact),
    );

    const originals = $derived([
        ...rows("documents")
            .filter((d) => d.location || d.location_physical)
            .map((d) => ({ key: `documents:${d.id}`, name: d.name || d.title, kind: d.category, where: d.location || d.location_physical, files: filesFor("documents", d.id) })),
        ...rows("medical_directives")
            .filter((d) => d.location_of_original)
            .map((d) => ({ key: `medical_directives:${d.id}`, name: d.title, kind: "Medical directive", where: d.location_of_original, files: filesFor("medical_directives", d.id) })),
    ]);

    const letters = $derived(rows("letters"));
    // Letters show their title and opening; each opens in full on a click (card U8), so a long
    // shelf of letters stays a calm list and only the open ones are laid out (and fetch files).
    const openLetters = new SvelteSet<string>();
    const OPENING = 240;
    const opening = (text: any) => {
        const t = String(text ?? "").replace(/\s+/g, " ").trim();
        if (t.length <= OPENING) return null;
        const cut = t.slice(0, OPENING);
        const sp = cut.lastIndexOf(" ");
        return `${(sp > OPENING / 2 ? cut.slice(0, sp) : cut).replace(/[\s,;:.]+$/, "")}…`;
    };
    const toggleLetter = (id: any) => {
        const k = String(id);
        if (openLetters.has(k)) openLetters.delete(k);
        else openLetters.add(k);
    };
    const capsules = $derived(rows("time_capsule"));
    const memories = $derived(
        [...rows("visual_memories").map((r) => ({ section: "visual_memories", r, title: r.name, text: r.description })),
         ...rows("family_memories").map((r) => ({ section: "family_memories", r, title: r.title, text: r.desc || r.text }))]
            .map((m) => ({ ...m, files: filesFor(m.section, m.r.id) }))
            .filter((m) => m.files.length > 0),
    );

    const names = (list: any[]) => {
        const n = list.map((c) => c.name).filter(Boolean);
        return n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
    };

    const hasWishes = $derived(
        rows("funeral_data").some((f) => {
            try {
                const w = typeof f.wishes === "string" ? JSON.parse(f.wishes) : f.wishes;
                return w && Object.values(w).some((v) => v !== "" && v !== null && v !== false && !(Array.isArray(v) && v.length === 0));
            } catch {
                return false;
            }
        }),
    );
    const otherExecutors = $derived(packet.executors.filter((n) => n !== recipient.name));
    const pets = $derived(rows("pets"));

    // First steps, from what the owner recorded.
    const steps = $derived.by(() => {
        const out: { title: string; body: string; href?: string }[] = [
            { title: "Take a moment for yourself", body: "There is time. This page stays here for you, and you can come back to it whenever you need." },
        ];
        // "See below" only points at a section this page shows (card G4).
        const toPeople = people.length ? "#people" : undefined;
        if (firstCalls.length)
            out.push({ title: `Let ${names(firstCalls)} know`, body: `${OwnerName} asked that they hear first. Their numbers are below.`, href: toPeople });
        if (recipient.is_executor)
            out.push({ title: "You are named as executor", body: originals.length ? "The originals of the important papers are listed below, with where each one is kept." : "The important papers are in the full record at the end of this page.", href: originals.length ? "#originals" : "#record" });
        else if (otherExecutors.length)
            out.push({ title: `${otherExecutors.join(" and ")} can help with the legal steps`, body: `${OwnerName} named them as executor.`, href: otherExecutors.some((n) => people.some((c) => c.name === n)) ? toPeople : undefined });
        if (hasWishes)
            out.push({ title: packet.ownerName ? `${packet.ownerName}'s final wishes are written down` : "The final wishes are written down", body: "You can read them in the full record at the end of this page.", href: "#record" });
        if (pets.length)
            out.push({ title: `${names(pets)} will need care`, body: "Their routines, food and vet are in the full record.", href: "#record" });
        out.push({ title: "When you feel ready, a funeral home can guide the first arrangements", body: "You can lean on them for the practical steps." });
        return out;
    });

    const html = $derived(showFull ? packetHTML(packet, (a) => urls.get(a.key) ?? null, liveCoverage) : "");

    async function revealRecord(section: string, id: any) {
        showFull = true;
        await tick();
        document.getElementById(packetRecordId(section, id))?.scrollIntoView({ block: "center" });
    }

    const fmtDate = (v: any) => {
        if (!v) return "";
        const d = new Date(String(v).length === 10 ? `${v}T12:00:00` : v);
        return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    async function downloadCopy() {
        busy = "download";
        downloadNote = null;
        try {
            await Promise.all(asked.values());
            const blob = await buildDownloadCopy(snapshot, (m) => (downloadNote = m), files, fetchBlob);
            if (gone) return;
            const safe = (s: string) => s.replace(/[^\w\- ]+/g, "").trim() || "Continuum";
            saveBlob(blob, `${safe(packet.ownerName)} - for ${safe(recipient.name)}.zip`);
            downloadNote = downloadCopyStatus(fileCoverage(snapshot, packet, files));
        } catch {
            downloadNote = "Everything here stays open to read. You can save a copy again whenever you're ready.";
        } finally {
            showFiles(files);
            for (const a of packet.attachments) if (!files.has(a.key)) failed.add(a.key);
            busy = null;
        }
    }
</script>

{#snippet media(list: SnapshotAttachment[])}
    {#if list.length}
        <div class="mt-4 flex flex-col gap-3">
            {#each list as a (a.key)}
                {@const url = urls.get(a.key)}
                <div use:inView={a} class="flex flex-col">
                {#if url && a.mime_type.startsWith("video/")}
                    <!-- Recordings made by family members carry no caption track. -->
                    <!-- svelte-ignore a11y_media_has_caption -->
                    <video src={url} controls preload="metadata" class="w-full max-w-xl rounded-xl bg-black" data-testid="recipient-video"></video>
                {:else if url && a.mime_type.startsWith("audio/")}
                    <audio src={url} controls class="w-full max-w-xl" data-testid="recipient-audio"></audio>
                {:else if url && a.mime_type.startsWith("image/")}
                    <img src={url} alt={a.filename || "Photo"} class="max-w-md max-h-80 rounded-xl object-cover" />
                {:else if url}
                    <a href={url} download={a.filename} target="_blank" rel="noopener" class="text-primary-deep underline text-sm">Open {a.filename || "this file"}</a>
                {:else if failed.has(a.key)}
                    <div class="text-sm text-slate-600 space-y-2" role="status" data-testid="recipient-file-retry">
                        <p>{a.filename || "This file"} · Ready to try again</p>
                        <button onclick={() => want([a])} class="text-primary-deep underline font-semibold">Try this file again</button>
                    </div>
                {:else}
                    <span class="text-sm text-slate-500 inline-flex items-center gap-2 {a.mime_type.startsWith("image/") || a.mime_type.startsWith("video/") ? 'min-h-48' : ''}"><Loader2 class="w-4 h-4 animate-spin" /> Opening {a.filename || "this file"}…</span>
                {/if}
                </div>
            {/each}
        </div>
    {/if}
{/snippet}

<div class="min-h-screen bg-[#FAF8F5] text-slate-800" data-testid="recipient-page">
    {#if view.preview}
        <div class="bg-primary-deep text-white text-sm text-center py-2.5 px-4" data-testid="recipient-preview-banner">
            Your preview: this is the page {recipient.name} sees.
        </div>
    {/if}

    <main class="max-w-4xl mx-auto px-8 py-16 space-y-14">
        <header class="space-y-4">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-deep">For {recipient.name}</p>
            <h1 class="font-serif text-5xl leading-tight text-primary-deep" data-testid="recipient-owner">From {ownerName}</h1>
            <div class="w-24 h-2 bg-gold rounded-full"></div>
            <p class="text-lg text-slate-600 max-w-2xl leading-relaxed">
                {OwnerName} gathered these things for you, {firstName}. Take whatever you need, in your own time.
            </p>
        </header>

        {#if view.note}
            <section class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm" data-testid="recipient-note">
                <h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">A note for you</h2>
                <p class="font-serif text-xl leading-relaxed whitespace-pre-wrap">{view.note}</p>
            </section>
        {/if}

        <section data-testid="recipient-steps">
            <h2 class="font-serif text-3xl text-primary-deep mb-6">The first steps</h2>
            <ol class="space-y-3">
                {#each steps as s, i}
                    <li class="flex gap-4 bg-white rounded-2xl border border-slate-200 p-5">
                        <span class="shrink-0 w-8 h-8 rounded-full bg-primary-deep/10 text-primary-deep font-bold flex items-center justify-center">{i + 1}</span>
                        <div>
                            <p class="font-semibold text-slate-800">{s.title}</p>
                            <p class="text-slate-600 text-sm mt-1">{s.body}{#if s.href}<a href={s.href} class="ml-1 text-primary-deep underline">See below</a>{/if}</p>
                        </div>
                    </li>
                {/each}
            </ol>
        </section>

        {#if people.length}
            <section id="people" data-testid="recipient-contacts">
                <h2 class="font-serif text-3xl text-primary-deep mb-6">People to reach</h2>
                <div class="grid grid-cols-2 gap-4">
                    {#each people as c (c.id)}
                        <article class="bg-white rounded-2xl border border-slate-200 p-5" data-contact={c.id}>
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <p class="font-semibold text-lg">{c.name}</p>
                                    <p class="text-sm text-slate-500">{[c.relation, c.role, isExecutorContact(c, snapshot.owner?.executor_name) && String(c.role ?? "").trim().toLowerCase() !== "executor" ? "Executor" : ""].filter(Boolean).join(" · ")}</p>
                                </div>
                                {#if TIERS[c.call_tier]}
                                    <span class="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gold/15 text-[#7a6420]">{TIERS[c.call_tier][1]}</span>
                                {/if}
                            </div>
                            <div class="mt-3 space-y-1 text-sm">
                                {#if c.phone}<a href={`tel:${c.phone}`} class="flex items-center gap-2 text-primary-deep"><Phone class="w-4 h-4" />{c.phone}</a>{/if}
                                {#if c.email}<a href={`mailto:${c.email}`} class="flex items-center gap-2 text-primary-deep"><Mail class="w-4 h-4" />{c.email}</a>{/if}
                            </div>
                            {#if c.notes}<p class="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{c.notes}</p>{/if}
                        </article>
                    {/each}
                </div>
            </section>
        {/if}

        {#if originals.length}
            <section id="originals" data-testid="recipient-originals">
                <h2 class="font-serif text-3xl text-primary-deep mb-6">Where the originals are kept</h2>
                <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                    {#each originals as d (d.key)}
                        <div class="p-5 grid grid-cols-[1fr_1.4fr] gap-6" data-record={d.key}>
                            <div>
                                <p class="font-semibold">{d.name}</p>
                                {#if d.kind}<p class="text-sm text-slate-500">{d.kind}</p>{/if}
                            </div>
                            <div>
                                <p class="text-slate-700">{d.where}</p>
                                {@render media(d.files)}
                            </div>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

        {#if letters.length}
            <section data-testid="recipient-letters">
                <h2 class="font-serif text-3xl text-primary-deep mb-6">{letters.length === 1 ? "A letter for you" : "Letters for you"}</h2>
                <div class="space-y-6">
                    {#each letters as l (l.id)}
                        {@const short = opening(l.content)}
                        {@const open = !short || openLetters.has(String(l.id))}
                        <article class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm" data-letter={l.id}>
                            <h3 class="font-serif text-2xl text-slate-800">{l.title}</h3>
                            <p class="text-sm text-slate-500 mt-1">
                                {[l.date ? `Written ${fmtDate(l.date)}` : "", l.triggerMilestone ? `For ${milestoneLabel(l.triggerMilestone)}` : l.triggerDate ? `For ${fmtDate(l.triggerDate)}` : ""].filter(Boolean).join(" · ")}
                            </p>
                            {#if open}
                                <p class="font-serif text-lg leading-relaxed whitespace-pre-wrap mt-6" data-testid="letter-content">{l.content}</p>
                                {@render media(filesFor("letters", l.id))}
                            {:else}
                                <p class="font-serif text-lg leading-relaxed text-slate-600 mt-6" data-testid="letter-opening">{short}</p>
                            {/if}
                            {#if short}
                                <button
                                    onclick={() => toggleLetter(l.id)}
                                    aria-expanded={open}
                                    class="mt-4 text-sm font-semibold text-primary-deep underline underline-offset-4 hover:opacity-80"
                                    data-testid="letter-toggle"
                                >{open ? "Fold the letter away" : "Read the letter"}</button>
                            {/if}
                        </article>
                    {/each}
                </div>
            </section>
        {/if}

        {#if capsules.length}
            <section data-testid="recipient-capsules">
                <h2 class="font-serif text-3xl text-primary-deep mb-6">Time capsule messages</h2>
                <div class="space-y-6">
                    {#each capsules as m (m.id)}
                        <article class="bg-white rounded-2xl border border-slate-200 p-8" data-capsule={m.id}>
                            <h3 class="font-serif text-2xl">{m.title}</h3>
                            <p class="text-sm text-slate-500 mt-1">
                                {m.trigger_type === "milestone" ? `For ${milestoneLabel(m.trigger_value)}` : m.trigger_value ? `Opened ${fmtDate(m.trigger_value)}` : ""}
                            </p>
                            {#if m.content_preview}<p class="font-serif text-lg leading-relaxed whitespace-pre-wrap mt-5">{m.content_preview}</p>{/if}
                            {@render media(filesFor("time_capsule", m.id))}
                        </article>
                    {/each}
                </div>
            </section>
        {/if}

        {#if memories.length}
            <section data-testid="recipient-memories">
                <h2 class="font-serif text-3xl text-primary-deep mb-6">Photos and recordings</h2>
                <div class="grid grid-cols-2 gap-4">
                    {#each memories as m (m.section + m.r.id)}
                        <article class="bg-white rounded-2xl border border-slate-200 p-5">
                            <p class="font-semibold">{m.title}</p>
                            {#if m.text}<p class="text-sm text-slate-600 mt-1">{m.text}</p>{/if}
                            {@render media(m.files)}
                        </article>
                    {/each}
                </div>
            </section>
        {/if}

        <section id="record" class="bg-white rounded-2xl border border-slate-200 p-8 space-y-5" data-testid="recipient-record">
            <h2 class="font-serif text-3xl text-primary-deep">The full record</h2>
            <p class="text-slate-600 leading-relaxed">
                Everything {ownerName} recorded, in one place: accounts, property, insurance, documents, wishes and more.
                The copy holds the recorded details and the files gathered for it, with a file list.
            </p>
            <div class="flex flex-wrap gap-3">
                <button
                    onclick={() => (showFull = !showFull)}
                    class="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-primary-deep/30 text-primary-deep font-semibold hover:bg-primary-deep/5"
                    data-testid="recipient-show-record"
                >
                    <ChevronDown class="w-4 h-4 transition-transform {showFull ? 'rotate-180' : ''}" />
                    {showFull ? "Fold the full record away" : "Read the full record"}
                </button>
                <button
                    onclick={downloadCopy}
                    disabled={busy !== null}
                    class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-deep text-white font-semibold hover:opacity-90 disabled:opacity-60"
                    data-testid="recipient-download"
                >
                    {#if busy}<Loader2 class="w-4 h-4 animate-spin" />{:else}<Archive class="w-4 h-4" />{/if}
                    Save a copy to keep
                </button>
            </div>
            {#if downloadNote}<p class="text-sm text-slate-600" role="status" data-testid="recipient-download-note">{downloadNote}</p>{/if}
            {#if fileIssues.length}
                <div class="rounded-xl border border-slate-200 p-4 space-y-3 text-sm text-slate-600" data-testid="recipient-file-issues">
                    <p class="font-semibold">{fileCoverageLabel(coverage)}</p>
                    <h3 class="font-semibold">Files to revisit</h3>
                    <ul class="space-y-4">
                        {#each fileIssues as issue (issue.key)}
                            <li class="space-y-1">
                                <p class="font-semibold text-slate-800">{issue.filename}</p>
                                {#each issue.records as record (`${record.section}:${record.id}:${record.field}`)}
                                    <button onclick={() => revealRecord(record.section, record.id)} class="block text-primary-deep underline text-left">
                                        {record.title} · {fileFieldLabel(record.field)}
                                    </button>
                                {/each}
                                {#if issue.kind === "retry"}
                                    <button onclick={() => want(packet.attachments.filter((a) => a.key === issue.key))} class="text-primary-deep underline font-semibold">Try this file again</button>
                                {:else}
                                    <p>The original record names this file. You can review its details in the record.</p>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
            {#if showFull}
                <div transition:slide class="border-t border-slate-100 pt-4 -mx-8" data-testid="recipient-packet">
                    {@html html}
                </div>
            {/if}
        </section>

        <footer class="text-center text-sm text-slate-600 pt-6">
            Kept with care by Continuum for {ownerName}.
        </footer>
    </main>
</div>
