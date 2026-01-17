<script lang="ts">
    import { onMount } from "svelte";
    import {
        ShieldAlert,
        Lock,
        Unlock,
        Plus,
        Trash2,
        Key,
        Home,
        Cat,
        Save,
        ArrowLeft,
        Eye,
        EyeOff,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    const USER_ID = 1;

    let items = $state<any[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let showSecrets = $state<Record<number, boolean>>({});

    let newItem = $state({
        name: "",
        content: "",
        unlock_condition: "tier_3_escalation",
    });

    onMount(async () => {
        await loadVault();
    });

    async function loadVault() {
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(
                `${baseUrl}/api/pulse/vault?user_id=${USER_ID}`,
            );
            if (res.ok) items = await res.json();
        } finally {
            loading = false;
        }
    }

    async function addItem() {
        if (!newItem.name || !newItem.content) return;
        saving = true;
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(
                `${baseUrl}/api/pulse/vault?user_id=${USER_ID}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newItem),
                },
            );
            if (res.ok) {
                const added = await res.json();
                items = [...items, added];
                newItem = {
                    name: "",
                    content: "",
                    unlock_condition: "tier_3_escalation",
                };
            }
        } finally {
            saving = false;
        }
    }

    async function deleteItem(id: number) {
        if (!confirm("Permanently delete these instructions from the vault?"))
            return;
        const baseUrl =
            import.meta.env.VITE_API_BASE || "http://localhost:8000";
        await fetch(`${baseUrl}/api/pulse/vault/${id}?user_id=${USER_ID}`, {
            method: "DELETE",
        });
        items = items.filter((i) => i.id !== id);
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-10 space-y-8 pb-32">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
            <a
                href="/modules/pulse"
                class="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
                <ArrowLeft class="w-5 h-5 text-slate-400" />
            </a>
            <h1 class="text-2xl font-serif text-white flex items-center gap-3">
                <Lock class="w-6 h-6 text-indigo-400" />
                The Vault
            </h1>
        </div>
        <div
            class="bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] text-indigo-400 font-bold uppercase tracking-widest"
        >
            Level 4 AES Encrypted
        </div>
    </div>

    <!-- Intro Card -->
    <div
        class="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden"
    >
        <div class="flex flex-col md:flex-row gap-8 items-center relative z-10">
            <div
                class="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center shrink-0"
            >
                <ShieldAlert class="w-10 h-10 text-indigo-400" />
            </div>
            <div class="space-y-2 text-center md:text-left">
                <h2 class="text-xl font-medium text-white">
                    Digital Dead-Drop Protocols
                </h2>
                <p class="text-slate-400 text-sm leading-relaxed max-w-xl">
                    Store sensitive instructions like <span
                        class="text-indigo-300">gate codes</span
                    >, <span class="text-indigo-300">home keys</span>, and
                    <span class="text-indigo-300">pet care steps</span>. These
                    are hidden from your Guardians until an escalation reaches
                    their assigned Tier.
                </p>
            </div>
        </div>
    </div>

    <!-- Entry Form -->
    <div
        class="bg-slate-950/40 border border-slate-800 rounded-3xl p-8 space-y-6"
    >
        <div class="flex items-center gap-2 mb-2">
            <Plus class="w-4 h-4 text-teal-400" />
            <h3
                class="text-sm font-bold text-slate-300 uppercase tracking-widest"
            >
                Add Secure Protocol
            </h3>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
            <div class="space-y-2">
                <label class="text-xs text-slate-500 ml-1">Protocol Name</label>
                <input
                    bind:value={newItem.name}
                    placeholder="e.g. Back Gate Code"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500/50 outline-none"
                />
            </div>
            <div class="space-y-2">
                <label class="text-xs text-slate-500 ml-1">Unlock At</label>
                <select
                    bind:value={newItem.unlock_condition}
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500/50 outline-none"
                >
                    <option value="tier_1_escalation"
                        >Tier 1 (Immediate Partners)</option
                    >
                    <option value="tier_2_escalation">Tier 2 (Family)</option>
                    <option value="tier_3_escalation"
                        >Tier 3 (Local/Emergency)</option
                    >
                </select>
            </div>
        </div>

        <div class="space-y-2">
            <label class="text-xs text-slate-500 ml-1">Sensitive Content</label>
            <textarea
                bind:value={newItem.content}
                placeholder="The instructions to reveal..."
                rows="3"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500/50 outline-none font-mono"
            ></textarea>
        </div>

        <button
            onclick={addItem}
            disabled={saving || !newItem.name || !newItem.content}
            class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
            <Save class="w-4 h-4" /> Save to Vault
        </button>
    </div>

    <!-- Vault Items -->
    <div class="space-y-4 pt-4">
        <h3
            class="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1"
        >
            Stored Heartbeat Assets ({items.length})
        </h3>

        {#each items as item (item.id)}
            <div
                class="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 group hover:border-slate-700/50 transition-all"
            >
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400"
                        >
                            {#if item.name
                                .toLowerCase()
                                .includes("gate") || item.name
                                    .toLowerCase()
                                    .includes("home")}
                                <Home class="w-4 h-4" />
                            {:else if item.name
                                .toLowerCase()
                                .includes("pet") || item.name
                                    .toLowerCase()
                                    .includes("cat") || item.name
                                    .toLowerCase()
                                    .includes("dog")}
                                <Cat class="w-4 h-4" />
                            {:else}
                                <Key class="w-4 h-4" />
                            {/if}
                        </div>
                        <div>
                            <h4 class="text-slate-200 font-medium">
                                {item.name}
                            </h4>
                            <div
                                class="text-[10px] text-indigo-400/70 font-bold uppercase tracking-widest"
                            >
                                {item.unlock_condition.replace("_", " ")}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={() =>
                                (showSecrets[item.id] = !showSecrets[item.id])}
                            class="p-2 text-slate-500 hover:text-white transition-colors"
                        >
                            {#if showSecrets[item.id]}
                                <EyeOff class="w-4 h-4" />
                            {:else}
                                <Eye class="w-4 h-4" />
                            {/if}
                        </button>
                        <button
                            onclick={() => deleteItem(item.id)}
                            class="p-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {#if showSecrets[item.id]}
                    <div
                        class="bg-slate-950/50 rounded-xl p-4 font-mono text-sm text-teal-400 border border-teal-500/20"
                        in:slide
                    >
                        {item.content}
                    </div>
                {:else}
                    <div
                        class="bg-slate-950/20 rounded-xl p-4 font-mono text-xs text-slate-600 italic select-none"
                    >
                        ••••••••••••••••••••••••••••
                    </div>
                {/if}
            </div>
        {/each}

        {#if items.length === 0 && !loading}
            <div
                class="text-center py-20 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl"
                in:fade
            >
                <Unlock class="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p class="text-slate-500 text-sm">
                    Your vault is empty. No backup protocols defined.
                </p>
            </div>
        {/if}
    </div>
</div>
