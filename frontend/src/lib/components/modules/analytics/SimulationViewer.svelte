<script lang="ts">
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import {
        User,
        Shield,
        Briefcase,
        Heart,
        CircleCheck,
    } from "lucide-svelte";

    export let activeSimulation: "probate" | "incapacity" | "transfer" =
        "transfer";

    let packets: any[] = [];
    let interval: any;

    const nodes = {
        user: { x: 10, y: 50, label: "You", icon: User, color: "text-white" },
        legal: {
            x: 40,
            y: 20,
            label: "Executor",
            icon: Shield,
            color: "text-indigo-400",
        },
        financial: {
            x: 40,
            y: 80,
            label: "Trust",
            icon: Briefcase,
            color: "text-emerald-400",
        },
        family: {
            x: 80,
            y: 50,
            label: "Beneficiary",
            icon: Heart,
            color: "text-rose-400",
        },
    };

    function spawnPacket() {
        const id = Math.random();
        // Simulation Logic
        let path = [];
        if (activeSimulation === "transfer") {
            path = ["user", "financial", "family"];
        } else if (activeSimulation === "probate") {
            path = ["user", "legal", "family"];
        } else {
            path = ["user", "legal", "financial"];
        }

        packets = [...packets, { id, path, step: 0, progress: 0 }];

        // Animate packet
        movePacket(id);
    }

    function movePacket(id: number) {
        // Simple animation loop would go here in a real app
        // For now, we rely on CSS animations or simplified interval updates
        // This is a placeholder for the "Packet" logic
        setTimeout(() => {
            packets = packets.filter((p) => p.id !== id);
        }, 3000);
    }

    onMount(() => {
        interval = setInterval(spawnPacket, 2000);
        return () => clearInterval(interval);
    });
</script>

<div
    class="relative w-full h-96 bg-slate-900/50 rounded-3xl border border-white/10 backdrop-blur-sm overflow-hidden p-8"
>
    <!-- Simulation Label -->
    <div class="absolute top-6 left-6 z-10">
        <div class="flex items-center gap-2 mb-1">
            <div
                class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
            ></div>
            <span
                class="text-xs font-bold uppercase tracking-widest text-emerald-400"
                >Simulation Active</span
            >
        </div>
        <h3 class="text-xl font-serif font-bold text-white capitalize">
            {activeSimulation} Protocol
        </h3>
    </div>

    <!-- Nodes -->
    {#each Object.entries(nodes) as [key, node]}
        <div
            class="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10"
            style="left: {node.x}%; top: {node.y}%"
        >
            <div
                class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center shadow-2xl {node.color}"
            >
                <svelte:component this={node.icon} size={32} />
            </div>
            <span
                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >{node.label}</span
            >
        </div>
    {/each}

    <!-- Connecting Lines (SVG) -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <!-- Lines from User to Legal/Financial -->
        <path
            d="M 10% 50% Q 25% 35% 40% 20%"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-dasharray="4 4"
        />
        <path
            d="M 10% 50% Q 25% 65% 40% 80%"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-dasharray="4 4"
        />
        <!-- Lines to Family -->
        <path
            d="M 40% 20% Q 60% 35% 80% 50%"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-dasharray="4 4"
        />
        <path
            d="M 40% 80% Q 60% 65% 80% 50%"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-dasharray="4 4"
        />
    </svg>

    <!-- Packets (Animated Dots) -->
    <!-- Note: In a full production implementation, we'd calculate exact XY positions along the quadratic bezier curves -->
    {#each packets as packet (packet.id)}
        <div
            class="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"
            style="animation: flow-{activeSimulation} 3s linear forwards"
        ></div>
    {/each}
</div>

<style>
    /* 
       Simplified CSS Keyframes for the "Flow" 
       These approximate the SVG paths above 
    */
    @keyframes flow-transfer {
        0% {
            left: 10%;
            top: 50%;
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        50% {
            left: 40%;
            top: 80%;
        }
        90% {
            opacity: 1;
        }
        100% {
            left: 80%;
            top: 50%;
            opacity: 0;
        }
    }
    @keyframes flow-probate {
        0% {
            left: 10%;
            top: 50%;
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        50% {
            left: 40%;
            top: 20%;
        }
        90% {
            opacity: 1;
        }
        100% {
            left: 80%;
            top: 50%;
            opacity: 0;
        }
    }
    @keyframes flow-incapacity {
        0% {
            left: 10%;
            top: 50%;
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        50% {
            left: 40%;
            top: 20%;
        } /* Stops at Legal (healthcare proxy) */
        100% {
            left: 40%;
            top: 20%;
            opacity: 0;
        }
    }
</style>
