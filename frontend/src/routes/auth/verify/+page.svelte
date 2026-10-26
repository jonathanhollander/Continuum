<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { API_BASE_URL } from "$lib/config";
    import { auth, storeTokens } from "$lib/stores/auth";
    import { beginSession, captureSession, isCurrentSession } from "$lib/services/sessionOwnership";
    import { Shield, CheckCircle2, Loader2 } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    let status: "verifying" | "success" | "error" = "verifying";
    let error = "";

    onMount(async () => {
        let owner = captureSession();
        const token = $page.url.searchParams.get("token");

        if (!token) {
            status = "error";
            error = "This link has been used or has rested. A new one is a tap away whenever you're ready.";
            return;
        }
        owner = beginSession();

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`,
            );

            if (!res.ok) {
                throw new Error("Verification failed");
            }

            const { access_token, refresh_token } = await res.json();
            if (typeof access_token !== "string" || !access_token) {
                throw new Error("Verification failed");
            }

            if (!storeTokens(access_token, refresh_token, owner)) return;
            owner = captureSession();
            await auth.init();
            if (!isCurrentSession(owner, true) || !isCurrentSession(captureSession())) return;

            status = "success";

            // Same-site relative destination only; anything else goes to the dashboard
            const dest = $page.url.searchParams.get("redirect") || "";
            const target =
                dest.startsWith("/") && !dest.startsWith("//") && !dest.includes("\\") && !dest.includes("://")
                    ? dest
                    : "/dashboard";
            setTimeout(() => {
                if (isCurrentSession(owner, true)) goto(target);
            }, 2000);
        } catch (e: any) {
            if (!isCurrentSession(owner, true)) return;
            console.error("Magic link verification failed:", e);
            status = "error";
            error =
                "This link has been used or has rested. A new one is a tap away whenever you're ready.";
        }
    });
</script>

<svelte:head>
    <title>Verifying Login - Continuum</title>
</svelte:head>

<div
    class="surface-dark min-h-screen bg-background flex items-center justify-center p-6 font-sans"
>
    <div class="max-w-2xl w-full" in:fade={{ duration: 600 }}>
        <div class="text-center mb-12">
            <div
                class="inline-flex p-5 rounded-3xl bg-primary/10 text-primary mb-8 border border-primary/20 shadow-2xl shadow-primary/10"
            >
                <Shield size={56} />
            </div>
        </div>

        <div
            class="bg-card/50 border border-border rounded-3xl p-10 backdrop-blur-sm"
        >
            {#if status === "verifying"}
                <div
                    class="text-center py-12 space-y-6"
                    in:fly={{ y: 20, duration: 300 }}
                >
                    <Loader2
                        size={56}
                        class="text-primary animate-spin mx-auto"
                    />
                    <div class="space-y-3">
                        <h3 class="text-foreground font-bold text-3xl">
                            Verifying your login...
                        </h3>
                        <p class="text-muted-foreground text-lg">
                            Signing you in securely...
                        </p>
                    </div>
                </div>
            {:else if status === "success"}
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
                            Welcome back
                        </h3>
                        <p class="text-muted-foreground text-lg">
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
                        class="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/30"
                    >
                        <Shield size={48} class="text-primary" />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-foreground font-bold text-3xl">
                            This link has finished its job
                        </h3>
                        <p class="text-muted-foreground text-lg">
                            {error}
                        </p>
                    </div>
                    <div class="pt-6">
                        <a
                            href="/login"
                            class="inline-block bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-8 rounded-2xl transition-all text-lg"
                        >
                            Sign in when you're ready
                        </a>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #0f172a; /* the .surface-dark background */
    }
</style>
