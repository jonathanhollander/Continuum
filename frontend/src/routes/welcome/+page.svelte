<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import {
        Users,
        ArrowRight,
        Shield,
        Check,
        Sparkles,
    } from "lucide-svelte";
    import logo from "$lib/assets/logo.png";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth";

    let ready = $state(false);
    let showSuccess = $state(false);

    // /auth/me returns the saved onboarding display name; never derive a name from email.
    let displayName = $derived(
        ($auth.user as (NonNullable<typeof $auth.user> & { display_name?: string | null }) | null)
            ?.display_name?.trim() || "",
    );

    onMount(() => {
        setTimeout(() => {
            ready = true;
        }, 600);
    });

    function goToContacts() {
        goto("/modules/contacts?welcome=true");
    }

    function skipForNow() {
        // Mark that they've seen welcome
        localStorage.setItem("continuum_welcome_seen", "true");
        goto("/dashboard");
    }

    function goToGuided() {
        goto("/start");
    }
</script>

<div
    class="min-h-screen bg-gradient-to-br from-background via-card to-primary-soft/30 flex flex-col items-center justify-center p-6 relative overflow-hidden"
>
    <!-- Subtle Background Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div
            class="absolute top-1/4 -left-12 w-64 h-64 bg-primary/30 rounded-full blur-3xl"
        ></div>
        <div
            class="absolute bottom-1/4 -right-12 w-64 h-64 bg-primary/30 rounded-full blur-3xl"
        ></div>
    </div>

    <!-- Content -->
    {#if ready}
        <div
            class="max-w-lg w-full text-center space-y-8 relative z-10"
            in:fade={{ duration: 600 }}
        >
            <!-- Logo -->
            <img
                src={logo}
                alt="Continuum"
                class="h-12 w-auto mx-auto opacity-80"
            />

            <!-- Welcome Message -->
            <div class="space-y-3" in:fly={{ y: 20, delay: 200 }}>
                <h1 class="text-3xl md:text-4xl font-serif font-bold text-foreground">
                    {displayName ? `Welcome, ${displayName}` : "Welcome to Continuum"}
                </h1>
                <p class="text-lg text-muted-foreground leading-relaxed">
                    Start with a person you want to keep informed.
                </p>
            </div>

            <!-- Main Action Card -->
            <div
                class="bg-card rounded-2xl shadow-xl shadow-slate-900/5 border border-border overflow-hidden"
                in:fly={{ y: 30, delay: 400 }}
            >
                <!-- Card Header -->
                <div class="bg-primary-deep px-6 py-5 text-white">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-white/20 rounded-xl">
                            <Users class="w-6 h-6" />
                        </div>
                        <div class="text-left">
                            <h2 class="font-bold text-lg text-white">Your First Step</h2>
                        </div>
                    </div>
                </div>

                <!-- Card Body -->
                <div class="p-6 space-y-5">
                    <p class="text-foreground text-left leading-relaxed">
                        <strong>Who should your family contact?</strong>
                        Record a trusted person’s name, relationship and contact details.
                    </p>

                    <!-- Benefits -->
                    <div class="space-y-3 text-left">
                        <div class="flex items-start gap-3">
                            <div class="p-1 bg-success/10 rounded-lg mt-0.5">
                                <Check class="w-4 h-4 text-success" />
                            </div>
                            <p class="text-sm text-muted-foreground">
                                Add how to reach them and what they can help with
                            </p>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="p-1 bg-success/10 rounded-lg mt-0.5">
                                <Check class="w-4 h-4 text-success" />
                            </div>
                            <p class="text-sm text-muted-foreground">
                                Create their recipient link when you are ready to share
                            </p>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="p-1 bg-success/10 rounded-lg mt-0.5">
                                <Check class="w-4 h-4 text-success" />
                            </div>
                            <p class="text-sm text-muted-foreground">
                                Preview that link to review the records it includes
                            </p>
                        </div>
                    </div>

                    <!-- Primary CTA -->
                    <button
                        onclick={goToContacts}
                        class="w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                        <span>Add your first trusted person</span>
                        <ArrowRight class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <!-- Secondary Options -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2" in:fade={{ delay: 600 }}>
                <button
                    onclick={skipForNow}
                    class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors underline underline-offset-4 decoration-border hover:decoration-muted-foreground"
                >
                    I'll explore on my own
                </button>
                <span class="hidden sm:block text-border" aria-hidden="true">|</span>
                <button
                    onclick={goToGuided}
                    class="flex items-center gap-2 text-primary hover:text-primary-hover text-sm font-medium transition-colors"
                >
                    <Sparkles class="w-4 h-4" />
                    <span>Use AI Guide instead</span>
                </button>
            </div>

            <!-- Trust Badge -->
            <div class="flex items-center justify-center gap-2 text-muted-foreground text-xs pt-4" in:fade={{ delay: 800 }}>
                <Shield class="w-4 h-4" />
                <span>Your information stays private to your account</span>
            </div>
        </div>
    {:else}
        <!-- Loading State -->
        <div class="flex flex-col items-center gap-4" in:fade>
            <img src={logo} alt="Continuum" class="h-12 w-auto opacity-60 animate-pulse" />
        </div>
    {/if}
</div>
