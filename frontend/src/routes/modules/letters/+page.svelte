<script lang="ts">
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
    import { onMount, tick, untrack } from "svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import LetterAssistant from "$lib/components/modules/letters/LetterAssistant.svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import { REFLECTION_POOLS } from "$lib/data/reflectionPools";
    import RefreshControl from "$lib/components/ui/RefreshControl.svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    import GriefSupportBanner from "$lib/components/GriefSupportBanner.svelte";
    import { lettersSync, type Letter } from "$lib/stores/letterStore.svelte";
    import { contactSync } from "$lib/stores/familyStore.svelte";

    // One owner for the letters table: the store's 'letters' manager.
    const letterSync = lettersSync;
    let savedLetters = $derived(letterSync.items);
    let contacts = $derived(contactSync.items);

    const MILESTONE_LABELS: Record<string, string> = {
        grad: "College Graduation",
        wedding: "Wedding Day",
        parent: "Becoming a Parent",
        home: "First Home",
    };

    let searchQuery = $state("");
    // A gentle cue until the first server answer, unless this device already holds letters.
    let firstSyncPending = $derived(letterSync.lastSync === null && letterSync.status !== "error");
    let isLoading = $derived(firstSyncPending && savedLetters.length === 0);
    // Header summary, in the same words as the letter cards ("Ready to read" / "On hold").
    // Local plural until the shared helper (card X58) reaches main.
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    let heldCount = $derived(savedLetters.filter((l) => l.isLocked).length);
    let readyCount = $derived(savedLetters.length - heldCount);
    let letterStates = $derived(
        [readyCount > 0 ? `${readyCount} ready to read` : "", heldCount > 0 ? `${heldCount} on hold` : ""]
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
        if (!generatedLetter) {
            notifications.showError({
                message:
                    "The letter content appears to be empty. Please go back and try again.",
                code: "EMPTY_CONTENT",
            });
            return;
        }

        const title = emotionalFlow
            ? emotionalFlow === "spouse"
                ? "Letter to Loved One"
                : "Ethical Will"
            : selectedTemplate?.title || "Draft Letter";

        const recipient = contacts.find((c) => String(c.id) === letterRecipientId);
        const details = {
            content: generatedLetter,
            recipientName: recipient?.name ?? "",
            recipientContactId: recipient ? Number(recipient.id) : null,
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
                type: emotionalFlow ? "emotional" : "transactional",
            } as Letter, false, false, saveToVault);

        activityLog.logEvent({
            module: "Letters",
            action: editingId !== null ? "UPDATE" : "CREATE",
            entityType: "Draft",
            entityId: saved.id,
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

    // Per-letter details; cleared whenever a new letter is started.
    function clearLetterDetails() {
        editingId = null;
        letterRecipientId = "";
        letterTriggerDate = "";
        letterTriggerMilestone = "";
        letterHold = false;
        customAttributes = {};
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
            !confirm(
                `Remove the letter to "${name}"? You can always start over if you feel like it later.`,
            )
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
        generatedLetter = letter.content;
        editingId = letter.id;
        letterRecipientId = letter.recipientContactId != null
            ? String(letter.recipientContactId)
            : String(contacts.find((c) => c.name === letter.recipientName)?.id ?? "");
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

    // Emotional State
    let emotionalFlow = $state<"spouse" | "ethical_will" | null>(null);
    let emotionalReflections = $state({
        memory: "",
        values: "",
        hopes: "",
    });
    let currentPromptIndex = $state(0);
    let currentQuestion = $state("");

    function refreshQuestion() {
        if (!emotionalFlow) return;
        const pool =
            REFLECTION_POOLS.letters[emotionalFlow].steps[currentPromptIndex]
                .pool;
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

    // Details of the letter being written or reopened
    let editingId = $state<number | string | null>(null);
    let letterRecipientId = $state("");
    let letterTriggerDate = $state("");
    let letterTriggerMilestone = $state("");
    let letterHold = $state(false);

    function startEmotionalFlow(flow: "spouse" | "ethical_will") {
        clearLetterDetails();
        emotionalFlow = flow;
        mode = "emotional_interview";
        currentPromptIndex = 0;
        emotionalReflections = { memory: "", values: "", hopes: "" };
        refreshQuestion();
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

    function selectTransactional(template: LetterTemplate) {
        clearLetterDetails();
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
        if (emotionalFlow === "spouse") {
            generatedLetter = `My Dearest,\n\nI was sitting here thinking about us, and my mind drifted to that time: ${emotionalReflections.memory}. It still makes me smile.\n\nI want you to know how much I admire you. Specifically, ${emotionalReflections.values}. You have always been my rock.\n\nMy greatest wish for you is this: ${emotionalReflections.hopes}. Be happy, live fully, and know that you were loved beyond measure.\n\nForever yours,\n[Your Name]`;
        } else {
            generatedLetter = `To My Family,\n\nAs I look back on my life, I want to leave you with more than just things. I want to share who I was and what I believed in.\n\nMy life was guided by three core values: ${emotionalReflections.values}. I hope they serve you as well as they served me.\n\nI learned many lessons, but the most important was: ${emotionalReflections.memory}. Don't make the same mistake I did—or if you do, forgive yourself quickly.\n\nWhen times are tough, remember: ${emotionalReflections.hopes}.\n\nWith all my love,\n[Your Name]`;
        }
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
    const WRITING_PROMPTS = Object.values(REFLECTION_POOLS.letters).flatMap((flow) =>
        flow.steps.flatMap((step) => step.pool),
    );

    function addWritingPrompt() {
        const prompt = WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
        generatedLetter = (generatedLetter ? generatedLetter.trimEnd() + "\n\n" : "") + prompt + "\n";
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

<LivingBlueprintHeader
    title="Legacy Correspondence"
    subtitle="Preserve your words for the people you love"
    tier="legacy"
    detailedDescription="Write letters for the people you love—ethical wills sharing your values, heartfelt messages to loved ones, or formal notifications to institutions."
    whyMatters="The words you write today will comfort, guide, and inspire your loved ones when you're no longer here to say them yourself. These letters become your voice across time, offering presence at moments you can't physically attend."
>
    <div class="flex items-center gap-4">
        {#if savedLetters.length > 0}
            <DataViewToggle module="letters" />
        {/if}
        <div
            class="bg-[#FDFBF7] border border-stone-200 p-4 rounded-2xl flex items-center gap-6 shadow-sm"
        >
            <div class="flex -space-x-3">
                {#each [1, 2, 3] as i}
                    <div
                        class="w-10 h-10 rounded-full border-2 border-[#FDFBF7] bg-stone-100 flex items-center justify-center"
                    >
                        <FileText size={16} class="text-stone-400" />
                    </div>
                {/each}
            </div>
            <div>
                <p
                    class="text-[10px] font-black uppercase tracking-widest text-stone-400"
                >
                    Your letters
                </p>
                {#if isLoading}
                    <p class="text-sm font-bold text-slate-500" data-testid="letters-count">Gathering your letters…</p>
                {:else if savedLetters.length > 0}
                    <p class="text-sm font-bold text-slate-700" data-testid="letters-count">
                        {plural(savedLetters.length, "letter", "letters")}
                    </p>
                    <p class="text-xs text-slate-500" data-testid="letters-states">{letterStates}</p>
                {:else}
                    <p class="text-sm font-bold text-slate-700" data-testid="letters-count">Ready when you are</p>
                {/if}
            </div>
            {#if savedLetters.length > 0}
                <button
                    onclick={() => viewLetter(savedLetters[0])}
                    aria-label="Continue writing your letter"
                    class="p-2 bg-stone-100 hover:bg-[#4A7C74] hover:text-white rounded-xl transition-all"
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
        <p class="text-sm text-slate-500">Gathering your letters…</p>
    </div>
{:else}
<div
    class="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700"
>
    {#if mode === "menu"}

        <!-- AI Concierge Drafting Assistant -->
        <AIPromptBar
            context="letters"
            prompts={[
                "Help me write a letter to my daughter...",
                "Draft a note expressing my forgiveness...",
                "Write an ethical will sharing my values...",
                "Help me craft a goodbye message to my spouse..."
            ]}
        />

        <div class="mb-12">
            <GriefSupportBanner compact={true} />
        </div>

        <!-- Essential Actions Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <button
                onclick={() => startEmotionalFlow("ethical_will")}
                class="group relative overflow-hidden bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex gap-8 items-center"
            >
                <div
                    class="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"
                ></div>
                <div
                    class="w-20 h-20 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform"
                >
                    <PenTool size={36} />
                </div>
                <div>
                    <h3
                        class="text-2xl font-black text-slate-900 mb-2 font-serif"
                    >
                        Draft Ethical Will
                    </h3>
                    <p class="text-slate-500 text-lg leading-snug">
                        Share your values, life lessons, and hopes for the next
                        generation.
                    </p>
                </div>
                <div
                    class="ml-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#4A7C74] group-hover:text-white transition-all"
                >
                    <ArrowRight size={20} />
                </div>
            </button>

            <button
                onclick={() => startEmotionalFlow("spouse")}
                class="group relative overflow-hidden bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex gap-8 items-center"
            >
                <div
                    class="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"
                ></div>
                <div
                    class="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:-rotate-6 transition-transform"
                >
                    <Heart size={36} />
                </div>
                <div>
                    <h3
                        class="text-2xl font-black text-slate-900 mb-2 font-serif"
                    >
                        Letter to Loved Ones
                    </h3>
                    <p class="text-slate-500 text-lg leading-snug">
                        Leave a personal, heartfelt message for your spouse or
                        children.
                    </p>
                </div>
                <div
                    class="ml-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                >
                    <ArrowRight size={20} />
                </div>
            </button>
        </div>

        {#if savedLetters.length > 0}
            <!-- Saved letters: reopen to keep writing -->
            <div class="space-y-4" data-testid="saved-letters">
                <h3 class="text-xl font-black text-slate-900 font-serif">
                    Your letters
                </h3>
                {#if viewMode === "table"}
                    <div class="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <table class="w-full text-left text-sm" data-testid="saved-letters-table">
                            <thead class="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
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
                                    <tr class="border-b border-slate-50 last:border-0" data-testid="saved-letter-row">
                                        <td class="px-5 py-3 font-bold text-slate-900">{letter.title}</td>
                                        <td class="px-5 py-3 text-slate-600">{letter.recipientName}</td>
                                        <td class="px-5 py-3 text-slate-500">
                                            {#if letter.triggerDate}
                                                {new Date(letter.triggerDate + "T00:00:00").toLocaleDateString()}
                                            {/if}
                                            {#if letter.triggerMilestone}
                                                {letter.triggerDate ? " · " : ""}{MILESTONE_LABELS[letter.triggerMilestone] ?? letter.triggerMilestone}
                                            {/if}
                                        </td>
                                        <td class="px-5 py-3">
                                            {#if letter.isLocked}
                                                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-600">On hold</span>
                                            {:else}
                                                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary">Ready to read</span>
                                            {/if}
                                        </td>
                                        <td class="px-5 py-3 whitespace-nowrap text-right">
                                            <button
                                                onclick={() => viewLetter(letter)}
                                                class="px-3 py-1.5 rounded-lg bg-[#4A7C74] text-white text-xs font-bold hover:opacity-90"
                                            >
                                                Continue writing
                                            </button>
                                            <button
                                                onclick={() => deleteLetter(letter.id, letter.recipientName || letter.title)}
                                                class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900"
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
                            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3"
                            data-testid="saved-letter"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <h4 class="font-bold text-slate-900 leading-snug">
                                    {letter.title}
                                </h4>
                                {#if letter.isLocked}
                                    <span
                                        class="shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-600"
                                        >On hold</span
                                    >
                                {:else}
                                    <span
                                        class="shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary"
                                        >Ready to read</span
                                    >
                                {/if}
                            </div>
                            {#if letter.recipientName}
                                <p class="text-sm text-slate-600">
                                    For {letter.recipientName}
                                </p>
                            {/if}
                            {#if letter.triggerDate}
                                <p class="text-xs text-slate-500">
                                    {new Date(letter.triggerDate + "T00:00:00").toLocaleDateString()}
                                    · Saved with your chosen date
                                </p>
                            {/if}
                            {#if letter.triggerMilestone}
                                <p class="text-xs text-slate-500">
                                    {MILESTONE_LABELS[letter.triggerMilestone] ?? letter.triggerMilestone}
                                    · Saved with your chosen milestone
                                </p>
                            {/if}
                            <div class="flex items-center gap-1 mt-auto pt-2" data-testid="saved-letter-actions">
                                <button
                                    onclick={() => viewLetter(letter)}
                                    class="shrink-0 whitespace-nowrap px-4 py-2 rounded-xl bg-[#4A7C74] text-white text-sm font-bold hover:opacity-90"
                                >
                                    Continue writing
                                </button>
                                <button
                                    onclick={() => deleteLetter(letter.id, letter.recipientName || letter.title)}
                                    class="shrink-0 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900"
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
                class="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-slate-100 pb-8"
            >
                <div class="flex flex-wrap items-center gap-2">
                    {#each categories as cat}
                        <button
                            onclick={() => (filterCategory = cat)}
                            class="px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wider transition-all {filterCategory ===
                            cat
                                ? 'bg-slate-900 text-white shadow-xl'
                                : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'}"
                        >
                            {cat}
                        </button>
                    {/each}
                </div>

                <div class="relative w-full md:w-80">
                    <Search
                        class="absolute left-4 top-3.5 text-slate-400"
                        size={18}
                    />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Search templates..."
                        class="w-full px-4 py-3 pl-12 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                    />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredTemplates as template (template.id)}
                    <button
                        onclick={() => selectTransactional(template)}
                        class="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between min-h-[160px]"
                    >
                        <div>
                            <div class="flex items-center gap-3 mb-4">
                                <div
                                    class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#4A7C74] group-hover:text-white transition-all"
                                >
                                    <svelte:component
                                        this={categoryIcons[
                                            template.category
                                        ] || FileText}
                                        size={20}
                                    />
                                </div>
                                <span
                                    class="text-[10px] font-black uppercase tracking-widest text-primary"
                                    >{template.category}</span
                                >
                            </div>
                            <h3
                                class="text-xl font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors"
                            >
                                {template.title}
                            </h3>
                        </div>
                        <div
                            class="flex items-center justify-between mt-6 opacity-40 group-hover:opacity-100 transition-opacity"
                        >
                            <span
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"
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
                    class="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Library
                </button>
                {#if filledFromProfile}
                    <div
                        class="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold"
                    >
                        <Sparkles size={14} />
                        <span>Auto-mapped from Estate Profile</span>
                    </div>
                {/if}
            </div>

            <div
                class="bg-white p-12 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-900/5 space-y-10"
            >
                <div class="text-center space-y-2">
                    <h2 class="text-3xl font-black text-slate-900 font-serif">
                        Customize {selectedTemplate.title}
                    </h2>
                    <p class="text-slate-500">
                        Provide the specific details to populate your formal
                        document.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {#each detectedVariables as variable, i}
                        <div class="space-y-3">
                            <label
                                for="letter-var-{i}"
                                class="block text-[11px] font-black text-slate-800 uppercase tracking-widest pl-1"
                                >{variable}</label
                            >
                            <input
                                id="letter-var-{i}"
                                type="text"
                                bind:value={templateVariables[variable]}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                placeholder="Enter {variable.toLowerCase()}..."
                            />
                        </div>
                    {/each}
                </div>

                <div class="pt-8 flex items-center justify-center gap-6">
                    <button
                        onclick={() => {
                            generatedLetter = selectedTemplate?.body || "";
                            mode = "transactional_preview";
                        }}
                        class="text-sm font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
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
                        onclick={() => (mode = "menu")}
                        class="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div class="flex-1">
                        <h2
                            class="text-3xl font-black text-slate-900 font-serif leading-tight"
                        >
                            {selectedTemplate.title}
                        </h2>
                        <p
                            class="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1"
                        >
                            Review & Refine Draft
                        </p>
                    </div>
                    <button aria-label="Save my letter"
                        onclick={saveToVault}
                        disabled={saving}
                        aria-busy={saving}
                        class="p-4 bg-[#4A7C74] text-white rounded-2xl shadow-xl shadow-[#4A7C74]/20"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>

                <div
                    class="bg-indigo-50/50 border border-indigo-100 p-8 rounded-2xl flex gap-6 items-center"
                >
                    <div
                        class="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                    >
                        <FileText size={28} />
                    </div>
                    <div>
                        <h4
                            class="font-black text-indigo-900 uppercase tracking-tighter text-sm"
                        >
                            Audience: {selectedTemplate.audience}
                        </h4>
                        <p
                            class="text-indigo-800/70 text-sm font-medium leading-relaxed mt-1"
                        >
                            This letter is structured to satisfy typical
                            requirements for {selectedTemplate.category?.toLowerCase() ||
                                "general"}
                            institutions.
                        </p>
                    </div>
                </div>

                <div
                    class="bg-white p-12 rounded-2xl border shadow-2xl shadow-slate-900/5 font-mono text-base leading-relaxed whitespace-pre-wrap text-slate-700 h-[600px] overflow-y-auto paper-texture ring-8 ring-slate-50/50"
                >
                    {generatedLetter ||
                        "(Empty draft - please go back and fill in the form)"}
                </div>
            </div>

            <!-- Guidance Sidebar -->
            <div class="space-y-8 lg:pt-24">
                {#if selectedTemplate.requiredDocs && selectedTemplate.requiredDocs.length > 0}
                    <div
                        class="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6"
                        in:slide
                    >
                        <h4
                            class="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-3"
                        >
                            <span
                                class="w-4 h-4 bg-primary/10 text-primary rounded-lg flex items-center justify-center"
                                ><CircleCheck size={10} /></span
                            >
                            Required Documents
                        </h4>
                        <ul class="space-y-4">
                            {#each selectedTemplate.requiredDocs as doc}
                                <li
                                    class="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100/50"
                                >
                                    <div
                                        class="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"
                                    ></div>
                                    <span
                                        class="text-sm font-bold text-slate-600 leading-snug"
                                        >{doc}</span
                                    >
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                {#if selectedTemplate.followUp}
                    <div
                        class="bg-[#FDFBF7] p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4"
                        in:slide
                    >
                        <h4
                            class="font-black text-stone-900 uppercase tracking-widest text-xs flex items-center gap-3"
                        >
                            <Sparkles size={16} class="text-amber-500" />
                            Expert Advice
                        </h4>
                        <p
                            class="text-sm text-stone-600 leading-relaxed font-medium italic"
                        >
                            "{selectedTemplate.followUp}"
                        </p>
                    </div>
                {/if}

                <button
                    onclick={saveToVault}
                    disabled={saving}
                    aria-busy={saving}
                    class="w-full bg-slate-900 text-white p-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
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
                        onclick={() => (mode = "menu")}
                        class="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900"
                        aria-label="Back to Your letters"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2
                            class="text-3xl font-black text-slate-900 font-serif"
                        >
                            Refine Your Draft
                        </h2>
                        <p
                            class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic"
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
                        class="flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                        <Sparkles size={18} class="text-primary" />
                        A gentle prompt
                    </button>
                    <button
                        onclick={saveToVault}
                        disabled={saving}
                        aria-busy={saving}
                        class="flex items-center gap-2 px-8 py-3 bg-[#4A7C74] text-white rounded-xl font-black shadow-xl shadow-[#4A7C74]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
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
                        class="bg-indigo-50/50 border border-indigo-100 p-8 rounded-2xl space-y-6"
                    >
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label
                                    for="letter-recipient"
                                    class="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Who this letter is for</label
                                >
                                <select
                                    id="letter-recipient"
                                    bind:value={letterRecipientId}
                                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 text-sm"
                                >
                                    <option value="">Choose someone from your contacts</option>
                                    {#each contacts as contact (contact.id)}
                                        <option value={String(contact.id)}
                                            >{contact.name}{contact.relation
                                                ? ` (${contact.relation})`
                                                : ""}</option
                                        >
                                    {/each}
                                </select>
                                {#if contacts.length === 0}
                                    <p class="text-[11px] text-slate-500 pl-1">
                                        People you add in <a
                                            href="/modules/contacts"
                                            class="text-primary underline">Contacts</a
                                        > appear here.
                                    </p>
                                {/if}
                            </div>
                            <div class="space-y-2">
                                <span
                                    class="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >When they can read it</span
                                >
                                <label
                                    class="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        bind:checked={letterHold}
                                        class="mt-1 accent-[#4A7C74]"
                                        data-testid="letter-hold"
                                    />
                                    <span class="text-sm text-slate-700">
                                        <span class="font-bold">Keep on hold</span><br />
                                        <span class="text-xs text-slate-500"
                                            >{letterHold
                                                ? "This letter stays with you until you release it."
                                                : "Ready for them to read in their view."}</span
                                        >
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <History size={20} class="text-primary" />
                            <h4
                                class="font-bold text-slate-900 uppercase tracking-widest text-xs"
                            >
                                A date or milestone that matters
                            </h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label
                                    for="letter-release-date"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Specific Release Date</label
                                >
                                <input
                                    id="letter-release-date"
                                    type="date"
                                    bind:value={letterTriggerDate}
                                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="letter-milestone"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Or Lifecycle Milestone</label
                                >
                                <select
                                    id="letter-milestone"
                                    bind:value={letterTriggerMilestone}
                                    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 appearance-none"
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
                            class="text-[10px] text-primary/60 font-medium italic"
                        >
                            Saved with your chosen date or milestone, and shown
                            with the letter.
                        </p>

                        <!-- Custom Fields -->
                        <div class="pt-4 mt-4 border-t border-indigo-100">
                            <CustomFieldsManager
                                entityType="letter"
                                bind:data={customAttributes}
                            />
                        </div>
                    </div>

                    <div class="relative group">
                        <div
                            class="absolute -inset-4 bg-gradient-to-r from-[#4A7C74]/5 to-blue-500/5 rounded-2xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"
                        ></div>
                        <div
                            data-letter-editor
                            class="relative bg-[#FDFBF7] p-16 rounded-2xl border border-stone-200 shadow-2xl font-serif text-xl leading-[2] text-stone-800 paper-texture ring-8 ring-stone-50/30 min-h-[700px]"
                        >
                            <SmartTextarea
                                bind:value={generatedLetter}
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
                        onupdate={(content: string) =>
                            (generatedLetter = content)}
                    />

                    <!-- Status card: what is true about where a letter is kept -->
                    <div class="space-y-4">
                        <div
                            class="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex gap-4"
                            data-testid="letter-kept-note"
                        >
                            <div
                                class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0"
                            >
                                <Save size={20} />
                            </div>
                            <div>
                                <h4
                                    class="font-black text-emerald-900 text-xs uppercase tracking-widest mb-1"
                                >
                                    Kept in your account
                                </h4>
                                <p
                                    class="text-[11px] text-emerald-800/70 font-medium leading-tight"
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
                                ? 'bg-[#4A7C74]'
                                : 'bg-slate-200'} transition-all duration-500"
                        ></div>
                    {/each}
                </div>
                <button
                    onclick={resetSelection}
                    class="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                >
                    Not right now
                </button>
            </div>

            <div class="space-y-6">
                <p
                    class="text-[10px] font-black uppercase tracking-[0.3em] text-[#4A7C74] text-center"
                >
                    Step {currentPromptIndex + 1} of 3
                </p>
                <div class="flex flex-col items-center gap-4 px-4">
                    <h2
                        class="text-4xl font-black text-slate-900 font-serif leading-tight text-center"
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
                    class="absolute -inset-4 bg-gradient-to-b from-[#4A7C74]/10 to-transparent rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity"
                ></div>
                {#key currentPromptIndex}
                    <div
                        data-reflection-box
                        class="relative w-full h-80 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl focus-within:border-[#4A7C74] transition-all overflow-hidden p-8"
                    >
                        <SmartTextarea
                            bind:value={
                                emotionalReflections[
                                    currentPromptIndex === 0
                                        ? "memory"
                                        : currentPromptIndex === 1
                                          ? "values"
                                          : "hopes"
                                ]
                            }
                            context="letter"
                            label={currentQuestion}
                            hideLabel
                            minimal={true}
                            minHeight="100%"
                            placeholder="Reflect here..."
                            suggestions={emotionalFlow === "spouse"
                                ? [
                                      [
                                          "Our first trip together",
                                          "The day we met",
                                          "A quiet moment shared",
                                      ],
                                      [
                                          "Your kindness",
                                          "Your strength",
                                          "Your sense of humor",
                                      ],
                                      [
                                          "Deep happiness",
                                          "Finding peace",
                                          "Adventure and love",
                                      ],
                                  ][currentPromptIndex]
                                : [
                                      [
                                          "A childhood memory",
                                          "A lesson learned the hard way",
                                          "A moment of clarity",
                                      ],
                                      ["Integrity", "Compassion", "Curiosity"],
                                      [
                                          "To be happy",
                                          "To find your passion",
                                          "To be kind",
                                      ],
                                  ][currentPromptIndex]}
                        />
                    </div>
                {/key}
            </div>

            <div class="flex items-center justify-center pt-8">
                <button
                    onclick={nextEmotionalPrompt}
                    disabled={!emotionalReflections[
                        currentPromptIndex === 0
                            ? "memory"
                            : currentPromptIndex === 1
                              ? "values"
                              : "hopes"
                    ]}
                    class="group flex items-center gap-4 bg-[#4A7C74] text-white px-16 py-6 rounded-2xl font-black text-xl shadow-2xl shadow-[#4A7C74]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                >
                    {currentPromptIndex === 2
                        ? "Create my letter"
                        : "Continue when ready"}
                    <div
                        class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform"
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

    textarea::placeholder {
        opacity: 0.3;
        font-style: italic;
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
