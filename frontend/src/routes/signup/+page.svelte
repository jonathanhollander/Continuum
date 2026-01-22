<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { auth } from '$lib/stores/auth';
    import { API_BASE_URL } from '$lib/config';
    import { startRegistration } from '@simplewebauthn/browser';
    import { Shield, Fingerprint, AlertCircle, CheckCircle2 } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let email = '';
    let isLoading = false;
    let error = '';
    let step: 'email' | 'passkey' | 'complete' = 'email';
    let userId: number | null = null;

    // Redirect if already logged in
    onMount(() => {
        if ($auth.user) {
            goto('/dashboard');
        }
    });

    async function handleEmailSubmit() {
        if (!email) {
            error = 'Please enter your email address';
            return;
        }

        isLoading = true;
        error = '';

        try {
            // Step 1: Create account and start passkey registration
            const res = await fetch(`${API_BASE_URL}/api/auth/passkey/register/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to create account');
            }

            const { user_id, options } = await res.json();
            userId = user_id;

            // Move to passkey step
            step = 'passkey';

            // Automatically start passkey registration
            await handlePasskeyRegistration(options);

        } catch (e: any) {
            console.error('Account creation failed:', e);
            error = e.message || 'Failed to create account';
        } finally {
            isLoading = false;
        }
    }

    async function handlePasskeyRegistration(options: any) {
        isLoading = true;
        error = '';

        try {
            // Step 2: Show browser passkey creation prompt
            const credential = await startRegistration(options);

            // Step 3: Finish registration and get JWT
            const finishRes = await fetch(`${API_BASE_URL}/api/auth/passkey/register/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    credential
                })
            });

            if (!finishRes.ok) {
                const errorData = await finishRes.json();
                throw new Error(errorData.detail || 'Registration failed');
            }

            const { access_token } = await finishRes.json();

            // Store token
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('continuum_auth_token', access_token);
            }

            // Show success and redirect
            step = 'complete';
            setTimeout(() => {
                auth.init();
                goto('/dashboard');
            }, 2000);

        } catch (e: any) {
            console.error('Passkey registration failed:', e);

            if (e.name === 'NotAllowedError') {
                error = 'Passkey creation was cancelled. Please try again.';
            } else if (e.name === 'NotSupportedError') {
                error = 'Your device does not support passkeys. Please try a different device or contact support.';
            } else {
                error = e.message || 'Failed to create passkey. Please try again.';
            }

            step = 'email';
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && email && step === 'email') {
            handleEmailSubmit();
        }
    }
</script>

<svelte:head>
    <title>Sign Up - Continuum</title>
</svelte:head>

<div class="min-h-screen bg-[#0F1115] flex items-center justify-center p-6 font-sans">
    <div class="max-w-2xl w-full" in:fade={{ duration: 600 }}>
        <!-- Header -->
        <div class="text-center mb-12">
            <div class="inline-flex p-5 rounded-3xl bg-teal-500/10 text-teal-400 mb-8 border border-teal-500/20 shadow-2xl shadow-teal-500/10">
                <Shield size={56} />
            </div>
            <h1 class="text-6xl font-serif font-black tracking-tighter text-white mb-3">
                Create Account
            </h1>
            <p class="text-slate-400 text-xl">Set up your secure digital vault</p>
        </div>

        <!-- Main Signup Card -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 backdrop-blur-sm space-y-6">
            {#if error}
                <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-4" in:fly={{ y: -20, duration: 300 }}>
                    <AlertCircle class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p class="text-red-300 font-medium text-lg">{error}</p>
                    </div>
                </div>
            {/if}

            {#if step === 'email'}
                <!-- Step 1: Email Entry -->
                <div class="space-y-6" in:fly={{ x: -20, duration: 300 }}>
                    <div>
                        <label for="email" class="block text-lg font-bold text-white mb-3">
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
                            autofocus
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
                        <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <span class="relative">{isLoading ? 'Creating Account...' : 'Continue'}</span>
                    </button>

                    <!-- Info Box -->
                    <div class="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-3">
                        <h3 class="text-white font-bold text-lg flex items-center gap-2">
                            <Fingerprint size={20} class="text-teal-400" />
                            You'll create a passkey next
                        </h3>
                        <p class="text-slate-300 text-base leading-relaxed">
                            After entering your email, we'll help you set up a passkey using your fingerprint, face, or device PIN.
                            This is faster and more secure than passwords.
                        </p>
                        <p class="text-slate-400 text-sm italic">
                            No passwords required. Ever.
                        </p>
                    </div>
                </div>
            {:else if step === 'passkey'}
                <!-- Step 2: Passkey Creation (Loading) -->
                <div class="text-center py-12 space-y-6" in:fly={{ y: 20, duration: 300 }}>
                    <div class="w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div class="space-y-3">
                        <h3 class="text-white font-bold text-2xl">Setting up your passkey...</h3>
                        <p class="text-slate-300 text-lg leading-relaxed max-w-md mx-auto">
                            Please follow the prompts on your device to create your passkey using your fingerprint, face, or PIN.
                        </p>
                    </div>
                </div>
            {:else if step === 'complete'}
                <!-- Step 3: Success -->
                <div class="text-center py-12 space-y-6" in:fly={{ y: 20, duration: 300 }}>
                    <div class="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto border border-teal-500/30">
                        <CheckCircle2 size={48} class="text-teal-400" />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-white font-bold text-3xl">Welcome to Continuum!</h3>
                        <p class="text-slate-300 text-lg leading-relaxed max-w-md mx-auto">
                            Your account is ready. Taking you to your vault...
                        </p>
                    </div>
                </div>
            {/if}

            <!-- Sign In Link -->
            {#if step === 'email'}
                <div class="text-center pt-6 border-t border-slate-800">
                    <p class="text-slate-400 text-lg">
                        Already have an account?
                        <a href="/login" class="text-teal-400 hover:text-teal-300 font-bold transition-colors">
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
