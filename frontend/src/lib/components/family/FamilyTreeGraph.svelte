<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        familyMembers,
        relationships,
        type FamilyMember,
        type Relationship,
        updateMember,
        removeMember,
        addMember,
    } from "$lib/stores/familyStore";
    import {
        User,
        Heart,
        Crown,
        Shield,
        Star,
        Plus,
        X,
        Save,
    } from "lucide-svelte";
    import { fade, scale, slide } from "svelte/transition";

    // --- Physics Simulation Types ---
    interface SimNode extends FamilyMember {
        x: number;
        y: number;
        vx: number;
        vy: number;
    }

    interface SimLink {
        source: SimNode;
        target: SimNode;
    }

    let nodes: SimNode[] = [];
    let links: SimLink[] = [];
    let width = 800;
    let height = 600;
    let animationId: number;
    let draggingNode: SimNode | null = null;
    let selectedNode: SimNode | null = null;
    let hoveredNode: SimNode | null = null;

    // --- Configuration ---
    const NODE_RADIUS = 30;
    const LINK_DISTANCE = 150;
    const REPULSION = 2000;
    const CENTER_FORCE = 0.05;
    const DAMPING = 0.8;

    // --- Reactivity ---
    $: if ($familyMembers && $relationships) {
        syncSimulationFromStore();
    }

    function syncSimulationFromStore() {
        // Map store data to simulation objects, preserving positions if they exist
        const oldNodeMap = new Map(nodes.map((n) => [n.id, n]));

        nodes = $familyMembers.map((m) => {
            const old = oldNodeMap.get(m.id);
            return {
                ...m,
                x: old ? old.x : width / 2 + (Math.random() - 0.5) * 50,
                y: old ? old.y : height / 2 + (Math.random() - 0.5) * 50,
                vx: old ? old.vx : 0,
                vy: old ? old.vy : 0,
            };
        });

        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        links = $relationships
            .map((r) => ({
                source: nodeMap.get(r.sourceId),
                target: nodeMap.get(r.targetId),
            }))
            .filter((l) => l.source && l.target) as SimLink[];
    }

    // --- Simulation Loop ---
    function tick() {
        // 1. Apply Forces
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            // Center Force
            const dx = width / 2 - node.x;
            const dy = height / 2 - node.y;
            node.vx += dx * CENTER_FORCE * 0.1;
            node.vy += dy * CENTER_FORCE * 0.1;

            // Repulsion
            for (let j = 0; j < nodes.length; j++) {
                if (i === j) continue;
                const other = nodes[j];
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1) dist = 1;

                const force = REPULSION / (dist * dist);
                node.vx += (dx / dist) * force;
                node.vy += (dy / dist) * force;
            }
        }

        // Link Force
        for (const link of links) {
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = (dist - LINK_DISTANCE) * 0.05;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            link.source.vx += fx;
            link.source.vy += fy;
            link.target.vx -= fx;
            link.target.vy -= fy;
        }

        // 2. Update Positions
        for (const node of nodes) {
            if (node === draggingNode) continue; // Don't move if dragging
            node.x += node.vx;
            node.y += node.vy;
            node.vx *= DAMPING;
            node.vy *= DAMPING;

            // Boundaries
            node.x = Math.max(
                NODE_RADIUS,
                Math.min(width - NODE_RADIUS, node.x),
            );
            node.y = Math.max(
                NODE_RADIUS,
                Math.min(height - NODE_RADIUS, node.y),
            );
        }

        // draw();
        animationId = requestAnimationFrame(tick);
    }

    // --- Value Helpers ---
    function getNodeColor(role: string): string {
        switch (role) {
            case "owner":
                return "#4A7C74"; // Brand Teal
            case "spouse":
                return "#E11D48"; // Rose
            case "child":
                return "#F59E0B"; // Amber
            default:
                return "#64748B"; // Slate
        }
    }

    // --- Hybrid Interaction ---
    // Actually, pure SVG is easier than Canvas + HTML mix for this node count (< 50).
    // Let's SWITCH to pure SVG. It handles events and images natively.
</script>

<!-- SWITCH TO SVG IMPLEMENTATION FOR BETTER DX -->
<div
    class="relative w-full h-[600px] bg-slate-50 rounded-2xl overflow-hidden shadow-inner border border-slate-200 user-select-none"
    bind:clientWidth={width}
    bind:clientHeight={height}
>
    <svg class="w-full h-full pointer-events-none">
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

    {#each nodes as node (node.id)}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style="left: {node.x}px; top: {node.y}px;"
            on:mousedown={(e) => {
                draggingNode = node;
                selectedNode = node;
                // prevent text selection
                e.preventDefault();
            }}
            on:mouseenter={() => (hoveredNode = node)}
            on:mouseleave={() => (hoveredNode = null)}
        >
            <!-- Halo -->
            {#if node === selectedNode}
                <div
                    class="absolute inset-0 -m-2 rounded-full border-2 border-[#4A7C74]/50 animate-pulse"
                ></div>
            {/if}

            <!-- Node -->
            <div
                class="w-16 h-16 rounded-full bg-white border-4 shadow-sm overflow-hidden relative transition-transform hover:scale-110"
                style="border-color: {getNodeColor(node.role)}"
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
                        {node.name.slice(0, 2).toUpperCase()}
                    </div>
                {/if}

                <!-- Role Icon Badge -->
                {#if node.isExecutor || node.role === "spouse"}
                    <div
                        class="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm"
                    >
                        {#if node.isExecutor}<Shield
                                size={12}
                                class="text-[#4A7C74]"
                            />{/if}
                        {#if node.role === "spouse"}<Heart
                                size={12}
                                class="text-rose-500"
                            />{/if}
                    </div>
                {/if}
            </div>

            <!-- Name Label -->
            <div
                class="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-700 whitespace-nowrap shadow-sm border border-slate-100 group-hover:bg-white group-hover:scale-105 transition-all"
            >
                {node.name}
            </div>
        </div>
    {/each}

    <!-- Add Button (Floating) -->
    <div class="absolute bottom-6 right-6 flex gap-4">
        <button
            class="flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-full font-bold text-slate-600 hover:text-[#4A7C74] transition-colors"
            on:click={() => {
                // reset sim positions gently
                nodes.forEach((n) => {
                    n.vx += (Math.random() - 0.5) * 5;
                    n.vy += (Math.random() - 0.5) * 5;
                });
            }}
        >
            Shake Graph
        </button>
        <button
            class="flex items-center gap-2 px-6 py-3 bg-[#4A7C74] shadow-lg rounded-full font-bold text-white hover:bg-[#3a615b] transition-transform hover:scale-105 active:scale-95"
            on:click={() =>
                (selectedNode = {
                    id: "",
                    name: "New Member",
                    role: "child",
                    relationToOwner: "",
                    isExecutor: false,
                    isBeneficiary: false,
                    isEmergencyContact: false,
                } as any)}
        >
            <Plus size={20} />
            Add Member
        </button>
    </div>

    <!-- Edit Panel -->
    {#if selectedNode}
        <div
            class="absolute top-0 right-0 h-full w-80 bg-white/95 backdrop-blur shadow-2xl border-l border-slate-200 p-6 overflow-y-auto"
            transition:slide={{ axis: "x", duration: 300 }}
        >
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-serif font-bold text-xl text-slate-800">
                    {selectedNode.id ? "Edit Member" : "Add Member"}
                </h3>
                <button
                    on:click={() => (selectedNode = null)}
                    class="p-1 hover:bg-slate-100 rounded-full"
                >
                    <X size={20} class="text-slate-400" />
                </button>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase text-slate-400"
                        >Name</label
                    >
                    <input
                        bind:value={selectedNode.name}
                        class="w-full p-2 border rounded-lg focus:border-[#4A7C74] outline-none"
                    />
                </div>

                <div>
                    <label class="text-xs font-bold uppercase text-slate-400"
                        >Relationship</label
                    >
                    <select
                        bind:value={selectedNode.role}
                        class="w-full p-2 border rounded-lg focus:border-[#4A7C74] outline-none"
                    >
                        <option value="spouse">Spouse / Partner</option>
                        <option value="child">Child</option>
                        <option value="grandchild">Grandchild</option>
                        <option value="sibling">Sibling</option>
                        <option value="parent">Parent</option>
                        <option value="professional">Professional</option>
                        <option value="executor">Executor (Non-Family)</option>
                    </select>
                </div>

                <div>
                    <label class="text-xs font-bold uppercase text-slate-400"
                        >Email Address</label
                    >
                    <input
                        type="email"
                        bind:value={selectedNode.email}
                        placeholder="email@example.com"
                        class="w-full p-2 border rounded-lg focus:border-[#4A7C74] outline-none"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label
                        class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-slate-50"
                    >
                        <input
                            type="checkbox"
                            bind:checked={selectedNode.isExecutor}
                            class="text-[#4A7C74] focus:ring-[#4A7C74]"
                        />
                        <span class="text-sm font-medium"
                            >Designated Executor</span
                        >
                        <Shield size={14} class="ml-auto text-slate-400" />
                    </label>
                    <label
                        class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-slate-50"
                    >
                        <input
                            type="checkbox"
                            bind:checked={selectedNode.isBeneficiary}
                            class="text-[#4A7C74] focus:ring-[#4A7C74]"
                        />
                        <span class="text-sm font-medium">Beneficiary</span>
                        <Crown size={14} class="ml-auto text-slate-400" />
                    </label>
                </div>

                <div class="pt-4 border-t">
                    <button
                        class="w-full py-3 bg-[#4A7C74] text-white rounded-xl font-bold hover:shadow-lg transition-transform active:scale-95"
                        on:click={() => {
                            if (selectedNode?.id) {
                                updateMember(selectedNode.id, selectedNode);
                            } else if (selectedNode) {
                                addMember(selectedNode);
                            }
                            selectedNode = null;
                        }}
                    >
                        Save Changes
                    </button>
                    {#if selectedNode.id && selectedNode.id !== "owner"}
                        <button
                            class="w-full mt-2 py-2 text-red-500 text-sm font-bold hover:bg-red-50 rounded-lg transition-colors"
                            on:click={() => {
                                if (selectedNode && selectedNode.id)
                                    removeMember(selectedNode.id);
                                selectedNode = null;
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

<svelte:window
    on:mousemove={(e) => {
        if (draggingNode) {
            // Need to account for container offset if I want precise tracking,
            // but for a simple draggable node in relative container:
            // e.clientX is global.
            // Better to use delta or set target to mouse pos mapped to container?
            // Simple delta approach for now or just rely on 'tick' updates if we mapped mouse correctly.
            // Let's use a simpler mapping:
            // We need client rect of container.
            // This is getting complex for a 1-file component without binding `this`.
            // Let's use simple drag handler on the DIV itself.
        }
    }}
    on:mouseup={() => (draggingNode = null)}
/>
