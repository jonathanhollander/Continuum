<script lang="ts">
    import {
        keyringEmails,
        switchAccount,
        activeAccountId,
    } from "$lib/stores/keyringStore";
    import { fade, fly, scale } from "svelte/transition";
    import { User, Plus, Shield, ArrowRight } from "lucide-svelte";
    import { onMount } from "svelte";

    let mounted = false;
    let hasAnonymous = false;
    let anonName = "";

    onMount(() => {
        mounted = true;

        // Check for any anonymous data
        if (typeof localStorage !== "undefined") {
            const storedProfs =
                localStorage.getItem("continuum_acc_anonymous_profiles") ||
                localStorage.getItem("continuum_global_profiles");

            if (storedProfs) {
                try {
                    const profs = JSON.parse(storedProfs);
                    const owner = profs.find((p: any) => p.id === "owner");
                    if (owner && owner.name && owner.name !== "Original User") {
                        anonName = owner.name;
                    }
                } catch (e) {}
            }

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith("continuum_acc_anonymous")) {
                    hasAnonymous = true;
                    break;
                }
            }
        }
    });

    function enterAnonymous() {
        activeAccountId.set("anonymous");
        window.location.href = "/modules/family-hub";
    }

    function createNew() {
        window.location.href = "/wizard";
    }

    async function sendMagicLink() {
        // In this concierge demo, we use a simple alert.
        // In real app, we'd prompt for the email if not in keyring.
        const email = $keyringEmails[0] || "user@example.com";
        try {
            const response = await fetch(
                "http://localhost:8000/api/auth/magic-link",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                },
            );
            if (response.ok) {
                alert(`Magic Link sent to ${email}! Check your inbox.`);
            }
        } catch (e) {
            console.error("Magic link failed", e);
            alert("Connection to authentication server failed.");
        }
    }
</script>

<div
    class="min-h-screen bg-[#0F1115] text-slate-200 flex items-center justify-center p-6 font-sans"
>
    {#if mounted}
        <div class="max-w-xl w-full" in:fade={{ duration: 800 }}>
            <div class="text-center mb-12">
                <div
                    class="inline-flex p-4 rounded-3xl bg-amber-500/10 text-amber-500 mb-6 border border-amber-500/20 shadow-2xl shadow-amber-500/10"
                >
                    <Shield size={48} />
                </div>
                <h1
                    class="text-5xl font-serif font-black tracking-tighter text-white mb-2"
                >
                    Continuum
                </h1>
                <p class="text-slate-500 text-lg">Whose vault is this?</p>
            </div>

            <div class="grid gap-4">
                {#each $keyringEmails as email}
                    <button
                        onclick={() => switchAccount(email)}
                        class="group p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6 hover:bg-white/10 hover:border-amber-500/30 transition-all text-left relative overflow-hidden"
                        in:fly={{ y: 20, duration: 400 }}
                    >
                        <div
                            class="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-black transition-all"
                        >
                            <User size={24} />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-lg font-bold text-white truncate">
                                {email}
                            </p>
                            <p
                                class="text-xs text-slate-500 uppercase tracking-widest font-bold"
                            >
                                Secure Estate Vault
                            </p>
                        </div>
                        <ArrowRight
                            size={20}
                            class="text-white/20 group-hover:text-amber-500 transition-all"
                        />

                        <!-- Glow effect -->
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                        ></div>
                    </button>
                {/each}

                {#if hasAnonymous}
                    <button
                        onclick={enterAnonymous}
                        class="group p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-6 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-left relative overflow-hidden"
                        in:fly={{ y: 20, duration: 400, delay: 50 }}
                    >
                        <div
                            class="w-14 h-14 rounded-full bg-amber-900/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all"
                        >
                            <Shield size={24} />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-lg font-bold text-white truncate">
                                {anonName
                                    ? `Local Session (${anonName})`
                                    : "Local Session (Guest)"}
                            </p>
                            <p
                                class="text-xs text-amber-500/60 uppercase tracking-widest font-bold"
                            >
                                Re-enter active vault
                            </p>
                        </div>
                        <ArrowRight
                            size={20}
                            class="text-amber-500/20 group-hover:text-amber-500 transition-all"
                        />
                    </button>
                {/if}

                <button
                    onclick={createNew}
                    class="p-6 border-2 border-dashed border-white/10 rounded-2xl flex items-center gap-6 hover:bg-white/5 hover:border-white/20 transition-all text-left text-slate-400 hover:text-white"
                    in:fly={{ y: 20, duration: 400, delay: 100 }}
                >
                    <div
                        class="w-14 h-14 rounded-full border border-dashed border-white/20 flex items-center justify-center"
                    >
                        <Plus size={24} />
                    </div>
                    <div>
                        <p class="text-lg font-bold">Create New Legacy</p>
                        <p
                            class="text-xs uppercase tracking-widest font-bold opacity-60"
                        >
                            Begin initialization
                        </p>
                    </div>
                </button>
            </div>

            <!-- Simplified Access Bridge for Elderly/Non-Technical Users -->
            <div class="mt-12 pt-12 border-t border-white/5">
                <div
                    class="bg-amber-500/5 rounded-3xl p-8 border border-amber-500/10"
                >
                    <h3
                        class="text-amber-500 font-bold mb-4 flex items-center gap-2"
                    >
                        <Shield size={20} /> Having trouble signing in?
                    </h3>
                    <div class="grid gap-4">
                        <button
                            class="w-full py-4 bg-amber-500 text-black font-black rounded-xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2 text-lg"
                            onclick={() =>
                                alert("Magic Link sent to Registered Email!")}
                        >
                            <User size={20} /> Quick Access via Email
                        </button>
                        <p class="text-slate-500 text-sm text-center px-4">
                            We can send a secure temporary link to your email.
                            <strong>No passwords or passkeys required.</strong>
                        </p>
                    </div>
                </div>

                <div class="mt-8 flex justify-center gap-8">
                    <button
                        class="text-slate-500 hover:text-white text-sm font-bold flex items-center gap-2"
                    >
                        Need human help?
                    </button>
                    <button
                        class="text-slate-500 hover:text-white text-sm font-bold flex items-center gap-2"
                    >
                        Print recovery key
                    </button>
                </div>
            </div>

            <p class="mt-12 text-center text-slate-600 text-xs">
                Encryption keys are stored locally in this browser's secure
                keyring.
            </p>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        background-color: #0f1115;
    }
</style>
