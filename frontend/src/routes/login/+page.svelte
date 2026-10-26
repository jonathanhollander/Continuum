<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth, storeTokens } from "$lib/stores/auth";
    import { beginSession, captureSession, isCurrentSession } from "$lib/services/sessionOwnership";
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
    let magicLinkRequested = $state(false);

    // Same-site relative path only (as on /auth/verify); anything else is dropped
    function sameSitePath(value: string | null): string | null {
        return value &&
            value.startsWith("/") &&
            !value.startsWith("//") &&
            !value.includes("\\") &&
            !value.includes("://")
            ? value
            : null;
    }

    // Get redirect URL from query params or default to dashboard
    let safeRedirect = $derived(sameSitePath($page.url.searchParams.get("redirect")));
    let redirectUrl = $derived(safeRedirect || "/dashboard");

    // Redirect if already logged in
    onMount(() => {
        if ($auth.user) {
            goto(redirectUrl);
        }

        // Arriving from signup's email-link choice: open the email-link form
        if ($page.url.searchParams.get("method") === "email") {
            showMagicLink = true;
        }

        // Remember Me: pre-fill last used email
        if (typeof localStorage !== "undefined") {
            const lastEmail = localStorage.getItem("continuum_last_email");
            if (lastEmail) {
                magicLinkEmail = lastEmail;
            }
        }

        // Arriving from /start with the marketing email this browser knows: fill it in
        const handoffEmail = $page.url.searchParams.get("email");
        if (handoffEmail) {
            magicLinkEmail = handoffEmail;
            showMagicLink = true;
        }
    });

    async function handlePasskeyLogin() {
        let owner = beginSession();
        isLoading = true;

        try {
            // Step 1: Get authentication challenge
            // Pass email if available to restrict to platform authenticators (prevents QR code)
            const startResult = await apiPost(
                "/api/auth/passkey/login/start",
                magicLinkEmail ? { email: magicLinkEmail } : {},
            );
            if (!isCurrentSession(owner, true)) return;

            const { challenge_id, options } = startResult;

            // Step 2: Show browser passkey prompt
            // Note: v11+ API requires { optionsJSON: options } format
            const credential = await startAuthentication({ optionsJSON: options });
            if (!isCurrentSession(owner, true)) return;

            // Step 3: Verify credential and get JWT
            const finishResult = await apiPost(
                "/api/auth/passkey/login/finish",
                {
                    challenge_id,
                    credential,
                },
            );

            if (!storeTokens(finishResult.access_token, finishResult.refresh_token, owner)) return;
            owner = captureSession();
            await auth.init();
            if (!isCurrentSession(owner, true) || !isCurrentSession(captureSession())) return;

            notifications.showSuccess(
                "Welcome back! Taking you to your vault...",
                "Welcome back",
            );

            // Store email for "Remember Me" and register account context
            if ($auth.user?.email && typeof localStorage !== "undefined") {
                localStorage.setItem("continuum_last_email", $auth.user.email);
                registerAccount($auth.user.email);
            }

            goto(redirectUrl);
        } catch (e: any) {
            if (!isCurrentSession(owner, true)) return;
            console.error("Passkey login failed:", e);

            if (e.name === "NotAllowedError") {
                notifications.showError({
                    message: "That sign-in paused. We can try again whenever you're ready.",
                    code: "AUTH_CANCELLED",
                });
            } else if (e.name === "NotSupportedError") {
                notifications.showError({
                    message: "You can request an email link from this device.",
                    code: "PASSKEY_NOT_SUPPORTED",
                });
                showMagicLink = true;
            } else {
                notifications.showError(e);
            }
        } finally {
            if (isCurrentSession(owner, true)) isLoading = false;
        }
    }

    async function handleMagicLink() {
        if (!magicLinkEmail) {
            notifications.showError({
                message: "Enter your email address to request a sign-in link.",
                code: "VALIDATION_ERROR",
            });
            return;
        }

        const owner = beginSession();
        const email = magicLinkEmail;
        isLoading = true;

        try {
            await apiPost("/api/auth/magic-link", {
                email,
                redirect: safeRedirect || undefined,
            });
            if (!isCurrentSession(owner, true)) return;

            // Store email for "Remember Me" early
            if (typeof localStorage !== "undefined") {
                localStorage.setItem("continuum_last_email", email);
            }

            magicLinkRequested = true;
            notifications.showInfo(
                "You can check your email or sign in with an existing passkey.",
                "Sign-in Request Received",
            );
        } catch (e: any) {
            if (!isCurrentSession(owner, true)) return;
            console.error("Login failed:", e);
            notifications.showError(e, () => {
                if (isCurrentSession(owner, true)) void handleMagicLink();
            });
        } finally {
            if (isCurrentSession(owner, true)) isLoading = false;
        }
    }

    // Leaving the email form drops ?method=email (kept by signup's email-link choice) and the
    // /start ?email so a reload stays on the passkey view; other params such as ?redirect are kept.
    function backToPasskey() {
        showMagicLink = false;
        const url = new URL($page.url);
        if (url.searchParams.has("method") || url.searchParams.has("email")) {
            url.searchParams.delete("method");
            url.searchParams.delete("email");
            goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && magicLinkEmail && !magicLinkRequested) {
            handleMagicLink();
        }
    }
</script>

<svelte:head>
    <title>Login - Continuum</title>
</svelte:head>

<div
    class="min-h-screen surface-dark bg-background text-foreground flex items-center justify-center p-6 font-sans"
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
                class="text-6xl font-serif font-black tracking-tighter text-foreground mb-3"
            >
                Welcome Back
            </h1>
            <p class="text-muted-foreground text-xl font-medium">
                Everything you've saved is right where you left it.
            </p>
        </div>

        <!-- Main Login Card -->
        <div
            class="bg-card/50 border border-border rounded-3xl p-10 backdrop-blur-sm space-y-6"
        >
            {#if !showMagicLink}
                <!-- Passkey Login (Primary) -->
                <div class="space-y-6">
                    <button
                        onclick={handlePasskeyLogin}
                        disabled={isLoading}
                        class="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-black py-6 px-8 rounded-2xl transition-all text-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 group relative overflow-hidden"
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
                        onclick={() => (showHelp = !showHelp)}
                        class="w-full text-muted-foreground hover:text-primary text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Info size={16} />
                        What is a passkey?
                    </button>

                    {#if showHelp}
                        <div
                            class="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3"
                            in:fly={{ y: -10, duration: 300 }}
                        >
                            <h3 class="text-foreground font-bold text-lg flex items-center gap-2">
                                <Info size={20} class="text-primary" />
                                What is a Passkey?
                            </h3>
                            <p class="text-foreground text-base leading-relaxed">
                                A Passkey is a safe way to log in using what's
                                already on your device—like your fingerprint,
                                your face, or the code you use to unlock your
                                screen.
                            </p>
                            <div class="bg-background/40 rounded-xl p-4">
                                <p class="text-foreground text-sm">
                                    It's much safer than a password, and best of
                                    all: <strong class="text-foreground">
                                        a way to sign in with what's already on your device.
                                    </strong>
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- Divider -->
                    <div class="flex items-center gap-4 my-8">
                        <div class="flex-1 h-px bg-border"></div>
                        <span class="text-muted-foreground text-sm font-bold uppercase tracking-widest">
                            Or
                        </span>
                        <div class="flex-1 h-px bg-border"></div>
                    </div>

                    <!-- Magic Link Option -->
                    <button
                        onclick={() => (showMagicLink = true)}
                        class="w-full bg-card hover:bg-border text-foreground font-bold py-5 px-6 rounded-2xl transition-all text-lg flex items-center justify-center gap-3 border border-border"
                    >
                        <Mail size={24} />
                        Use Email Link Instead
                    </button>
                </div>
            {:else}
                <!-- Magic Link Form -->
                <div class="space-y-6" in:fly={{ x: 20, duration: 300 }}>
                    {#if !magicLinkRequested}
                        <div class="space-y-4">
                            <div>
                                <label
                                    for="email"
                                    class="block text-lg font-bold text-foreground mb-3"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    bind:value={magicLinkEmail}
                                    onkeydown={handleKeydown}
                                    placeholder="you@example.com"
                                    class="w-full bg-background border border-border rounded-2xl px-6 py-5 text-foreground text-xl placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                onclick={handleMagicLink}
                                disabled={isLoading || !magicLinkEmail}
                                class="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-black py-6 px-8 rounded-2xl transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 group relative overflow-hidden"
                            >
                                <div
                                    class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                                ></div>
                                <Mail size={28} class="relative" />
                                <span class="relative">
                                    {isLoading ? "Requesting..." : "Send Sign-in Link"}
                                </span>
                            </button>

                            <button
                                onclick={backToPasskey}
                                class="w-full text-muted-foreground hover:text-foreground font-medium py-3 transition-colors text-base"
                            >
                                Back to Passkey Login
                            </button>
                        </div>
                    {:else}
                        <!-- Uniform request receipt; delivery and account existence stay private. -->
                        <div
                            class="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center"
                            in:fly={{ y: 20, duration: 300 }}
                        >
                            <Mail size={48} class="text-primary mx-auto mb-4" />
                            <h3 class="text-foreground font-bold text-2xl mb-3">
                                Sign-in Request Received
                            </h3>
                            <p class="text-foreground text-lg leading-relaxed mb-6">
                                You requested a sign-in link for <strong class="text-foreground">
                                    {magicLinkEmail}
                                </strong>
                            </p>
                            <p class="text-muted-foreground text-base">
                                If a link arrives, open it within 15 minutes. You can also use a passkey you've already set up.
                            </p>
                        </div>

                        <button
                            onclick={() => (magicLinkRequested = false)}
                            class="w-full text-muted-foreground hover:text-foreground font-medium py-3 transition-colors text-base"
                        >
                            Use a different email
                        </button>
                        <button
                            onclick={handlePasskeyLogin}
                            disabled={isLoading}
                            class="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-colors disabled:opacity-50"
                        >
                            {isLoading ? "Connecting..." : "Login with Passkey"}
                        </button>
                    {/if}
                </div>
            {/if}

            <!-- Sign Up Link -->
            <div class="text-center pt-6 border-t border-border">
                <p class="text-muted-foreground text-lg">
                    New here?
                    <a
                        href={safeRedirect
                            ? `/signup?redirect=${encodeURIComponent(safeRedirect)}`
                            : "/signup"}
                        class="text-primary hover:text-primary-hover font-bold transition-colors"
                    >
                        Create one
                    </a>
                </p>
            </div>
        </div>

        <!-- Footer Info -->
        <div class="mt-8 text-center">
            <p class="text-muted-foreground text-sm">
                Your information stays private to your account and travels over a secure connection
            </p>
        </div>
    </div>
</div>

