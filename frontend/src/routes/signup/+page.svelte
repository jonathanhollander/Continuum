<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth";
    import { API_BASE_URL } from "$lib/config";
    import { apiPost } from "$lib/api/client";
    import { notifications } from "$lib/stores/notificationStore";
    import { startRegistration } from "@simplewebauthn/browser";
    import {
        Shield,
        Fingerprint,
        AlertCircle,
        CheckCircle2,
    } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    let email = "";
    let isLoading = false;
    let step: "email" | "passkey" | "complete" = "email";
    let userId: number | null = null;
    let lastOptions: any = null;

    // Retry function for passkey registration
    function retryPasskeyRegistration() {
        if (lastOptions && userId) {
            handlePasskeyRegistration(lastOptions);
        } else {
            // Restart from email step
            step = "email";
        }
    }

    // Redirect if already logged in
    onMount(() => {
        if ($auth.user) {
            goto("/dashboard");
        }
    });

    async function handleEmailSubmit() {
        if (!email) {
            notifications.showError({
                message: "Please enter your email address",
                code: "VALIDATION_ERROR",
            });
            return;
        }

        isLoading = true;

        try {
            // Step 1: Create account and start passkey registration
            const result = await apiPost("/api/auth/passkey/register/start", {
                email,
            });

            userId = result.user_id;

            // Check for warnings (e.g., email send failures)
            if (result.warnings && result.warnings.length > 0) {
                result.warnings.forEach((warning: any) => {
                    if (warning.severity === "warning") {
                        notifications.showInfo(
                            warning.message,
                            "Account Created",
                        );
                    } else {
                        notifications.showInfo(
                            warning.message,
                            "Account Created",
                        );
                    }
                });
            }

            // Store options for retry
            lastOptions = result.options;

            // Move to passkey step
            step = "passkey";

            // Automatically start passkey registration
            await handlePasskeyRegistration(result.options);
        } catch (e: any) {
            console.error("Account creation failed:", e);
            // Show error notification to user
            if (e.message?.includes("already registered") || e.message?.includes("already exists")) {
                notifications.showError({
                    message: "This email is already registered. Please sign in instead.",
                    code: "DUPLICATE_EMAIL",
                });
            } else {
                notifications.showError(e);
            }
        } finally {
            isLoading = false;
        }
    }

    async function handlePasskeyRegistration(options: any) {
        isLoading = true;

        try {
            // Step 2: Show browser passkey creation prompt
            // Note: v11+ API requires { optionsJSON: options } format
            const credential = await startRegistration({ optionsJSON: options });

            // Step 3: Finish registration and get JWT
            const result = await apiPost("/api/auth/passkey/register/finish", {
                user_id: userId,
                credential,
            });

            // Check for warnings
            if (result.warnings && result.warnings.length > 0) {
                result.warnings.forEach((warning: any) => {
                    notifications.showInfo(
                        warning.message,
                        "Registration Complete",
                    );
                });
            }

            // Store token
            if (typeof localStorage !== "undefined") {
                localStorage.setItem(
                    "continuum_auth_token",
                    result.access_token,
                );
            }

            notifications.showSuccess(
                "Your account is ready! Let's get you set up...",
                "Welcome to Continuum!",
            );

            // Show success and redirect to onboarding
            step = "complete";
            setTimeout(() => {
                auth.init();
                goto("/onboarding");
            }, 2000);
        } catch (e: any) {
            console.error("Passkey registration failed:", e);

            if (e.name === "NotAllowedError") {
                notifications.showError(
                    {
                        message:
                            "Passkey creation was cancelled. Please try again.",
                        code: "VALIDATION_ERROR",
                    },
                    retryPasskeyRegistration,
                );
            } else if (e.name === "NotSupportedError") {
                notifications.showError({
                    message:
                        "Your device does not support passkeys. Please try a different device or contact support.",
                    code: "VALIDATION_ERROR",
                });
            } else {
                notifications.showError(e, retryPasskeyRegistration);
            }

            step = "email";
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && email && step === "email") {
            handleEmailSubmit();
        }
    }
</script>

<svelte:head>
    <title>Sign Up - Continuum</title>
</svelte:head>

<div
    class="min-h-screen bg-[#0F1115] flex items-center justify-center p-6 font-sans"
>
    <div class="max-w-2xl w-full" in:fade={{ duration: 600 }}>
        <!-- Header -->
        <div class="text-center mb-12">
            <div
                class="inline-flex p-5 rounded-3xl bg-teal-500/10 text-teal-400 mb-8 border border-teal-500/20 shadow-2xl shadow-teal-500/10"
            >
                <Shield size={56} />
            </div>
            <h1
                class="text-6xl font-serif font-black tracking-tighter text-white mb-3"
            >
                Create Account
            </h1>
            <p class="text-slate-400 text-xl">
                Set up your secure digital vault
            </p>
        </div>

        <!-- Main Signup Card -->
        <div
            class="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 backdrop-blur-sm space-y-6"
        >
            {#if step === "email"}
                <!-- Step 1: Email Entry -->
                <div class="space-y-6" in:fly={{ x: -20, duration: 300 }}>
                    <div>
                        <label
                            for="email"
                            class="block text-lg font-bold text-white mb-3"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            bind:value={email}
                            on:keydown={handleKeydown}
                            placeholder="you@example.com"
                            class="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-5 text-white text-xl placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
                            disabled={isLoading}
                        />
                        <p class="text-slate-500 text-sm mt-3">
                            We'll use this to set up your account and passkey
                        </p>
                    </div>

                    <button
                        on:click={handleEmailSubmit}
                        disabled={isLoading || !email}
                        class="w-full bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 font-black py-6 px-8 rounded-2xl transition-all text-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-4 group relative overflow-hidden"
                    >
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                        ></div>
                        <span class="relative"
                            >{isLoading
                                ? "Creating Account..."
                                : "Continue"}</span
                        >
                    </button>

                    <!-- Info Box -->
                    <div
                        class="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-3"
                    >
                        <h3
                            class="text-white font-bold text-lg flex items-center gap-2"
                        >
                            <Fingerprint size={20} class="text-teal-400" />
                            You'll create a passkey next
                        </h3>
                        <p class="text-slate-300 text-base leading-relaxed">
                            After entering your email, we'll help you set up a
                            passkey using your fingerprint, face, or device PIN.
                            This is faster and more secure than passwords.
                        </p>
                        <p class="text-slate-400 text-sm italic">
                            No passwords required. Ever.
                        </p>
                    </div>
                </div>
            {:else if step === "passkey"}
                <!-- Step 2: Passkey Creation (Loading) -->
                <div
                    class="text-center py-12 space-y-6"
                    in:fly={{ y: 20, duration: 300 }}
                >
                    <div
                        class="w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"
                    ></div>
                    <div class="space-y-3">
                        <h3 class="text-white font-bold text-2xl">
                            Setting up your passkey...
                        </h3>
                        <p
                            class="text-slate-300 text-lg leading-relaxed max-w-md mx-auto"
                        >
                            Please follow the prompts on your device to create
                            your passkey using your fingerprint, face, or PIN.
                        </p>
                    </div>
                </div>
            {:else if step === "complete"}
                <!-- Step 3: Success -->
                <div
                    class="text-center py-12 space-y-6"
                    in:fly={{ y: 20, duration: 300 }}
                >
                    <div
                        class="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto border border-teal-500/30"
                    >
                        <CheckCircle2 size={48} class="text-teal-400" />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-white font-bold text-3xl">
                            Welcome to Continuum!
                        </h3>
                        <p
                            class="text-slate-300 text-lg leading-relaxed max-w-md mx-auto"
                        >
                            Your account is ready. Taking you to your vault...
                        </p>
                    </div>
                </div>
            {/if}

            <!-- Sign In Link -->
            {#if step === "email"}
                <div class="text-center pt-6 border-t border-slate-800">
                    <p class="text-slate-400 text-lg">
                        Already have an account?
                        <a
                            href="/login"
                            class="text-teal-400 hover:text-teal-300 font-bold transition-colors"
                        >
                            Sign in
                        </a>
                    </p>
                </div>
            {/if}
        </div>

        <!-- Footer Info -->
        <div class="mt-8 text-center">
            <p class="text-slate-600 text-sm">
                Your data is encrypted end-to-end with military-grade security
            </p>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #0f1115;
    }
</style>
