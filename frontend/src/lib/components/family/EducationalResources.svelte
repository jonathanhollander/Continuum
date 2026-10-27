<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import { BookOpen, FileText, X } from "lucide-svelte";
    import { slide, fade } from "svelte/transition";

    type Guide = {
        id: number;
        title: string;
        description: string;
        paragraphs: string[];
    };

    type GuideGroup = {
        title: string;
        guides: Guide[];
    };

    const guideGroups: GuideGroup[] = [
    {
        "title": "Getting oriented",
        "guides": [
            {
                "id": 1,
                "title": "Finding your way in Continuum",
                "description": "A guide to the records, people, and personal words gathered here.",
                "paragraphs": [
                    "The sidebar brings together your overview, personal memories, financial records, practical instructions, and people to contact.",
                    "Letters, the Legacy Journal, and the Life Timeline offer places for personal words and experiences. Family Hub brings family memories together.",
                    "Financial Accounts, Insurance, and Property hold practical details. The Document Vault records copies and the locations of originals.",
                    "Family & Contacts holds the people connected to the plan. The owner can choose a recipient and preview that person's shared start page there.",
                    "You can return to a record whenever you want to add details or revise what it says."
                ]
            },
            {
                "id": 2,
                "title": "People and shared views",
                "description": "Where contact details, perspectives, and recipient pages fit together.",
                "paragraphs": [
                    "Family & Contacts is where the owner records names, relationships, phone numbers, email addresses, and personal notes.",
                    "The Owner, Executor, and Family perspectives arrange the account's guidance and navigation for different situations. The perspective control is in the page header.",
                    "A recipient opens a shared start page through a link provided by the owner. It gathers the owner's note, practical records, and available personal messages.",
                    "The owner can preview the recipient page from Family & Contacts and review its contents before sharing the link."
                ]
            },
            {
                "id": 3,
                "title": "Understanding recorded wishes",
                "description": "A place to begin with documents, original locations, and trusted advisors.",
                "paragraphs": [
                    "The Document Vault holds recorded documents and details such as the original's location and review date. Those details help the reader find the material the owner intended them to use.",
                    "Funeral Wishes and Health & Medical hold the preferences and care information the owner has recorded. Personal letters and reflections can add the meaning behind those choices.",
                    "Family & Contacts can include an executor, lawyer, financial advisor, or other trusted person, along with their contact details.",
                    "A qualified professional can help interpret documents and the next steps for the owner's circumstances."
                ]
            }
        ]
    },
    {
        "title": "Using your records",
        "guides": [
            {
                "id": 4,
                "title": "Reading the dashboard",
                "description": "How to follow a summary back to the information behind it.",
                "paragraphs": [
                    "The dashboard brings recorded areas of the plan into view. Its cards lead to the related records.",
                    "Counts describe recorded entries. You can open the corresponding area to read the names, values, notes, and files behind a summary.",
                    "Insights brings together checks based on recorded information. Reviewing the underlying records helps you understand what each check describes.",
                    "The Cards and Table controls offer different views of the same records on pages that provide both choices."
                ]
            },
            {
                "id": 5,
                "title": "Reading notes and keeping a copy",
                "description": "Where to find personal messages, check-in information, and download options.",
                "paragraphs": [
                    "A shared recipient page begins with the owner's note and practical information. Available letters and memories offer a separate place for personal words.",
                    "The Red Binder offers a readable view and print or download options. Opening the saved copy and its files lets you check what you have taken with you.",
                    "The owner can review a chosen Pulse check-in plan, trusted contacts, and waits on the Pulse pages. Message Hub shows its recorded message history.",
                    "You can return to the original records to read more detail or ask a named contact for help understanding them."
                ]
            }
        ]
    }
];

    let activeGuide = $state<Guide | null>(null);
</script>

<div class="space-y-8">
    {#each guideGroups as group}
        <div class="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3
                class="font-bold text-xl text-foreground mb-6 flex items-center gap-2"
            >
                <BookOpen class="text-primary" aria-hidden="true" />
                {group.title}
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each group.guides as guide}
                    <button
                        aria-haspopup="dialog"
                        class="text-left bg-muted hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-xl p-4 transition-all group relative overflow-hidden"
                        onclick={() => (activeGuide = guide)}
                    >
                        <div
                            class="absolute top-3 right-3 bg-card/80 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-muted-foreground group-hover:text-primary-hover"
                        >
                            Written guide
                        </div>

                        <div
                            class="w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-sm text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all mb-3"
                        >
                            <BookOpen size={20} aria-hidden="true" />
                        </div>

                        <h4
                            class="font-bold text-foreground group-hover:text-primary-hover mb-1"
                        >
                            {guide.title}
                        </h4>
                        <p class="text-xs text-muted-foreground line-clamp-2">
                            {guide.description}
                        </p>
                    </button>
                {/each}
            </div>
        </div>
    {/each}

    <!-- Written guide dialog -->
    {#if activeGuide}
        <div role="dialog" aria-modal="true" aria-labelledby={`family-guide-${activeGuide.id}`} use:focusTrap={{ onEscape: () => (activeGuide = null) }}
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                in:slide={{ duration: 200, axis: "y" }}
            >
                <div class="p-6 flex-1 overflow-y-auto">
                    <div class="flex justify-between items-start mb-6 gap-4">
                        <div>
                            <h3 id={`family-guide-${activeGuide.id}`}
                                class="font-serif font-bold text-2xl text-foreground"
                            >
                                {activeGuide.title}
                            </h3>
                            <p class="text-muted-foreground">
                                {activeGuide.description}
                            </p>
                        </div>
                        <button aria-label="Close guide"
                            onclick={() => (activeGuide = null)}
                            class="p-2 hover:bg-muted rounded-full transition-colors shrink-0"
                        >
                            <X size={20} class="text-muted-foreground" aria-hidden="true" />
                        </button>
                    </div>

                    <div
                        class="bg-muted rounded-xl p-6 border border-border"
                    >
                        <h4
                            class="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"
                        >
                            <FileText size={14} aria-hidden="true" /> Written guide
                        </h4>
                        <ul class="space-y-3">
                            {#each activeGuide.paragraphs as paragraph}
                                <li class="flex gap-3 text-sm text-muted-foreground">
                                    <span
                                        class="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"
                                        aria-hidden="true"
                                    ></span>
                                    <p>{paragraph}</p>
                                </li>
                            {/each}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
