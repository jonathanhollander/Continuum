<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { auth } from '$lib/stores/auth';
    import { API_BASE_URL } from '$lib/config';
    import { startAuthentication } from '@simplewebauthn/browser';
    import { Shield, Fingerprint, Mail, AlertCircle, Info } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let isLoading = false;
    let error = '';
    let showHelp = false;
    let showMagicLink = false;
    let magicLinkEmail = '';
    let magicLinkSent = false;

    // Redirect if already logged in
    onMount(() => {
        if ($auth.user) {
            goto('/dashboard');
        }
    });

    async function handlePasskeyLogin() {
        isLoading = true;
        error = '';

        try {
            // Step 1: Get authentication challenge
            const startRes = await fetch(`${API_BASE_URL}/api/auth/passkey/login/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!startRes.ok) {
                throw new Error('Failed to start authentication');
            }

            const { challenge_id, options } = await startRes.json();

            // Step 2: Show browser passkey prompt
            const credential = await startAuthentication(options);

            // Step 3: Verify credential and get JWT
            const finishRes = await fetch(`${API_BASE_URL}/api/auth/passkey/login/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challenge_id,
                    credential
                })
            });

            if (!finishRes.ok) {
                const errorData = await finishRes.json();
                throw new Error(errorData.detail || 'Authentication failed');
            }

            const { access_token } = await finishRes.json();

            // Store token and fetch user info
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('continuum_auth_token', access_token);
            }

            await auth.init();
            goto('/dashboard');

        } catch (e: any) {
            console.error('Passkey login failed:', e);

            if (e.name === 'NotAllowedError') {
                error = 'Login was cancelled or timed out. Please try again.';
            } else if (e.name === 'NotSupportedError') {
                error = 'Your device does not support passkeys. Please use magic link instead.';
                showMagicLink = true;
            } else {
                error = e.message || 'Login failed. Please try again or use magic link.';
            }
        } finally {
            isLoading = false;
        }
    }

    async function handleMagicLink() {
        if (!magicLinkEmail) {
            error = 'Please enter your email address';
            return;
        }

        isLoading = true;
        error = '';

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: magicLinkEmail })
            });

            if (res.ok) {
                magicLinkSent = true;
            } else {
                throw new Error('Failed to send magic link');
            }
        } catch (e: any) {
            error = e.message || 'Failed to send magic link';
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Login - Continuum</title>
</svelte:head>

<div class="min-h-screen bg-[#0F1115] flex items-center justify-center p-6 font-sans">
    <div class="max-w-2xl w-full" in:fade={{ duration: 600 }}>
        <!-- Header -->
        <div class="text-center mb-12">
            <div class="inline-flex p-5 rounded-3xl bg-teal-500/10 text-teal-400 mb-8 border border-teal-500/20 shadow-2xl shadow-teal-500/10">
                <Shield size={56} />
            </div>
            <h1 class="text-6xl font-serif font-black tracking-tighter text-white mb-3">
                Welcome Back
            </h1>
            <p class="text-slate-400 text-xl">Sign in to your secure vault</p>
        </div>

        <!-- Main Login Card -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 backdrop-blur-sm space-y-6">
            {#if error}
                <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-4" in:fly={{ y: -20, duration: 300 }}>
                    <AlertCircle class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p class="text-red-300 font-medium text-lg">{error}</p>
                    </div>
                </div>
            {/if}

            {#if !showMagicLink}
                <!-- Passkey Login (Primary) -->
                <div class="space-y-6">
                    <button
                        on:click={handlePasskeyLogin}
                        disabled={isLoading}
                        class="w-full bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 font-black py-6 px-8 rounded-2xl transition-all text-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-4 group relative overflow-hidden"
                    >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <Fingerprint size={32} class="relative" />
                        <span class="relative">{isLoading ? 'Connecting...' : 'Login with Passkey'}</span>
                    </button>

                    <!-- Help Text for Passkeys -->
                    <button
                        on:click={() => showHelp = !showHelp}
                        class="w-full text-slate-400 hover:text-teal-400 text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Info size={16} />
                        What is a passkey?
                    </button>

                    {#if showHelp}
                        <div class="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-3" in:fly={{ y: -10, duration: 300 }}>
                            <h3 class="text-white font-bold text-lg flex items-center gap-2">
                                <Info size={20} class="text-teal-400" />
                                About Passkeys
                            </h3>
                            <p class="text-slate-300 text-base leading-relaxed">
                                A passkey is a secure way to log in using your fingerprint, face, or device PIN.
                                It's more secure than passwords and works with:
                            </p>
                            <ul class="text-slate-300 text-base space-y-2 ml-6 list-disc">
                                <li>Face ID or Touch ID on iPhone/iPad</li>
                                <li>Fingerprint or face unlock on Android</li>
                                <li>Windows Hello on PC</li>
                                <li>Touch ID on Mac</li>
                            </ul>
                            <p class="text-slate-400 text-sm italic mt-4">
                                No passwords to remember. No passwords to type.
                            </p>
                        </div>
                    {/if}

                    <!-- Divider -->
                    <div class="flex items-center gap-4 my-8">
                        <div class="flex-1 h-px bg-slate-800"></div>
                        <span class="text-slate-500 text-sm font-bold uppercase tracking-widest">Or</span>
                        <div class="flex-1 h-px bg-slate-800"></div>
                    </div>

                    <!-- Magic Link Option -->
                    <button
                        on:click={() => showMagicLink = true}
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
                                <label for="email" class="block text-lg font-bold text-white mb-3">
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
                                {isLoading ? 'Sending...' : 'Send Magic Link'}
                            </button>

                            <button
                                on:click={() => showMagicLink = false}
                                class="w-full text-slate-400 hover:text-white font-medium py-3 transition-colors text-base"
                            >
                                Back to Passkey Login
                            </button>
                        </div>
                    {:else}
                        <div class="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-8 text-center" in:fly={{ y: 20, duration: 300 }}>
                            <Mail size={48} class="text-teal-400 mx-auto mb-4" />
                            <h3 class="text-white font-bold text-2xl mb-3">Check Your Email</h3>
                            <p class="text-slate-300 text-lg leading-relaxed mb-6">
                                We've sent a secure login link to <strong class="text-white">{magicLinkEmail}</strong>
                            </p>
                            <p class="text-slate-400 text-base">
                                Click the link in your email to sign in. The link expires in 15 minutes.
                            </p>
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Sign Up Link -->
            <div class="text-center pt-6 border-t border-slate-800">
                <p class="text-slate-400 text-lg">
                    Don't have an account?
                    <a href="/signup" class="text-teal-400 hover:text-teal-300 font-bold transition-colors">
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
