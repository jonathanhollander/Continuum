<script lang="ts">
    import { Shield, BookOpen, Users, HelpCircle } from "lucide-svelte";
    import FAQSection from "$lib/components/help/FAQSection.svelte";
    import ProfessionalDirectory from "$lib/components/help/ProfessionalDirectory.svelte";
    import GettingStartedWizard from "$lib/components/help/GettingStartedWizard.svelte";

    let activeTab: "guide" | "resources" | "faq" = "guide";
</script>

<div class="min-h-screen bg-[#F9FAFB] pb-20">
    <!-- Header -->
    <header
        class="bg-[#304743] text-white pt-12 pb-24 relative overflow-hidden"
    >
        <div
            class="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37] opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"
        ></div>
        <div class="container mx-auto px-6 relative z-10">
            <div
                class="flex items-center gap-3 text-[#D4AF37] font-bold uppercase tracking-widest text-xs mb-4"
            >
                <Shield size={14} />
                <span>Support Center</span>
            </div>
            <h1 class="font-serif text-4xl md:text-5xl mb-4">
                Help & Resources
            </h1>
            <p class="text-white/70 text-lg max-w-2xl font-light">
                Everything you need to navigate your estate planning journey.
                From getting started to finding the right professionals.
            </p>
        </div>
    </header>

    <div class="container mx-auto px-6 -mt-16 relative z-20">
        <!-- Quick Nav -->
        <div
            class="flex gap-4 mb-8 overflow-x-auto pb-4 md:pb-0 hide-scrollbar"
        >
            <button
                class="flex items-center gap-3 px-6 py-4 rounded-xl border transition-all whitespace-nowrap
        {activeTab === 'guide'
                    ? 'bg-white border-transparent text-[#304743] shadow-lg'
                    : 'bg-[#304743]/80 border-white/20 text-white hover:bg-[#304743]'}"
                on:click={() => (activeTab = "guide")}
            >
                <BookOpen
                    size={20}
                    class={activeTab === "guide"
                        ? "text-[#D4AF37]"
                        : "text-white/50"}
                />
                <span class="font-bold">Getting Started</span>
            </button>

            <button
                class="flex items-center gap-3 px-6 py-4 rounded-xl border transition-all whitespace-nowrap
        {activeTab === 'resources'
                    ? 'bg-white border-transparent text-[#304743] shadow-lg'
                    : 'bg-[#304743]/80 border-white/20 text-white hover:bg-[#304743]'}"
                on:click={() => (activeTab = "resources")}
            >
                <Users
                    size={20}
                    class={activeTab === "resources"
                        ? "text-[#D4AF37]"
                        : "text-white/50"}
                />
                <span class="font-bold">Pro Directory</span>
            </button>

            <button
                class="flex items-center gap-3 px-6 py-4 rounded-xl border transition-all whitespace-nowrap
        {activeTab === 'faq'
                    ? 'bg-white border-transparent text-[#304743] shadow-lg'
                    : 'bg-[#304743]/80 border-white/20 text-white hover:bg-[#304743]'}"
                on:click={() => (activeTab = "faq")}
            >
                <HelpCircle
                    size={20}
                    class={activeTab === "faq"
                        ? "text-[#D4AF37]"
                        : "text-white/50"}
                />
                <span class="font-bold">FAQ</span>
            </button>
        </div>

        <!-- Content Area -->
        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {#if activeTab === "guide"}
                <div class="max-w-4xl mx-auto">
                    <GettingStartedWizard />
                </div>
            {:else if activeTab === "resources"}
                <div class="max-w-6xl mx-auto">
                    <div
                        class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
                    >
                        <div class="mb-8 border-b border-gray-100 pb-8">
                            <h2 class="font-serif text-3xl text-[#304743] mb-4">
                                Professional Directory
                            </h2>
                            <p class="text-gray-500">
                                Connect with vetted professionals who specialize
                                in estate planning. These contacts have been
                                verified for quality and reliability.
                            </p>
                        </div>
                        <ProfessionalDirectory />
                    </div>
                </div>
            {:else if activeTab === "faq"}
                <div class="max-w-4xl mx-auto">
                    <div class="text-center mb-12">
                        <h2 class="font-serif text-3xl text-[#304743] mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p class="text-gray-500">
                            Common questions about securing your legacy.
                        </p>
                    </div>
                    <FAQSection />
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
