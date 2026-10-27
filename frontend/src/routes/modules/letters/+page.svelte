<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { fade, fly, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import {
        PenTool,
        Heart,
        Sparkles,
        ArrowRight,
        Save,
        Mic,
        Briefcase,
        Landmark,
        Scale,
        FileText,
        ChevronRight,
        Trash2,
        X,
        ArrowLeft,
        Printer,
        Download,
        Mail,
        History,
        Search,
        Filter,
        Stethoscope,
        Users,
        Building,
        GraduationCap,
        PawPrint,
        ShieldCheck,
        Info,
        MicOff,
        CircleCheck,
        Loader2,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import {
        LETTER_TEMPLATES,
        EMOTIONAL_PROMPTS,
        type LetterTemplate,
    } from "$lib/data/letterTemplates";
    import { onMount, onDestroy, tick, untrack } from "svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import LetterAssistant from "$lib/components/modules/letters/LetterAssistant.svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import { aiRuntimeAssets, aiAssets, aiAsset, assetStrings, loadAIConfig, observeAIConfig, renderAIAsset, registerAIJob, aiJobId, aiSourceFacts, type AIWritingJob } from "$lib/services/aiCapabilities";
    import { auth } from "$lib/stores/auth";
    import { captureSession, isCurrentSession, type SessionOwnership } from "$lib/services/sessionOwnership";
    import RefreshControl from "$lib/components/ui/RefreshControl.svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    import GriefSupportBanner from "$lib/components/GriefSupportBanner.svelte";
    import { lettersSync, type Letter } from "$lib/stores/letterStore.svelte";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import { milestoneLabel } from "$lib/utils/milestones";
    import { letterReadState, letterStateLabel, type LetterReadState } from "$lib/utils/letterReadiness";

    // One owner for the letters table: the store's 'letters' manager.
    const letterSync = lettersSync;
    let savedLetters = $derived(letterSync.items);
    let contacts = $derived(contactSync.items);

    let searchQuery = $state("");
    // A gentle cue until the first server answer, unless this device already holds letters.
    let firstSyncPending = $derived(letterSync.lastSync === null && letterSync.status !== "error");
    let isLoading = $derived(firstSyncPending && savedLetters.length === 0);
    // Header, cards and table use the same personal-reader readiness and drafting states.
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    let readStates = $derived(new Map(savedLetters.map((letter) => [String(letter.id), letterReadState(letter, contacts)])));
    const stateOf = (letter: Letter): LetterReadState => readStates.get(String(letter.id)) ?? 'draft';
    let heldCount = $derived(savedLetters.filter((letter) => stateOf(letter) === 'held').length);
    let readyCount = $derived(savedLetters.filter((letter) => stateOf(letter) === 'ready').length);
    let draftCount = $derived(savedLetters.filter((letter) => stateOf(letter) === 'draft').length);
    let institutionCount = $derived(savedLetters.filter((letter) => stateOf(letter) === 'institution').length);
    let letterStates = $derived(
        [readyCount > 0 ? `${readyCount} ready to read` : "", heldCount > 0 ? `${heldCount} on hold` : "",
         draftCount > 0 ? plural(draftCount, "draft", "drafts") : "",
         institutionCount > 0 ? plural(institutionCount, "institution draft", "institution drafts") : ""]
            .filter(Boolean)
            .join(" · "),
    );
    // Cards or table for "Your letters"; DataViewToggle stores the choice per module.
    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('letters'));
    let customAttributes = $state<Record<string, any>>({});

    onMount(() => {
        letterSync.init().catch(() => {});
        contactSync.init().catch(() => {});
        // Fetched with the page's own data, so template fields can fill from it right away.
        estateProfile.sync().catch(() => {});
    });
    let filterCategory = $state("All");

    // Removal of old persistence
    // import { getStored, setStored } from "$lib/stores/persistence";

    // onMount removed

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function saveToVault() {
        if (saving) return;
        saving = true;
        try {
            await saveToVaultOnce();
        } finally {
            saving = false;
        }
    }

    async function saveToVaultOnce() {
        if (!generatedLetter.trim()) {
            notifications.showError({
                message:
                    "Your letter is waiting for its first words. Go back whenever you're ready.",
                code: "EMPTY_CONTENT",
            });
            return;
        }

        const title = letterTitle();

        const details = {
            content: generatedLetter,
            ...recipientDetails(),
            triggerDate: letterTriggerDate || null,
            triggerMilestone: letterTriggerMilestone || null,
            isLocked: letterHold,
            customAttributes: JSON.stringify(customAttributes ?? {}),
        };

        try {
        // Reopened letter: save over it (never a second copy).
        const saved = editingId !== null
            ? await letterSync.update(editingId, details)
            : await letterSync.create({
                ...details,
                title: `${title} (${new Date().toLocaleDateString()})`,
                date: new Date().toLocaleDateString(),
                type: currentLetterType(),
            } as Letter, false, false, saveToVault);

        activityLog.logEvent({
            module: "Letters",
            action: editingId !== null ? "UPDATE" : "CREATE",
            entityType: "Draft",
            entityId: String(saved.id),
            entityName: saved.title,
            userContext: $estateProfile.ownerName || "User",
        });

        // Affirmation is shown automatically by letterSync.create()
        mode = "menu";
        resetSelection();
        } catch {
            // The manager already showed the one gentle message; the draft stays on screen.
        }
    }

    function currentLetterType(): string {
        if (editingId !== null) return savedLetters.find(letter => String(letter.id) === String(editingId))?.type ?? 'emotional';
        return selectedTemplate && !emotionalFlow ? 'transactional' : 'emotional';
    }

    function letterTitle() {
        // A reopened letter keeps its own title (its flow is only a placeholder; see viewLetter).
        const reopened = editingId !== null
            ? savedLetters.find((l) => String(l.id) === String(editingId))?.title
            : undefined;
        if (reopened) return reopened;
        return emotionalFlow
            ? emotionalFlow === "spouse"
                ? "Letter to Loved One"
                : "Ethical Will"
            : selectedTemplate?.title || "Draft Letter";
    }

    const esc = (v: string) =>
        v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // Print: the letter alone, in a hidden frame, through the browser's own print dialog.
    function printLetter() {
        if (!generatedLetter.trim()) return;
        document.getElementById("letter-print-frame")?.remove();
        const frame = document.createElement("iframe");
        frame.id = "letter-print-frame";
        frame.setAttribute("aria-hidden", "true");
        frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
        frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(letterTitle())}</title><style>
            @page { margin: 1in; }
            body { font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.5; color: #1e293b; margin: 0; white-space: pre-wrap; }
        </style></head><body>${esc(generatedLetter)}</body></html>`;
        frame.onload = () => {
            frame.contentWindow?.focus();
            frame.contentWindow?.print();
        };
        document.body.appendChild(frame);
    }

    // Download PDF: the same letter as a PDF file, written with the jsPDF library the export packet uses.
    let pdfBusy = $state(false);
    async function downloadLetterPDF() {
        if (pdfBusy || !generatedLetter.trim()) return;
        pdfBusy = true;
        try {
            const [{ createUnicodePDF, PDF_FONT, splitPDFText, writePDFLine }, { saveBlob }] = await Promise.all([
                import("$lib/services/unicodePDF"),
                import("$lib/services/exportService"),
            ]);
            const doc = await createUnicodePDF();
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            const M = 72;
            const size = 11;
            const lh = size * 1.45;
            let y = M;
            doc.setFont(PDF_FONT, "normal");
            doc.setFontSize(size);
            for (const line of splitPDFText(doc, generatedLetter, W - 2 * M)) {
                if (y + lh > H - M) { doc.addPage(); y = M; }
                writePDFLine(doc, line, M, y + size, W - 2 * M);
                y += lh;
            }
            const file = letterTitle().replace(/[\\/:*?"<>|]+/g, " ").trim() || "Letter";
            saveBlob(doc.output("blob"), `${file}.pdf`);
        } finally {
            pdfBusy = false;
        }
    }

    // Per-letter details; cleared whenever a new letter is started.
    function clearLetterDetails() {
        selectionVersion++;
        writingDraft = {};
        generatedLetter = "";
        reflections = ["", "", ""];
        reflectionQuestions = ["", "", ""];
        currentQuestion = "";
        editingId = null;
        letterRecipientId = "";
        recordedRecipientName = "";
        recordedRecipientId = null;
        recipientChanged = false;
        letterTriggerDate = "";
        letterTriggerMilestone = "";
        letterHold = false;
        customAttributes = {};
        templateVariables = {};
        detectedVariables = [];
        filledFromProfile = false;
    }

    function resetSelection() {
        emotionalFlow = null;
        selectedTemplate = null;
        generatedLetter = "";
        templateVariables = {};
        clearLetterDetails();
        mode = "menu";
    }

    async function deleteLetter(id: number | string, name: string) {
        if (
            !(await askConfirm(
                `Remove the letter to "${name}"? You can always start over if you feel like it later.`,
            ))
        )
            return;
        await letterSync.delete(id);
        if (letterSync.items.some((l) => String(l.id) === String(id))) return;

        activityLog.logEvent({
            module: "Letters",
            action: "DELETE",
            entityType: "Draft",
            entityId: String(id),
            entityName: name,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    function viewLetter(letter: Letter) {
        clearLetterDetails();
        emotionalFlow = null;
        selectedTemplate = null;
        generatedLetter = letter.content;
        editingId = letter.id;
        recordedRecipientName = letter.recipientName ?? "";
        recordedRecipientId = letter.recipientContactId ?? null;
        recipientChanged = false;
        // A name-only or removed contact stays exactly as recorded until the owner chooses otherwise.
        letterRecipientId = recordedRecipientId != null && contacts.some((c) => String(c.id) === String(recordedRecipientId))
            ? String(recordedRecipientId)
            : (recordedRecipientName || recordedRecipientId != null) ? RECORDED_RECIPIENT : "";
        letterTriggerDate = letter.triggerDate ?? "";
        letterTriggerMilestone = letter.triggerMilestone ?? "";
        letterHold = !!letter.isLocked;
        try {
            customAttributes = JSON.parse(letter.customAttributes || "{}") ?? {};
        } catch {
            customAttributes = {};
        }
        mode = "review";
        if (letter.type === "emotional") {
            emotionalFlow = "ethical_will"; // Placeholder to enable UI
        } else {
            selectedTemplate = {
                id: String(letter.id),
                title: letter.title,
                subject: `Review: ${letter.title}`,
                body: letter.content,
                category: "Saved",
                audience: "Viewer",
            };
        }
    }

    let mode = $state<
        | "menu"
        | "emotional_interview"
        | "review"
        | "transactional_preview"
        | "variable_input"
    >("menu");

    let letterAssets = $derived(aiAssets({purpose:'letter.draft'}, $aiRuntimeAssets));
    type ReflectionFlow = { title: string; steps: { category: string; pool: string[]; suggestions: string[] }[] };
    let reflectionFlows = $derived(letterAssets['lib/data/reflectionPools.ts:letters'] as Record<string, ReflectionFlow> | undefined);
    $effect(() => observeAIConfig({ purpose: 'letter.draft' }));
    // Emotional State
    let emotionalFlow = $state<"spouse" | "ethical_will" | null>(null);
    // One answer per interview step, in the order the steps are asked (see REFLECTION_POOLS.letters).
    let reflections = $state(["", "", ""]);
    let reflectionQuestions = $state(["", "", ""]);
    function recordReflection(answer: string) {
        reflections[currentPromptIndex] = answer;
        reflectionQuestions[currentPromptIndex] = currentQuestion;
    }
    let currentPromptIndex = $state(0);
    let currentSuggestions = $derived(
        emotionalFlow
            ? reflectionFlows?.[emotionalFlow]?.steps[currentPromptIndex]?.suggestions ?? []
            : [],
    );
    let currentQuestion = $state("");

    function refreshQuestion() {
        if (!emotionalFlow) return;
        const pool =
            reflectionFlows?.[emotionalFlow]?.steps[currentPromptIndex]?.pool ?? [];
        if (!pool.length) return;
        let newQuestion = currentQuestion;
        if (pool.length > 1) {
            // helper to avoid same question twice in a row
            let attempts = 0;
            while (newQuestion === currentQuestion && attempts < 10) {
                newQuestion = pool[Math.floor(Math.random() * pool.length)];
                attempts++;
            }
        } else {
            newQuestion = pool[0];
        }
        currentQuestion = newQuestion;
    }

    // Transactional State
    let selectedTemplate = $state<LetterTemplate | null>(null);
    let templateVariables = $state<Record<string, string>>({});
    let detectedVariables = $state<string[]>([]);
    // True when the Estate Profile filled at least one field of the chosen template.
    let filledFromProfile = $state(false);

    // Editor Content
    let generatedLetter = $state("");
    let writingDraft = $state<object>({});


    // Details of the letter being written or reopened
    let editingId = $state<number | string | null>(null);
    const RECORDED_RECIPIENT = "__recorded_recipient__";
    let letterRecipientId = $state("");
    let recordedRecipientName = $state("");
    let recordedRecipientId = $state<number | null>(null);
    let recipientChanged = $state(false);
    let letterTriggerDate = $state("");
    let letterTriggerMilestone = $state("");
    let letterHold = $state(false);

    function recipientDetails() {
        if (letterRecipientId === RECORDED_RECIPIENT || (editingId !== null && !recipientChanged)) {
            return { recipientName: recordedRecipientName, recipientContactId: recordedRecipientId };
        }
        const recipient = contacts.find((contact) => String(contact.id) === letterRecipientId);
        return { recipientName: recipient?.name ?? "", recipientContactId: recipient ? Number(recipient.id) : null };
    }

    const writingJob = (): AIWritingJob => {
        const recipient = recipientDetails();
        const person = contacts.find((contact) => String(contact.id) === String(recipient.recipientContactId));
        return { job_id: aiJobId('letter', writingDraft, editingId), document_type: emotionalFlow || selectedTemplate?.category || 'letter',
            document_title: editingId !== null ? savedLetters.find((letter) => String(letter.id) === String(editingId))?.title : selectedTemplate?.title,
            current_draft: generatedLetter, recipient_name: recipient.recipientName, recipient_relationship: person?.relation,
            notes: [...reflections],
            field_label: mode === 'emotional_interview' ? currentQuestion : 'Your letter',
            field_question: mode === 'emotional_interview' ? currentQuestion : '',
            question_answers: reflections.flatMap((answer, index) => answer.trim() && reflectionQuestions[index]
                ? [JSON.stringify({question:reflectionQuestions[index],answer})] : []),
            source_facts: aiSourceFacts({ ...templateVariables, signature: $estateProfile.ownerName }) };
    };
    const retainedWritingJob = (): AIWritingJob | undefined => editingId !== null || generatedLetter.trim() || reflections.some(answer => answer.trim()) || selectedTemplate || emotionalFlow
        ? writingJob() : undefined;
    $effect(() => { $auth; mode; writingJob().job_id; return registerAIJob(() => mode === 'menu' ? retainedWritingJob() : writingJob()); });

    let editorReadState = $derived(letterReadState({
        ...recipientDetails(),
        content: generatedLetter,
        type: currentLetterType(),
        isLocked: letterHold,
    }, contacts));

    let selectionVersion = 0;
    let selectionAlive = true;
    const ownsSelection = (owner: SessionOwnership, version: number) => selectionAlive && version === selectionVersion && isCurrentSession(owner);
    onDestroy(() => { selectionAlive = false; selectionVersion++; });
    function returnToMenu() { selectionVersion++; mode = "menu"; }
    async function startEmotionalFlow(flow: "spouse" | "ethical_will") {
        const owner = captureSession(), version = ++selectionVersion;
        try { await loadAIConfig({ purpose: 'letter.draft' }, true); }
        catch (error) { if (ownsSelection(owner, version)) notifications.showError(error instanceof Error ? error : String(error)); return; }
        if (!ownsSelection(owner, version)) return;
        clearLetterDetails();
        selectedTemplate = null;
        emotionalFlow = flow;
        mode = "emotional_interview";
        currentPromptIndex = 0;
        reflections = ["", "", ""];
        refreshQuestion();
    }

    async function useAssistantDraft(text: string, ownsResult: () => boolean) {
        const owner = captureSession(), version = selectionVersion;
        const source = JSON.stringify(retainedWritingJob());
        if (!ownsResult() || !ownsSelection(owner, version)) return;
        if (generatedLetter.trim() && generatedLetter !== text && !(await askConfirm('Use this version in your letter editor?', 'Use this version'))) return;
        if (!ownsResult() || !ownsSelection(owner, version) || source !== JSON.stringify(retainedWritingJob())) return;
        generatedLetter = text;
        mode = 'review';
        await tick();
        if (!isCurrentSession(owner)) return;
        document.querySelector<HTMLTextAreaElement>('[data-letter-editor] textarea')?.focus({preventScroll:true});
    }

    // Template fields the Estate Profile can fill.
    function profileValues(): Record<string, string> {
        const p = $estateProfile;
        return {
            "Account Holder Name": p.ownerName,
            "Deceased Name": p.ownerName,
            "Cardholder Name": p.ownerName,
            "Borrower Name": p.ownerName,
            "Date of Death": p.dateOfDeath,
            "Executor/Administrator": p.executorName,
            "Executor Name": p.executorName,
            Spouse: p.spouseName,
            "Primary Beneficiary": p.primaryBeneficiary,
            SSN: p.last4SSN,
            "Social Security Number": p.last4SSN,
            "Last 4 digits of SSN": p.last4SSN,
            City: p.legalCityState.split(",")[0]?.trim() || "",
            State: p.legalCityState.split(",")[1]?.trim() || "",
        };
    }

    // Fill the chosen template's empty fields from the profile; what the person typed stays.
    function fillFromProfile(withDate = false) {
        const values = profileValues();
        if (withDate) values.Date = new Date().toLocaleDateString();
        for (const v of detectedVariables) {
            if (templateVariables[v] || !values[v]) continue;
            templateVariables[v] = values[v];
            if (v !== "Date") filledFromProfile = true;
        }
    }

    // The profile can answer after a template is opened: fill its fields when it arrives.
    $effect(() => {
        $estateProfile;
        untrack(() => {
            if (mode === "variable_input") fillFromProfile();
        });
    });

    async function selectTransactional(template: LetterTemplate) {
        const owner = captureSession(), version = ++selectionVersion;
        try {
            await loadAIConfig({ purpose: 'letter.draft' }, true);
            if (!ownsSelection(owner, version)) return;
            const body = aiAsset<Record<string, string>>('lib/data/letterTemplates.ts:bodies', {purpose:'letter.draft'})?.[template.id];
            if (typeof body !== 'string') throw new Error('Drafting template could not be loaded');
            template = { ...template, body };
        } catch (error) { if (ownsSelection(owner, version)) notifications.showError(error instanceof Error ? error : String(error)); return; }
        clearLetterDetails();
        // A letter from the library is never an emotional letter, even after one was open.
        emotionalFlow = null;
        selectedTemplate = template;
        const regex = /\[(.*?)\]/g;
        const matches = [...template.body.matchAll(regex)];
        detectedVariables = [...new Set(matches.map((m) => m[1]))];
        templateVariables = Object.fromEntries(detectedVariables.map((v) => [v, ""]));
        filledFromProfile = false;
        fillFromProfile(true);

        if (detectedVariables.length > 0) {
            mode = "variable_input";
        } else {
            generatedLetter = template.body;
            mode = "transactional_preview";
        }
    }

    function applyVariables() {
        if (!selectedTemplate) return;
        let text = selectedTemplate.body;
        detectedVariables.forEach((v) => {
            if (templateVariables[v]) {
                text = text.replaceAll(`[${v}]`, templateVariables[v]);
            }
        });
        generatedLetter = text;
        mode = "transactional_preview";
    }

    function nextEmotionalPrompt() {
        if (currentPromptIndex < 2) {
            currentPromptIndex++;
            refreshQuestion();
            // The answer box is rebuilt for each question; put the keyboard back in it.
            tick().then(() => {
                const boxes = document.querySelectorAll<HTMLTextAreaElement>("[data-reflection-box] textarea");
                boxes[boxes.length - 1]?.focus();
            });
        } else {
            generateEmotionalDraft();
        }
    }

    function generateEmotionalDraft() {
        const templates = aiAsset<Record<string, string>>('routes/modules/letters/+page.svelte:emotional_drafts', {purpose:'letter.draft'});
        const template = templates?.[emotionalFlow || ''];
        if (typeof template !== 'string') return;
        const signature = $estateProfile.ownerName?.trim() || templates?.signature_placeholder || '';
        const [one, two, three] = reflections;
        generatedLetter = renderAIAsset(template, { signature, memory: one, admire: two, hopes: three, values: one, lesson: two, legacy: three });
        mode = "review";
        // Put the keyboard straight into the new letter.
        tick().then(() => {
            document.querySelector<HTMLTextAreaElement>("[data-letter-editor] textarea")?.focus({ preventScroll: true });
        });

        activityLog.logEvent({
            module: "Letters",
            action: "GENERATE",
            entityType: "Emotional Draft",
            entityId: "draft-temp",
            entityName:
                emotionalFlow === "spouse"
                    ? "Letter to Loved One"
                    : "Ethical Will",
            userContext: $estateProfile.ownerName || "User",
        });
    }

    const categories = [
        "All",
        "Financial",
        "Government",
        "Professional",
        "Service",
        "Asset",
        "Medical",
        "Digital",
        "Social",
        "Housing",
        "Identity",
    ];

    const categoryIcons: Record<string, any> = {
        Financial: Landmark,
        Government: Scale,
        Professional: Briefcase,
        Service: Mail,
        Asset: ShieldCheck,
        Medical: Stethoscope,
        Digital: Sparkles,
        Social: Users,
        Housing: Building,
        Identity: ShieldCheck,
    };

    // A writing prompt: adds one reflection question to the draft to write beneath.
    function addWritingPrompt() {
        const prompts = Object.values(reflectionFlows ?? {}).flatMap((flow) => flow.steps.flatMap((step) => step.pool));
        if (!prompts.length) return;
        const prompt = prompts[Math.floor(Math.random() * prompts.length)];
        const template = aiAsset<string>('routes/modules/letters/+page.svelte:writing_prompt_append', {purpose:'letter.draft'});
        const separator = aiAsset<string>('routes/modules/letters/+page.svelte:writing_prompt_separator', {purpose:'letter.draft'});
        if (typeof template !== 'string' || typeof separator !== 'string') return;
        generatedLetter = renderAIAsset(template, { draft: generatedLetter.trimEnd(), separator: generatedLetter ? separator : '', prompt });
    }

    let filteredTemplates = $derived(
        LETTER_TEMPLATES.filter((t) => {
            const matchesSearch =
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.subject.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                filterCategory === "All" || t.category === filterCategory;
            return matchesSearch && matchesCategory;
        }),
    );
</script>

{#snippet recipientPicker()}
    <div class="space-y-2">
        <label
            for="letter-recipient"
            class="block text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
            >Who this letter is for</label
        >
        <select
            id="letter-recipient"
            bind:value={letterRecipientId}
            onchange={() => { recipientChanged = true; }}
            class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm"
        >
            <option value="">Choose someone from your contacts</option>
            {#if recordedRecipientName || recordedRecipientId != null}
                <option value={RECORDED_RECIPIENT}>Keep recorded recipient{recordedRecipientName ? `: ${recordedRecipientName}` : ""}</option>
            {/if}
            {#each contacts as contact (contact.id)}
                <option value={String(contact.id)}
                    >{contact.name}{contact.relation
                        ? ` (${contact.relation})`
                        : ""}</option
                >
            {/each}
        </select>
        {#if recordedRecipientName && !recipientChanged}
            <p class="text-[11px] text-muted-foreground pl-1" data-testid="recorded-letter-recipient">Recorded recipient: {recordedRecipientName}</p>
        {/if}
        {#if contacts.length === 0}
            <p class="text-[11px] text-muted-foreground pl-1">
                People you add in <a
                    href="/modules/contacts"
                    class="text-primary-hover underline">Contacts</a
                > appear here.
            </p>
        {/if}
    </div>
{/snippet}

<LivingBlueprintHeader
    title="Legacy Correspondence"
    subtitle="Preserve your words for the people you love"
    detailedDescription="Write letters for the people you love—ethical wills sharing your values, heartfelt messages to loved ones, or formal notifications to institutions."
    whyMatters="The words you write today will comfort, guide, and inspire your loved ones. These letters become your voice across time, present at the moments that matter."
>
    <div class="flex items-center gap-4">
        {#if savedLetters.length > 0}
            <DataViewToggle module="letters" />
        {/if}
        <div
            class="bg-card border border-border p-4 rounded-2xl flex items-center gap-6 shadow-sm"
        >
            <div class="flex -space-x-3">
                {#each [1, 2, 3] as i}
                    <div
                        class="w-10 h-10 rounded-full border-2 border-card bg-muted flex items-center justify-center"
                    >
                        <FileText size={16} class="text-muted-foreground" />
                    </div>
                {/each}
            </div>
            <div>
                <p
                    class="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                >
                    Your letters
                </p>
                {#if isLoading}
                    <p class="text-sm font-bold text-muted-foreground" data-testid="letters-count">Gathering your letters…</p>
                {:else if savedLetters.length > 0}
                    <p class="text-sm font-bold text-foreground" data-testid="letters-count">
                        {plural(savedLetters.length, "letter", "letters")}
                    </p>
                    <p class="text-xs text-muted-foreground" data-testid="letters-states">{letterStates}</p>
                {:else}
                    <p class="text-sm font-bold text-foreground" data-testid="letters-count">Ready when you are</p>
                {/if}
            </div>
            {#if savedLetters.length > 0}
                <button
                    onclick={() => viewLetter(savedLetters[0])}
                    aria-label="Continue writing your letter"
                    class="p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl transition-all"
                >
                    <ArrowRight size={18} />
                </button>
            {/if}
        </div>
    </div>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex flex-col items-center justify-center gap-3 py-16" role="status" data-testid="letters-loading">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-sm text-muted-foreground">Gathering your letters…</p>
    </div>
{:else}
<div
    class="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700"
>
    {#if mode === "menu"}

        <!-- AI Concierge Drafting Assistant -->
        <AIPromptBar
            context="letters"
            job={retainedWritingJob()}
            onUseDraft={useAssistantDraft}
            promptSource="routes/modules/letters/+page.svelte:prompts"
        />

        <div class="mb-12">
            <GriefSupportBanner compact={true} />
        </div>

        <!-- Essential Actions Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <button
                onclick={() => startEmotionalFlow("ethical_will")}
                class="group relative overflow-hidden bg-card p-10 rounded-2xl border border-border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex gap-8 items-center"
            >
                <div
                    class="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"
                ></div>
                <div
                    class="w-20 h-20 bg-gold/15 text-gold-text rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform"
                >
                    <PenTool size={36} />
                </div>
                <div>
                    <h3
                        class="text-2xl font-black text-foreground mb-2 font-serif"
                    >
                        Draft Ethical Will
                    </h3>
                    <p class="text-muted-foreground text-lg leading-snug">
                        Share your values, life lessons, and hopes for the next
                        generation.
                    </p>
                </div>
                <div
                    class="ml-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                >
                    <ArrowRight size={20} />
                </div>
            </button>

            <button
                onclick={() => startEmotionalFlow("spouse")}
                class="group relative overflow-hidden bg-card p-10 rounded-2xl border border-border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex gap-8 items-center"
            >
                <div
                    class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"
                ></div>
                <div
                    class="w-20 h-20 bg-primary-soft text-primary-hover rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:-rotate-6 transition-transform"
                >
                    <Heart size={36} />
                </div>
                <div>
                    <h3
                        class="text-2xl font-black text-foreground mb-2 font-serif"
                    >
                        Letter to Loved Ones
                    </h3>
                    <p class="text-muted-foreground text-lg leading-snug">
                        Leave a personal, heartfelt message for your spouse or
                        children.
                    </p>
                </div>
                <div
                    class="ml-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                >
                    <ArrowRight size={20} />
                </div>
            </button>
        </div>

        {#if savedLetters.length > 0}
            <!-- Saved letters: reopen to keep writing -->
            <div class="space-y-4" data-testid="saved-letters">
                <h3 class="text-xl font-black text-foreground font-serif">
                    Your letters
                </h3>
                {#if viewMode === "table"}
                    <div class="overflow-x-auto bg-card rounded-2xl border border-border shadow-sm">
                        <table class="w-full text-left text-sm" data-testid="saved-letters-table">
                            <thead class="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                                <tr>
                                    <th class="px-5 py-3">Letter</th>
                                    <th class="px-5 py-3">For</th>
                                    <th class="px-5 py-3">Chosen moment</th>
                                    <th class="px-5 py-3">Status</th>
                                    <th class="px-5 py-3"><span class="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each savedLetters as letter (letter.id)}
                                    <tr class="border-b border-border last:border-0" data-testid="saved-letter-row" data-letter-id={letter.id} data-letter-state={stateOf(letter)}>
                                        <td class="px-5 py-3 font-bold text-foreground">{letter.title}</td>
                                        <td class="px-5 py-3 text-muted-foreground">{letter.recipientName}</td>
                                        <td class="px-5 py-3 text-muted-foreground">
                                            {#if letter.triggerDate}
                                                {new Date(letter.triggerDate + "T00:00:00").toLocaleDateString()}
                                            {/if}
                                            {#if letter.triggerMilestone}
                                                {letter.triggerDate ? " · " : ""}{milestoneLabel(letter.triggerMilestone)}
                                            {/if}
                                        </td>
                                        <td class="px-5 py-3">
                                            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest {stateOf(letter) === 'ready' ? 'bg-primary-soft text-primary-hover' : 'bg-muted text-muted-foreground'}">{letterStateLabel(stateOf(letter))}</span>
                                        </td>
                                        <td class="px-5 py-3 whitespace-nowrap text-right">
                                            <button
                                                onclick={() => viewLetter(letter)}
                                                class="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90"
                                            >
                                                Continue writing
                                            </button>
                                            <button
                                                onclick={() => deleteLetter(letter.id, letter.recipientName || letter.title)}
                                                class="px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground"
                                            >
                                                Remove this letter
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each savedLetters as letter (letter.id)}
                        <div
                            class="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-3"
                            data-testid="saved-letter"
                            data-letter-id={letter.id}
                            data-letter-state={stateOf(letter)}
                        >
                            <div class="flex items-start justify-between gap-3">
                                <h4 class="font-bold text-foreground leading-snug">
                                    {letter.title}
                                </h4>
                                <span
                                    class="shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest {stateOf(letter) === 'ready' ? 'bg-primary-soft text-primary-hover' : 'bg-muted text-muted-foreground'}"
                                    >{letterStateLabel(stateOf(letter))}</span
                                >
                            </div>
                            {#if letter.recipientName}
                                <p class="text-sm text-muted-foreground">
                                    For {letter.recipientName}
                                </p>
                            {/if}
                            {#if letter.triggerDate}
                                <p class="text-xs text-muted-foreground">
                                    {new Date(letter.triggerDate + "T00:00:00").toLocaleDateString()}
                                    · Saved with your chosen date
                                </p>
                            {/if}
                            {#if letter.triggerMilestone}
                                <p class="text-xs text-muted-foreground">
                                    {milestoneLabel(letter.triggerMilestone)}
                                    · Saved with your chosen milestone
                                </p>
                            {/if}
                            <div class="flex items-center gap-1 mt-auto pt-2" data-testid="saved-letter-actions">
                                <button
                                    onclick={() => viewLetter(letter)}
                                    class="shrink-0 whitespace-nowrap px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90"
                                >
                                    Continue writing
                                </button>
                                <button
                                    onclick={() => deleteLetter(letter.id, letter.recipientName || letter.title)}
                                    class="shrink-0 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground"
                                >
                                    Remove this letter
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
                {/if}
            </div>
        {/if}

        <!-- Category Browser -->
        <div class="space-y-8">
            <div
                class="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-border pb-8"
            >
                <div class="flex flex-wrap items-center gap-2">
                    {#each categories as cat}
                        <button
                            onclick={() => (filterCategory = cat)}
                            class="px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wider transition-all {filterCategory ===
                            cat
                                ? 'bg-primary text-primary-foreground shadow-xl'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border'}"
                        >
                            {cat}
                        </button>
                    {/each}
                </div>

                <div class="relative w-full md:w-80">
                    <Search
                        class="absolute left-4 top-3.5 text-muted-foreground"
                        size={18}
                    />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        aria-label="Search templates"
                        placeholder="Search templates..."
                        class="w-full px-4 py-3 pl-12 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                    />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredTemplates as template (template.id)}
                    {@const Icon = categoryIcons[ template.category ] || FileText}
                    <button
                        onclick={() => selectTransactional(template)}
                        class="group bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between min-h-[160px]"
                    >
                        <div>
                            <div class="flex items-center gap-3 mb-4">
                                <div
                                    class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                                >
                                    <Icon
                                        size={20}
                                    />
                                </div>
                                <span
                                    class="text-[10px] font-black uppercase tracking-widest text-primary"
                                    >{template.category}</span
                                >
                            </div>
                            <h3
                                class="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors"
                            >
                                {template.title}
                            </h3>
                        </div>
                        <div
                            class="flex items-center justify-between mt-6"
                        >
                            <span
                                class="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter"
                                >Draft Template</span
                            >
                            <ArrowRight size={16} class="text-primary" />
                        </div>
                    </button>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Variable Input Mode -->
    {#if mode === "variable_input" && selectedTemplate}
        <div class="max-w-3xl mx-auto space-y-12" in:fade>
            <div class="flex items-center justify-between">
                <button
                    onclick={resetSelection}
                    class="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Library
                </button>
                {#if filledFromProfile}
                    <div
                        class="flex items-center gap-2 px-4 py-2 bg-primary-soft text-primary-hover rounded-full text-xs font-bold"
                    >
                        <Sparkles size={14} />
                        <span>Auto-mapped from Estate Profile</span>
                    </div>
                {/if}
            </div>

            <div
                class="bg-card p-12 rounded-2xl border border-border shadow-2xl shadow-slate-900/5 space-y-10"
            >
                <div class="text-center space-y-2">
                    <h2 class="text-3xl font-black text-foreground font-serif">
                        Customize {selectedTemplate.title}
                    </h2>
                    <p class="text-muted-foreground">
                        Share a few details and we'll fill in your formal
                        letter.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {#each detectedVariables as variable, i}
                        <div class="space-y-3">
                            <label
                                for="letter-var-{i}"
                                class="block text-[11px] font-black text-foreground uppercase tracking-widest pl-1"
                                >{variable}</label
                            >
                            <input
                                id="letter-var-{i}"
                                type="text"
                                bind:value={templateVariables[variable]}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                                placeholder="Share {variable.toLowerCase()}..."
                            />
                        </div>
                    {/each}
                </div>

                <div class="pt-8 flex items-center justify-center gap-6">
                    <button
                        onclick={applyVariables}
                        class="text-sm font-black text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors"
                    >
                        Continue with blank fields
                    </button>
                    <button
                        onclick={applyVariables}
                        class="px-12 py-5 bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90 rounded-xl"
                    >
                        Create my document
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Transactional Preview Mode -->
    {#if mode === "transactional_preview" && selectedTemplate}
        <div
            class="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12"
        >
            <div class="lg:col-span-2 space-y-8">
                <div class="flex items-center justify-between gap-4">
                    <button aria-label="Back to Your letters"
                        onclick={returnToMenu}
                        class="p-4 bg-card border border-border rounded-2xl text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div class="flex-1">
                        <h2
                            class="text-3xl font-black text-foreground font-serif leading-tight"
                        >
                            {selectedTemplate.title}
                        </h2>
                        <p
                            class="text-muted-foreground font-bold text-xs uppercase tracking-widest mt-1"
                        >
                            Review & Refine Draft
                        </p>
                    </div>
                    <button aria-label="Save my letter"
                        onclick={saveToVault}
                        disabled={saving}
                        aria-busy={saving}
                        class="p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>

                <div
                    class="bg-primary/5 border border-primary/20 p-8 rounded-2xl flex gap-6 items-center"
                >
                    <div
                        class="w-14 h-14 bg-primary-soft text-primary-hover rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                    >
                        <FileText size={28} />
                    </div>
                    <div>
                        <h4
                            class="font-black text-foreground uppercase tracking-tighter text-sm"
                        >
                            Audience: {selectedTemplate.audience}
                        </h4>
                        <p
                            class="text-muted-foreground text-sm font-medium leading-relaxed mt-1"
                        >
                            Review the names, facts, your role, and any documents
                            or access instructions before sharing this draft. For
                            an institution, confirm its current process before sending it.
                        </p>
                    </div>
                </div>

                <div class="max-w-md">
                    {@render recipientPicker()}
                </div>

                <textarea
                    data-template-editor
                    bind:value={generatedLetter}
                    aria-label="Your letter"
                    placeholder="Your draft will appear here once you've shared a few details."
                    class="block w-full bg-card p-12 rounded-2xl border shadow-2xl shadow-slate-900/5 font-mono text-base leading-relaxed text-slate-800 h-[600px] resize-none paper-texture ring-8 ring-muted/50 focus:outline-none focus:border-primary"
                ></textarea>
            </div>

            <!-- Guidance Sidebar -->
            <div class="space-y-8 lg:pt-24">
                {#if selectedTemplate.requiredDocs && selectedTemplate.requiredDocs.length > 0}
                    <div
                        class="bg-card p-8 rounded-2xl border border-border shadow-sm space-y-6"
                        in:slide
                    >
                        <h4
                            class="font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-3"
                        >
                            <span
                                class="w-4 h-4 bg-primary-soft text-primary-hover rounded-lg flex items-center justify-center"
                                ><CircleCheck size={10} /></span
                            >
                            Documents and details to confirm
                        </h4>
                        <ul class="space-y-4">
                            {#each selectedTemplate.requiredDocs as doc}
                                <li
                                    class="flex items-start gap-3 bg-muted p-4 rounded-xl border border-border/50"
                                >
                                    <div
                                        class="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"
                                    ></div>
                                    <span
                                        class="text-sm font-bold text-muted-foreground leading-snug"
                                        >{doc}</span
                                    >
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                {#if selectedTemplate.followUp}
                    <div
                        class="bg-card p-8 rounded-2xl border border-border shadow-sm space-y-4"
                        in:slide
                    >
                        <h4
                            class="font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-3"
                        >
                            <Sparkles size={16} class="text-gold-text" />
                            Follow-up question
                        </h4>
                        <p
                            class="text-sm text-muted-foreground leading-relaxed font-medium italic"
                        >
                            "{selectedTemplate.followUp}"
                        </p>
                    </div>
                {/if}

                <div class="grid grid-cols-2 gap-3">
                    <button
                        onclick={printLetter}
                        disabled={!generatedLetter.trim()}
                        class="py-3 rounded-xl font-bold text-muted-foreground bg-card border border-border hover:bg-muted flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        onclick={downloadLetterPDF}
                        disabled={pdfBusy || !generatedLetter.trim()}
                        aria-busy={pdfBusy}
                        class="py-3 rounded-xl font-bold text-muted-foreground bg-card border border-border hover:bg-muted flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Download size={16} /> Download PDF
                    </button>
                </div>

                <button
                    onclick={saveToVault}
                    disabled={saving}
                    aria-busy={saving}
                    class="w-full bg-primary text-primary-foreground p-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save my letter"} <ArrowRight size={20} />
                </button>
            </div>
        </div>
    {/if}

    {#if mode === "review"}
        <div class="max-w-[1400px] mx-auto space-y-8" in:fade={{ duration: 150 }}>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <button
                        onclick={returnToMenu}
                        class="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground"
                        aria-label="Back to Your letters"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2
                            class="text-3xl font-black text-foreground font-serif"
                        >
                            Refine Your Draft
                        </h2>
                        <p
                            class="text-[10px] font-black text-primary-hover uppercase tracking-[0.2em] mt-1 italic"
                        >
                            Personal Reflection in Progress
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button
                        onclick={addWritingPrompt}
                        data-testid="writing-prompt"
                        title="Adds a reflection question to your draft"
                        class="flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all bg-card border border-border text-muted-foreground hover:bg-muted"
                    >
                        <Sparkles size={18} class="text-primary" />
                        A gentle prompt
                    </button>
                    <button
                        onclick={printLetter}
                        disabled={!generatedLetter.trim()}
                        class="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm bg-card border border-border text-muted-foreground hover:bg-muted transition-all disabled:opacity-50"
                    >
                        <Printer size={18} /> Print
                    </button>
                    <button
                        onclick={downloadLetterPDF}
                        disabled={pdfBusy || !generatedLetter.trim()}
                        aria-busy={pdfBusy}
                        class="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm bg-card border border-border text-muted-foreground hover:bg-muted transition-all disabled:opacity-50"
                    >
                        <Download size={18} /> Download PDF
                    </button>
                    <button
                        onclick={saveToVault}
                        disabled={saving}
                        aria-busy={saving}
                        class="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? "Saving..." : "Save my letter"}
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Editor Column -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Legacy Trigger Settings (New Feature) -->
                    <div
                        class="bg-primary/5 border border-primary/20 p-8 rounded-2xl space-y-6"
                    >
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {@render recipientPicker()}
                            <div class="space-y-2">
                                <span
                                    class="block text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >When they can read it</span
                                >
                                <label
                                    class="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        bind:checked={letterHold}
                                        class="mt-1 accent-primary"
                                        data-testid="letter-hold"
                                    />
                                    <span class="text-sm text-foreground">
                                        <span class="font-bold">Keep on hold</span><br />
                                        <span class="text-xs text-muted-foreground"
                                            data-testid="letter-readiness-hint"
                                            >{editorReadState === 'held'
                                                ? "This letter stays with you until you release it."
                                                : editorReadState === 'institution'
                                                    ? "Saved as an institution draft for printing or sending when you choose."
                                                    : editorReadState === 'ready'
                                                        ? "Ready for them to read in their view."
                                                        : !generatedLetter.trim()
                                                            ? "Your letter is waiting for its first words."
                                                            : "Choose someone from your contacts to prepare their view."}</span
                                        >
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <History size={20} class="text-primary" />
                            <h4
                                class="font-bold text-foreground uppercase tracking-widest text-xs"
                            >
                                A date or milestone that matters
                            </h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label
                                    for="letter-release-date"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Chosen date</label
                                >
                                <input
                                    id="letter-release-date"
                                    type="date"
                                    bind:value={letterTriggerDate}
                                    class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="letter-milestone"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Or a milestone</label
                                >
                                <select
                                    id="letter-milestone"
                                    bind:value={letterTriggerMilestone}
                                    class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground appearance-none"
                                >
                                    <option value=""
                                        >Choose a milestone, if you like</option
                                    >
                                    <option value="grad"
                                        >College Graduation</option
                                    >
                                    <option value="wedding">Wedding Day</option>
                                    <option value="parent"
                                        >Becoming a Parent</option
                                    >
                                    <option value="home">First Home</option>
                                </select>
                            </div>
                        </div>
                        <p
                            class="text-[10px] text-muted-foreground font-medium italic"
                        >
                            Saved with your chosen date or milestone, and shown
                            with the letter.
                        </p>

                        <!-- Custom Fields -->
                        <div class="pt-4 mt-4 border-t border-primary/20">
                            <CustomFieldsManager
                                entityType="letter"
                                bind:data={customAttributes}
                            />
                        </div>
                    </div>

                    <div class="relative group">
                        <div
                            class="absolute -inset-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"
                        ></div>
                        <div
                            data-letter-editor
                            class="relative bg-[#FDFBF7] p-16 rounded-2xl border border-border shadow-2xl font-serif text-xl leading-[2] text-slate-800 paper-texture ring-8 ring-muted/30 min-h-[700px]"
                        >
                            <SmartTextarea
                                bind:value={generatedLetter}
                                job={writingJob()}
                                label="Refine Your Draft"
                                hideLabel
                                placeholder="Begin typing your legacy here..."
                                context="letter"
                                minimal={true}
                                minHeight="600px"
                            />
                        </div>
                    </div>
                </div>

                <!-- Sidebar Column -->
                <div class="space-y-6">
                    <LetterAssistant
                        currentContent={generatedLetter}
                        job={writingJob()}
                        onupdate={(content: string) =>
                            (generatedLetter = content)}
                    />

                    <!-- Status card: what is true about where a letter is kept -->
                    <div class="space-y-4">
                        <div
                            class="bg-success/10 p-6 rounded-2xl border border-success/20 flex gap-4"
                            data-testid="letter-kept-note"
                        >
                            <div
                                class="w-10 h-10 bg-primary-soft text-primary-hover rounded-xl flex items-center justify-center shrink-0"
                            >
                                <Save size={20} />
                            </div>
                            <div>
                                <h4
                                    class="font-black text-success text-xs uppercase tracking-widest mb-1"
                                >
                                    Kept in your account
                                </h4>
                                <p
                                    class="text-[11px] text-foreground font-medium leading-tight"
                                >
                                    Each time you choose Save my letter, this letter is kept in your account, ready to open and continue on any device.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Emotional Interview Mode -->
    {#if mode === "emotional_interview" && emotionalFlow}
        <div class="max-w-3xl mx-auto space-y-12" in:fade>
            <div class="flex items-center justify-between">
                <div class="flex gap-2">
                    {#each [0, 1, 2] as i}
                        <div
                            class="w-12 h-2 rounded-full {i <=
                            currentPromptIndex
                                ? 'bg-primary'
                                : 'bg-border'} transition-all duration-500"
                        ></div>
                    {/each}
                </div>
                <button
                    onclick={resetSelection}
                    class="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                    Maybe later
                </button>
            </div>

            <div class="space-y-6">
                <p
                    class="text-[10px] font-black uppercase tracking-[0.3em] text-primary-hover text-center"
                >
                    Step {currentPromptIndex + 1} of 3
                </p>
                <div class="flex flex-col items-center gap-4 px-4">
                    <h2
                        class="text-4xl font-black text-foreground font-serif leading-tight text-center"
                    >
                        {currentQuestion}
                    </h2>
                    <RefreshControl
                        onRefresh={refreshQuestion}
                        label="New Question"
                    />
                </div>
            </div>

            <div class="relative group">
                <div
                    class="absolute -inset-4 bg-gradient-to-b from-primary/10 to-transparent rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity"
                ></div>
                {#key currentPromptIndex}
                    <div
                        data-reflection-box
                        class="relative w-full min-h-80 bg-card border-2 border-border rounded-2xl shadow-2xl focus-within:border-primary transition-all p-8"
                    >
                        <SmartTextarea
                            bind:value={reflections[currentPromptIndex]}
                            job={{ ...writingJob(), job_id: `${writingJob().job_id}:reflection:${currentPromptIndex}` }}
                            context="letter"
                            label={currentQuestion}
                            question={currentQuestion}
                            oninput={recordReflection}
                            hideLabel
                            minimal={true}
                            minHeight="16rem"
                            placeholder="Reflect here..."
                            suggestions={currentSuggestions}
                        />
                    </div>
                {/key}
            </div>

            <div class="flex items-center justify-center pt-8">
                <button
                    onclick={nextEmotionalPrompt}
                    disabled={!reflections[currentPromptIndex]}
                    class="group flex items-center gap-4 bg-primary text-primary-foreground px-16 py-6 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                >
                    {currentPromptIndex === 2
                        ? "Create my letter"
                        : "Continue when ready"}
                    <div
                        class="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center group-hover:translate-x-2 transition-transform"
                    >
                        <ArrowRight size={24} />
                    </div>
                </button>
            </div>
        </div>
    {/if}
</div>
{/if}

<style>
    .paper-texture {
        background-color: #fdfbf7;
        background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    }

    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }
</style>
