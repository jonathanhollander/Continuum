<script lang="ts">
    import { genesisStore } from "$lib/stores/genesisStore";
    import { familyMembers, addMember } from "$lib/stores/familyStore";
    import { profiles, currentProfileId } from "$lib/stores/profileContext";
    import { page } from "$app/stores";
    import { fade, fly, slide } from "svelte/transition";
    import {
        Sparkles,
        ArrowRight,
        Shield,
        Wallet,
        Users,
        Key,
        User,
        Heart,
        CircleCheck,
        CircleAlert,
    } from "lucide-svelte";
    import { registerAccount } from "$lib/stores/keyringStore";
    import TheArchitect from "$lib/components/wizard/TheArchitect.svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    // --- Wizard State ---
    let wizardStep: "owner" | "beneficiary" | "complete" = "owner";
    let processing = false;

    // --- Data Binding ---
    let ownerName = "";
    let ownerEmail = ""; // Future use for notifications

    let beneficiaryName = "";
    let beneficiaryRelation = "";
    let beneficiaryEmail = "";

    // --- Genesis / AI State ---
    let input = "";
    let responseMessage = "";

    onMount(() => {
        // 1. Check URL params for pre-filled Marketing data
        const paramName = $page.url.searchParams.get("name");
        const paramEmail = $page.url.searchParams.get("email");
        const forceReset = $page.url.searchParams.get("force") === "true";

        if (paramName) ownerName = paramName;
        if (paramEmail) ownerEmail = paramEmail;

        if (forceReset) {
            localStorage.removeItem("continuum_setup_skipped");
            wizardStep = "owner";
            return;
        }

        // 2. Check Store for existing Owner Name (Persistence Check)
        // We need to check the actual store values
        // Note: subscriber auto-runs, but onMount is safer for initial logic
        const allProfiles = get(profiles);
        const currentId = get(currentProfileId);

        const currentProfile =
            allProfiles.find((p) => p.id === currentId) ||
            allProfiles.find((p) => p.id === "owner");

        if (
            currentProfile &&
            currentProfile.name &&
            currentProfile.name !== "Original User"
        ) {
            ownerName = currentProfile.name;
            // If we have a real name, assume Step 1 is done
            wizardStep = "beneficiary";
        }

        // 3. Check if we already have a beneficiary OR skipped
        const members = get(familyMembers);
        const isSkipped =
            localStorage.getItem("continuum_setup_skipped") === "true";

        if (members.length > 1 || isSkipped) {
            wizardStep = "complete";
        }
    });

    function saveOwner() {
        if (!ownerName) return;

        // Register Account if email is provided
        if (ownerEmail) {
            registerAccount(ownerEmail);
        }

        // Update Concierge Profile
        profiles.update((current) => {
            return current.map((p) => {
                if (p.id === "owner" || p.id === $currentProfileId) {
                    return { ...p, name: ownerName };
                }
                return p;
            });
        });

        // Move to next step
        wizardStep = "beneficiary";
    }

    function saveBeneficiary() {
        if (!beneficiaryName) return;

        // Add to Family Store
        addMember({
            name: beneficiaryName,
            role: "executor", // Default to Executor/Professional or generic? Let's assume important contact.
            relationToOwner: beneficiaryRelation || "Beneficiary",
            email: beneficiaryEmail,
            isExecutor: true, // Make them key by default? Or ask? User said "intending to pass this on to".
            isBeneficiary: true,
            isEmergencyContact: true, // Likely true for the primary person
            avatar: "",
        });

        // Complete
        wizardStep = "complete";
    }

    const BLOCKS = [
        {
            id: "foundation",
            label: "My Foundation",
            icon: Shield,
            desc: "Legal Authority",
            color: "from-emerald-500 to-teal-600",
            route: "/modules/legal-documents",
        },
        {
            id: "network",
            label: "My People",
            icon: Users,
            desc: "Emergency Contacts",
            color: "from-rose-500 to-orange-600",
            route: "/modules/contacts",
        },
        {
            id: "vault",
            label: "My Assets",
            icon: Wallet,
            desc: "Financial access",
            color: "from-indigo-500 to-purple-600",
            route: "/modules/financial-accounts",
        },
        {
            id: "digital",
            label: "Digital Life",
            icon: Key,
            desc: "Passwords & Data",
            color: "from-sky-500 to-blue-600",
            route: "/modules/digital-guardian",
        },
    ];

    function handleNavigation(route: string, id: string) {
        genesisStore.setActiveBlock(id);
        genesisStore.setGodMode(false); // Ensure we are in focus mode
        goto(route);
    }

    function handleInput() {
        if (!input) return;
        processing = true;

        // Simulate AI Thinking
        setTimeout(() => {
            const result = genesisStore.analyzeIntent(input);
            responseMessage = result.message;
            if (result.route) {
                // Auto-navigate after a brief delay to read message
                setTimeout(
                    () => handleNavigation(result.route!, "custom"),
                    1500,
                );
            }
            processing = false;
        }, 800);
    }
</script>

<div class="flex-1 flex h-full relative overflow-hidden">
    <!-- Left: The Architect (Always present guide) -->
    <TheArchitect
        title={wizardStep === "complete"
            ? "Welcome, " + (ownerName || "Owner") + "."
            : "System Initialization"}
        blueprint={wizardStep === "complete"
            ? "Estate Architecture"
            : "Core Configuration"}
        why="A legacy isn't built in a day. It is built one block at a time."
        tip="There is no wrong place to start. Pick what keeps you up at night."
        backLink="/"
        backLabel="Main Menu"
    />

    <!-- Center Stage -->
    <div
        class="flex-1 flex flex-col items-center justify-center p-12 relative z-10"
    >
        <!-- STEP 1: OWNER IDENTITY -->
        {#if wizardStep === "owner"}
            <div class="max-w-md w-full" in:fly={{ y: 20, duration: 600 }}>
                <div class="mb-8 text-center">
                    <div
                        class="mx-auto w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30"
                    >
                        <User size={32} class="text-indigo-400" />
                    </div>
                    <h2 class="text-3xl font-light text-white mb-2">
                        Who are you?
                    </h2>
                    <p class="text-slate-400">
                        Let's start by establishing your identity as the Estate
                        Owner.
                    </p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-2">
                        <label
                            class="text-xs uppercase tracking-widest text-slate-500 font-bold ml-1"
                            >Full Name</label
                        >
                        <input
                            bind:value={ownerName}
                            type="text"
                            placeholder="e.g. Jonathan Hollander"
                            class="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div class="space-y-2">
                        <label
                            class="text-xs uppercase tracking-widest text-slate-500 font-bold ml-1"
                            >Email (Optional)</label
                        >
                        <input
                            bind:value={ownerEmail}
                            type="email"
                            placeholder="To receive your plan..."
                            class="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <button
                        on:click={saveOwner}
                        disabled={!ownerName}
                        class="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                    >
                        <span>Continue</span>
                        <ArrowRight size={18} />
                    </button>

                    <!-- Only show skip on Step 1 if they want to browse anonymously? -->
                    <button
                        on:click={() => {
                            localStorage.setItem(
                                "continuum_setup_skipped",
                                "true",
                            );
                            wizardStep = "complete";
                        }}
                        class="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors mt-2"
                    >
                        Skip setup for now
                    </button>
                </div>
            </div>

            <!-- STEP 2: BENEFICIARY IDENTITY -->
        {:else if wizardStep === "beneficiary"}
            <div class="max-w-md w-full" in:fly={{ x: 50, duration: 600 }}>
                <div class="mb-8 text-center">
                    <div
                        class="mx-auto w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/30"
                    >
                        <Heart size={32} class="text-rose-400" />
                    </div>
                    <h2 class="text-3xl font-light text-white mb-2">
                        Who is this for?
                    </h2>
                    <p class="text-slate-400">
                        Knowing your primary beneficiary helps the AI tailor its
                        guidance for them.
                    </p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-2">
                        <label
                            class="text-xs uppercase tracking-widest text-slate-500 font-bold ml-1"
                            >Their Name</label
                        >
                        <input
                            bind:value={beneficiaryName}
                            type="text"
                            placeholder="e.g. Sarah, or 'My Kids'"
                            class="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label
                                class="text-xs uppercase tracking-widest text-slate-500 font-bold ml-1"
                                >Relation</label
                            >
                            <input
                                bind:value={beneficiaryRelation}
                                type="text"
                                placeholder="e.g. Wife, Son"
                                class="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-600"
                            />
                        </div>
                        <div class="space-y-2">
                            <label
                                class="text-xs uppercase tracking-widest text-slate-500 font-bold ml-1"
                                >Email (Optional)</label
                            >
                            <input
                                bind:value={beneficiaryEmail}
                                type="email"
                                placeholder="For access..."
                                class="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <button
                        on:click={saveBeneficiary}
                        disabled={!beneficiaryName}
                        class="w-full mt-6 bg-rose-600 hover:bg-rose-500 text-white font-medium py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
                    >
                        <span>Initialize System</span>
                        <CircleCheck size={18} />
                    </button>

                    <button
                        on:click={() => {
                            localStorage.setItem(
                                "continuum_setup_skipped",
                                "true",
                            );
                            wizardStep = "complete";
                        }}
                        class="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors"
                    >
                        Skip for now
                    </button>
                </div>
            </div>

            <!-- STEP 3: THE GENESIS DASHBOARD (Original Content) -->
        {:else}
            <!-- RESUME SETUP ALERT -->
            {#if $familyMembers.length <= 1}
                <div class="absolute top-4 right-12 z-50">
                    <button
                        on:click={() => (wizardStep = "owner")}
                        class="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all backdrop-blur-md"
                        in:fly={{ y: -20, duration: 400 }}
                    >
                        <CircleAlert size={16} />
                        <span>Setup Incomplete</span>
                        <ArrowRight size={14} class="opacity-50" />
                    </button>
                </div>
            {/if}

            <!-- AI Input / Architect Interface -->
            <div
                class="max-w-xl mx-auto mb-20 relative z-20 w-full"
                in:fade={{ duration: 800 }}
            >
                <h2
                    class="text-3xl md:text-4xl font-light text-center mb-8 tracking-wide text-white"
                >
                    What requires your <span
                        class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-medium"
                        >immediate attention</span
                    >?
                </h2>
                <div class="flex justify-center mb-6">
                    <div
                        class="p-3 bg-white/5 rounded-full border border-white/10 animate-pulse"
                    >
                        <Sparkles size={24} class="text-indigo-400" />
                    </div>
                </div>

                <div class="relative group">
                    <input
                        type="text"
                        bind:value={input}
                        on:keydown={(e) => e.key === "Enter" && handleInput()}
                        placeholder="e.g., 'I want to make sure my wife can access the bank accounts...'"
                        class="w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl py-6 px-8 text-lg md:text-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-2xl"
                    />

                    <button
                        on:click={handleInput}
                        class="absolute right-3 top-3 bottom-3 aspect-square bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl flex items-center justify-center transition-colors border border-white/5"
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>

                <!-- AI Response Area -->
                {#if responseMessage}
                    <div
                        class="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-200 text-sm"
                        in:slide
                    >
                        <span class="font-bold mr-2">System:</span>
                        {@html responseMessage}
                    </div>
                {/if}
            </div>

            <!-- The Citadel Blocks -->
            <div
                class="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl"
                in:fade={{ duration: 1000, delay: 200 }}
            >
                {#each BLOCKS as block, i}
                    <button
                        class="group relative h-48 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm overflow-hidden hover:scale-105 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] text-left p-6 flex flex-col justify-between"
                        in:fly={{ y: 50, duration: 800, delay: i * 100 }}
                        on:click={() => handleNavigation(block.route, block.id)}
                    >
                        <!-- Background Gradient (Hidden by default, reveal on hover) -->
                        <div
                            class="absolute inset-0 bg-gradient-to-br {block.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                        ></div>

                        <!-- Icon -->
                        <div
                            class="relative z-10 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors"
                        >
                            <svelte:component
                                this={block.icon}
                                size={20}
                                class="text-slate-300 group-hover:text-white"
                            />
                        </div>

                        <!-- Text -->
                        <div class="relative z-10">
                            <h3
                                class="text-xl font-bold text-slate-200 group-hover:text-white transition-colors"
                            >
                                {block.label}
                            </h3>
                            <p
                                class="text-xs text-slate-500 group-hover:text-slate-300 uppercase tracking-wider mt-1"
                            >
                                {block.desc}
                            </p>
                        </div>

                        <!-- 3D Edge Highlight -->
                        <div
                            class="absolute inset-0 border border-white/10 rounded-3xl transition-all group-hover:border-white/30"
                        ></div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>
