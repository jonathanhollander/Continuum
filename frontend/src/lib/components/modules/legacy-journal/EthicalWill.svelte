<script lang="ts">
    import { fade } from "svelte/transition";
    import { Save, Heart, Anchor, Shield, Sun, Edit3, X } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import { journalStore, type JournalEntry } from "$lib/stores/journalStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";

    // The letter is one JournalEntry (type "ethical_will", content = letter text).
    // Each core value is a JournalEntry (type "core_value", title, content = description,
    // tags = icon name). Nothing here is saved until the person saves it.

    const ICONS: Record<string, { icon: typeof Sun; color: string }> = {
        Shield: { icon: Shield, color: "bg-blue-100 text-blue-700" },
        Sun: { icon: Sun, color: "bg-yellow-100 text-yellow-700" },
        Heart: { icon: Heart, color: "bg-pink-100 text-pink-700" },
        Anchor: { icon: Anchor, color: "bg-slate-100 text-slate-700" },
    };
    const iconOf = (name?: string) => ICONS[name ?? ""] ?? ICONS.Sun;

    // Suggestions only: clicking one fills the form, the person decides whether to save it.
    const SUGGESTED_VALUES = [
        { title: "Integrity", desc: "Doing the right thing, even when no one is watching.", iconName: "Shield" },
        { title: "Curiosity", desc: "Keep learning and asking questions.", iconName: "Sun" },
        { title: "Kindness", desc: "Everyone is fighting a battle you know nothing about.", iconName: "Heart" },
        { title: "Resilience", desc: "What matters is how you get up after a fall.", iconName: "Anchor" },
    ];

    const EXAMPLE_LETTER = `To my dearest family,

More than my possessions, I want to leave you with the beliefs that have guided my life. I have tried my best to live with integrity and love.

I hope you will always prioritize your relationships over material success. Money can be regained, but time with loved ones is precious.

Forgive freely. Letting go of anger sets you free.

I am so proud of the people you have become.

With all my love,
[Your Name]`;

    let letterEntry = $derived(journalStore.items.find((e) => e.type === "ethical_will"));
    let values = $derived(journalStore.items.filter((e) => e.type === "core_value"));
    let unusedSuggestions = $derived(
        SUGGESTED_VALUES.filter(
            (s) => !values.some((v) => (v.title ?? "").toLowerCase() === s.title.toLowerCase()),
        ),
    );

    let activeSection = $state<"values" | "letter">("values");

    // Letter draft: filled from the saved letter once it arrives, then the person's typing wins.
    let letterText = $state("");
    let loadedLetterId = $state<number | undefined>(undefined);
    $effect(() => {
        const entry = letterEntry;
        if (entry?.id !== undefined && entry.id !== loadedLetterId) {
            loadedLetterId = entry.id;
            letterText = entry.content ?? "";
        }
    });

    let savingLetter = $state(false);
    async function saveLetter() {
        if (!letterText.trim() || savingLetter) return;
        savingLetter = true;
        try {
            if (letterEntry?.id !== undefined) {
                await journalStore.update(letterEntry.id, { content: letterText });
            } else {
                const created = (await journalStore.create({
                    type: "ethical_will",
                    title: "Ethical Will",
                    content: letterText,
                })) as JournalEntry | undefined;
                if (created?.id !== undefined) loadedLetterId = created.id;
            }
            activityLog.logEvent({
                module: "Ethical Will",
                action: "UPDATE",
                entityType: "Document",
                entityId: String(letterEntry?.id ?? loadedLetterId ?? ""),
                entityName: "Ethical Will",
                userContext: "User",
            });
        } catch {
            // SyncManager already showed a gentle message; the draft stays in the editor.
        } finally {
            savingLetter = false;
        }
    }

    // Value form (add or edit)
    let showValueForm = $state(false);
    let editingValueId = $state<number | undefined>(undefined);
    let valueTitle = $state("");
    let valueDesc = $state("");
    let valueIcon = $state("Sun");

    function openValueForm(entry?: JournalEntry, suggestion?: (typeof SUGGESTED_VALUES)[number]) {
        editingValueId = entry?.id;
        valueTitle = entry?.title ?? suggestion?.title ?? "";
        valueDesc = entry?.content ?? suggestion?.desc ?? "";
        valueIcon = entry?.tags || suggestion?.iconName || "Sun";
        showValueForm = true;
    }

    async function saveValue() {
        if (!valueTitle.trim()) return;
        const data = { title: valueTitle.trim(), content: valueDesc, tags: valueIcon };
        try {
            if (editingValueId !== undefined) {
                await journalStore.update(editingValueId, data);
            } else {
                await journalStore.create({ type: "core_value", ...data });
            }
            showValueForm = false;
        } catch {
            // The form stays open with the person's words.
        }
    }

    async function removeValue(id?: number) {
        if (id === undefined) return;
        if (!confirm("Remove this value? You can add it again whenever you like.")) return;
        await journalStore.delete(id);
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- Sidebar / Navigation for this subsection -->
    <div class="lg:col-span-4 space-y-6">
        <div class="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <h3 class="font-bold text-[#304743] mb-4 text-lg">Structure</h3>
            <div class="space-y-2">
                <button
                    onclick={() => (activeSection = "values")}
                    class="w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3
                    {activeSection === 'values'
                        ? 'bg-white shadow-sm ring-1 ring-stone-200 font-bold text-[#304743]'
                        : 'text-stone-500 hover:bg-stone-100'}"
                >
                    <div
                        class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                    >
                        <Shield size={16} />
                    </div>
                    Core Values
                </button>
                <button
                    onclick={() => (activeSection = "letter")}
                    class="w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3
                    {activeSection === 'letter'
                        ? 'bg-white shadow-sm ring-1 ring-stone-200 font-bold text-[#304743]'
                        : 'text-stone-500 hover:bg-stone-100'}"
                >
                    <div
                        class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"
                    >
                        <Edit3 size={16} />
                    </div>
                    The Letter
                </button>
            </div>
        </div>

        <div class="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            <h4 class="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Sun size={18} /> Why an Ethical Will?
            </h4>
            <p class="text-sm text-blue-800/80 leading-relaxed">
                Legal wills distribute valuables. Ethical wills distribute
                values. Use this space to explain <em>what</em> mattered to you
                and <em>why</em>.
            </p>
        </div>
    </div>

    <!-- Main Editor Area -->
    <div class="lg:col-span-8">
        {#if activeSection === "values"}
            <div in:fade class="space-y-6">
                <div class="flex justify-between items-center mb-2">
                    <h2 class="text-2xl font-serif font-bold text-[#304743]">
                        My Core Values
                    </h2>
                    <button
                        onclick={() => openValueForm()}
                        class="text-sm font-bold text-[#4A7C74] hover:underline"
                        >+ Add Value</button
                    >
                </div>

                {#if showValueForm}
                    <div
                        class="p-5 rounded-2xl border border-[#4A7C74]/40 bg-white space-y-3"
                        data-testid="value-form"
                    >
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-[#304743]">
                                {editingValueId !== undefined ? "Refine this value" : "A value that guides you"}
                            </h3>
                            <button
                                onclick={() => (showValueForm = false)}
                                class="p-1 text-stone-400 hover:text-stone-700"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <input
                            id="value-title"
                            bind:value={valueTitle}
                            class="w-full p-3 rounded-xl border border-stone-200 focus:border-[#4A7C74] outline-none font-bold"
                            placeholder="e.g. Generosity"
                        />
                        <textarea
                            id="value-desc"
                            bind:value={valueDesc}
                            class="w-full p-3 rounded-xl border border-stone-200 focus:border-[#4A7C74] outline-none text-sm min-h-[80px]"
                            placeholder="What this value means to you"
                        ></textarea>
                        <div class="flex gap-2">
                            {#each Object.keys(ICONS) as name}
                                {@const Icon = ICONS[name].icon}
                                <button
                                    onclick={() => (valueIcon = name)}
                                    class="p-2 rounded-xl {ICONS[name].color} {valueIcon === name
                                        ? 'ring-2 ring-[#4A7C74]'
                                        : 'opacity-60'}"
                                    aria-label={name}
                                >
                                    <Icon size={16} />
                                </button>
                            {/each}
                        </div>
                        <div class="flex justify-end">
                            <button
                                onclick={saveValue}
                                disabled={!valueTitle.trim()}
                                class="bg-[#4A7C74] hover:bg-[#3b635d] disabled:opacity-50 text-white px-5 py-2 rounded-full font-bold text-sm"
                            >
                                Save this value
                            </button>
                        </div>
                    </div>
                {/if}

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each values as value (value.id)}
                        {@const look = iconOf(value.tags)}
                        <div
                            class="p-5 rounded-2xl border border-stone-200 bg-white hover:border-[#4A7C74]/30 hover:shadow-md transition-all group relative"
                            data-testid="core-value"
                        >
                            <div
                                class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <button
                                    onclick={() => openValueForm(value)}
                                    class="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700"
                                    aria-label="Edit value"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    onclick={() => removeValue(value.id)}
                                    class="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700"
                                    aria-label="Remove value"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div class="inline-flex p-3 rounded-xl {look.color} mb-4">
                                <look.icon size={20} />
                            </div>
                            <h3 class="font-bold text-lg text-[#304743] mb-1">
                                {value.title}
                            </h3>
                            <p class="text-sm text-muted-foreground leading-relaxed">
                                {value.content}
                            </p>
                        </div>
                    {/each}

                    <button
                        onclick={() => openValueForm()}
                        class="border-2 border-dashed border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center text-stone-400 hover:border-[#4A7C74] hover:text-[#4A7C74] hover:bg-[#4A7C74]/5 transition-all min-h-[180px]"
                    >
                        <div
                            class="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3"
                        >
                            <span class="text-2xl">+</span>
                        </div>
                        <span class="font-bold text-sm">Define a new value</span>
                    </button>
                </div>

                {#if unusedSuggestions.length > 0}
                    <div class="pt-2">
                        <p class="text-xs font-bold uppercase text-stone-400 mb-2">
                            Values to consider
                        </p>
                        <div class="flex flex-wrap gap-2">
                            {#each unusedSuggestions as s}
                                <button
                                    onclick={() => openValueForm(undefined, s)}
                                    class="px-3 py-1.5 rounded-full border border-stone-200 text-sm text-stone-600 hover:border-[#4A7C74] hover:text-[#4A7C74]"
                                >
                                    + {s.title}
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {:else if activeSection === "letter"}
            <div in:fade class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-serif font-bold text-[#304743]">
                        Values Letter
                    </h2>
                    {#if !letterText.trim()}
                        <button
                            onclick={() => (letterText = EXAMPLE_LETTER)}
                            class="text-sm font-bold text-[#4A7C74] hover:underline"
                        >
                            Begin from an example
                        </button>
                    {/if}
                </div>
                <div class="relative">
                    <div
                        class="absolute -top-3 -left-3 -right-3 -bottom-3 bg-stone-100 rounded-2xl -z-10 rotate-1"
                    ></div>
                    <div
                        class="bg-white p-8 md:p-12 rounded-2xl border border-stone-200 shadow-sm relative"
                    >
                        <SmartTextarea
                            context="ethical_will"
                            bind:value={letterText}
                            placeholder="To the people I love..."
                            minHeight="500px"
                        />
                    </div>
                </div>

                <div class="flex justify-end gap-3">
                    <button
                        onclick={saveLetter}
                        disabled={!letterText.trim() || savingLetter}
                        class="bg-[#4A7C74] hover:bg-[#3b635d] disabled:opacity-50 text-white px-6 py-2.5 rounded-full font-bold shadow-lg flex items-center gap-2"
                    >
                        <Save size={18} /> Save Letter
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
