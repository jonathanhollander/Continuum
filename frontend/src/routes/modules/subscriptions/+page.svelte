<script lang="ts">
    import { formSaveAttempt } from "$lib/utils/formSaveAttempt";
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { focusTrap } from "$lib/actions/focusTrap";
    import { readCustom } from "$lib/utils/customFields";
    import {
        Receipt,
        Plus,
        CircleAlert,
        TrendingUp,
        Filter,
        X,
        Pencil,
        Loader2,
        Sparkles,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import SubscriptionRow from "$lib/components/modules/subscriptions/SubscriptionRow.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import { onMount, onDestroy, tick } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { auth } from "$lib/stores/auth";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { fade, scale } from "svelte/transition";
    import { FileText, Download, Printer } from "lucide-svelte";
    import type { SyncManager } from "$lib/services/sync.svelte";
    import { subscriptionsSync } from "$lib/stores/subscriptionStore.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import { formatMoney } from "$lib/utils/money";
    import { subscriptionAmounts } from "$lib/utils/subscriptionAmounts";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    type Subscription = {
        id: string;
        name: string;
        cost: number;
        cycle: "Monthly" | "Yearly";
        paymentMethod: string;
        nextBilling: string;
        difficulty: "Easy" | "Medium" | "Hard";
        cancellationInstructions: string;
        loginUrl?: string;
        notes?: string;
        // false once the subscription is closed: it stays listed and leaves the totals.
        auto_renew?: boolean;
        custom_attributes?: string;
    };

    let parsedCustomAttributes = $state<Record<string, any>>({});

    // One owner for 'subscriptions': the store (its mapper normalizes id, auto_renew, paymentMethod).
    const subscriptionSync = subscriptionsSync as unknown as SyncManager<Subscription>;
    let subscriptions = $derived(subscriptionSync.items);
    let isLoading = $state(true);

    // Filter: narrow the list to one cancellation difficulty (the words each row already shows).
    let showDifficultyFilter = $state(false);
    let difficultyFilter = $state<Subscription["difficulty"] | null>(null);
    const difficultyOrder: Subscription["difficulty"][] = ["Easy", "Medium", "Hard"];
    let difficultyChoices = $derived(
        difficultyOrder.filter((d) => subscriptions.some((s) => s.difficulty === d)),
    );
    let shownSubscriptions = $derived(
        difficultyFilter && difficultyChoices.includes(difficultyFilter)
            ? subscriptions.filter((s) => s.difficulty === difficultyFilter) : subscriptions,
    );
    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('subscriptions'));

    onMount(async () => {
        await subscriptionSync.init();
        isLoading = false;
    });

    let showAddForm = $state(false);
    let exampleDraft = $state(false);
    let newSub = $state<Partial<Subscription> & { id?: string }>({
        difficulty: "Easy",
        cycle: "Monthly",
        cost: undefined,
        auto_renew: true,
    });
    const isClosed = (s: Partial<Subscription>) => s.auto_renew === false;
    let activeSubscriptions = $derived(subscriptions.filter((s) => !isClosed(s)));

    let selectedSubForLetter = $state<Subscription | null>(null);
    let showLetterModal = $state(false);
    let customLetterContent = $state("");
    let letterSigner = $state("");
    let letterCapacity = $state("");
    let letterOwner = captureSession();
    let letterGeneration = 0;
    let pdfJob: symbol | null = null;
    let pdfBusy = $state(false);
    function retireLetterPDF() {
        letterGeneration += 1;
        pdfJob = null;
        pdfBusy = false;
    }
    onDestroy(retireLetterPDF);
    $effect(() => {
        $auth;
        if (showLetterModal && !isCurrentSession(letterOwner)) closeLetterModal();
    });

    function generateDefaultLetter(sub: Subscription) {
        return `
            <p>Dear Customer Service Team,</p>
            
            <p>I am contacting you about the <strong>${esc(sub.name)}</strong> service recorded for <strong>${esc($estateProfile.ownerName || "[Account holder]")}</strong>.</p>
            
            <p><strong>Account Details:</strong></p>
            <ul>
                <li>Service: ${esc(sub.name)}</li>
                ${$estateProfile.legalAddress ? `<li>Billing Address: ${esc($estateProfile.legalAddress)}</li>` : ""}
                <li>Identifying reference: [Add the reference the provider requests]</li>
            </ul>

            <p>Please tell me the process and documents needed to close this service, and confirm any remaining charges, renewal dates or refund questions.</p>
            <p>My relationship or authority to make this enquiry: [Describe your actual role and any documents you can provide].</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
        `;
    }

    // onMount removed (SyncManager handles loading)

    // save() removed (SyncManager handles persistence)

    const saveAttempt = formSaveAttempt(subscriptionSync);

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function saveSubscription() {
        if (saving) return;
        saving = true;
        try {
            await saveSubscriptionOnce();
        } finally {
            saving = false;
        }
    }

    async function saveSubscriptionOnce() {
        if (!newSub.name) return;
        const form = newSub;
        const fields = JSON.stringify([form, parsedCustomAttributes]);
        const ownerName = $estateProfile.ownerName || "User";
        const id = form.id;
        const payload = {
            name: form.name, cost: Number(form.cost) || 0, cycle: form.cycle || "Monthly",
            paymentMethod: form.paymentMethod || "", nextBilling: form.nextBilling || "",
            difficulty: form.difficulty || "Medium", cancellationInstructions: form.cancellationInstructions || "",
            loginUrl: form.loginUrl || "", notes: form.notes || "", auto_renew: !isClosed(form),
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };
        try {
            await saveAttempt(form, payload, (saved) => {
                activityLog.logEvent({
                    module: "Subscriptions", action: id ? "UPDATE" : "CREATE", entityType: "Subscription",
                    entityId: saved.id, entityName: saved.name, userContext: ownerName,
                });
                if (newSub !== form) return;
                if (JSON.stringify([form, parsedCustomAttributes]) === fields) resetForm();
                else newSub.id = saved.id;
            }, id);
        } catch {
            // The captured attempt stays available through Try Again.
        }
    }

    function editSubscription(sub: Subscription) {
        exampleDraft = false;
        newSub = { ...sub };
        parsedCustomAttributes = readCustom(sub);
        showAddForm = true;
    }

    function resetForm() {
        exampleDraft = false;
        showAddForm = false;
        newSub = {
            id: undefined,
            difficulty: "Easy",
            cycle: "Monthly",
            cost: undefined,
            name: "",
            paymentMethod: "",
            nextBilling: "",
            cancellationInstructions: "",
            loginUrl: "",
            notes: "",
            auto_renew: true,
        };
        parsedCustomAttributes = {};
    }

    async function removeSubscription(id: string) {
        if (
            !(await askConfirm(
                "Remove this subscription? This detail can always be added back later.",
            ))
        )
            return;
        const sub = subscriptions.find((s) => s.id === id);

        await subscriptionSync.delete(id);

        // Log DELETE only if the item is really gone (the manager rolls back and shows its message on failure)
        if (sub && !subscriptionSync.items.some((s) => s.id === id)) {
            activityLog.logEvent({
                module: "Subscriptions",
                action: "DELETE",
                entityType: "Subscription",
                entityId: id,
                entityName: sub.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }
    }

    function openLetterModal(sub: Subscription) {
        retireLetterPDF();
        selectedSubForLetter = sub;
        letterOwner = captureSession();
        letterSigner = letterCapacity = "";
        customLetterContent = generateDefaultLetter(sub);
        showLetterModal = true;

        // Log EXPORT
        activityLog.logEvent({
            module: "Subscriptions",
            action: "EXPORT",
            entityType: "Cancellation Letter",
            entityId: sub.id,
            entityName: `${sub.name} Cancellation Letter`,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    function resetLetter() {
        if (selectedSubForLetter) {
            retireLetterPDF();
            letterSigner = letterCapacity = "";
            customLetterContent = generateDefaultLetter(selectedSubForLetter);
        }
    }

    function closeLetterModal() {
        retireLetterPDF();
        showLetterModal = false;
        selectedSubForLetter = null;
        customLetterContent = letterSigner = letterCapacity = "";
    }

    // The letter body as written in the modal (edits included); the rest is the same text the sheet shows.
    let letterBody = $state<HTMLDivElement | null>(null);
    const esc = (v: string) =>
        v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    function letterParts(sub: Subscription) {
        return {
            date: `Date: ${new Date().toLocaleDateString()}`,
            to: `To: ${sub.name} Billing Department`,
            subject: `Subject: Subscription closure enquiry - ${sub.name}`,
            signer: letterSigner.trim() || "[Your name]",
            role: letterCapacity.trim() || "[Your relationship or authority, if applicable]",
        };
    }

    // Print: the letter alone, in a hidden frame, through the browser's own print dialog.
    function printLetter() {
        const sub = selectedSubForLetter;
        if (!sub) return;
        const l = letterParts(sub);
        document.getElementById("letter-print-frame")?.remove();
        const frame = document.createElement("iframe");
        frame.id = "letter-print-frame";
        frame.setAttribute("aria-hidden", "true");
        frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
        frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sub.name)} closure enquiry</title><style>
            @page { margin: 1in; }
            body { font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.5; color: #1e293b; margin: 0; }
            p { margin: 0 0 0.8em; } ul { margin: 0 0 0.8em; padding-left: 1.4em; }
            .bold { font-weight: bold; } .head p { margin: 0; } .head { margin-bottom: 2em; }
            .sig { margin-top: 2.5em; } .sig p { margin: 0; } .line { width: 12em; height: 3em; border-bottom: 1px solid #94a3b8; margin-bottom: 0.3em; }
            .role { font-size: 10pt; font-style: italic; color: #64748b; }
        </style></head><body>
            <div class="head"><p class="bold">${esc(l.date)}</p><p>${esc(l.to)}</p></div>
            <p class="bold">${esc(l.subject)}</p>
            ${letterBody?.innerHTML ?? customLetterContent}
            <div class="sig"><p>Sincerely,</p><div class="line"></div><p class="bold">${esc(l.signer)}</p><p class="role">${esc(l.role)}</p></div>
        </body></html>`;
        frame.onload = () => {
            frame.contentWindow?.focus();
            frame.contentWindow?.print();
        };
        document.body.appendChild(frame);
    }

    // Download PDF: the same letter as a PDF file, written with the jsPDF library the export packet uses.
    async function downloadLetterPDF() {
        const sub = selectedSubForLetter;
        if (!sub || !showLetterModal || pdfBusy || !isCurrentSession(letterOwner)) return;
        const owner = captureSession();
        const generation = letterGeneration;
        const job = Symbol();
        // Capture the requested draft before loading modules/fonts. New typing stays on screen.
        const l = letterParts(sub);
        const body = (letterBody?.innerText ?? "").split(/\n+/).map((t) => t.trim()).filter(Boolean);
        const file = `${sub.name || "Subscription"} closure enquiry`.replace(/[\\/:*?"<>|]+/g, " ").trim();
        pdfJob = job;
        pdfBusy = true;
        const current = () => pdfJob === job && generation === letterGeneration
            && showLetterModal && selectedSubForLetter === sub && isCurrentSession(owner);
        try {
            const [{ createUnicodePDF, PDF_FONT, splitPDFText, writePDFLine }, { saveBlob }] = await Promise.all([
                import("$lib/services/unicodePDF"),
                import("$lib/services/exportService"),
            ]);
            if (!current()) return;
            const doc = await createUnicodePDF();
            if (!current()) return;
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            const M = 72;
            let y = M;
            const write = (s: string, opts: { bold?: boolean; italic?: boolean; size?: number; gap?: number } = {}) => {
                const size = opts.size ?? 11;
                doc.setFont(PDF_FONT, opts.bold ? "bold" : opts.italic ? "italic" : "normal");
                doc.setFontSize(size);
                const lh = size * 1.45;
                for (const line of splitPDFText(doc, s, W - 2 * M)) {
                    if (y + lh > H - M) { doc.addPage(); y = M; }
                    writePDFLine(doc, line, M, y + size, W - 2 * M);
                    y += lh;
                }
                y += opts.gap ?? 0;
            };
            write(l.date, { bold: true });
            write(l.to, { gap: 20 });
            write(l.subject, { bold: true, gap: 10 });
            for (const para of body) write(para, { gap: 6 });
            y += 18;
            write("Sincerely,", { gap: 30 });
            doc.setDrawColor(148, 163, 184);
            doc.line(M, y, M + 170, y);
            y += 6;
            write(l.signer, { bold: true });
            write(l.role, { italic: true, size: 9 });
            if (!current()) return;
            saveBlob(doc.output("blob"), `${file}.pdf`);
        } finally {
            if (pdfJob === job) {
                pdfJob = null;
                pdfBusy = false;
            }
        }
    }

    // Derived stats
    let totals = $derived(subscriptionAmounts(activeSubscriptions));
    let totalMonthly = $derived(totals.monthly);
    let totalYearly = $derived(totals.yearly);
</script>

<LivingBlueprintHeader
    title="Subscriptions & Services"
    subtitle="Keep recurring charges in view for your family"
    detailedDescription="Record recurring services, their billing details and provider instructions. Use Notes to explain which services you would like your family to continue, review or close."
    whyMatters="A useful service record identifies the provider, how it is paid, the next billing date and whom to ask about current cancellation or renewal requirements."
>
    <div class="flex items-center gap-4">
        <DataViewToggle module="subscriptions" />
        <button
            class="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-sm group"
            onclick={() => (showAddForm = true)}
        >
            <Plus class="w-4 h-4 group-hover:scale-110 transition-transform" />
            Record a service
        </button>
    </div>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div
    class="container mx-auto px-8 py-8 space-y-8 animate-in fade-in duration-500"
>

    <!-- AI Concierge Drafting Assistant -->
    <p class="text-sm text-muted-foreground">Describe one service for help organizing its details or drafting an enquiry. Review the wording, then add it to the record or correspondence you prepare.</p>
    <AIPromptBar
        context="subscriptions"
        promptSource="routes/modules/subscriptions/+page.svelte:prompts"
    />

    <!-- Content -->
    {#if subscriptions.length === 0}
        <EmptyState
            title="Gather your recurring charges"
            whyMatters="Start with a service shown on a current bill or statement. Record how it is paid, where the provider instructions are kept, and whether your family should continue, review or close it."
            encouragement="Start with the obvious ones—Netflix, Spotify, your gym. You can add others as you remember them."
            icon={Receipt}
            iconClass="text-muted-foreground"
            ctaLabel="Document first subscription"
            onAction={() => (showAddForm = true)}
        />

        <!-- Sample Data GhostRows -->
        <div class="mt-8">
            <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Examples open a blank service record for your own details</p>
            <div class="space-y-3">
                {#each getSmartSamples($language).subscriptions || [] as sample}
                    <GhostRow
                        name={sample.name}
                        subtitle={`${sample.category} - ${sample.cycle}`}
                        type="Subscription"
                        value={sample.cost}
                        onClick={() => {
                            exampleDraft = true;
                            newSub = { ...newSub, cycle: newSub.name ? newSub.cycle : sample.cycle as "Monthly" | "Yearly" };
                            showAddForm = true;
                        }}
                    >
                        {#snippet icon()}
                            <Receipt size={20} class="text-muted-foreground" />
                        {/snippet}
                    </GhostRow>
                {/each}
            </div>
        </div>
    {:else}
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
                class="bg-card p-5 rounded-2xl border border-border shadow-sm"
            >
                <div
                    class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1"
                >
                    Monthly total
                </div>
                <div class="text-2xl font-bold text-foreground">
                    {formatMoney(totalMonthly)}
                </div>
            </div>
            <div
                class="bg-card p-5 rounded-2xl border border-border shadow-sm"
            >
                <div
                    class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1"
                >
                    Annual Impact
                </div>
                <div class="text-2xl font-bold text-foreground">
                    {formatMoney(totalYearly)}
                </div>
            </div>
            <div
                class="bg-background p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4"
            >
                <div class="p-3 bg-card rounded-full text-primary shadow-sm">
                    <TrendingUp class="w-6 h-6" />
                </div>
                <div>
                    <div class="text-sm text-foreground font-medium">
                        A gentle reminder
                    </div>
                    <div class="text-xs text-muted-foreground">
                        A yearly look keeps these amounts current.
                    </div>
                </div>
            </div>
        </div>

        <!-- Main List -->
        <div class="space-y-4">
            <div
                class="flex items-center justify-between pb-2 border-b border-border"
            >
                <h2 class="font-bold text-foreground flex items-center gap-2">
                    Recurring Charges
                    <span
                        class="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs"
                        >{subscriptions.length}</span
                    >
                </h2>
                <div class="flex items-center gap-2">
                    {#if showDifficultyFilter}
                        {#each difficultyChoices as diff (diff)}
                            <button type="button"
                                onclick={() => (difficultyFilter = difficultyFilter === diff ? null : diff)}
                                aria-pressed={difficultyFilter === diff}
                                class="px-2.5 py-1 rounded-full text-xs font-bold border transition-colors {difficultyFilter === diff
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-card text-muted-foreground border-border hover:text-foreground'}"
                            >
                                {diff}
                            </button>
                        {/each}
                    {/if}
                    <button
                        aria-label="Filter"
                        aria-expanded={showDifficultyFilter}
                        onclick={() => {
                            showDifficultyFilter = !showDifficultyFilter;
                            if (!showDifficultyFilter) difficultyFilter = null;
                        }}
                        class="{showDifficultyFilter || difficultyFilter ? 'text-primary' : 'text-muted-foreground'} hover:text-muted-foreground"
                    >
                        <Filter class="w-4 h-4" />
                    </button>
                </div>
            </div>

            {#if viewMode === 'card'}
                {#each shownSubscriptions as sub (sub.id)}
                    <div class="relative group">
                        <SubscriptionRow
                            {sub}
                            onGenerateLetter={() => openLetterModal(sub)}
                        />
                        <div
                            class="absolute top-3 right-2 flex gap-1 bg-card/50 backdrop-blur-sm rounded-full p-1"
                        >
                            <button
                                onclick={() => editSubscription(sub)}
                                class="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-full transition-colors"
                                title="Edit"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onclick={() => removeSubscription(sub.id)}
                                class="p-1.5 hover:bg-danger-soft text-muted-foreground hover:text-danger rounded-full transition-colors"
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                {/each}
            {:else}
                <!-- Table View -->
                <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-background border-b border-border">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Service</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Cost</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Cycle</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Difficulty</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Payment</th>
                                <th class="px-4 py-3 text-right text-xs font-bold uppercase text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                            {#each shownSubscriptions as sub (sub.id)}
                                <tr class="hover:bg-background transition-colors group">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                                <Receipt size={16} />
                                            </div>
                                            <span class="font-medium text-foreground">{sub.name}</span>
                                            {#if isClosed(sub)}
                                                <span class="text-xs font-medium px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">Closed</span>
                                            {/if}
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-muted-foreground font-medium">
                                        {formatMoney(sub.cost)}
                                    </td>
                                    <td class="px-4 py-3 text-sm text-muted-foreground">{sub.cycle}</td>
                                    <td class="px-4 py-3">
                                        {#if sub.difficulty}
                                            <span class="text-xs font-medium px-2 py-1 rounded-lg {
                                                sub.difficulty === 'Easy' ? 'bg-success/10 text-success' :
                                                sub.difficulty === 'Medium' ? 'bg-warning-soft text-warning' :
                                                'bg-muted text-foreground'
                                            }">
                                                {sub.difficulty}
                                            </span>
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">
                                        {sub.paymentMethod || '-'}
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <div class="flex items-center justify-end gap-2 transition-opacity">
                                            <button
                                                onclick={() => openLetterModal(sub)}
                                                class="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                                title="Generate Letter"
                                            >
                                                <FileText size={14} />
                                            </button>
                                            <button aria-label="Edit these details"
                                                onclick={() => editSubscription(sub)}
                                                class="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button aria-label="Remove this item"
                                                onclick={() => removeSubscription(sub.id)}
                                                class="p-1.5 text-muted-foreground hover:text-danger transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}

        </div>
    {/if}

    <!-- Add Form Modal -->
    {#if showAddForm}
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: resetForm }}
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
            <div
                class="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
                <div
                    class="p-6 border-b border-border bg-background flex justify-between items-start shrink-0"
                >
                    <div class="flex-1 pr-4">
                        <h3
                            class="font-serif font-bold text-2xl text-foreground"
                        >
                            {newSub.id
                                ? "Update Subscription"
                                : "Track a Recurring Charge"}
                        </h3>
                        <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
                            Record the current bill or provider details. Use Notes for your wish about continuing, reviewing or closing this service.
                            {#if exampleDraft}<span class="block mt-2 text-primary-hover" role="status">Example starting point: enter your own service name, amount and billing details. Your entered words stay in the form.</span>{/if}
                        </p>
                    </div>
                    <button
                        aria-label="Close"
                        onclick={resetForm}
                        class="p-2 -mr-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div class="p-6 space-y-4 flex-1 overflow-y-auto">
                    <div>
                        <label for="subscription-name"
                            class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                            >What Service?</label
                        >
                        <!-- Focus moves to this field because the person just chose to add something here. -->
                        <!-- svelte-ignore a11y_autofocus -->
                        <input id="subscription-name"
                            type="text"
                            bind:value={newSub.name}
                            class="w-full px-4 py-3 rounded-xl border border-border"
                            placeholder="e.g. Netflix, Spotify, gym membership"
                            autoFocus
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="subscription-cost"
                                class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                >Cost</label
                            >
                            <input id="subscription-cost"
                                type="number"
                                bind:value={newSub.cost}
                                class="w-full px-4 py-3 rounded-xl border border-border"
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label for="subscription-cycle"
                                class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                >Cycle</label
                            >
                            <select id="subscription-cycle"
                                bind:value={newSub.cycle}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card"
                            >
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <span id="subscription-difficulty-label"
                            class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                            >How easy it is to close</span
                        >
                        <div
                            class="flex gap-2"
                            role="group"
                            aria-labelledby="subscription-difficulty-label"
                        >
                            {#each ["Easy", "Medium", "Hard"] as diff}
                                <button type="button"
                                    aria-pressed={newSub.difficulty === diff}
                                    class="px-4 py-2 rounded-lg border text-sm font-bold transition-all {newSub.difficulty ===
                                    diff
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-card text-muted-foreground border-border hover:border-slate-300'}"
                                    onclick={() =>
                                        (newSub.difficulty = diff as
                                            | "Easy"
                                            | "Medium"
                                            | "Hard")}
                                >
                                    {diff}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div>
                        <label for="subscription-cancellation-instructions"
                            class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                            >Cancellation Instructions</label
                        >
                        <textarea id="subscription-cancellation-instructions"
                            bind:value={newSub.cancellationInstructions}
                            class="w-full px-4 py-3 rounded-xl border border-border h-24"
                            placeholder="Provider contact or account page, current instructions, notice period and questions still to ask"
                        ></textarea>
                    </div>

                    <div>
                        <label for="subscription-payment-method"
                            class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                            >Payment Method (Optional)</label
                        >
                        <input id="subscription-payment-method"
                            type="text"
                            bind:value={newSub.paymentMethod}
                            class="w-full px-4 py-3 rounded-xl border border-border"
                            placeholder="e.g. Chase ending in 1234"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="subscription-next-billing"
                                class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                >Next Billing (Optional)</label
                            >
                            <input id="subscription-next-billing"
                                type="date"
                                bind:value={newSub.nextBilling}
                                class="w-full px-4 py-3 rounded-xl border border-border"
                            />
                        </div>
                        <div>
                            <label for="subscription-login-url"
                                class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                >Login Address (Optional)</label
                            >
                            <input id="subscription-login-url"
                                type="text"
                                bind:value={newSub.loginUrl}
                                class="w-full px-4 py-3 rounded-xl border border-border"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div>
                        <label for="subscription-notes"
                            class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                            >Notes (Optional)</label
                        >
                        <textarea id="subscription-notes"
                            bind:value={newSub.notes}
                            class="w-full px-4 py-3 rounded-xl border border-border h-20"
                        ></textarea>
                    </div>

                    <!-- Closed: kept on the list for the record, left out of the totals. -->
                    <label class="flex items-center gap-3 text-sm text-foreground cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isClosed(newSub)}
                            onchange={(e) => (newSub.auto_renew = !e.currentTarget.checked)}
                            class="w-4 h-4 rounded border-slate-300"
                        />
                        This subscription is closed
                    </label>

                    <!-- Custom Fields -->
                    <div class="pt-4 mt-4 border-t border-border">
                        <CustomFieldsManager
                            entityType="subscription"
                            bind:data={parsedCustomAttributes}
                        />
                    </div>
                </div>

                <div class="p-6 bg-background border-t border-border flex justify-end gap-3 shrink-0">
                    <button
                        onclick={resetForm}
                        class="px-6 py-2 rounded-xl font-bold text-muted-foreground hover:bg-border"
                        >Maybe later</button
                    >
                    <button
                        onclick={saveSubscription}
                        disabled={!newSub.name || saving}
                        aria-busy={saving}
                        class="px-6 py-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                    >
                        {saving
                            ? "Saving..."
                            : newSub.id
                            ? "Update Subscription"
                            : "Save Subscription"}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Cancellation Letter Modal -->
    {#if showLetterModal && selectedSubForLetter}
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: closeLetterModal }}
            class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            transition:fade
        >
            <div
                class="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                in:scale
            >
                <div
                    class="p-6 border-b border-border flex justify-between items-center bg-background"
                >
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-primary/10 text-primary-hover rounded-lg">
                            <FileText size={20} />
                        </div>
                        <h3 class="font-serif font-bold text-xl text-foreground">
                            Subscription closure enquiry
                        </h3>
                    </div>
                    <button aria-label="Close"
                        onclick={closeLetterModal}
                        class="p-2 hover:bg-border rounded-full transition-colors text-muted-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-8 bg-background/30">
                    <p class="mb-4 text-sm text-muted-foreground">Edit the body and sender details below. Complete bracketed details using your actual role and records, then print or download a copy to send through the provider's process.</p>
                    <!-- Letter Document -->
                    <div
                        class="bg-card shadow-sm border border-border p-12 aspect-[1/1.4] max-w-[500px] mx-auto text-sm text-foreground space-y-8 font-serif"
                    >
                        <div class="space-y-1">
                            <p class="font-bold">
                                Date: {new Date().toLocaleDateString()}
                            </p>
                            <p>
                                To: {selectedSubForLetter.name} Billing Department
                            </p>
                        </div>

                        <div class="space-y-4">
                            <p class="font-bold">
                                {letterParts(selectedSubForLetter).subject}
                            </p>

                            <div
                                contenteditable="true"
                                bind:this={letterBody}
                                bind:innerHTML={customLetterContent}
                                class="max-w-none [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-2 -m-2 transition-all min-h-[200px]"
                            ></div>

                            <div class="pt-8 space-y-1">
                                <p>Sincerely,</p>
                                <div
                                    class="w-48 h-12 border-b border-slate-300"
                                ></div>
                                <label class="block text-xs font-bold text-muted-foreground" for="subscription-letter-signer">Sender name for this draft</label>
                                <input id="subscription-letter-signer" bind:value={letterSigner} placeholder="[Your name]" class="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
                                <label class="block text-xs font-bold text-muted-foreground" for="subscription-letter-capacity">Relationship or authority for this draft</label>
                                <input id="subscription-letter-capacity" bind:value={letterCapacity} placeholder="[Your relationship or authority, if applicable]" class="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="p-6 border-t border-border bg-card flex justify-end gap-3"
                >
                    <button
                        onclick={resetLetter}
                        class="mr-auto px-4 py-2 text-xs font-bold text-muted-foreground hover:text-muted-foreground transition-colors"
                    >
                        Reset to Default
                    </button>
                    <button
                        onclick={printLetter}
                        class="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted flex items-center gap-2 transition-all"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        onclick={downloadLetterPDF}
                        disabled={pdfBusy}
                        aria-busy={pdfBusy}
                        class="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                        <Download size={16} /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
{/if}
