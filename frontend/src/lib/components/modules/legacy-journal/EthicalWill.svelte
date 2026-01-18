<script lang="ts">
    import { onMount } from "svelte";
    import { fade, slide } from "svelte/transition";
    import { Save, Heart, Anchor, Shield, Sun, Edit3 } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import { registerSync } from "$lib/services/sync.svelte"; // Added
    import { activityLog } from "$lib/stores/activityLog";

    // --- State ---
    interface CoreValue {
        id: number;
        title: string;
        desc: string;
        iconName: string; // Svelte component serialization issue - store name
        color: string;
    }

    // Default Values
    const DEFAULT_VALUES: CoreValue[] = [
        {
            id: 1,
            title: "Integrity",
            desc: "Doing the right thing, even when no one is watching.",
            iconName: "Shield",
            color: "bg-blue-100 text-blue-700",
        },
        {
            id: 2,
            title: "Curiosity",
            desc: "Never stop learning and asking questions.",
            iconName: "Sun",
            color: "bg-yellow-100 text-yellow-700",
        },
        {
            id: 3,
            title: "Kindness",
            desc: "Everyone is fighting a battle you know nothing about.",
            iconName: "Heart",
            color: "bg-pink-100 text-pink-700",
        },
        {
            id: 4,
            title: "Resilience",
            desc: "It's not about how hard you fall, but how you get up.",
            iconName: "Anchor",
            color: "bg-slate-100 text-slate-700",
        },
    ];

    const DEFAULT_TEXT = `To my dearest family,

More than my possessions, I want to leave you with the beliefs that have guided my life. I have tried my best to live with integrity and love.

I hope you will always prioritize your relationships over material success. Money can be regained, but time with loved ones cannot.

Forgive freely. Holding onto anger only hurts you.

I am so proud of the people you have become.

With all my love,
[Your Name]`;

    interface EthicalWillData {
        id: string;
        text: string;
        values: CoreValue[];
    }

    // Sync Registration
    const willSync = registerSync<EthicalWillData>(
        "ethical_will",
        "ethical_will",
    );

    // Derived State
    let willData = $derived(willSync.items.find((i) => i.id === "main"));

    // Local editable state (mirrors sync state but allows binding)
    let ethicalWillText = $state(DEFAULT_TEXT);
    let coreValues = $state<CoreValue[]>(DEFAULT_VALUES);

    // Initialization Effect
    $effect(() => {
        if (willSync.status === "synced" || willSync.status === "idle") {
            if (willSync.items.length === 0) {
                // Initialize default
                console.log("Initializing Ethical Will defaults...");
                willSync.create({
                    id: "main",
                    text: DEFAULT_TEXT,
                    values: DEFAULT_VALUES,
                });
            } else if (willData) {
                // Load into local state
                ethicalWillText = willData.text;
                coreValues =
                    willData.values && willData.values.length > 0
                        ? willData.values
                        : DEFAULT_VALUES;
            }
        }
    });

    let activeSection = "values"; // 'values' | 'letter'

    async function save() {
        if (willData) {
            await willSync.update("main", {
                text: ethicalWillText,
                values: coreValues,
            });
            // alert("Ethical Will saved."); // Removed alert for smoother UX
        } else {
            // Should not happen if effect runs
            await willSync.create({
                id: "main",
                text: ethicalWillText,
                values: coreValues,
            });
        }

        activityLog.logEvent({
            module: "Ethical Will",
            action: "UPDATE",
            entityType: "Document",
            entityId: "main",
            entityName: "Ethical Will",
            userContext: "User",
        });
    }

    // Icon helper maps
    function getIcon(name: string) {
        if (name === "Shield") return Shield;
        if (name === "Sun") return Sun;
        if (name === "Heart") return Heart;
        if (name === "Anchor") return Anchor;
        return Sun;
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- Sidebar / Navigation for this subsection -->
    <div class="lg:col-span-4 space-y-6">
        <div class="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <h3 class="font-bold text-[#304743] mb-4 text-lg">Structure</h3>
            <div class="space-y-2">
                <button
                    on:click={() => (activeSection = "values")}
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
                    on:click={() => (activeSection = "letter")}
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
                        class="text-sm font-bold text-[#4A7C74] hover:underline"
                        >+ Add Value</button
                    >
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each coreValues as value}
                        <div
                            class="p-5 rounded-2xl border border-stone-200 bg-white hover:border-[#4A7C74]/30 hover:shadow-md transition-all group relative cursor-pointer"
                        >
                            <div
                                class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <button
                                    class="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700"
                                >
                                    <Edit3 size={14} />
                                </button>
                            </div>

                            <div
                                class="inline-flex p-3 rounded-xl {value.color} mb-4"
                            >
                                <svelte:component
                                    this={getIcon(value.iconName)}
                                    size={20}
                                />
                            </div>
                            <h3 class="font-bold text-lg text-[#304743] mb-1">
                                {value.title}
                            </h3>
                            <p
                                class="text-sm text-muted-foreground leading-relaxed"
                            >
                                {value.desc}
                            </p>
                        </div>
                    {/each}

                    <!-- Empty Slot -->
                    <button
                        class="border-2 border-dashed border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center text-stone-400 hover:border-[#4A7C74] hover:text-[#4A7C74] hover:bg-[#4A7C74]/5 transition-all min-h-[180px]"
                    >
                        <div
                            class="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3"
                        >
                            <span class="text-2xl">+</span>
                        </div>
                        <span class="font-bold text-sm">Define a new value</span
                        >
                    </button>
                </div>
            </div>
        {:else if activeSection === "letter"}
            <div in:fade class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-[#304743]">
                    Values Letter
                </h2>
                <div class="relative">
                    <div
                        class="absolute -top-3 -left-3 -right-3 -bottom-3 bg-stone-100 rounded-3xl -z-10 rotate-1"
                    ></div>
                    <div
                        class="bg-white p-8 md:p-12 rounded-2xl border border-stone-200 shadow-sm relative"
                    >
                        <SmartTextarea
                            context="ethical_will"
                            bind:value={ethicalWillText}
                            minHeight="500px"
                        />
                    </div>
                </div>

                <div class="flex justify-end gap-3">
                    <button
                        on:click={save}
                        class="bg-[#4A7C74] hover:bg-[#3b635d] text-white px-6 py-2.5 rounded-full font-bold shadow-lg flex items-center gap-2"
                    >
                        <Save size={18} /> Save Letter
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
