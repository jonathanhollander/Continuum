<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth";
    import { API_BASE_URL } from "$lib/config";
    import { apiPost } from "$lib/api/client";
    import { notifications } from "$lib/stores/notificationStore";
    import { startAuthentication } from "@simplewebauthn/browser";
    import {
        Shield,
        Fingerprint,
        Mail,
        AlertCircle,
        Info,
    } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    let isLoading = false;
    let showHelp = false;
    let showMagicLink = false;
    let magicLinkEmail = "";
    let magicLinkSent = false;

    // Get redirect URL from query params or default to dashboard
    $: redirectUrl = $page.url.searchParams.get("redirect") || "/dashboard";

    // Redirect if already logged in
    onMount(() => {
        if ($auth.user) {
            goto(redirectUrl);
        }
    });

    async function handlePasskeyLogin() {
        isLoading = true;

        try {
            // Step 1: Get authentication challenge
            const startResult = await apiPost('/api/auth/passkey/login/start', {});

            const { challenge_id, options } = startResult;

            // Step 2: Show browser passkey prompt
            const credential = await startAuthentication(options);

            // Step 3: Verify credential and get JWT
            const finishResult = await apiPost('/api/auth/passkey/login/finish', {
                challenge_id,
                credential,
            });

            // Store token and fetch user info
            if (typeof localStorage !== "undefined") {
                localStorage.setItem("continuum_auth_token", finishResult.access_token);
            }

            notifications.showSuccess(
                'Welcome back! Taking you to your vault...',
                'Login Successful'
            );

            await auth.init();
            goto(redirectUrl);
        } catch (e: any) {
            console.error("Passkey login failed:", e);

            if (e.name === "NotAllowedError") {
                notifications.showError(
                    'Login was cancelled or timed out. Please try again.',
                    'Login Cancelled'
                );
            } else if (e.name === "NotSupportedError") {
                notifications.showError(
                    'Your device does not support passkeys. Please use email link instead.',
                    'Passkey Not Supported'
                );
                showMagicLink = true;
            }
            // apiPost already shows error notification for other errors
        } finally {
            isLoading = false;
        }
    }

    async function handleMagicLink() {
        if (!magicLinkEmail) {
            notifications.showError(
                'Please enter your email address',
                'Email Required'
            );
            return;
        }

        isLoading = true;

        try {
            await apiPost('/api/auth/magic-link', { email: magicLinkEmail });

            magicLinkSent = true;
            notifications.showSuccess(
                'Check your email for the login link!',
                'Magic Link Sent'
            );
        } catch (e: any) {
            console.error('Magic link failed:', e);
            // apiPost already shows error notification
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Login - Continuum</title>
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
                Welcome Back
            </h1>
            <p class="text-slate-400 text-xl font-medium">
                Continue securing your legacy with courage.
            </p>
        </div>

        <!-- Main Login Card -->
        <div
            class="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 backdrop-blur-sm space-y-6"
        >
            {#if !showMagicLink}
                <!-- Passkey Login (Primary) -->
                <div class="space-y-6">
                    <button
                        on:click={handlePasskeyLogin}
                        disabled={isLoading}
                        class="w-full bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 font-black py-6 px-8 rounded-2xl transition-all text-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-4 group relative overflow-hidden"
                    >
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                        ></div>
                        <Fingerprint size={32} class="relative" />
                        <span class="relative"
                            >{isLoading
                                ? "Connecting..."
                                : "Login with Passkey"}</span
                        >
                    </button>

                    <!-- Help Text for Passkeys -->
                    <button
                        on:click={() => (showHelp = !showHelp)}
                        class="w-full text-slate-400 hover:text-teal-400 text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Info size={16} />
                        What is a passkey?
                    </button>

                    {#if showHelp}
                        <div
                            class="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 space-y-3"
                            in:fly={{ y: -10, duration: 300 }}
                        >
                            <h3
                                class="text-white font-bold text-lg flex items-center gap-2"
                            >
                                <Info size={20} class="text-teal-400" />
                                What is a Passkey?
                            </h3>
                            <p class="text-slate-300 text-base leading-relaxed">
                                A Passkey is a safe way to log in using what's
                                already on your device—like your fingerprint,
                                your face, or the code you use to unlock your
                                screen.
                            </p>
                            <div class="bg-slate-950/40 rounded-xl p-4">
                                <p class="text-slate-300 text-sm">
                                    It's much safer than a password, and best of
                                    all: <strong class="text-white"
                                        >nothing to remember and nothing to
                                        type.</strong
                                    >
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- Divider -->
                    <div class="flex items-center gap-4 my-8">
                        <div class="flex-1 h-px bg-slate-800"></div>
                        <span
                            class="text-slate-500 text-sm font-bold uppercase tracking-widest"
                            >Or</span
                        >
                        <div class="flex-1 h-px bg-slate-800"></div>
                    </div>

                    <!-- Magic Link Option -->
                    <button
                        on:click={() => (showMagicLink = true)}
                        class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-5 px-6 rounded-2xl transition-all text-lg flex items-center justify-center gap-3 border border-slate-700"
                    >
                        <Mail size={24} />
                        Use Email Link Instead
                    </button>
                </div>
            {:else}
                <!-- Magic Link Form -->
                <div class="space-y-6" in:fly={{ x: 20, duration: 300 }}>
                    {#if !magicLinkSent}
                        <div class="space-y-4">
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
                                    bind:value={magicLinkEmail}
                                    placeholder="you@example.com"
                                    class="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-5 text-white text-xl placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                on:click={handleMagicLink}
                                disabled={isLoading || !magicLinkEmail}
                                class="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-5 px-6 rounded-2xl transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-teal-500/20"
                            >
                                {isLoading ? "Sending..." : "Send Magic Link"}
                            </button>

                            <button
                                on:click={() => (showMagicLink = false)}
                                class="w-full text-slate-400 hover:text-white font-medium py-3 transition-colors text-base"
                            >
                                Back to Passkey Login
                            </button>
                        </div>
                    {:else}
                        <div
                            class="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-8 text-center"
                            in:fly={{ y: 20, duration: 300 }}
                        >
                            <Mail
                                size={48}
                                class="text-teal-400 mx-auto mb-4"
                            />
                            <h3 class="text-white font-bold text-2xl mb-3">
                                Check Your Email
                            </h3>
                            <p
                                class="text-slate-300 text-lg leading-relaxed mb-6"
                            >
                                We've sent a secure login link to <strong
                                    class="text-white">{magicLinkEmail}</strong
                                >
                            </p>
                            <p class="text-slate-400 text-base">
                                Click the link in your email to sign in. The
                                link expires in 15 minutes.
                            </p>
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Sign Up Link -->
            <div class="text-center pt-6 border-t border-slate-800">
                <p class="text-slate-400 text-lg">
                    Don't have an account?
                    <a
                        href="/signup"
                        class="text-teal-400 hover:text-teal-300 font-bold transition-colors"
                    >
                        Create one
                    </a>
                </p>
            </div>
        </div>

        <!-- Footer Info -->
        <div class="mt-8 text-center">
            <p class="text-slate-600 text-sm">
                Your data is encrypted and secured with industry-standard
                protection
            </p>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #0f1115;
    }
</style>
