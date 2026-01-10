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
    } from "lucide-svelte";
    import {
        LETTER_TEMPLATES,
        EMOTIONAL_PROMPTS,
        type LetterTemplate,
    } from "$lib/data/letterTemplates";
    import { onMount } from "svelte";
    import { activityLog } from "$lib/stores/activityLog";
    import { estateProfile } from "$lib/stores/estateStore";
    import LetterAssistant from "$lib/components/modules/letters/LetterAssistant.svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import { REFLECTION_POOLS } from "$lib/data/reflectionPools";
    import RefreshControl from "$lib/components/ui/RefreshControl.svelte";

    type SavedLetter = {
        id: string;
        title: string;
        content: string;
        date: string;
        type: "emotional" | "transactional";
        triggerDate?: string;
        triggerMilestone?: string;
        isLocked?: boolean;
    };

    let savedLetters: SavedLetter[] = [];
    let searchQuery = "";
    let filterCategory: string = "All";

    import { getStored, setStored } from "$lib/stores/persistence";
    // ...
    // ...
    onMount(() => {
        savedLetters = getStored<SavedLetter[]>("saved_letters", []);
    });

    function saveToVault() {
        if (!generatedLetter) {
            alert(
                "Error: The letter content appears to be empty. Please go back and try again.",
            );
            return;
        }

        const title = emotionalFlow
            ? emotionalFlow === "spouse"
                ? "Letter to Loved One"
                : "Ethical Will"
            : selectedTemplate?.title || "Draft Letter";

        const newLetter: SavedLetter = {
            id: crypto.randomUUID(),
            title: `${title} (${new Date().toLocaleDateString()})`,
            content: generatedLetter,
            date: new Date().toLocaleDateString(),
            type: emotionalFlow ? "emotional" : "transactional",
            triggerDate: letterTriggerDate,
            triggerMilestone: letterTriggerMilestone,
            isLocked: !!(letterTriggerDate || letterTriggerMilestone),
        };

        savedLetters = [newLetter, ...savedLetters];
        setStored("saved_letters", savedLetters);

        activityLog.logEvent({
            module: "Letters",
            action: "CREATE",
            entityType: "Draft",
            entityId: newLetter.id,
            entityName: newLetter.title,
            userContext: $estateProfile.ownerName || "User",
        });

        alert("Letter saved to your secure vault.");
        mode = "menu";
        resetSelection();
    }

    function resetSelection() {
        emotionalFlow = null;
        selectedTemplate = null;
        generatedLetter = "";
        templateVariables = {};
        mode = "menu";
    }

    function deleteLetter(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        savedLetters = savedLetters.filter((l) => l.id !== id);
        setStored("saved_letters", savedLetters);

        activityLog.logEvent({
            module: "Letters",
            action: "DELETE",
            entityType: "Draft",
            entityId: id,
            entityName: name,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    function viewLetter(letter: SavedLetter) {
        generatedLetter = letter.content;
        mode = "review";
        if (letter.type === "emotional") {
            emotionalFlow = "ethical_will"; // Placeholder to enable UI
        } else {
            selectedTemplate = {
                id: letter.id,
                title: letter.title,
                subject: `Review: ${letter.title}`,
                body: letter.content,
                category: "Saved",
                audience: "Viewer",
            };
        }
    }

    let mode:
        | "menu"
        | "emotional_interview"
        | "drafting"
        | "review"
        | "transactional_preview"
        | "variable_input" = "menu";

    // Emotional State
    let emotionalFlow: "spouse" | "ethical_will" | null = null;
    let emotionalReflections = {
        memory: "",
        values: "",
        hopes: "",
    };
    let currentPromptIndex = 0;
    let currentQuestion = "";

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
    let selectedTemplate: LetterTemplate | null = null;
    let templateVariables: Record<string, string> = {};
    let detectedVariables: string[] = [];

    // Editor Content
    let generatedLetter = "";

    // Trigger Settings for current draft
    let letterTriggerDate = "";
    let letterTriggerMilestone = "";

    function startEmotionalFlow(flow: "spouse" | "ethical_will") {
        emotionalFlow = flow;
        mode = "emotional_interview";
        currentPromptIndex = 0;
        emotionalReflections = { memory: "", values: "", hopes: "" };
        refreshQuestion();
    }

    function selectTransactional(template: LetterTemplate) {
        selectedTemplate = template;
        const regex = /\[(.*?)\]/g;
        const matches = [...template.body.matchAll(regex)];
        detectedVariables = [...new Set(matches.map((m) => m[1]))];
        templateVariables = {};

        const mappingKeys: Record<string, string> = {
            "Account Holder Name": $estateProfile.ownerName,
            "Deceased Name": $estateProfile.ownerName,
            "Cardholder Name": $estateProfile.ownerName,
            "Borrower Name": $estateProfile.ownerName,
            "Date of Death": $estateProfile.dateOfDeath,
            "Executor/Administrator": $estateProfile.executorName,
            "Executor Name": $estateProfile.executorName,
            Spouse: $estateProfile.spouseName,
            "Primary Beneficiary": $estateProfile.primaryBeneficiary,
            Relationship: "Executor",
            SSN: $estateProfile.last4SSN,
            "Social Security Number": $estateProfile.last4SSN,
            "Last 4 digits of SSN": $estateProfile.last4SSN,
            City: $estateProfile.legalCityState.split(",")[0]?.trim() || "",
            State: $estateProfile.legalCityState.split(",")[1]?.trim() || "",
            Date: new Date().toLocaleDateString(),
        };

        detectedVariables.forEach((v) => {
            templateVariables[v] = mappingKeys[v] || "";
        });

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
        } else {
            generateEmotionalDraft();
        }
    }

    function generateEmotionalDraft() {
        mode = "drafting";
        setTimeout(() => {
            if (emotionalFlow === "spouse") {
                generatedLetter = `My Dearest,\n\nI was sitting here thinking about us, and my mind drifted to that time: ${emotionalReflections.memory}. It still makes me smile.\n\nI want you to know how much I admire you. Specifically, ${emotionalReflections.values}. You have always been my rock.\n\nMy greatest wish for you is this: ${emotionalReflections.hopes}. Be happy, live fully, and know that you were loved beyond measure.\n\nForever yours,\n[Your Name]`;
            } else {
                generatedLetter = `To My Family,\n\nAs I look back on my life, I want to leave you with more than just things. I want to share who I was and what I believed in.\n\nMy life was guided by three core values: ${emotionalReflections.values}. I hope they serve you as well as they served me.\n\nI learned many lessons, but the most important was: ${emotionalReflections.memory}. Don't make the same mistake I did—or if you do, forgive yourself quickly.\n\nWhen times are tough, remember: ${emotionalReflections.hopes}.\n\nWith all my love,\n[Your Name]`;
            }
            mode = "review";

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
        }, 1500);
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

    let isRecording = false;
    let recordingTimer: any;

    function simulateVoiceToText() {
        isRecording = true;
        const transcript = " ... [Voice Capture Enabled] ... ";
        generatedLetter += "\n" + transcript;
        setTimeout(() => {
            stopRecording();
            generatedLetter +=
                "Added: 'Keep my childhood photo albums together for the grandchildren.'";
        }, 3000);
    }

    function stopRecording() {
        isRecording = false;
    }

    $: filteredTemplates = LETTER_TEMPLATES.filter((t) => {
        const matchesSearch =
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            filterCategory === "All" || t.category === filterCategory;
        return matchesSearch && matchesCategory;
    });
</script>

<div
    class="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700"
>
    <!-- Header Section -->
    {#if mode === "menu"}
        <header
            class="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-4"
        >
            <div class="space-y-4">
                <nav
                    class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4A7C74]"
                >
                    <PenTool size={14} />
                    <span>Concierge v4.0</span>
                    <ChevronRight size={12} />
                    <span class="text-slate-900">Legacy Correspondence</span>
                </nav>
                <div>
                    <h1
                        class="text-5xl font-black text-slate-900 tracking-tight mb-3 font-serif"
                    >
                        Legacy <span class="text-[#4A7C74] font-light italic"
                            >Correspondence</span
                        >
                    </h1>
                    <p class="text-slate-500 max-w-3xl text-xl leading-relaxed">
                        Automate administrative notifications and preserve
                        emotional legacies with AI-guided templates.
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <div
                    class="bg-[#FDFBF7] border border-stone-200 p-4 rounded-3xl flex items-center gap-6 shadow-sm"
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
                            Vault Status
                        </p>
                        <p class="text-sm font-bold text-slate-700">
                            {savedLetters.length} Drafts Saved
                        </p>
                    </div>
                    <button
                        on:click={() => {
                            if (savedLetters.length > 0)
                                viewLetter(savedLetters[0]);
                        }}
                        class="p-2 bg-stone-100 hover:bg-[#4A7C74] hover:text-white rounded-xl transition-all"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </header>

        <!-- Essential Actions Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <button
                on:click={() => startEmotionalFlow("ethical_will")}
                class="group relative overflow-hidden bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex gap-8 items-center"
            >
                <div
                    class="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"
                ></div>
                <div
                    class="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform"
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
                on:click={() => startEmotionalFlow("spouse")}
                class="group relative overflow-hidden bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex gap-8 items-center"
            >
                <div
                    class="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"
                ></div>
                <div
                    class="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:-rotate-6 transition-transform"
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
                    class="ml-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all"
                >
                    <ArrowRight size={20} />
                </div>
            </button>
        </div>

        <!-- Category Browser -->
        <div class="space-y-8">
            <div
                class="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-slate-100 pb-8"
            >
                <div class="flex flex-wrap items-center gap-2">
                    {#each categories as cat}
                        <button
                            on:click={() => (filterCategory = cat)}
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
                        class="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredTemplates as template (template.id)}
                    <button
                        on:click={() => selectTransactional(template)}
                        class="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between min-h-[160px]"
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
                                    class="text-[10px] font-black uppercase tracking-widest text-[#4A7C74]"
                                    >{template.category}</span
                                >
                            </div>
                            <h3
                                class="text-xl font-bold text-slate-900 tracking-tight group-hover:text-[#4A7C74] transition-colors"
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
                            <ArrowRight size={16} class="text-[#4A7C74]" />
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
                    on:click={resetSelection}
                    class="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Library
                </button>
                <div
                    class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold"
                >
                    <Sparkles size={14} />
                    <span>Auto-mapped from Estate Profile</span>
                </div>
            </div>

            <div
                class="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-900/5 space-y-10"
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
                    {#each detectedVariables as variable}
                        <div class="space-y-3">
                            <label
                                class="block text-[11px] font-black text-slate-800 uppercase tracking-widest pl-1"
                                >{variable}</label
                            >
                            <input
                                type="text"
                                bind:value={templateVariables[variable]}
                                class="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#4A7C74] focus:bg-white outline-none font-bold transition-all"
                                placeholder="Enter {variable.toLowerCase()}..."
                            />
                        </div>
                    {/each}
                </div>

                <div class="pt-8 flex items-center justify-center gap-6">
                    <button
                        on:click={() => {
                            generatedLetter = selectedTemplate?.body || "";
                            mode = "transactional_preview";
                        }}
                        class="text-sm font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
                    >
                        Skip & Modify Draft
                    </button>
                    <button
                        on:click={applyVariables}
                        class="px-12 py-5 bg-[#4A7C74] text-white rounded-[2rem] font-black hover:bg-[#3b635d] shadow-2xl shadow-[#4A7C74]/20 transition-all hover:scale-105"
                    >
                        Generate Document
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
                    <button
                        on:click={() => (mode = "menu")}
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
                    <button
                        on:click={saveToVault}
                        class="p-4 bg-[#4A7C74] text-white rounded-2xl shadow-xl shadow-[#4A7C74]/20"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>

                <div
                    class="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[2.5rem] flex gap-6 items-center"
                >
                    <div
                        class="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
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
                    class="bg-white p-12 rounded-[3.5rem] border shadow-2xl shadow-slate-900/5 font-mono text-base leading-relaxed whitespace-pre-wrap text-slate-700 h-[600px] overflow-y-auto paper-texture ring-8 ring-slate-50/50"
                >
                    {generatedLetter ||
                        "(Empty draft - please go back and fill in the form)"}
                </div>
            </div>

            <!-- Guidance Sidebar -->
            <div class="space-y-8 lg:pt-24">
                {#if selectedTemplate.requiredDocs && selectedTemplate.requiredDocs.length > 0}
                    <div
                        class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6"
                        in:slide
                    >
                        <h4
                            class="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-3"
                        >
                            <span
                                class="w-4 h-4 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"
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
                                        class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"
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
                        class="bg-[#FDFBF7] p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-4"
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
                    on:click={saveToVault}
                    class="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all"
                >
                    Finalize & Save <ArrowRight size={20} />
                </button>
            </div>
        </div>
    {/if}

    <!-- Emotional Drafting & Review Mode -->
    {#if mode === "drafting"}
        <div
            class="flex flex-col items-center justify-center py-48 space-y-8"
            in:fade
        >
            <div class="relative">
                <div
                    class="w-24 h-24 border-8 border-slate-100 rounded-full animate-ping opacity-20"
                ></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <PenTool size={48} class="text-[#4A7C74] animate-bounce" />
                </div>
            </div>
            <div class="text-center space-y-2">
                <h3 class="text-3xl font-black text-slate-900 font-serif">
                    Compose Legacy Draft...
                </h3>
                <p
                    class="text-slate-400 font-bold uppercase tracking-widest text-xs"
                >
                    AI is weaving your reflections into a narrative
                </p>
            </div>
        </div>
    {/if}

    {#if mode === "review"}
        <div class="max-w-[1400px] mx-auto space-y-8" in:fade>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <button
                        on:click={() => (mode = "menu")}
                        class="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900"
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
                            class="text-[10px] font-black text-[#4A7C74] uppercase tracking-[0.2em] mt-1 italic"
                        >
                            Personal Reflection in Progress
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button
                        on:click={isRecording
                            ? stopRecording
                            : simulateVoiceToText}
                        class="flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all
                        {isRecording
                            ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}"
                    >
                        {#if isRecording}
                            <div class="flex gap-1">
                                <span
                                    class="w-1 h-3 bg-white/50 rounded-full animate-bounce"
                                ></span>
                                <span
                                    class="w-1 h-5 bg-white rounded-full animate-bounce"
                                    style="animation-delay: 0.1s"
                                ></span>
                                <span
                                    class="w-1 h-3 bg-white/50 rounded-full animate-bounce"
                                    style="animation-delay: 0.2s"
                                ></span>
                            </div>
                            Recording...
                        {:else}
                            <Mic size={18} class="text-rose-500" />
                            Voice Reflection
                        {/if}
                    </button>
                    <button
                        on:click={saveToVault}
                        class="flex items-center gap-2 px-8 py-3 bg-[#4A7C74] text-white rounded-2xl font-black shadow-xl shadow-[#4A7C74]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Save size={18} />
                        Seal in Vault
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Editor Column -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Legacy Trigger Settings (New Feature) -->
                    <div
                        class="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[2.5rem] space-y-6"
                    >
                        <div class="flex items-center gap-3">
                            <History size={20} class="text-indigo-600" />
                            <h4
                                class="font-bold text-slate-900 uppercase tracking-widest text-xs"
                            >
                                Future Release Triggers
                            </h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Specific Release Date</label
                                >
                                <input
                                    type="date"
                                    bind:value={letterTriggerDate}
                                    class="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Or Lifecycle Milestone</label
                                >
                                <select
                                    bind:value={letterTriggerMilestone}
                                    class="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium appearance-none"
                                >
                                    <option value=""
                                        >No Milestone Trigger</option
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
                            class="text-[10px] text-indigo-500 font-medium italic"
                        >
                            If set, this letter will remain "Locked" in your
                            vault until the trigger condition is met.
                        </p>
                    </div>

                    <div class="relative group">
                        <div
                            class="absolute -inset-4 bg-gradient-to-r from-[#4A7C74]/5 to-blue-500/5 rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"
                        ></div>
                        <div
                            class="relative bg-[#FDFBF7] p-16 rounded-[3.5rem] border border-stone-200 shadow-2xl font-serif text-xl leading-[2] text-stone-800 paper-texture ring-8 ring-stone-50/30 min-h-[700px]"
                        >
                            <SmartTextarea
                                bind:value={generatedLetter}
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
                        on:update={(e) => (generatedLetter = e.detail)}
                    />

                    <!-- Status Cards Stacked -->
                    <div class="space-y-4">
                        <div
                            class="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4"
                        >
                            <div
                                class="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"
                            >
                                <Printer size={20} />
                            </div>
                            <div>
                                <h4
                                    class="font-black text-blue-900 text-xs uppercase tracking-widest mb-1"
                                >
                                    Print Ready
                                </h4>
                                <p
                                    class="text-[11px] text-blue-800/70 font-medium leading-tight"
                                >
                                    Download as PDF for physical storage.
                                </p>
                            </div>
                        </div>
                        <div
                            class="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4"
                        >
                            <div
                                class="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0"
                            >
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4
                                    class="font-black text-amber-900 text-xs uppercase tracking-widest mb-1"
                                >
                                    Encrypted
                                </h4>
                                <p
                                    class="text-[11px] text-amber-800/70 font-medium leading-tight"
                                >
                                    Accessible only to you and designees.
                                </p>
                            </div>
                        </div>
                        <div
                            class="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex gap-4"
                        >
                            <div
                                class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"
                            >
                                <Download size={20} />
                            </div>
                            <div>
                                <h4
                                    class="font-black text-emerald-900 text-xs uppercase tracking-widest mb-1"
                                >
                                    Auto-Save
                                </h4>
                                <p
                                    class="text-[11px] text-emerald-800/70 font-medium leading-tight"
                                >
                                    Saved locally during editing.
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
                    on:click={resetSelection}
                    class="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                >
                    Cancel Interview
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
                    class="absolute -inset-4 bg-gradient-to-b from-[#4A7C74]/10 to-transparent rounded-[3rem] blur-xl opacity-50 group-hover:opacity-80 transition-opacity"
                ></div>
                {#key currentPromptIndex}
                    <div
                        class="relative w-full h-80 bg-white border-2 border-slate-100 rounded-[3rem] shadow-2xl focus-within:border-[#4A7C74] transition-all overflow-hidden p-8"
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
                    on:click={nextEmotionalPrompt}
                    disabled={!emotionalReflections[
                        currentPromptIndex === 0
                            ? "memory"
                            : currentPromptIndex === 1
                              ? "values"
                              : "hopes"
                    ]}
                    class="group flex items-center gap-4 bg-[#4A7C74] text-white px-16 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-[#4A7C74]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                >
                    {currentPromptIndex === 2
                        ? "Generate Legacy Letter"
                        : "Next Reflection"}
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

<style>
    :global(.animate-in) {
        animation: fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

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
