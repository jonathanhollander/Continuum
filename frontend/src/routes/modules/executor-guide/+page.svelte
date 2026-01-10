<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import {
        BookOpen,
        ChevronRight,
        Clock,
        FileText,
        Shield,
        Scale,
        Heart,
        Users,
        Activity,
        CircleAlert,
    } from "lucide-svelte";

    const guides = [
        {
            id: "immediate",
            title: "Immediate Actions (First 48 Hours)",
            icon: Clock,
            color: "text-red-600",
            bg: "bg-red-50",
            steps: [
                "Locate the original Will and any Letters of Instruction.",
                "Verify the designated Healthcare Proxy or Power of Attorney status.",
                "Notify immediate family and designated emergency contacts.",
                "Ensure home and physical assets are secure (locks, pets, perishables).",
                "Contact the funeral home or donor registry as specified in the medical directives.",
            ],
        },
        {
            id: "legal",
            title: "Legal & Probate Fundamentals",
            icon: Scale,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            steps: [
                "Petition the court for appointment as Executor (Letters Testamentary).",
                "Obtain multiple certified copies of the Death Certificate.",
                "Notify the Social Security Administration and relevant government agencies.",
                "Publish a notice to creditors if required by local state law.",
                "Open an estate bank account for managing all financial inflows/outflows.",
            ],
        },
        {
            id: "assets",
            title: "Asset Inventory & Management",
            icon: Shield,
            color: "text-blue-600",
            bg: "bg-blue-50",
            steps: [
                "Conduct a thorough search of the home for hidden assets or cash.",
                "Contact banks and financial institutions to freeze/transfer accounts.",
                "Inventory all physical property (real estate, vehicles, jewelry).",
                "Manage digital assets and social media accounts via the Digital Kill Switch records.",
                "Arrange for appraisals of high-value items for tax purposes.",
            ],
        },
    ];

    let activeGuideId = "immediate";
    $: activeGuide = guides.find((g) => g.id === activeGuideId) || guides[0];
</script>

<div class="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
    <!-- Header -->
    <header>
        <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div class="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <BookOpen size={32} />
            </div>
            Executor Knowledge Base
        </h1>
        <p class="text-gray-500 mt-2">
            Essential guidance for those of us handling the handover of a life.
        </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Sidebar Navigation -->
        <div class="lg:col-span-4 space-y-4">
            {#each guides as guide}
                <button
                    on:click={() => (activeGuideId = guide.id)}
                    class="w-full p-6 text-left rounded-3xl border transition-all flex items-center gap-4
                    {activeGuideId === guide.id
                        ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100'
                        : 'bg-gray-50/50 border-transparent hover:bg-white hover:border-gray-200'}"
                >
                    <div class="p-3 {guide.bg} {guide.color} rounded-2xl">
                        <guide.icon size={24} />
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-gray-900 leading-tight">
                            {guide.title}
                        </h3>
                        <p class="text-xs text-gray-500 mt-1">
                            {guide.steps.length} key actions
                        </p>
                    </div>
                    {#if activeGuideId === guide.id}
                        <ChevronRight size={20} class="text-blue-600" />
                    {/if}
                </button>
            {/each}

            <div
                class="p-6 bg-indigo-900 rounded-[32px] text-white overflow-hidden relative group"
            >
                <div class="relative z-10">
                    <h4 class="font-bold mb-2">Need Pro Help?</h4>
                    <p class="text-xs text-indigo-200 leading-relaxed mb-4">
                        Connect with specialized estate attorneys or fiduciary
                        accountants for complex scenarios.
                    </p>
                    <button
                        class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                    >
                        Browse Directory
                    </button>
                </div>
                <Users
                    class="absolute -bottom-4 -right-4 text-white/5"
                    size={120}
                />
            </div>
        </div>

        <!-- Content Area -->
        <div
            class="lg:col-span-8 bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 md:p-12 min-h-[600px]"
        >
            {#key activeGuideId}
                <div in:fade={{ duration: 300 }}>
                    <div class="flex items-center gap-4 mb-8">
                        <div
                            class="p-4 {activeGuide.bg} {activeGuide.color} rounded-[24px]"
                        >
                            <activeGuide.icon size={32} />
                        </div>
                        <h2 class="text-3xl font-black text-gray-900">
                            {activeGuide.title}
                        </h2>
                    </div>

                    <div class="space-y-6">
                        {#each activeGuide.steps as step, i}
                            <div class="flex gap-6 items-start group">
                                <div
                                    class="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-gray-400 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all"
                                >
                                    {i + 1}
                                </div>
                                <div class="pt-2">
                                    <p
                                        class="text-gray-700 font-medium leading-relaxed"
                                    >
                                        {step}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    </div>

                    <div class="mt-20 pt-12 border-t border-gray-100">
                        <div
                            class="flex items-start gap-4 p-6 bg-yellow-50 rounded-3xl border border-yellow-100"
                        >
                            <CircleAlert
                                class="text-yellow-600 mt-1 shrink-0"
                                size={24}
                            />
                            <div>
                                <h4 class="font-bold text-yellow-900">
                                    Pro Tip for Executors
                                </h4>
                                <p
                                    class="text-sm text-yellow-800 mt-1 leading-relaxed"
                                >
                                    Emotional intelligence is as important as
                                    legal diligence. Keep beneficiaries updated
                                    weekly, even if there is no major news.
                                    Transparency prevents most estate
                                    litigation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            {/key}
        </div>
    </div>
</div>
