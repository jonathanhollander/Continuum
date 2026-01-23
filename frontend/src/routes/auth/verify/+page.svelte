<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { API_BASE_URL } from "$lib/config.ts";
    import { Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    let status: "verifying" | "success" | "error" = "verifying";
    let error = "";

    onMount(async () => {
        const token = $page.url.searchParams.get("token");

        if (!token) {
            status = "error";
            error = "No verification token found";
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`,
            );

            if (!res.ok) {
                throw new Error("Verification failed");
            }

            const { access_token } = await res.json();

            // Store token
            if (typeof localStorage !== "undefined") {
                localStorage.setItem("continuum_auth_token", access_token);
            }

            status = "success";

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                goto("/dashboard");
            }, 2000);
        } catch (e: any) {
            console.error("Magic link verification failed:", e);
            status = "error";
            error = e.message || "The link is invalid or has expired";
        }
    });
</script>

<svelte:head>
    <title>Verifying Login - Continuum</title>
</svelte:head>

<div
    class="min-h-screen bg-[#0F1115] flex items-center justify-center p-6 font-sans"
>
    <div class="max-w-2xl w-full" in:fade={{ duration: 600 }}>
        <div class="text-center mb-12">
            <div
                class="inline-flex p-5 rounded-3xl bg-teal-500/10 text-teal-400 mb-8 border border-teal-500/20 shadow-2xl shadow-teal-500/10"
            >
                <Shield size={56} />
            </div>
        </div>

        <div
            class="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 backdrop-blur-sm"
        >
            {#if status === "verifying"}
                <div
                    class="text-center py-12 space-y-6"
                    in:fly={{ y: 20, duration: 300 }}
                >
                    <Loader2
                        size={56}
                        class="text-teal-400 animate-spin mx-auto"
                    />
                    <div class="space-y-3">
                        <h3 class="text-white font-bold text-3xl">
                            Verifying your login...
                        </h3>
                        <p class="text-slate-300 text-lg">
                            Please wait while we securely log you in
                        </p>
                    </div>
                </div>
            {:else if status === "success"}
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
                            Login Successful!
                        </h3>
                        <p class="text-slate-300 text-lg">
                            Taking you to your vault...
                        </p>
                    </div>
                </div>
            {:else if status === "error"}
                <div
                    class="text-center py-12 space-y-6"
                    in:fly={{ y: 20, duration: 300 }}
                >
                    <div
                        class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30"
                    >
                        <AlertCircle size={48} class="text-red-400" />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-white font-bold text-3xl">
                            Verification Failed
                        </h3>
                        <p class="text-slate-300 text-lg">
                            {error}
                        </p>
                    </div>
                    <div class="pt-6">
                        <a
                            href="/login"
                            class="inline-block bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-4 px-8 rounded-2xl transition-all text-lg"
                        >
                            Try Again
                        </a>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #0f1115;
    }
</style>
