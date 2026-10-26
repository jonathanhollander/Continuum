<script lang="ts">
    import { onMount } from "svelte";
    import { apiGet, apiPost, apiPut, apiDelete } from "$lib/api/client";
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
    import EmptyState from "$lib/components/EmptyState.svelte";

    let items = $state<any[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let showSecrets = $state<Record<number, boolean>>({});
    let loadError = $state("");
    let formError = $state("");
    let listError = $state("");

    const tierLabels: Record<string, string> = {
        tier_1_escalation: "Tier 1 (Immediate Partners)",
        tier_2_escalation: "Tier 2 (Family)",
        tier_3_escalation: "Tier 3 (Local/Emergency)",
    };
    function tierLabel(condition: string): string {
        return tierLabels[condition] ?? condition.replaceAll("_", " ");
    }

    function cancelEdit() {
        formError = "";
        newItem = { name: "", content: "", unlock_condition: "tier_3_escalation" };
    }

    let newItem = $state<{ id?: number; name: string; content: string; unlock_condition: string }>({
        name: "",
        content: "",
        unlock_condition: "tier_3_escalation",
    });

    onMount(async () => {
        await loadVault();
    });

    async function loadVault() {
        loadError = "";
        try {
            items = await apiGet('/api/pulse/vault');
        } catch (e) {
            console.error("Vault load failed", e);
            loadError = "Let's try opening your vault again in a moment — your items are safe.";
        } finally {
            loading = false;
        }
    }

    async function addItem() {
        if (!newItem.name || !newItem.content) return;
        saving = true;
        formError = "";
        try {
            let saved;
            if (newItem.id) {
                // Update implementation
                saved = await apiPut(`/api/pulse/vault/${newItem.id}`, newItem);
            } else {
                // Create implementation
                saved = await apiPost('/api/pulse/vault', newItem);
            }

            if (newItem.id) {
                items = items.map((i) => (i.id === saved.id ? saved : i));
            } else {
                items = [...items, saved];
            }
            newItem = {
                name: "",
                content: "",
                unlock_condition: "tier_3_escalation",
            };
        } catch (e) {
            // Keep the draft in the form so nothing typed is lost
            console.error("Vault save failed", e);
            formError = "Let's try that again in a moment — your words are still here.";
        } finally {
            saving = false;
        }
    }

    async function deleteItem(id: number) {
        if (!confirm("Remove these instructions from the vault? This action is permanent."))
            return;
        listError = "";
        try {
            await apiDelete(`/api/pulse/vault/${id}`);
            items = items.filter((i) => i.id !== id);
            if (newItem.id === id) cancelEdit();
        } catch (e) {
            console.error("Vault delete failed", e);
            listError = "Let's try removing that again in a moment — it's still safely in your vault.";
        }
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
            Private to you
        </div>
    </div>

    <!-- Intro Card -->
    <div
        class="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden"
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
                    <span class="text-indigo-300">pet care steps</span>. They
                    stay private, and are shared only with the guardians you
                    choose, when the time comes: once an escalation reaches the
                    tier you set for each item.
                </p>
            </div>
        </div>
    </div>

    <!-- Entry Form -->
    <div
        class="bg-slate-950/40 border border-slate-800 rounded-2xl p-8 space-y-6"
    >
        <div class="flex items-center gap-2 mb-2">
            <Plus class="w-4 h-4 text-teal-400" />
            <h3
                class="text-sm font-bold text-slate-300 uppercase tracking-widest"
            >
                {newItem.id ? `Editing “${items.find((i) => i.id === newItem.id)?.name ?? newItem.name}”` : "Add an item"}
            </h3>
            {#if newItem.id}
                <button
                    onclick={cancelEdit}
                    class="ml-auto text-xs text-slate-400 hover:text-slate-200 underline"
                >
                    Stop editing
                </button>
            {/if}
        </div>

        <div class="grid md:grid-cols-2 gap-4">
            <div class="space-y-2">
                <label class="text-xs text-slate-500 ml-1">Name</label>
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
            <label class="text-xs text-slate-500 ml-1">What they should know</label>
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
            <Save class="w-4 h-4" /> {newItem.id ? "Save my changes" : "Save to Vault"}
        </button>

        {#if formError}
            <p role="alert" class="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                {formError}
            </p>
        {/if}
    </div>

    <!-- Vault Items -->
    <div class="space-y-4 pt-4">
        <h3
            class="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1"
        >
            Your vault items ({items.length})
        </h3>

        {#if loadError}
            <div role="alert" class="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <span>{loadError}</span>
                <button onclick={() => { loading = true; loadVault(); }} class="underline shrink-0">Try again</button>
            </div>
        {/if}
        {#if listError}
            <p role="alert" class="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                {listError}
            </p>
        {/if}

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
                                Shared at {tierLabel(item.unlock_condition)}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={() => {
                                // Populate edit state
                                newItem = {
                                    id: item.id,
                                    name: item.name,
                                    content: item.content,
                                    unlock_condition: item.unlock_condition,
                                };
                                formError = "";
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            title="Edit"
                            class="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                        >
                            <span class="sr-only">Edit</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                    d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                                /><path d="m15 5 4 4" /></svg
                            >
                        </button>
                        <button
                            onclick={() =>
                                (showSecrets[item.id] = !showSecrets[item.id])}
                            title={showSecrets[item.id] ? "Hide" : "Show"}
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
                            title="Remove this item"
                            class="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                            <span class="sr-only">Remove this item</span>
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

        {#if items.length === 0 && !loading && !loadError}
            <div
                class="text-center py-16 px-8 bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl max-w-2xl mx-auto"
                in:fade
            >
                <div class="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lock class="w-10 h-10 text-indigo-400" />
                </div>

                <h3 class="font-serif font-bold text-2xl text-slate-200 mb-4">
                    Secrets that reveal themselves when needed
                </h3>

                <div class="mb-6 bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-left">
                    <p class="text-slate-300 leading-relaxed">
                        <strong class="text-indigo-300">Some information is best kept for when it's truly needed.</strong>
                        Gate codes, safe combinations, pet feeding instructions, or where you keep the spare key—these are things your trusted contacts
                        only need access to in an emergency.
                    </p>
                    <p class="text-slate-400 mt-3 leading-relaxed">
                        The Pulse Vault keeps these private, and shares them only with the guardians you choose, when the time comes:
                        once an escalation reaches the tier you set. It's peace of mind that the people you trust will have what they need.
                    </p>
                </div>

                <p class="text-slate-500 mb-6 text-sm italic">
                    Start with something simple—like where you keep the house key.
                </p>

                <p class="text-xs text-slate-600 mt-4">
                    Add protocols using the form above. They'll appear here once saved.
                </p>
            </div>
        {/if}
    </div>
</div>
