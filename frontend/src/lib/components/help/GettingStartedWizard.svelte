<script lang="ts">
    import {
        ArrowRight,
        Check,
        Settings,
        Shield,
        Users,
    } from "lucide-svelte";
    import { navGroups } from "$lib/config/navigation";
    import { userRole } from "$lib/stores/conciergeStore.svelte";

    let currentStep = $state(1);

    // Builder Tools opens only for the roles its nav entry allows (the layout guard sends others away).
    const builderToolsHref = "/modules/builders-console";
    let canOpenBuilderTools = $derived(
        navGroups
            .flatMap((g) => g.items)
            .find((i) => i.href === builderToolsHref)
            ?.allowedRoles.includes($userRole) ?? false,
    );

    const steps = [
        {
            id: 1,
            title: "Start small",
            icon: Settings,
            desc: "Choose a useful first record",
        },
        {
            id: 2,
            title: "Key People",
            icon: Users,
            desc: "Add executor and family members",
        },
        {
            id: 3,
            title: "Documents",
            icon: Shield,
            desc: "Record copies and original locations",
        },
        { id: 4, title: "Next action", icon: Check, desc: "Open your records" },
    ];

    // Each document opens the module where it is saved.
    const documents = [
        { name: "Last Will & Testament", href: "/modules/legal-documents" },
        { name: "Power of Attorney", href: "/modules/legal-documents" },
        { name: "Advance Healthcare Directive", href: "/modules/legal-documents" },
        { name: "Life Insurance Policies", href: "/modules/insurance" },
    ];

    function nextStep() {
        if (currentStep < 4) currentStep++;
    }
</script>

<div class="bg-card rounded-2xl border border-border shadow-sm p-8">
    <!-- Progress Bar -->
    <div class="flex justify-between items-center mb-12 relative">
        <div class="absolute top-1/2 left-0 w-full h-1 bg-border -z-0"></div>
        <div
            class="absolute top-1/2 left-0 h-1 bg-primary -z-0 transition-all duration-500"
            style="width: {((currentStep - 1) / 3) * 100}%"
        ></div>

        {#each steps as step}
            <div class="relative z-10 flex flex-col items-center">
                <div
                    class="w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
                    {currentStep >= step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-card border-border text-muted-foreground'}"
                >
                    <step.icon size={18} />
                </div>
                <span
                    class="mt-2 text-xs font-bold uppercase tracking-wide {currentStep >=
                    step.id
                        ? 'text-primary-deep dark:text-primary-hover'
                        : 'text-muted-foreground'}"
                >
                    {step.title}
                </span>
            </div>
        {/each}
    </div>

    <!-- Content Area -->
    <div class="min-h-[300px] max-w-2xl mx-auto text-center">
        {#if currentStep === 1}
            <h2 class="text-3xl font-serif text-primary-deep dark:text-primary-hover mb-4">
                What would help your family first?
            </h2>
            <p class="text-muted-foreground mb-8">
                Open one record to begin, or continue to review people and documents.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/modules/contacts" data-testid="wizard-link" class="p-6 rounded-xl border-2 border-border text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary">
                    <h3 class="font-bold text-foreground mb-2">A person</h3>
                    <p class="text-sm text-muted-foreground">Record who to contact, their number and how they can help.</p>
                    <span class="inline-flex items-center gap-2 text-sm text-primary-deep dark:text-primary-hover mt-4">Open Contacts <ArrowRight size={16} /></span>
                </a>
                <a href="/modules/financial-accounts" data-testid="wizard-link" class="p-6 rounded-xl border-2 border-border text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary">
                    <h3 class="font-bold text-foreground mb-2">An account</h3>
                    <p class="text-sm text-muted-foreground">Record the institution, identifying details and who to ask for help.</p>
                    <span class="inline-flex items-center gap-2 text-sm text-primary-deep dark:text-primary-hover mt-4">Open Accounts <ArrowRight size={16} /></span>
                </a>
                <a href="/modules/letters" data-testid="wizard-link" class="p-6 rounded-xl border-2 border-border text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary">
                    <h3 class="font-bold text-foreground mb-2">Your words</h3>
                    <p class="text-sm text-muted-foreground">Write a letter, a memory or something you want your son to know.</p>
                    <span class="inline-flex items-center gap-2 text-sm text-primary-deep dark:text-primary-hover mt-4">Open Letters <ArrowRight size={16} /></span>
                </a>
            </div>
            {#if canOpenBuilderTools}
                <a href={builderToolsHref} data-testid="wizard-link" class="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl border-2 border-primary text-primary-deep dark:text-primary-hover font-bold hover:bg-primary/5 transition-colors">
                    Review optional checklists in Builder Tools
                    <ArrowRight size={16} />
                </a>
            {/if}
        {:else if currentStep === 2}
            <h2 class="text-3xl font-serif text-primary-deep dark:text-primary-hover mb-4">
                Who should your family contact?
            </h2>
            <p class="text-muted-foreground mb-8">
                Record the people who can help, including your chosen executor.
            </p>
            <p class="text-foreground max-w-md mx-auto">
                In Family &amp; Contacts, add them and mark them as your
                <strong>Designated Executor</strong>, if that is their role. This records
                the designation; it does not share your records. Create their
                recipient link and preview it before sharing the link yourself.
            </p>
            <a href="/modules/contacts" data-testid="wizard-link" class="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl border-2 border-primary text-primary-deep dark:text-primary-hover font-bold hover:bg-primary/5 transition-colors">
                Open Family &amp; Contacts
                <ArrowRight size={16} />
            </a>
        {:else if currentStep === 3}
            <h2 class="text-3xl font-serif text-primary-deep dark:text-primary-hover mb-4">
                Where are your documents?
            </h2>
            <p class="text-muted-foreground mb-8">
                Add copies you have and note where the originals are kept. For example: “Signed will, blue folder in the study; ask Alex for the key.”
            </p>
            <div class="space-y-3 max-w-md mx-auto text-left">
                {#each documents as doc (doc.name)}
                    <a
                        href={doc.href}
                        data-testid="wizard-link"
                        class="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted transition-colors"
                    >
                        <span class="text-foreground font-medium">{doc.name}</span>
                        <ArrowRight size={16} class="ml-auto text-muted-foreground" />
                    </a>
                {/each}
            </div>
        {:else}
            <div class="py-12">
                <div
                    class="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <Check size={40} />
                </div>
                <h2 class="text-3xl font-serif text-primary-deep dark:text-primary-hover mb-4">
                    Choose your next record
                </h2>
                <p class="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                    This introduction has not saved or checked your records. Open your dashboard
                    to add details, write a letter or review what you have already saved.
                </p>
                <a
                    href="/dashboard"
                    data-testid="wizard-finish"
                    class="inline-block px-8 py-3 bg-primary-deep text-white rounded-xl font-bold hover:bg-primary-deep/90 transition-colors shadow-lg shadow-primary-deep/20"
                >
                    Open my records
                </a>
            </div>
        {/if}
    </div>

    <!-- Actions -->
    {#if currentStep < 4}
        <div class="border-t border-border mt-12 pt-6 flex justify-end">
            <button
                onclick={nextStep}
                class="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-1px]"
            >
                Continue
                <ArrowRight size={18} />
            </button>
        </div>
    {/if}
</div>
