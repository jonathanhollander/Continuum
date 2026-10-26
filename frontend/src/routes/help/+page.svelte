<script lang="ts">
    import { Shield, BookOpen, Users, HelpCircle } from "lucide-svelte";
    import FAQSection from "$lib/components/help/FAQSection.svelte";
    import ProfessionalDirectory from "$lib/components/help/ProfessionalDirectory.svelte";
    import GettingStartedWizard from "$lib/components/help/GettingStartedWizard.svelte";

    let activeTab: "guide" | "resources" | "faq" = "guide";
</script>

<div class="min-h-screen bg-background pb-20">
    <!-- Header -->
    <header
        class="bg-primary-deep text-white pt-12 pb-24 relative overflow-hidden"
    >
        <div
            class="absolute top-0 right-0 w-96 h-96 bg-gold opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"
        ></div>
        <div class="container mx-auto px-6 relative z-10">
            <div
                class="flex items-center gap-3 text-gold font-bold uppercase tracking-widest text-xs mb-4"
            >
                <Shield size={14} />
                <span>Support Center</span>
            </div>
            <h1 class="font-serif text-4xl md:text-5xl mb-4 text-white">
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
                    ? 'bg-card border-transparent text-primary-deep dark:text-primary-hover shadow-lg'
                    : 'bg-primary-deep/80 border-white/20 text-white hover:bg-primary-deep'}"
                on:click={() => (activeTab = "guide")}
            >
                <BookOpen
                    size={20}
                    class={activeTab === "guide"
                        ? "text-gold-text"
                        : "text-white/70"}
                />
                <span class="font-bold">Getting Started</span>
            </button>

            <button
                class="flex items-center gap-3 px-6 py-4 rounded-xl border transition-all whitespace-nowrap
        {activeTab === 'resources'
                    ? 'bg-card border-transparent text-primary-deep dark:text-primary-hover shadow-lg'
                    : 'bg-primary-deep/80 border-white/20 text-white hover:bg-primary-deep'}"
                on:click={() => (activeTab = "resources")}
            >
                <Users
                    size={20}
                    class={activeTab === "resources"
                        ? "text-gold-text"
                        : "text-white/70"}
                />
                <span class="font-bold">Pro Directory</span>
            </button>

            <button
                class="flex items-center gap-3 px-6 py-4 rounded-xl border transition-all whitespace-nowrap
        {activeTab === 'faq'
                    ? 'bg-card border-transparent text-primary-deep dark:text-primary-hover shadow-lg'
                    : 'bg-primary-deep/80 border-white/20 text-white hover:bg-primary-deep'}"
                on:click={() => (activeTab = "faq")}
            >
                <HelpCircle
                    size={20}
                    class={activeTab === "faq"
                        ? "text-gold-text"
                        : "text-white/70"}
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
                        class="bg-card rounded-2xl p-8 shadow-sm border border-border"
                    >
                        <div class="mb-8 border-b border-border pb-8">
                            <h2 class="font-serif text-3xl text-primary-deep dark:text-primary-hover mb-4">
                                Professional Directory
                            </h2>
                            <p class="text-muted-foreground">
                                Professionals who specialize in estate
                                planning.
                            </p>
                        </div>
                        <ProfessionalDirectory />
                    </div>
                </div>
            {:else if activeTab === "faq"}
                <div class="max-w-4xl mx-auto">
                    <div class="text-center mb-12">
                        <h2 class="font-serif text-3xl text-primary-deep dark:text-primary-hover mb-4">
                            Common questions
                        </h2>
                        <p class="text-muted-foreground">
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
