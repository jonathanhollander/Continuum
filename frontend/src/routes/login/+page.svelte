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
        Info,
    } from "lucide-svelte";
    import { registerAccount } from "$lib/stores/keyringStore";
    import { fade, fly } from "svelte/transition";

    let isLoading = $state(false);
    let showHelp = $state(false);
    let showMagicLink = $state(false);
    let magicLinkEmail = $state("");
    let magicLinkSent = $state(false);

    // Get redirect URL from query params or default to dashboard
    let redirectUrl = $derived($page.url.searchParams.get("redirect") || "/dashboard");

    // Redirect if already logged in
    onMount(() => {
        if ($auth.user) {
            goto(redirectUrl);
        }

        // Remember Me: pre-fill last used email
        if (typeof localStorage !== "undefined") {
            const lastEmail = localStorage.getItem("continuum_last_email");
            if (lastEmail) {
                magicLinkEmail = lastEmail;
            }
        }
    });

    async function handlePasskeyLogin() {
        isLoading = true;

        try {
            // Step 1: Get authentication challenge
            // Pass email if available to restrict to platform authenticators (prevents QR code)
            const startResult = await apiPost(
                "/api/auth/passkey/login/start",
                magicLinkEmail ? { email: magicLinkEmail } : {},
            );

            const { challenge_id, options } = startResult;

            // Step 2: Show browser passkey prompt
            // Note: v11+ API requires { optionsJSON: options } format
            const credential = await startAuthentication({ optionsJSON: options });

            // Step 3: Verify credential and get JWT
            const finishResult = await apiPost(
                "/api/auth/passkey/login/finish",
                {
                    challenge_id,
                    credential,
                },
            );

            // Store token and fetch user info
            if (typeof localStorage !== "undefined") {
                localStorage.setItem(
                    "continuum_auth_token",
                    finishResult.access_token,
                );
            }

            notifications.showSuccess(
                "Welcome back! Taking you to your vault...",
                "Login Successful",
            );

            await auth.init();

            // Store email for "Remember Me" and register account context
            if ($auth.user?.email && typeof localStorage !== "undefined") {
                localStorage.setItem("continuum_last_email", $auth.user.email);
                registerAccount($auth.user.email);
            }

            goto(redirectUrl);
        } catch (e: any) {
            console.error("Passkey login failed:", e);

            if (e.name === "NotAllowedError") {
                notifications.showError({
                    message: "Login was cancelled or timed out. Please try again.",
                    code: "AUTH_CANCELLED",
                });
            } else if (e.name === "NotSupportedError") {
                notifications.showError({
                    message: "Your device does not support passkeys. Please use email link instead.",
                    code: "PASSKEY_NOT_SUPPORTED",
                });
                showMagicLink = true;
            } else {
                notifications.showError(e);
            }
        } finally {
            isLoading = false;
        }
    }

    async function handleMagicLink() {
        if (!magicLinkEmail) {
            notifications.showError({
                message: "We'll need your email address to continue.",
                code: "VALIDATION_ERROR",
            });
            return;
        }

        isLoading = true;

        try {
            // DEVELOPER BYPASS
            if (magicLinkEmail === "jh@continuum.estate") {
                const params = new URLSearchParams();
                params.append("username", magicLinkEmail);
                params.append("password", "bypass");

                const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: params,
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error("Bypass failed:", response.status, errText);
                    throw new Error(
                        `Bypass failed: ${response.status} ${errText}`,
                    );
                }

                const data = await response.json();

                if (typeof localStorage !== "undefined") {
                    localStorage.setItem(
                        "continuum_auth_token",
                        data.access_token,
                    );
                }

                await auth.init();

                // Store email for "Remember Me" and Register account context
                if ($auth.user?.email && typeof localStorage !== "undefined") {
                    localStorage.setItem(
                        "continuum_last_email",
                        $auth.user.email,
                    );
                    registerAccount($auth.user.email);
                }

                notifications.showSuccess(
                    "Developer Mode Enabled",
                    "Bypass Successful",
                );

                goto(redirectUrl);
                return;
            }

            await apiPost("/api/auth/magic-link", { email: magicLinkEmail });

            // Store email for "Remember Me" early
            if (typeof localStorage !== "undefined") {
                localStorage.setItem("continuum_last_email", magicLinkEmail);
            }

            magicLinkSent = true;
            notifications.showSuccess(
                "Check your email for the login link!",
                "Magic Link Sent",
            );
        } catch (e: any) {
            console.error("Login failed:", e);
            notifications.showError(e, handleMagicLink);
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && magicLinkEmail && !magicLinkSent) {
            handleMagicLink();
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
                class="inline-flex p-5 rounded-3xl bg-primary/10 text-primary mb-8 border border-primary/20 shadow-2xl shadow-primary/10"
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
                        type="button"
                        onclick={handlePasskeyLogin}
                        disabled={isLoading}
                        aria-label="Login with passkey"
                        class="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-6 px-8 rounded-2xl transition-all text-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 group relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] focus-ring"
                    >
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                        ></div>
                        <Fingerprint size={32} class="relative" />
                        <span class="relative">
                            {isLoading ? "Connecting..." : "Login with Passkey"}
                        </span>
                    </button>

                    <!-- Help Text for Passkeys -->
                    <button
                        type="button"
                        onclick={() => (showHelp = !showHelp)}
                        aria-label="What is a passkey"
                        class="w-full text-slate-400 hover:text-primary text-sm flex items-center justify-center gap-2 transition-colors focus-ring rounded-lg py-2"
                    >
                        <Info size={16} />
                        What is a passkey?
                    </button>

                    {#if showHelp}
                        <div
                            class="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3"
                            in:fly={{ y: -10, duration: 300 }}
                        >
                            <h3 class="text-white font-bold text-lg flex items-center gap-2">
                                <Info size={20} class="text-primary" />
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
                                    all: <strong class="text-white">
                                        nothing to remember and nothing to type.
                                    </strong>
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- Divider -->
                    <div class="flex items-center gap-4 my-8">
                        <div class="flex-1 h-px bg-slate-800"></div>
                        <span class="text-slate-500 text-sm font-bold uppercase tracking-widest">
                            Or
                        </span>
                        <div class="flex-1 h-px bg-slate-800"></div>
                    </div>

                    <!-- Magic Link Option -->
                    <button
                        type="button"
                        onclick={() => (showMagicLink = true)}
                        aria-label="Use email link instead"
                        class="w-full btn-secondary py-5 px-6 rounded-2xl text-lg flex items-center justify-center gap-3 border border-slate-200/10"
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
                                    onkeydown={handleKeydown}
                                    placeholder="you@example.com"
                                    class="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-5 text-white text-xl placeholder-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="button"
                                onclick={handleMagicLink}
                                disabled={isLoading || !magicLinkEmail}
                                aria-label="Send sign-in link"
                                class="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-6 px-8 rounded-2xl transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 group relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] focus-ring"
                            >
                                <div
                                    class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                                ></div>
                                <Mail size={28} class="relative" />
                                <span class="relative">
                                    {isLoading ? "Sending..." : "Send Sign-in Link"}
                                </span>
                            </button>

                            <button
                                type="button"
                                onclick={() => (showMagicLink = false)}
                                aria-label="Back to passkey login"
                                class="w-full text-slate-400 hover:text-white font-medium py-3 transition-colors text-base focus-ring rounded-lg"
                            >
                                Back to Passkey Login
                            </button>
                        </div>
                    {:else}
                        <!-- Magic Link Sent Confirmation -->
                        <div
                            class="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center"
                            in:fly={{ y: 20, duration: 300 }}
                        >
                            <Mail size={48} class="text-primary mx-auto mb-4" />
                            <h3 class="text-white font-bold text-2xl mb-3">
                                Check Your Email
                            </h3>
                            <p class="text-slate-300 text-lg leading-relaxed mb-6">
                                We've sent a secure sign-in link to <strong class="text-white">
                                    {magicLinkEmail}
                                </strong>
                            </p>
                            <p class="text-slate-400 text-base">
                                Click the link in your email to continue. The link expires in 15 minutes.
                            </p>
                        </div>

                        <button
                            type="button"
                            onclick={() => (magicLinkSent = false)}
                            aria-label="Use a different email"
                            class="w-full text-slate-400 hover:text-white font-medium py-3 transition-colors text-base focus-ring rounded-lg"
                        >
                            Use a different email
                        </button>
                    {/if}
                </div>
            {/if}

            <!-- Sign Up Link -->
            <div class="text-center pt-6 border-t border-slate-800">
                <p class="text-slate-400 text-lg">
                    Don't have an account?
                    <a
                        href="/signup"
                        class="text-primary hover:text-primary/80 font-bold transition-colors focus-ring rounded"
                    >
                        Create one
                    </a>
                </p>
            </div>
        </div>

        <!-- Footer Info -->
        <div class="mt-8 text-center">
            <p class="text-slate-600 text-sm">
                Your data is encrypted and secured with industry-standard protection
            </p>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #0f1115;
    }
</style>
