<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth, storeTokens } from "$lib/stores/auth";
    import { beginSession, captureSession, isCurrentSession, type SessionOwnership } from "$lib/services/sessionOwnership";
    import { API_BASE_URL } from "$lib/config";
    import { apiPost } from "$lib/api/client";
    import { accessStatus, refreshAccessStatus } from "$lib/services/accessStatus";
    import { notifications } from "$lib/stores/notificationStore";
    import { startRegistration } from "@simplewebauthn/browser";
    import {
        Shield,
        Fingerprint,
        AlertCircle,
        CheckCircle2,
    } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    // Email carried from the marketing CTA via /start
    let email =
        typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("email") ?? ""
            : "";
    let isLoading = false;
    let step: "email" | "passkey" | "complete" = "email";
    let pendingRegistration: { id: string; userId: number; email: string } | null = null;
    let passkeyFailed = false;
    let signupOwner: SessionOwnership | null = null;
    const PASSKEY_WAIT_MS = 12000;

    function waitForPasskey(options: any) {
        return new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => {
                const err: any = new Error("passkey wait elapsed");
                err.name = "PasskeyWaitElapsed";
                reject(err);
            }, PASSKEY_WAIT_MS);
            startRegistration({ optionsJSON: options }).then(
                (v) => { clearTimeout(timer); resolve(v); },
                (e) => { clearTimeout(timer); reject(e); },
            );
        });
    }

    // Retry function for passkey registration
    async function retryPasskeyRegistration() {
        const owner = signupOwner;
        const pending = pendingRegistration;
        if ($accessStatus.phase !== "ready" || !$accessStatus.status?.signup_enabled || isLoading || !owner || !isCurrentSession(owner, true)) return;
        if (!pending) {
            step = "email";
            return;
        }
        isLoading = true;
        passkeyFailed = false;
        try {
            const result = await apiPost("/api/auth/passkey/register/start", {
                email: pending.email,
                registration_id: pending.id,
            });
            if (!isCurrentSession(owner, true) || pendingRegistration !== pending) return;
            await handlePasskeyRegistration(result.options, owner, pending);
        } catch (e: any) {
            if (!isCurrentSession(owner, true) || pendingRegistration !== pending) return;
            passkeyFailed = true;
            notifications.showError(e);
        } finally {
            if (isCurrentSession(owner, true)) isLoading = false;
        }
    }

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

    $: safeRedirect = sameSitePath($page.url.searchParams.get("redirect"));
    // Sign-in link carrying the email and the /start choice
    $: loginHref = (() => {
        const params = new URLSearchParams();
        if (email) params.set("email", email);
        if (safeRedirect) params.set("redirect", safeRedirect);
        const query = params.toString();
        return query ? `/login?${query}` : "/login";
    })();
    let alreadyHere = false;

    // Redirect if already logged in
    onMount(() => {
        const signedInEmail = $auth.user?.email?.trim().toLowerCase();
        if (signedInEmail && (!email.trim() || signedInEmail === email.trim().toLowerCase())) {
            goto(safeRedirect || "/dashboard");
        }
    });

    async function handleEmailSubmit() {
        if ($accessStatus.phase !== "ready" || !$accessStatus.status?.signup_enabled || isLoading) return;
        if (!email) {
            notifications.showError({
                message: "Your email address will help us begin.",
                code: "VALIDATION_ERROR",
            });
            return;
        }

        const owner = beginSession();
        const submittedEmail = email;
        signupOwner = owner;
        pendingRegistration = null;
        isLoading = true;
        alreadyHere = false;

        try {
            // Step 1: Create account and start passkey registration
            const result = await apiPost("/api/auth/passkey/register/start", {
                email: submittedEmail,
            });
            if (!isCurrentSession(owner, true)) return;

            const pending = {
                id: result.registration_id,
                userId: result.user_id,
                email: submittedEmail,
            };
            pendingRegistration = pending;

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

            // Move to passkey step
            step = "passkey";

            // Automatically start passkey registration
            await handlePasskeyRegistration(result.options, owner, pending);
        } catch (e: any) {
            if (!isCurrentSession(owner, true)) return;
            console.error("Account creation failed:", e);
            // Show error notification to user
            if (e.message?.includes("already registered") || e.message?.includes("already exists")) {
                // Shown beside the email field with a sign-in link
                alreadyHere = true;
            } else {
                notifications.showError(e);
            }
        } finally {
            if (isCurrentSession(owner, true)) isLoading = false;
        }
    }

    function goToEmailLink() {
        if (typeof localStorage !== "undefined" && email) {
            localStorage.setItem("continuum_last_email", email);
        }
        const params = new URLSearchParams({ method: "email" });
        if (safeRedirect) params.set("redirect", safeRedirect);
        goto(`/login?${params}`);
    }

    async function handlePasskeyRegistration(options: any, owner = signupOwner, pending = pendingRegistration) {
        if ($accessStatus.phase !== "ready" || !$accessStatus.status?.signup_enabled || !owner || !pending || !isCurrentSession(owner, true) || pendingRegistration !== pending) return;
        isLoading = true;
        passkeyFailed = false;

        try {
            // Step 2: Show browser passkey creation prompt
            // Note: v11+ API requires { optionsJSON: options } format
            const credential = await waitForPasskey(options);
            if (!isCurrentSession(owner, true) || pendingRegistration !== pending) return;

            // Step 3: Finish registration and get JWT
            const result = await apiPost("/api/auth/passkey/register/finish", {
                user_id: pending.userId,
                registration_id: pending.id,
                credential,
            });
            if (!isCurrentSession(owner, true) || pendingRegistration !== pending) return;

            // Check for warnings
            if (result.warnings && result.warnings.length > 0) {
                result.warnings.forEach((warning: any) => {
                    notifications.showInfo(
                        warning.message,
                        "Registration Complete",
                    );
                });
            }

            if (!storeTokens(result.access_token, result.refresh_token, owner)) return;
            owner = captureSession();
            signupOwner = owner;
            pendingRegistration = null;

            notifications.showSuccess(
                "Your account is ready! Let's get you set up...",
                "Welcome to Continuum!",
            );

            // Show success and redirect to onboarding
            step = "complete";
            // A path chosen on /start (?redirect=) continues there once signed in
            setTimeout(async () => {
                if (!isCurrentSession(owner!, true)) return;
                await auth.init();
                if (isCurrentSession(owner!, true) && isCurrentSession(captureSession())) goto(safeRedirect || "/onboarding");
            }, 2000);
        } catch (e: any) {
            if (!isCurrentSession(owner, true)) return;
            console.warn("Passkey registration did not finish:", e?.name);
            // Stay on the passkey step and offer the way forward
            passkeyFailed = true;
            step = "passkey";
        } finally {
            if (isCurrentSession(owner, true)) isLoading = false;
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

{#if $accessStatus.phase === "ready" && $accessStatus.status?.signup_enabled}
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
                Create Account
            </h1>
            <p class="text-muted-foreground text-xl">
                Set up your secure digital vault
            </p>
        </div>

        <!-- Main Signup Card -->
        <div
            class="bg-card/50 border border-border rounded-3xl p-10 backdrop-blur-sm space-y-6"
        >
            {#if step === "email"}
                <!-- Step 1: Email Entry -->
                <div class="space-y-6" in:fly={{ x: -20, duration: 300 }}>
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
                            bind:value={email}
                            on:keydown={handleKeydown}
                            placeholder="you@example.com"
                            class="w-full bg-background border border-border rounded-2xl px-6 py-5 text-foreground text-xl placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                            disabled={isLoading}
                        />
                        <p class="text-muted-foreground text-sm mt-3">
                            We'll use this to set up your account and passkey
                        </p>
                        {#if alreadyHere}
                            <p class="text-foreground text-base mt-3">
                                Welcome back. This email already has a space here.
                                <a
                                    href={loginHref}
                                    class="text-primary hover:text-primary-hover font-bold transition-colors"
                                >
                                    Sign in
                                </a>
                            </p>
                        {/if}
                    </div>

                    <button
                        on:click={handleEmailSubmit}
                        disabled={isLoading || !email}
                        class="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-black py-6 px-8 rounded-2xl transition-all text-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 group relative overflow-hidden"
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
                        class="bg-background/50 border border-border rounded-2xl p-6 space-y-3"
                    >
                        <h3
                            class="text-foreground font-bold text-lg flex items-center gap-2"
                        >
                            <Fingerprint size={20} class="text-primary" />
                            You'll create a passkey next
                        </h3>
                        <p class="text-foreground text-base leading-relaxed">
                            After entering your email, we'll help you set up a
                            passkey using your fingerprint, face, or device PIN.
                            Your device will guide you through creating it.
                        </p>
                        <p class="text-muted-foreground text-sm italic">
                            You can also sign in by email. If passkey setup pauses, choose the email-link option.
                        </p>
                    </div>
                </div>
            {:else if step === "passkey"}
                <!-- Step 2: Passkey Creation (Loading) -->
                {#if passkeyFailed}
                <div
                    class="text-center py-12 space-y-6"
                    data-testid="passkey-options"
                    in:fly={{ y: 20, duration: 300 }}
                >
                    <div class="space-y-3">
                        <h3 class="text-foreground font-bold text-2xl">
                            Your account is ready for a passkey
                        </h3>
                        <p class="text-foreground text-lg leading-relaxed max-w-md mx-auto">
                            When you're ready, you can try again, or request an email link.
                        </p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            on:click={retryPasskeyRegistration}
                            class="bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-3 px-6 rounded-2xl transition-colors"
                        >Try again</button>
                        <button
                            on:click={goToEmailLink}
                            class="border border-border hover:border-primary text-foreground font-bold py-3 px-6 rounded-2xl transition-colors"
                        >Request an email link</button>
                    </div>
                </div>
                {:else}
                <div
                    class="text-center py-12 space-y-6"
                    in:fly={{ y: 20, duration: 300 }}
                >
                    <div
                        class="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"
                    ></div>
                    <div class="space-y-3">
                        <h3 class="text-foreground font-bold text-2xl">
                            Setting up your passkey...
                        </h3>
                        <p
                            class="text-foreground text-lg leading-relaxed max-w-md mx-auto"
                        >
                            Your device will guide you to create your passkey
                            with your fingerprint, face, or PIN.
                        </p>
                    </div>
                </div>
                {/if}
            {:else if step === "complete"}
                <!-- Step 3: Success -->
                <div
                    class="text-center py-12 space-y-6"
                    in:fly={{ y: 20, duration: 300 }}
                >
                    <div
                        class="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/30"
                    >
                        <CheckCircle2 size={48} class="text-primary" />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-foreground font-bold text-3xl">
                            Welcome to Continuum!
                        </h3>
                        <p
                            class="text-foreground text-lg leading-relaxed max-w-md mx-auto"
                        >
                            Your account is ready. Taking you to your vault...
                        </p>
                    </div>
                </div>
            {/if}

            <!-- Sign In Link -->
            {#if step === "email"}
                <div class="text-center pt-6 border-t border-border">
                    <p class="text-muted-foreground text-lg">
                        Already have an account?
                        <a
                            href={loginHref}
                            class="text-primary hover:text-primary-hover font-bold transition-colors"
                        >
                            Sign in
                        </a>
                    </p>
                </div>
            {/if}
        </div>

        <!-- Footer Info -->
        <div class="mt-8 text-center">
            <p class="text-muted-foreground text-sm">
                Your information stays private to your account and travels over a secure connection
            </p>
        </div>
    </div>
</div>
{:else}
<main class="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
    <div class="max-w-lg space-y-6 text-center">
        <h1 class="text-3xl font-serif font-bold">New signups are currently closed</h1>
        <p class="text-muted-foreground">Existing users can still sign in.</p>
        {#if $accessStatus.phase === "error"}
            <p role="alert">Access status is unavailable. Try again when you are ready.</p>
            <button class="text-primary font-semibold underline" on:click={() => refreshAccessStatus()}>Try again</button>
        {:else if $accessStatus.phase === "loading"}<p role="status">Checking access…</p>{/if}
        <a href={loginHref} class="block text-primary font-semibold underline">Sign in</a>
        <a href="/" class="block text-primary font-semibold underline">Back to website</a>
    </div>
</main>
{/if}

