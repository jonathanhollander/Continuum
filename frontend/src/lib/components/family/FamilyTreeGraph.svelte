<script lang="ts">
    import {
        familyStore,
        type FamilyMember,
    } from "$lib/stores/familyStore.svelte";
    import { Heart, Crown, Shield, Plus, X } from "lucide-svelte";
    import { slide } from "svelte/transition";

    interface PlacedNode extends FamilyMember {
        x: number;
        y: number;
    }

    let width = $state(800);
    const HEIGHT = 600;
    // Width of the edit panel; the map uses the space beside it while it is open
    const PANEL_WIDTH = 320;

    // The member being edited or added (a copy, so closing the panel leaves the map as it was)
    let draft = $state<any>(null);

    // Members placed on an ellipse (two rings past 12), so circles and names keep apart
    let nodes = $derived.by((): PlacedNode[] => {
        const members = familyStore.members || [];
        const n = members.length;
        const mapWidth = draft ? Math.max(0, width - PANEL_WIDTH) : width;
        const cx = mapWidth / 2;
        const cy = HEIGHT / 2;
        if (n === 1) return [{ ...members[0], x: cx, y: cy }];
        const rx = Math.max(0, mapWidth / 2 - 130);
        const ry = HEIGHT / 2 - 80;
        const outer = n > 12 ? Math.ceil(n * 0.6) : n;
        return members.map((m, i) => {
            const onOuter = i < outer;
            const count = onOuter ? outer : n - outer;
            const k = onOuter ? i : i - outer;
            const scale = onOuter ? 1 : 0.5;
            const angle = -Math.PI / 2 + (2 * Math.PI * k) / count + (onOuter ? 0 : Math.PI / count);
            return {
                ...m,
                x: cx + rx * scale * Math.cos(angle),
                y: cy + ry * scale * Math.sin(angle),
            };
        });
    });

    let links = $derived.by(() => {
        const byId = new Map(nodes.map((n) => [String(n.id), n]));
        return (familyStore.relationships || [])
            .map((r) => ({
                source: byId.get(String(r.sourceId)),
                target: byId.get(String(r.targetId)),
            }))
            .filter((l) => l.source && l.target) as { source: PlacedNode; target: PlacedNode }[];
    });

    let showMap = $derived(nodes.length > 0 || draft !== null);

    function getNodeColor(role: string, relation: string): string {
        const r = (role || "").toLowerCase();
        const rel = relation?.toLowerCase() || "";

        if (r === "owner") return "#4A7C74"; // Brand Teal

        if (r === "family") {
            if (
                rel.includes("spouse") ||
                rel.includes("partner") ||
                rel.includes("wife") ||
                rel.includes("husband")
            ) {
                return "#E11D48"; // Rose
            }
            if (
                rel.includes("child") ||
                rel.includes("son") ||
                rel.includes("daughter")
            ) {
                return "#F59E0B"; // Amber
            }
            return "#64748B"; // Slate (General Family)
        }

        return "#94A3B8"; // Default Gray
    }

    function isSpouse(node: FamilyMember): boolean {
        const rel = node.relation?.toLowerCase() || "";
        return (
            node.role === "Family" &&
            (rel.includes("spouse") ||
                rel.includes("partner") ||
                rel.includes("wife") ||
                rel.includes("husband"))
        );
    }

    function edit(node: PlacedNode) {
        const { x, y, ...member } = node;
        draft = { ...member };
    }

    function startAdd() {
        draft = {
            name: "",
            role: "Family",
            relation: "",
            email: "",
            isExecutor: false,
            isBeneficiary: false,
            isEmergencyContact: false,
        };
    }

    function save() {
        if (!draft || !String(draft.name ?? "").trim()) return;
        if (draft.id) familyStore.updateMember(draft.id, draft);
        else familyStore.addMember(draft);
        draft = null;
    }
</script>

<div
    class="relative w-full bg-slate-50 rounded-2xl overflow-hidden shadow-inner border border-slate-200 select-none {showMap
        ? 'h-[600px]'
        : 'py-10 flex justify-center'}"
    bind:clientWidth={width}
>
    {#if showMap}
        <!-- Lines -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none">
            {#each links as link}
                <line
                    x1={link.source.x}
                    y1={link.source.y}
                    x2={link.target.x}
                    y2={link.target.y}
                    stroke="#CBD5E1"
                    stroke-width="2"
                />
            {/each}
        </svg>

        <!-- Nodes -->
        {#each nodes as node (node.id)}
            <button
                type="button"
                class="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style="left: {node.x}px; top: {node.y}px;"
                onclick={() => edit(node)}
            >
                {#if draft?.id === node.id}
                    <div
                        class="absolute -inset-2 w-20 h-20 rounded-full border-2 border-[#4A7C74]/50 animate-pulse"
                    ></div>
                {/if}

                <div
                    class="w-16 h-16 rounded-full bg-white border-4 shadow-sm overflow-hidden relative transition-transform group-hover:scale-110"
                    style="border-color: {getNodeColor(node.role, node.relation)}"
                >
                    {#if node.avatar}
                        <img
                            src={node.avatar}
                            alt={node.name}
                            class="w-full h-full object-cover"
                        />
                    {:else}
                        <div
                            class="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold"
                        >
                            {(node.name || "").slice(0, 2).toUpperCase()}
                        </div>
                    {/if}

                    {#if node.isExecutor || isSpouse(node)}
                        <div
                            class="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm"
                        >
                            {#if node.isExecutor}<Shield
                                    size={12}
                                    class="text-[#4A7C74]"
                                />{/if}
                            {#if isSpouse(node)}<Heart
                                    size={12}
                                    class="text-rose-500"
                                />{/if}
                        </div>
                    {/if}
                </div>

                <!-- Name -->
                <div
                    class="absolute top-full left-1/2 -translate-x-1/2 mt-2 max-w-[160px] truncate bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-700 whitespace-nowrap shadow-sm border border-slate-100"
                    title={node.name}
                >
                    {node.name}
                </div>
            </button>
        {/each}
    {/if}

    {#if !draft}
        <div class={showMap ? "absolute bottom-6 right-6" : ""}>
            <button
                class="flex items-center gap-2 px-6 py-3 bg-primary shadow-lg rounded-full font-bold text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                onclick={startAdd}
            >
                <Plus size={20} />
                Add Member
            </button>
        </div>
    {/if}

    <!-- Edit Panel -->
    {#if draft}
        <div
            class="absolute top-0 right-0 h-full w-80 bg-white/95 backdrop-blur shadow-2xl border-l border-slate-200 p-5 overflow-y-auto"
            transition:slide={{ axis: "x", duration: 300 }}
        >
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-serif font-bold text-xl text-slate-800">
                    {draft.id ? "Edit Member" : "Add Member"}
                </h3>
                <button
                    aria-label="Close"
                    onclick={() => (draft = null)}
                    class="p-1 hover:bg-slate-100 rounded-full"
                >
                    <X size={20} class="text-slate-400" />
                </button>
            </div>

            <div class="space-y-3">
                <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1">
                    Name
                    <input
                        bind:value={draft.name}
                        class="mt-1.5 w-full px-4 py-3 text-sm normal-case font-normal tracking-normal text-slate-800 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </label>

                <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1">
                    Type
                    <select
                        bind:value={draft.role}
                        class="mt-1.5 w-full px-4 py-3 text-sm normal-case font-normal tracking-normal text-slate-800 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                        <option value="Family">Family Member</option>
                        <option value="Friend">Friend</option>
                        <option value="Medical">Medical Professional</option>
                        <option value="Legal">Legal Professional</option>
                        <option value="Financial">Financial Professional</option>
                        <option value="Pet">Pet</option>
                        <option value="Other">Other</option>
                    </select>
                </label>

                <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1">
                    Relationship / Title
                    <input
                        bind:value={draft.relation}
                        placeholder={draft.role === "Family"
                            ? "e.g. Spouse, Son, Mother"
                            : "e.g. Cardiologist, Best Friend"}
                        class="mt-1.5 w-full px-4 py-3 text-sm normal-case font-normal tracking-normal text-slate-800 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </label>

                <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1">
                    Email Address
                    <input
                        type="email"
                        bind:value={draft.email}
                        placeholder="email@example.com"
                        class="mt-1.5 w-full px-4 py-3 text-sm normal-case font-normal tracking-normal text-slate-800 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </label>

                <div class="flex flex-col gap-2">
                    <label
                        class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-all"
                    >
                        <input
                            type="checkbox"
                            bind:checked={draft.isExecutor}
                            class="w-4 h-4 rounded accent-primary"
                        />
                        <span class="text-sm font-medium text-slate-800">Designated Executor</span>
                        <Shield size={14} class="ml-auto text-slate-400" />
                    </label>
                    <label
                        class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-all"
                    >
                        <input
                            type="checkbox"
                            bind:checked={draft.isBeneficiary}
                            class="w-4 h-4 rounded accent-primary"
                        />
                        <span class="text-sm font-medium text-slate-800">Beneficiary</span>
                        <Crown size={14} class="ml-auto text-slate-400" />
                    </label>
                </div>

                <div class="pt-3 border-t border-slate-200">
                    <button
                        class="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                        disabled={!String(draft.name ?? "").trim()}
                        onclick={save}
                    >
                        Save Changes
                    </button>
                    {#if draft.id && draft.id !== "owner"}
                        <button
                            class="w-full mt-2 py-2 text-red-500 text-sm font-bold hover:bg-red-50 rounded-lg transition-colors"
                            onclick={() => {
                                familyStore.removeMember(draft.id);
                                draft = null;
                            }}
                        >
                            Remove Member
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
