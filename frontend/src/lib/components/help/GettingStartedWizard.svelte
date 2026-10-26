<script lang="ts">
    import {
        ArrowRight,
        Check,
        Settings,
        Shield,
        Users,
    } from "lucide-svelte";

    let currentStep = $state(1);

    const steps = [
        {
            id: 1,
            title: "Complexity",
            icon: Settings,
            desc: "Tailor the estate plan to your needs",
        },
        {
            id: 2,
            title: "Key People",
            icon: Users,
            desc: "Add executor and family members",
        },
        {
            id: 3,
            title: "Core Assets",
            icon: Shield,
            desc: "Secure your financial foundation",
        },
        { id: 4, title: "Complete", icon: Check, desc: "You're ready to go!" },
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
                How complex is your estate?
            </h2>
            <p class="text-muted-foreground mb-8">
                This helps us show the tools that fit you.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-6 rounded-xl border-2 border-border text-left">
                    <div
                        class="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center mb-4"
                    >
                        <span class="text-xl font-bold">1</span>
                    </div>
                    <h3 class="font-bold text-foreground mb-2">Simple</h3>
                    <p class="text-xs text-muted-foreground">
                        Single home, simple accounts, straightforward trusts.
                    </p>
                </div>
                <div class="p-6 rounded-xl border-2 border-border text-left">
                    <div
                        class="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-4"
                    >
                        <span class="text-xl font-bold">2</span>
                    </div>
                    <h3 class="font-bold text-foreground mb-2">Standard</h3>
                    <p class="text-xs text-muted-foreground">
                        Home + investments, life insurance, retirement accounts.
                    </p>
                </div>
                <div class="p-6 rounded-xl border-2 border-border text-left">
                    <div
                        class="w-12 h-12 rounded-full bg-gold/15 text-gold-text flex items-center justify-center mb-4"
                    >
                        <span class="text-xl font-bold">3</span>
                    </div>
                    <h3 class="font-bold text-foreground mb-2">Complex</h3>
                    <p class="text-xs text-muted-foreground">
                        Business interests, multiple properties, advanced tax
                        planning.
                    </p>
                </div>
            </div>
            <a href="/modules/builders-console" data-testid="wizard-link" class="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl border-2 border-primary text-primary-deep dark:text-primary-hover font-bold hover:bg-primary/5 transition-colors">
                Choose your level in Builder Tools
                <ArrowRight size={16} />
            </a>
        {:else if currentStep === 2}
            <h2 class="text-3xl font-serif text-primary-deep dark:text-primary-hover mb-4">
                Who is your Executor?
            </h2>
            <p class="text-muted-foreground mb-8">
                We'll set up a special dashboard just for them.
            </p>
            <p class="text-foreground max-w-md mx-auto">
                In Family &amp; Contacts, add them and mark them as your
                <strong>Designated Executor</strong>.
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
                Do you know where these documents are kept?
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
                    You're ready to go!
                </h2>
                <p class="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                    Your dashboard brings every part of your plan together in
                    one place.
                </p>
                <a
                    href="/dashboard"
                    data-testid="wizard-finish"
                    class="inline-block px-8 py-3 bg-primary-deep text-white rounded-xl font-bold hover:bg-primary-deep/90 transition-colors shadow-lg shadow-primary-deep/20"
                >
                    Go to Dashboard
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
                Next Step
                <ArrowRight size={18} />
            </button>
        </div>
    {/if}
</div>
