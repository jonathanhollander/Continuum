<script lang="ts">
    import {
        familyStore,
        contactSync,
        type FamilyMember,
    } from "$lib/stores/familyStore.svelte";
    import { Heart, Crown, Shield, Plus, X } from "lucide-svelte";
    import { slide } from "svelte/transition";

    interface PlacedNode extends FamilyMember {
        x: number;
        y: number;
    }

    // The member being edited or added (a copy, so closing the panel leaves the map as it was)
    let draft = $state<any>(null);

    let width = $state(800);
    // A small family gets a shorter map so everyone fits the first screen;
    // larger families and the open edit panel keep the full height
    const SMALL_FAMILY = 6;
    let height = $derived(
        draft || (familyStore.members || []).length > SMALL_FAMILY ? 600 : 400,
    );
    // Width of the edit panel; the map uses the space beside it while it is open
    const PANEL_WIDTH = 320;

    // Members placed on an ellipse (two rings past 12), so circles and names keep apart
    let nodes = $derived.by((): PlacedNode[] => {
        const members = familyStore.members || [];
        const n = members.length;
        const mapWidth = draft ? Math.max(0, width - PANEL_WIDTH) : width;
        const cx = mapWidth / 2;
        const cy = height / 2;
        if (n === 1) return [{ ...members[0], x: cx, y: cy }];
        const rx = Math.max(0, mapWidth / 2 - 130);
        const ry = height / 2 - 80;
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

        if (r === "owner") return "var(--color-primary)";

        if (r === "family") {
            if (
                rel.includes("spouse") ||
                rel.includes("partner") ||
                rel.includes("wife") ||
                rel.includes("husband")
            ) {
                return "var(--color-gold)";
            }
            if (
                rel.includes("child") ||
                rel.includes("son") ||
                rel.includes("daughter")
            ) {
                return "var(--color-info)";
            }
            return "var(--color-muted-foreground)"; // General family
        }

        return "var(--color-border)";
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

    let saving = $state(false);
    const saveVersions = new WeakMap<object, number>();
    const recoveryIds = new WeakMap<object, string>();
    async function save() {
        if (saving || !draft || !String(draft.name ?? "").trim()) return;
        const form = draft;
        const submitted = JSON.parse(JSON.stringify(form));
        const version = (saveVersions.get(form) ?? 0) + 1;
        saveVersions.set(form, version);
        let completed = false;
        const attempt = async () => {
            if (saving || completed || saveVersions.get(form) !== version) return;
            saving = true;
            try {
                const saved = submitted.id
                    ? await contactSync.update(submitted.id, submitted, true, attempt, recoveryIds.get(form))
                    : await contactSync.create(submitted, false, false, attempt, recoveryIds.get(form));
                completed = true;
                recoveryIds.delete(form);
                if (draft === form) {
                    if (JSON.stringify(draft) === JSON.stringify(submitted)) draft = null;
                    else draft.id = saved.id;
                }
            } catch (e) {
                if (e && typeof e === "object" && "recoveryId" in e && typeof e.recoveryId === "string") recoveryIds.set(form, e.recoveryId);
                // The shared notice offers Retry; the member's complete draft stays editable here.
            } finally {
                saving = false;
            }
        };
        await attempt();
    }
</script>

<div
    class="relative w-full bg-muted rounded-2xl overflow-hidden shadow-inner border border-border select-none {showMap
        ? ''
        : 'py-10 flex justify-center'}"
    style:height={showMap ? `${height}px` : undefined}
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
                    stroke="var(--color-muted-foreground)"
                    stroke-opacity="0.4"
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
                        class="absolute -inset-2 w-20 h-20 rounded-full border-2 border-primary/50 animate-pulse"
                    ></div>
                {/if}

                <div
                    class="w-16 h-16 rounded-full bg-card border-4 shadow-sm overflow-hidden relative transition-transform group-hover:scale-110"
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
                            class="w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-bold"
                        >
                            {(node.name || "").slice(0, 2).toUpperCase()}
                        </div>
                    {/if}

                    {#if node.isExecutor || isSpouse(node)}
                        <div
                            class="absolute bottom-0 right-0 w-5 h-5 bg-card rounded-full flex items-center justify-center shadow-sm"
                        >
                            {#if node.isExecutor}<Shield
                                    size={12}
                                    class="text-primary"
                                />{/if}
                            {#if isSpouse(node)}<Heart
                                    size={12}
                                    class="text-primary"
                                />{/if}
                        </div>
                    {/if}
                </div>

                <!-- Name -->
                <div
                    class="absolute top-full left-1/2 -translate-x-1/2 mt-2 max-w-[160px] truncate bg-card/90 px-2 py-1 rounded text-xs font-bold text-foreground whitespace-nowrap shadow-sm border border-border"
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
            class="absolute top-0 right-0 h-full w-80 bg-card/95 backdrop-blur shadow-2xl border-l border-border p-5 overflow-y-auto"
            transition:slide={{ axis: "x", duration: 300 }}
        >
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-serif font-bold text-xl text-foreground">
                    {draft.id ? "Edit Member" : "Add Member"}
                </h3>
                <button
                    aria-label="Close"
                    onclick={() => (draft = null)}
                    class="p-1 hover:bg-muted rounded-full"
                >
                    <X size={20} class="text-muted-foreground" />
                </button>
            </div>

            <div class="space-y-3">
                <label class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1">
                    Name
                    <input
                        bind:value={draft.name}
                        class="mt-1.5 w-full px-4 py-3 text-sm normal-case font-normal tracking-normal text-foreground rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </label>

                <label class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1">
                    Type
                    <select
                        bind:value={draft.role}
                        class="mt-1.5 w-full px-4 py-3 text-sm normal-case font-normal tracking-normal text-foreground rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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

                <label class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1">
                    Relationship / Title
                    <input
                        bind:value={draft.relation}
                        placeholder={draft.role === "Family"
                            ? "e.g. Spouse, Son, Mother"
                            : "e.g. Cardiologist, Best Friend"}
                        class="mt-1.5 w-full px-4 py-3 text-sm normal-case font-normal tracking-normal text-foreground rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </label>

                <label class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1">
                    Email Address
                    <input
                        type="email"
                        bind:value={draft.email}
                        placeholder="email@example.com"
                        class="mt-1.5 w-full px-4 py-3 text-sm normal-case font-normal tracking-normal text-foreground rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </label>

                <div class="flex flex-col gap-2">
                    <label
                        class="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted transition-all"
                    >
                        <input
                            type="checkbox"
                            bind:checked={draft.isExecutor}
                            class="w-4 h-4 rounded accent-primary"
                        />
                        <span class="text-sm font-medium text-foreground">Designated Executor</span>
                        <Shield size={14} class="ml-auto text-muted-foreground" />
                    </label>
                    <label
                        class="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted transition-all"
                    >
                        <input
                            type="checkbox"
                            bind:checked={draft.isBeneficiary}
                            class="w-4 h-4 rounded accent-primary"
                        />
                        <span class="text-sm font-medium text-foreground">Beneficiary</span>
                        <Crown size={14} class="ml-auto text-muted-foreground" />
                    </label>
                </div>

                <div class="pt-3 border-t border-border">
                    <button
                        class="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                        disabled={saving || !String(draft.name ?? "").trim()}
                        aria-busy={saving}
                        onclick={save}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                    {#if draft.id && draft.id !== "owner"}
                        <button
                            class="w-full mt-2 py-2 text-danger text-sm font-bold hover:bg-danger-soft rounded-lg transition-colors"
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
