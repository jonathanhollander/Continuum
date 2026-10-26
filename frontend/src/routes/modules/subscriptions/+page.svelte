<script lang="ts">
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
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import { onMount, tick } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { fade, scale } from "svelte/transition";
    import { FileText, Download, Printer } from "lucide-svelte";
    import type { SyncManager } from "$lib/services/sync.svelte";
    import { subscriptionsSync } from "$lib/stores/subscriptionStore.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import { toCents, fromCents, formatMoney } from "$lib/utils/money";
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
    let viewMode = $state<ViewMode>('card');

    onMount(async () => {
        await subscriptionSync.init();
        isLoading = false;
    });

    let showAddForm = $state(false);
    let newSub = $state<Partial<Subscription> & { id?: string }>({
        difficulty: "Easy",
        cycle: "Monthly",
        cost: 0,
    });

    let selectedSubForLetter = $state<Subscription | null>(null);
    let showLetterModal = $state(false);
    let customLetterContent = $state("");

    function generateDefaultLetter(sub: Subscription) {
        return `
            <p>Dear Customer Service Team,</p>
            
            <p>Please accept this formal request to cancel the account and all associated services for <strong>${$estateProfile.ownerName || "[Name Not Set]"}</strong>, effective immediately.</p>
            
            <p><strong>Account Details:</strong></p>
            <ul>
                <li>Service: ${sub.name}</li>
                <li>Billing Address: ${$estateProfile.legalAddress || "[Address Not Set]"}</li>
                <li>Payment Method: ${sub.paymentMethod || "On File"}</li>
            </ul>

            <p>This request is being made on behalf of the estate by the designated executor. We request that you confirm this cancellation in writing and provide a final statement of account.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
        `;
    }

    // onMount removed (SyncManager handles loading)

    // save() removed (SyncManager handles persistence)

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

        try {
        if (newSub.id) {
            // Edit Mode
            await subscriptionSync.update(newSub.id, {
                name: newSub.name,
                cost: newSub.cost,
                cycle: newSub.cycle,
                paymentMethod: newSub.paymentMethod,
                nextBilling: newSub.nextBilling,
                difficulty: newSub.difficulty,
                cancellationInstructions: newSub.cancellationInstructions,
                loginUrl: newSub.loginUrl,
                notes: newSub.notes,
                custom_attributes: JSON.stringify(parsedCustomAttributes),
            });

            // Log UPDATE handled by component manually for now, or move to SyncManager hooks?
            // Existing logging logic:
            const oldSub = subscriptions.find((s) => s.id === newSub.id);
            // ... (Logging logic relies on oldSub, which is fine since we calculate it before update if we want exact diff,
            // but for simplicity we'll keeping it simplified or just assume success logging)

            activityLog.logEvent({
                module: "Subscriptions",
                action: "UPDATE",
                entityType: "Subscription",
                entityId: newSub.id,
                entityName: newSub.name || "Unnamed Subscription",
                changes: [], // omitting detailed changes for brevity/cleanliness in refactor
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode
            const created = await subscriptionSync.create({
                name: newSub.name || "Unknown Service",
                cost: Number(newSub.cost) || 0,
                cycle: newSub.cycle || "Monthly",
                paymentMethod: newSub.paymentMethod || "",
                nextBilling: newSub.nextBilling || "",
                difficulty: newSub.difficulty || "Medium",
                cancellationInstructions: newSub.cancellationInstructions || "",
                loginUrl: newSub.loginUrl || "",
                notes: newSub.notes || "",
                custom_attributes: JSON.stringify(parsedCustomAttributes),
            }, false, false, saveSubscription);

            // Log CREATE
            activityLog.logEvent({
                module: "Subscriptions",
                action: "CREATE",
                entityType: "Subscription",
                entityId: created.id,
                entityName: created.name || "Unknown Service",
                userContext: $estateProfile.ownerName || "User",
            });
        }

        resetForm();
        } catch {
            // The manager already showed the one gentle message; the form stays open with the draft.
        }
    }

    function editSubscription(sub: Subscription) {
        newSub = { ...sub };
        parsedCustomAttributes = readCustom(sub);
        showAddForm = true;
    }

    function resetForm() {
        showAddForm = false;
        newSub = {
            id: undefined,
            difficulty: "Easy",
            cycle: "Monthly",
            cost: 0,
            name: "",
            paymentMethod: "",
            nextBilling: "",
            cancellationInstructions: "",
            loginUrl: "",
            notes: "",
        };
        parsedCustomAttributes = {};
    }

    async function removeSubscription(id: string) {
        if (
            !confirm(
                "Remove this subscription? This detail can always be added back later.",
            )
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
        selectedSubForLetter = sub;
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
            customLetterContent = generateDefaultLetter(selectedSubForLetter);
        }
    }

    function closeLetterModal() {
        showLetterModal = false;
        selectedSubForLetter = null;
    }

    // The letter body as written in the modal (edits included); the rest is the same text the sheet shows.
    let letterBody = $state<HTMLDivElement | null>(null);
    const esc = (v: string) =>
        v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    function letterParts(sub: Subscription) {
        return {
            date: `Date: ${new Date().toLocaleDateString()}`,
            to: `To: ${sub.name} Billing Department`,
            subject: `Subject: Account Cancellation Request - ${sub.name}`,
            signer: $estateProfile.executorName || "[Executor Name Not Set]",
            role: `Executor of the Estate of ${$estateProfile.ownerName || ""}`,
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
        frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sub.name)} cancellation letter</title><style>
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
    let pdfBusy = $state(false);
    async function downloadLetterPDF() {
        const sub = selectedSubForLetter;
        if (!sub || pdfBusy) return;
        pdfBusy = true;
        try {
            const [{ default: jsPDF }, { saveBlob }] = await Promise.all([
                import("jspdf"),
                import("$lib/services/exportService"),
            ]);
            const l = letterParts(sub);
            const doc = new jsPDF({ unit: "pt", format: "letter" });
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            const M = 72;
            let y = M;
            // jsPDF's built-in fonts cover Latin-1; common typography is mapped so words stay readable.
            const latin1 = (s: string) =>
                s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
                    .replace(/…/g, "...").replace(/[^\x00-\xFF\n]/g, "?");
            const write = (s: string, opts: { bold?: boolean; italic?: boolean; size?: number; gap?: number } = {}) => {
                const size = opts.size ?? 11;
                doc.setFont("times", opts.bold ? "bold" : opts.italic ? "italic" : "normal");
                doc.setFontSize(size);
                const lh = size * 1.45;
                for (const line of doc.splitTextToSize(latin1(s), W - 2 * M) as string[]) {
                    if (y + lh > H - M) { doc.addPage(); y = M; }
                    doc.text(line, M, y + size);
                    y += lh;
                }
                y += opts.gap ?? 0;
            };
            write(l.date, { bold: true });
            write(l.to, { gap: 20 });
            write(l.subject, { bold: true, gap: 10 });
            const body = (letterBody?.innerText ?? "").split(/\n+/).map((t) => t.trim()).filter(Boolean);
            for (const para of body) write(para, { gap: 6 });
            y += 18;
            write("Sincerely,", { gap: 30 });
            doc.setDrawColor(148, 163, 184);
            doc.line(M, y, M + 170, y);
            y += 6;
            write(l.signer, { bold: true });
            write(l.role, { italic: true, size: 9 });
            const file = `${sub.name || "Subscription"} cancellation letter`.replace(/[\\/:*?"<>|]+/g, " ").trim();
            saveBlob(doc.output("blob"), `${file}.pdf`);
        } finally {
            pdfBusy = false;
        }
    }

    // Derived stats
    // Totals summed in whole cents; a yearly cost's month is its twelfth, rounded once.
    let totalMonthly = $derived(
        fromCents(subscriptions.reduce(
            (sum, s) => sum + (s.cycle === "Yearly" ? Math.round(toCents(s.cost) / 12) : toCents(s.cost)),
            0,
        )),
    );

    let totalYearly = $derived(
        fromCents(subscriptions.reduce(
            (sum, s) => sum + (s.cycle === "Yearly" ? toCents(s.cost) : toCents(s.cost) * 12),
            0,
        )),
    );
</script>

<LivingBlueprintHeader
    title="Subscriptions & Services"
    subtitle="Prevent forgotten charges that drain your estate"
    tier="preparation"
    detailedDescription="Every subscription you document is money your family won't lose to forgotten charges. This simple list can save them hundreds—or even thousands—in the months after you're gone."
    whyMatters="After you're gone, these charges will keep hitting your bank account until someone notices and cancels them. Without a record, your family won't know what to look for or how to cancel them. Each service you document is one less headache for them."
>
    <div class="flex items-center gap-4">
        <DataViewToggle module="subscriptions" onchange={(mode) => viewMode = mode} />
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
    class="container mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500"
>

    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="subscriptions"
        prompts={[
            "Help me write instructions for cancelling my streaming and software subscriptions...",
            "Draft a letter my executor can send to close a subscription account...",
            "List the steps my executor can follow to cancel subscriptions...",
            "How do automatic renewals work after someone passes away?"
        ]}
    />

    <!-- Content -->
    {#if subscriptions.length === 0}
        <EmptyState
            title="Identify your 'zombie bills'"
            whyMatters="<strong>After you're gone, these charges will keep hitting your bank account until someone notices and cancels them.</strong> But without a record, your family won't know what to look for or how to cancel them.<br/><br/>Documenting your subscriptions isn't just about saving money—it's about preventing your spouse or executor from spending weeks hunting down mystery charges while grieving. Each service you document is one less headache for them."
            encouragement="Start with the obvious ones—Netflix, Spotify, your gym. You can add others as you remember them."
            icon={Receipt}
            iconClass="text-slate-600"
            ctaLabel="Document first subscription"
            onAction={() => (showAddForm = true)}
        />

        <!-- Sample Data GhostRows -->
        <div class="mt-8">
            <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
            <div class="space-y-3 opacity-60">
                {#each getSmartSamples($language).subscriptions || [] as sample}
                    <GhostRow
                        name={sample.name}
                        subtitle={`${sample.category} - ${sample.cycle}`}
                        type="Subscription"
                        value={sample.cost}
                        onClick={() => {
                            newSub = {
                                ...newSub,
                                name: sample.name,
                                cost: sample.cost,
                                cycle: sample.cycle as "Monthly" | "Yearly",
                                notes: sample.notes
                            };
                            showAddForm = true;
                        }}
                    >
                        {#snippet icon()}
                            <Receipt size={20} class="text-slate-400" />
                        {/snippet}
                    </GhostRow>
                {/each}
            </div>
        </div>
    {:else}
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
                class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
            >
                <div
                    class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1"
                >
                    Monthly Burn
                </div>
                <div class="text-2xl font-bold text-slate-800">
                    {formatMoney(totalMonthly)}
                </div>
            </div>
            <div
                class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
            >
                <div
                    class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1"
                >
                    Annual Impact
                </div>
                <div class="text-2xl font-bold text-slate-800">
                    {formatMoney(totalYearly)}
                </div>
            </div>
            <div
                class="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4"
            >
                <div class="p-3 bg-white rounded-full text-amber-500 shadow-sm">
                    <TrendingUp class="w-6 h-6" />
                </div>
                <div>
                    <div class="text-sm text-amber-900 font-medium">
                        Inflation Alert
                    </div>
                    <div class="text-xs text-amber-700/80">
                        Review annually. Prices tend to creep up.
                    </div>
                </div>
            </div>
        </div>

        <!-- Main List -->
        <div class="space-y-4">
            <div
                class="flex items-center justify-between pb-2 border-b border-slate-200"
            >
                <h2 class="font-bold text-slate-700 flex items-center gap-2">
                    Active Recurring Charges
                    <span
                        class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs"
                        >{subscriptions.length}</span
                    >
                </h2>
                <div class="flex items-center gap-2">
                    {#if showDifficultyFilter}
                        {#each difficultyChoices as diff (diff)}
                            <button
                                onclick={() => (difficultyFilter = difficultyFilter === diff ? null : diff)}
                                aria-pressed={difficultyFilter === diff}
                                class="px-2.5 py-1 rounded-full text-xs font-bold border transition-colors {difficultyFilter === diff
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'}"
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
                        class="{showDifficultyFilter || difficultyFilter ? 'text-primary' : 'text-slate-400'} hover:text-slate-600"
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
                            onCancel={() => removeSubscription(sub.id)}
                            onGenerateLetter={() => openLetterModal(sub)}
                        />
                        <div
                            class="absolute top-3 right-2 flex gap-1 bg-white/50 backdrop-blur-sm rounded-full p-1"
                        >
                            <button
                                onclick={() => editSubscription(sub)}
                                class="p-1.5 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-full transition-colors"
                                title="Edit"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onclick={() => removeSubscription(sub.id)}
                                class="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-colors"
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                {/each}
            {:else}
                <!-- Table View -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Service</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Cost</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Cycle</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Difficulty</th>
                                <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Payment</th>
                                <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            {#each shownSubscriptions as sub (sub.id)}
                                <tr class="hover:bg-slate-50 transition-colors group">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                                <Receipt size={16} />
                                            </div>
                                            <span class="font-medium text-slate-800">{sub.name}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-slate-600 font-medium">
                                        {formatMoney(sub.cost)}
                                    </td>
                                    <td class="px-4 py-3 text-sm text-slate-600">{sub.cycle}</td>
                                    <td class="px-4 py-3">
                                        {#if sub.difficulty}
                                            <span class="text-xs font-medium px-2 py-1 rounded-lg {
                                                sub.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                sub.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }">
                                                {sub.difficulty}
                                            </span>
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3 text-sm text-slate-600 max-w-[150px] truncate">
                                        {sub.paymentMethod || '-'}
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <div class="flex items-center justify-end gap-2 transition-opacity">
                                            <button
                                                onclick={() => openLetterModal(sub)}
                                                class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                                title="Generate Letter"
                                            >
                                                <FileText size={14} />
                                            </button>
                                            <button aria-label="Edit these details"
                                                onclick={() => editSubscription(sub)}
                                                class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button aria-label="Remove this item"
                                                onclick={() => removeSubscription(sub.id)}
                                                class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
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
                class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
                <div
                    class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start shrink-0"
                >
                    <div class="flex-1 pr-4">
                        <h3
                            class="font-serif font-bold text-2xl text-slate-800"
                        >
                            {newSub.id
                                ? "Update Subscription"
                                : "Track a Recurring Charge"}
                        </h3>
                        <p class="text-slate-500 text-sm mt-2 leading-relaxed">
                            {newSub.id
                                ? "Keep this information current—it makes the cancellation process smoother."
                                : "Subscriptions keep charging even when no one's watching. Documenting these helps your family avoid months of unnecessary charges and navigate the often-frustrating cancellation process."}
                        </p>
                    </div>
                    <button
                        aria-label="Close"
                        onclick={resetForm}
                        class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div class="p-6 space-y-4 flex-1 overflow-y-auto">
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >What Service?</label
                        >
                        <input
                            type="text"
                            bind:value={newSub.name}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="e.g. Netflix, Spotify, gym membership"
                            autoFocus
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Cost</label
                            >
                            <input
                                type="number"
                                bind:value={newSub.cost}
                                class="w-full px-4 py-3 rounded-xl border border-gray-200"
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Cycle</label
                            >
                            <select
                                bind:value={newSub.cycle}
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
                            >
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Difficulty to Cancel</label
                        >
                        <div class="flex gap-2">
                            {#each ["Easy", "Medium", "Hard"] as diff}
                                <button
                                    class="px-4 py-2 rounded-lg border text-sm font-bold transition-all {newSub.difficulty ===
                                    diff
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}"
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
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Cancellation Instructions</label
                        >
                        <textarea
                            bind:value={newSub.cancellationInstructions}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 h-24"
                            placeholder="How do we turn this off?"
                        ></textarea>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Payment Method (Optional)</label
                        >
                        <input
                            type="text"
                            bind:value={newSub.paymentMethod}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="e.g. Chase ending in 1234"
                        />
                    </div>

                    <!-- Custom Fields -->
                    <div class="pt-4 mt-4 border-t border-gray-100">
                        <CustomFieldsManager
                            entityType="subscription"
                            bind:data={parsedCustomAttributes}
                        />
                    </div>
                </div>

                <div class="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button
                        onclick={resetForm}
                        class="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200"
                        >Not right now</button
                    >
                    <button
                        onclick={saveSubscription}
                        disabled={!newSub.name || saving}
                        aria-busy={saving}
                        class="px-6 py-2 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
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
                class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                in:scale
            >
                <div
                    class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"
                >
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-primary/10 text-primary rounded-lg">
                            <FileText size={20} />
                        </div>
                        <h3 class="font-serif font-bold text-xl text-slate-800">
                            Cancellation Request
                        </h3>
                    </div>
                    <button aria-label="Close"
                        onclick={closeLetterModal}
                        class="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                    <!-- Letter Document -->
                    <div
                        class="bg-white shadow-sm border border-slate-200 p-12 aspect-[1/1.4] max-w-[500px] mx-auto text-sm text-slate-800 space-y-8 font-serif"
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
                                Subject: Account Cancellation Request - {selectedSubForLetter.name}
                            </p>

                            <div
                                contenteditable="true"
                                bind:this={letterBody}
                                bind:innerHTML={customLetterContent}
                                class="prose prose-sm max-w-none focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-lg p-2 -m-2 transition-all min-h-[200px]"
                            ></div>

                            <div class="pt-8 space-y-1">
                                <p>Sincerely,</p>
                                <div
                                    class="w-48 h-12 border-b border-slate-300"
                                ></div>
                                <p class="font-bold">
                                    {$estateProfile.executorName ||
                                        "[Executor Name Not Set]"}
                                </p>
                                <p class="text-xs text-slate-500 italic">
                                    Executor of the Estate of {$estateProfile.ownerName}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="p-6 border-t border-slate-100 bg-white flex justify-end gap-3"
                >
                    <button
                        onclick={resetLetter}
                        class="mr-auto px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Reset to Default
                    </button>
                    <button
                        onclick={printLetter}
                        class="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition-all"
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
