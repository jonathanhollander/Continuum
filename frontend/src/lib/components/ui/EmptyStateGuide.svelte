<script lang="ts">
    import {
        Users,
        User,
        Phone,
        Plus,
        Gift,
        Music,
        Heart,
        Wallet,
        FileText,
        Hammer,
        Receipt,
        Book,
    } from "lucide-svelte";
    import { fade } from "svelte/transition";

    export let type:
        | "contacts"
        | "heirlooms"
        | "funeral"
        | "financial"
        | "legal"
        | "home"
        | "subscriptions"
        | "binder"
        | "default" = "default";
    export let onAdd: () => void;

    // Custom Overrides (Optional)
    export let title: string | undefined = undefined;
    export let description: string | undefined = undefined;
    export let icon: any = undefined;
    export let actionLabel: string | undefined = undefined;

    const guides = {
        contacts: {
            title: "Your Circle of Trust",
            description:
                "Add key people who should be notified or involved. Start with your immediate family or executor.",
            icon: Users,
            examples: [
                { name: "Spouse / Partner", role: "Category: Family" },
                { name: "Executor / Attorney", role: "Category: Legal" },
                { name: "Best Friend", role: "Category: Support" },
                { name: "Primary Physician", role: "Category: Medical" },
                { name: "Financial Advisor", role: "Category: Professional" },
                { name: "Neighbor w/ Key", role: "Category: Support" },
            ],
        },
        heirlooms: {
            title: "Treasure Registry",
            description:
                "Catalog items that carry emotional value. Ensure their stories aren't lost.",
            icon: Gift,
            examples: [
                { name: "Grandfather's Watch", role: "For: James (Son)" },
                { name: "Wedding Pearls", role: "For: Emily (Niece)" },
                { name: "Vintage Guitar", role: "For: Sarah (Daughter)" },
                { name: "War Medals", role: "For: Museum / Loan" },
                { name: "Family Bible", role: "For: Eldest Grandchild" },
                { name: "Grandma's Recipes", role: "For: Entire Family" },
            ],
        },
        funeral: {
            title: "Final Wishes",
            description:
                "Guide your loved ones on how you'd like to be remembered. Music, flowers, and tone.",
            icon: Music,
            examples: [
                {
                    name: "Processional Song",
                    role: "e.g. 'What a Wonderful World'",
                },
                { name: "Flower Preference", role: "e.g. White Lilies" },
                { name: "Dress Code", role: "e.g. Colorful / No Black" },
                { name: "Preferred Venue", role: "e.g. Seaside Park" },
                { name: "Pallbearers", role: "e.g. Cousins & Uncles" },
                { name: "Donations", role: "e.g. Local Animal Shelter" },
            ],
        },
        financial: {
            title: "Asset Ledger",
            description:
                "Track your physical and digital assets. This creates a roadmap for your Executor.",
            icon: Wallet,
            examples: [
                { name: "Primary Residence", role: "Type: Property" },
                { name: "Main Checking", role: "Type: Financial" },
                { name: "Life Insurance", role: "Type: Policy" },
                { name: "Crypto Wallet", role: "Type: Digital" },
                { name: "401(k) / Ira", role: "Type: Retirement" },
                { name: "Safety Deposit Box", role: "Type: Physical" },
            ],
        },
        legal: {
            title: "Document Vault",
            description:
                "Securely log locations of critical documents. We verify that you know where they are.",
            icon: FileText,
            examples: [
                { name: "Last Will & Testament", role: "Location: Safe" },
                { name: "Living Trust", role: "Location: Lawyer" },
                { name: "Power of Attorney", role: "Location: Desk Drawer" },
                { name: "Healthcare Proxy", role: "Location: Doctor" },
                { name: "Property Deed", role: "Location: Bank Box" },
                { name: "Marriage Certificate", role: "Location: Cloud" },
            ],
        },
        home: {
            title: "Home Operating Manual",
            description:
                "Don't leave them guessing. Log trusted vendors and critical shutoff locations.",
            icon: Hammer,
            examples: [
                { name: "Plumber", role: "Contact: Mario" },
                { name: "Water Shutoff", role: "Loc: Garage Wall" },
                { name: "WiFi Password", role: "Loc: Router Sticker" },
                { name: "Electrician", role: "Contact: Sparky Inc." },
                { name: "Alarm Code", role: "Loc: Safe" },
                { name: "Landscaper", role: "Contact: Green Thumb" },
            ],
        },
        subscriptions: {
            title: "Recurring Charges",
            description:
                "Identify 'Zombie Bills' and services that need cancellation.",
            icon: Receipt,
            examples: [
                { name: "Netflix", role: "Cycle: Monthly" },
                { name: "Gym Membership", role: "Diff: Hard" },
                { name: "Amazon Prime", role: "Cycle: Yearly" },
                { name: "Spotify", role: "Cycle: Monthly" },
                { name: "New York Times", role: "Cycle: Weekly" },
                { name: "Cloud Storage", role: "Cycle: Monthly" },
            ],
        },
        binder: {
            title: "The Red Binder",
            description:
                "This is a digital mirror of your physical binder. Fill in other sections to populate this.",
            icon: Book,
            examples: [
                { name: "Estate Overview", role: "Status: Generated" },
                { name: "Asset List", role: "Status: Pending" },
                { name: "Instructions", role: "Status: Complete" },
                { name: "Contact Sheet", role: "Status: Updated" },
                { name: "Login Credentials", role: "Status: Vaulted" },
            ],
        },
        default: {
            title: "Start Building",
            description: "This section is empty. Add your first item to begin.",
            icon: Plus,
            examples: [],
        },
    };

    $: config = guides[type] || guides.default;

    $: displayTitle = title || config.title;
    $: displayDesc = description || config.description;
    $: displayIcon = icon || config.icon;
    $: displayAction = actionLabel || "Add First Item";
</script>

<div class="py-12 px-4 max-w-3xl mx-auto text-center" in:fade>
    <!-- Header -->
    <div class="mb-8">
        <div
            class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"
        >
            <svelte:component this={displayIcon} size={32} />
        </div>
        <h3 class="font-serif font-bold text-2xl text-slate-700 mb-2">
            {displayTitle}
        </h3>
        <p class="text-slate-500 max-w-md mx-auto">{displayDesc}</p>
    </div>

    <!-- Ghost Cards -->
    <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 opacity-50 pointer-events-none select-none"
    >
        {#each config.examples as ex}
            <div
                class="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 flex items-center gap-3"
            >
                <div
                    class="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"
                >
                    <Plus size={16} />
                </div>
                <div class="text-left">
                    <div class="font-bold text-slate-400 text-sm">
                        {ex.name}
                    </div>
                    <div class="text-xs text-slate-300 uppercase font-bold">
                        {ex.role}
                    </div>
                </div>
            </div>
        {/each}
        <div
            class="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200 border-dashed flex items-center justify-center gap-2 animate-pulse"
        >
            <span class="text-indigo-400 text-sm font-bold"
                >Your Entry Goes Here</span
            >
        </div>
    </div>

    <!-- CTA -->
    <button
        on:click={onAdd}
        class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
    >
        <Plus size={20} />
        {displayAction}
    </button>
</div>
