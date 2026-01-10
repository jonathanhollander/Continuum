<script lang="ts">
    import { onMount } from "svelte";
    import { t } from "$lib/stores/concierge";
    import { registerAccount } from "$lib/stores/keyringStore";
    import { profiles, currentProfileId } from "$lib/stores/profileContext";
    import { get } from "svelte/store";
    import { fade, slide, fly } from "svelte/transition";
    import {
        ArrowRight,
        CircleCheck,
        User,
        Users,
        Building2,
        Heart,
        Shield,
        Sparkles,
        ChevronRight,
        ChevronLeft,
    } from "lucide-svelte";

    // Setup State
    let step = 0;
    let direction = 1;

    // User Data Model
    let profile = {
        firstName: "",
        email: "",
        age: "",
        state: "",
        maritalStatus: "single", // single, married, divorced, widowed
        hasChildren: false,
        childrenCount: 0,
        hasPets: false,
        hasBusiness: false,
        hasTrust: false,
        wishes: {
            remains: "", // burial, cremation, science
            organDonor: false,
        },
    };

    let selectedAssets: string[] = [];

    const assetTypes = [
        { id: "home", label: "Primary Residence", icon: Building2 },
        { id: "bank", label: "Bank Accounts", icon: Shield },
        { id: "life_insurance", label: "Life Insurance", icon: Heart },
        { id: "business", label: "Business Interest", icon: Building2 },
        { id: "crypto", label: "Digital Assets", icon: Sparkles },
    ];

    // Navigation and completion logic
    function next() {
        if (step === 1 && profile.firstName) {
            // Update the profile name in the store
            const pid = get(currentProfileId) || "owner";
            profiles.update((current) => {
                return current.map((p) =>
                    p.id === pid ? { ...p, name: profile.firstName } : p,
                );
            });
        }

        if (step === 1 && profile.email) {
            registerAccount(profile.email);
        }

        if (step < 4) {
            direction = 1;
            step++;
        } else {
            completeSetup();
        }
    }

    function back() {
        if (step > 0) {
            direction = -1;
            step--;
        }
    }

    function toggleAsset(id: string) {
        if (selectedAssets.includes(id)) {
            selectedAssets = selectedAssets.filter((a) => a !== id);
        } else {
            selectedAssets = [...selectedAssets, id];
        }
    }

    function completeSetup() {
        // Here we would save to local storage or API
        // For now, we simulate "Configuring..."
        isConfiguring = true;
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 2000);
    }

    let isConfiguring = false;
</script>

<div
    class="max-w-2xl mx-auto w-full min-h-[600px] flex flex-col relative overflow-hidden bg-white/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20"
>
    <!-- Progress Header -->
    <div class="p-8 border-b border-black/5 flex justify-between items-center">
        <div>
            <h2
                class="text-xs font-bold uppercase tracking-widest text-[#4A7C74] mb-1"
            >
                {$t.wizTitle}
            </h2>
            <div class="flex gap-2">
                {#each [0, 1, 2, 3, 4] as s}
                    <div
                        class="h-1.5 w-8 rounded-full transition-all duration-500 {s <=
                        step
                            ? 'bg-[#4A7C74]'
                            : 'bg-gray-200'}"
                    ></div>
                {/each}
            </div>
        </div>
        <div
            class="w-10 h-10 rounded-full bg-[#4A7C74]/10 flex items-center justify-center text-[#4A7C74]"
        >
            <Sparkles size={20} />
        </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 p-8 relative">
        {#if isConfiguring}
            <div
                class="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-50 p-8 text-center"
                in:fade
            >
                <div
                    class="w-16 h-16 border-4 border-[#4A7C74] border-t-transparent rounded-full animate-spin mb-6"
                ></div>
                <h3 class="text-2xl font-serif font-bold text-[#304743] mb-2">
                    {$t.wizConfiguring}
                </h3>
                <p class="text-muted-foreground">
                    {$t.wizConfiguringDesc}
                </p>
            </div>
        {/if}

        <!-- Step 0: Welcome -->
        {#if step === 0}
            <div
                class="h-full flex flex-col justify-center text-center space-y-6"
                in:fly={{ x: 20 * direction, duration: 400 }}
                out:fly={{ x: -20 * direction, duration: 400 }}
            >
                <div
                    class="mx-auto w-20 h-20 bg-[#4A7C74] text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 mb-4"
                >
                    <Shield size={40} />
                </div>
                <h1 class="text-4xl font-serif font-bold text-[#304743]">
                    {$t.wizWelcome}
                </h1>
                <p
                    class="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed"
                >
                    {$t.wizWelcomeDesc}
                </p>
                <p
                    class="text-sm font-bold text-[#4A7C74] uppercase tracking-wide"
                >
                    {$t.wizWelcomeCTA}
                </p>
            </div>
        {/if}

        <!-- Step 1: The Basics -->
        {#if step === 1}
            <div
                class="space-y-6"
                in:fly={{ x: 20 * direction, duration: 400 }}
                out:fly={{ x: -20 * direction, duration: 400 }}
            >
                <div class="space-y-2">
                    <h2 class="text-3xl font-serif font-bold text-[#304743]">
                        {$t.wizBasics}
                    </h2>
                    <p class="text-muted-foreground">
                        {$t.wizBasicsDesc}
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase text-muted-foreground"
                            >{$t.wizLabelFirstName}</label
                        >
                        <input
                            bind:value={profile.firstName}
                            class="w-full text-lg p-3 border-b-2 border-border bg-transparent focus:border-[#4A7C74] outline-none transition-colors"
                            placeholder="Type your name..."
                        />
                    </div>
                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase text-muted-foreground"
                            >{$t.wizLabelEmail || "Email (Optional)"}</label
                        >
                        <input
                            bind:value={profile.email}
                            type="email"
                            class="w-full text-lg p-3 border-b-2 border-border bg-transparent focus:border-[#4A7C74] outline-none transition-colors"
                            placeholder="To save your progress..."
                        />
                    </div>
                </div>

                <div class="pt-4">
                    <label
                        class="text-xs font-bold uppercase text-muted-foreground block mb-3"
                        >{$t.wizLabelMarital}</label
                    >
                    <div class="flex gap-4">
                        {#each ["Single", "Married", "Partnered", "Widowed"] as status}
                            <button
                                onclick={() =>
                                    (profile.maritalStatus =
                                        status.toLowerCase())}
                                class="px-4 py-2 rounded-lg border transition-all {profile.maritalStatus ===
                                status.toLowerCase()
                                    ? 'bg-[#4A7C74] text-white border-transparent shadow-md'
                                    : 'bg-white border-border text-muted-foreground hover:border-[#4A7C74]'}"
                            >
                                {status}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}

        <!-- Step 2: Family -->
        {#if step === 2}
            <div
                class="space-y-6"
                in:fly={{ x: 20 * direction, duration: 400 }}
                out:fly={{ x: -20 * direction, duration: 400 }}
            >
                <div class="space-y-2">
                    <h2 class="text-3xl font-serif font-bold text-[#304743]">
                        {$t.wizFamily}
                    </h2>
                    <p class="text-muted-foreground">
                        {$t.wizFamilyDesc}
                    </p>
                </div>

                <div class="space-y-6 pt-4">
                    <div
                        class="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-border"
                    >
                        <div class="flex items-center gap-4">
                            <div
                                class="p-3 bg-blue-100 text-blue-600 rounded-full"
                            >
                                <Users size={24} />
                            </div>
                            <div>
                                <h4 class="font-bold text-foreground">
                                    {$t.wizLabelChildren}
                                </h4>
                                <p class="text-xs text-muted-foreground">
                                    {$t.wizLabelChildrenDesc}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <button
                                onclick={() =>
                                    (profile.childrenCount = Math.max(
                                        0,
                                        profile.childrenCount - 1,
                                    ))}
                                class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-lg"
                                >-</button
                            >
                            <span class="w-8 text-center font-bold text-xl"
                                >{profile.childrenCount}</span
                            >
                            <button
                                onclick={() => {
                                    profile.childrenCount++;
                                    profile.hasChildren = true;
                                }}
                                class="w-8 h-8 rounded-full bg-[#4A7C74] text-white hover:opacity-90 flex items-center justify-center font-bold text-lg"
                                >+</button
                            >
                        </div>
                    </div>

                    <label
                        class="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-border cursor-pointer hover:border-[#4A7C74] transition-colors"
                    >
                        <div class="flex items-center gap-4">
                            <div
                                class="p-3 bg-amber-100 text-amber-600 rounded-full"
                            >
                                <Heart size={24} />
                            </div>
                            <div>
                                <h4 class="font-bold text-foreground">
                                    {$t.wizLabelPets}
                                </h4>
                                <p class="text-xs text-muted-foreground">
                                    {$t.wizLabelPetsDesc}
                                </p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            bind:checked={profile.hasPets}
                            class="w-6 h-6 text-[#4A7C74] rounded focus:ring-[#4A7C74]"
                        />
                    </label>
                </div>
            </div>
        {/if}

        <!-- Step 3: Assets Check -->
        {#if step === 3}
            <div
                class="space-y-6"
                in:fly={{ x: 20 * direction, duration: 400 }}
                out:fly={{ x: -20 * direction, duration: 400 }}
            >
                <div class="space-y-2">
                    <h2 class="text-3xl font-serif font-bold text-[#304743]">
                        {$t.wizAssets}
                    </h2>
                    <p class="text-muted-foreground">
                        {$t.wizAssetsDesc}
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {#each assetTypes as asset}
                        <button
                            onclick={() => toggleAsset(asset.id)}
                            class="flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-md {selectedAssets.includes(
                                asset.id,
                            )
                                ? 'border-[#4A7C74] bg-[#4A7C74]/5 shadow-sm'
                                : 'border-border bg-white/40 hover:bg-white'}"
                        >
                            <div
                                class="p-2 rounded-lg {selectedAssets.includes(
                                    asset.id,
                                )
                                    ? 'bg-[#4A7C74] text-white'
                                    : 'bg-gray-100 text-gray-500'}"
                            >
                                <svelte:component this={asset.icon} size={20} />
                            </div>
                            <span
                                class="font-bold {selectedAssets.includes(
                                    asset.id,
                                )
                                    ? 'text-[#304743]'
                                    : 'text-muted-foreground'}"
                                >{asset.label}</span
                            >
                            {#if selectedAssets.includes(asset.id)}
                                <CircleCheck
                                    size={16}
                                    class="ml-auto text-[#4A7C74]"
                                />
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Step 4: Final Wishes -->
        {#if step === 4}
            <div
                class="space-y-6"
                in:fly={{ x: 20 * direction, duration: 400 }}
                out:fly={{ x: -20 * direction, duration: 400 }}
            >
                <div class="space-y-2">
                    <h2 class="text-3xl font-serif font-bold text-[#304743]">
                        {$t.wizWishes}
                    </h2>
                    <p class="text-muted-foreground">
                        {$t.wizWishesDesc}
                    </p>
                </div>

                <div class="grid grid-cols-1 gap-4 pt-4">
                    {#each ["Burial", "Cremation", "Eco-Friendly / Natural", "Undecided"] as wish}
                        <button
                            onclick={() => (profile.wishes.remains = wish)}
                            class="p-4 rounded-xl border text-left font-bold transition-all {profile
                                .wishes.remains === wish
                                ? 'bg-[#4A7C74] text-white border-transparent shadow-md'
                                : 'bg-white border-border text-muted-foreground hover:border-[#4A7C74] hover:text-[#304743]'}"
                        >
                            {wish}
                        </button>
                    {/each}
                </div>

                <p class="text-xs text-muted-foreground text-center pt-8">
                    {$t.wizWishesNotice}
                </p>
            </div>
        {/if}
    </div>

    <!-- Footer Actions -->
    <div
        class="p-8 border-t border-black/5 flex justify-between items-center bg-white/30"
    >
        {#if step > 0}
            <button
                onclick={back}
                class="text-muted-foreground hover:text-foreground font-bold flex items-center gap-2"
            >
                <ChevronLeft size={18} />
                {$t.wizBtnBack}
            </button>
        {:else}
            <div></div>
            <!-- Spacer -->
        {/if}

        <button
            onclick={next}
            class="bg-[#4A7C74] hover:bg-[#3b635d] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg"
        >
            {#if step === 0}
                {$t.wizBtnStart}
            {:else if step === 4}
                {$t.wizBtnComplete}
            {:else}
                {$t.wizBtnNext} <ArrowRight size={18} />
            {/if}
        </button>
    </div>
</div>
