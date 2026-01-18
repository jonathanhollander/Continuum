<script lang="ts">
    import { fly, fade, slide } from "svelte/transition";
    import {
        X,
        Mic,
        MicOff,
        Send,
        RefreshCw,
        ChevronDown,
        Sparkles,
        AlertCircle,
        Target,
        ExternalLink,
        Minimize2,
        Maximize2,
    } from "lucide-svelte";
    import { conciergeEngine, type Message } from "$lib/stores/conciergeEngine";
    import { voiceService } from "$lib/services/voiceService";
    import { accessibilityStore } from "$lib/stores/accessibilityStore";
    import { preferenceStore } from "$lib/stores/preferenceStore";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { CheckCircle2 } from "lucide-svelte";

    const {
        isOpen = false,
        isPoppedOut = false,
        onClose,
    } = $props<{
        isOpen?: boolean;
        isPoppedOut?: boolean;
        onClose: () => void;
    }>();

    // State for Floating Mode (Dragging & Resizing)
    let isDragging = $state(false);
    let isResizing = $state(false);
    let dragStart = $state({ x: 0, y: 0 });
    let resizeStartSize = $state({ width: 0, height: 0 });
    let panelRef = $state<HTMLElement | null>(null);

    // Derived flags
    const isActuallyPoppedOut = $derived($conciergeEngine.isPoppedOut);
    const popOutMode = $derived($conciergeEngine.popOutMode);
    const floatingPos = $derived(
        $conciergeEngine.floatingPosition || { x: 50, y: 50 },
    );
    const floatingSize = $derived(
        $conciergeEngine.floatingSize || { width: 340, height: 580 },
    );

    let input = $state("");
    let scrollContainer = $state<HTMLElement | null>(null);

    // Accessibility Derived
    const fontSizeClass = $derived(
        $accessibilityStore.fontSize === "normal"
            ? "text-base"
            : $accessibilityStore.fontSize === "large"
              ? "text-lg"
              : $accessibilityStore.fontSize === "xlarge"
                ? "text-xl"
                : "text-2xl",
    );

    const contrastClass = $derived(
        $accessibilityStore.highContrast
            ? "border-indigo-500 border-2"
            : "border-white/10",
    );

    onMount(() => {
        scrollToBottom();
    });

    // Replace legacy afterUpdate with $effect for scrolling
    $effect(() => {
        // This effect runs whenever messages change, triggering the scroll
        if ($conciergeEngine.messages) {
            scrollToBottom();
        }
    });

    function scrollToBottom() {
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }

    async function handleSend() {
        if (!input.trim()) return;
        const msg = input;
        input = "";
        await conciergeEngine.sendMessage(msg);
    }

    function toggleVoice() {
        if ($conciergeEngine.isListening) {
            voiceService.stopListening();
        } else {
            voiceService.startListening();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // Handle auto-open suppression logic
    $effect(() => {
        if ($preferenceStore.expertMode && $conciergeEngine.isOpen) {
            // In expert mode, we don't do anything special here yet,
            // but we ensure the engine doesn't proactively pop up.
        }
    });

    // Auto-TTS for assistant messages
    const lastMessage = $derived(
        $conciergeEngine.messages[$conciergeEngine.messages.length - 1],
    );

    // PiP Window Reference
    let pipWindow = $state<Window | null>(null);

    async function handlePiPToggle() {
        if (!browser || !("documentPictureInPicture" in window)) return;

        try {
            // @ts-ignore
            pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 400,
                height: 700,
            });

            if (!pipWindow || !panelRef) return;

            // Move styles
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const cssRules = [...styleSheet.cssRules]
                        .map((rule) => rule.cssText)
                        .join("");
                    const style = document.createElement("style");
                    style.textContent = cssRules;
                    pipWindow?.document.head.appendChild(style);
                } catch (e) {
                    const link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.type = styleSheet.type;
                    // @ts-ignore
                    link.href = styleSheet.href;
                    pipWindow?.document.head.appendChild(link);
                }
            });

            // Move Panel
            pipWindow.document.body.append(panelRef);

            pipWindow.addEventListener("pagehide", () => {
                // Move panel back to main document before it's destroyed with the window
                if (panelRef) {
                    document.body.appendChild(panelRef);
                }
                pipWindow = null;
                conciergeEngine.popIn();
            });
        } catch (e) {
            console.error("PiP failed:", e);
            // Fallback to floating already handled by store logic
        }
    }

    $effect(() => {
        if (popOutMode === "pip" && !pipWindow) {
            handlePiPToggle();
        }
    });

    // Dragging Logic
    function onPointerDown(e: PointerEvent) {
        if (popOutMode !== "floating") return;
        isDragging = true;
        dragStart = {
            x: e.clientX - floatingPos.x,
            y: e.clientY - floatingPos.y,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!isDragging) return;
        conciergeEngine.setFloatingPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }

    function onPointerUp(e: PointerEvent) {
        isDragging = false;
        isResizing = false;
    }

    // Resizing Logic
    function onResizeDown(e: PointerEvent) {
        if (popOutMode !== "floating") return;
        e.stopPropagation(); // Don't trigger drag
        isResizing = true;
        dragStart = { x: e.clientX, y: e.clientY };
        resizeStartSize = {
            width: floatingSize.width,
            height: floatingSize.height,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onResizeMove(e: PointerEvent) {
        if (!isResizing) return;
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        conciergeEngine.setFloatingSize({
            width: Math.max(300, resizeStartSize.width + deltaX),
            height: Math.max(400, resizeStartSize.height + deltaY),
        });
    }
</script>

{#if (isOpen && !isActuallyPoppedOut) || (isActuallyPoppedOut && isOpen)}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-transparent z-40 transition-all duration-500"
        onclick={onClose}
        transition:fade={{ duration: 200 }}
    ></div>

    <!-- Panel -->
    <div
        bind:this={panelRef}
        class="fixed bg-slate-900 shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 pointer-events-auto"
        transition:fly={{ x: 400, duration: 400, opacity: 1 }}
        class:h-full={!popOutMode}
        class:border-l={!popOutMode}
        class:rounded-2xl={popOutMode === "floating"}
        class:border={popOutMode === "floating"}
        style={popOutMode === "floating"
            ? `width: ${floatingSize.width}px; height: ${floatingSize.height}px; left: ${floatingPos.x}px; top: ${floatingPos.y}px; ${contrastClass}`
            : popOutMode === "pip"
              ? `width: 100%; height: 100%; top: 0; left: 0;`
              : `top: 0; right: 0; width: 480px; ${contrastClass}`}
    >
        <div
            class="p-6 border-b border-white/10 bg-black/20 backdrop-blur flex items-center justify-between {popOutMode ===
            'floating'
                ? 'cursor-move active:cursor-grabbing'
                : ''}"
            onpointerdown={onPointerDown}
            onpointermove={onPointerMove}
            onpointerup={onPointerUp}
        >
            <div class="flex items-center gap-3">
                <div class="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h2 class="text-xl font-bold text-white tracking-tight">
                        AI Concierge
                    </h2>
                    <div class="flex items-center gap-2">
                        <span
                            class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                        ></span>
                        <span
                            class="text-[10px] uppercase tracking-widest text-white/40 font-bold"
                            >Active Assistant</span
                        >
                        {#if $conciergeEngine.currentContextName}
                            <div
                                class="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/20 rounded-full border border-indigo-500/30"
                            >
                                <Target size={10} class="text-indigo-400" />
                                <span
                                    class="text-[9px] font-bold uppercase tracking-wider text-indigo-300"
                                    >{$conciergeEngine.currentContextName}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button
                    onclick={() => conciergeEngine.clearHistory()}
                    class="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    title="Reset Conversation"
                >
                    <RefreshCw size={18} />
                </button>

                {#if !isActuallyPoppedOut}
                    <button
                        onclick={() => conciergeEngine.popOut()}
                        class="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors flex items-center gap-1.5"
                        title="Pop Out"
                    >
                        <Maximize2 size={16} />
                        <span
                            class="text-[10px] uppercase font-bold tracking-wider"
                            >Pop Out</span
                        >
                    </button>
                {:else}
                    <button
                        onclick={() => {
                            if (pipWindow) {
                                pipWindow.close();
                            } else {
                                conciergeEngine.popIn();
                            }
                        }}
                        class="p-1.5 px-3 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-full transition-colors flex items-center gap-1.5 border border-indigo-500/30"
                        title="Pop In"
                    >
                        <Minimize2 size={14} />
                        <span
                            class="text-[10px] uppercase font-bold tracking-wider"
                            >Pop In</span
                        >
                    </button>
                {/if}
                <button
                    onclick={onClose}
                    class="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>

        <!-- Chat Rail -->
        <div
            bind:this={scrollContainer}
            class="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
            {#each $conciergeEngine.messages as msg (msg.id)}
                <div
                    class="flex {msg.role === 'user'
                        ? 'justify-end'
                        : 'justify-start'}"
                    transition:fly={{ y: 20, duration: 300 }}
                >
                    <div class="max-w-[85%] space-y-2">
                        <div
                            class="p-4 rounded-2xl {msg.role === 'user'
                                ? msg.isDictated
                                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-50'
                                    : 'bg-indigo-600 text-white'
                                : 'bg-white/5 border border-white/10 text-slate-200'}"
                        >
                            <p class="{fontSizeClass} leading-relaxed">
                                {msg.content}
                            </p>

                            {#if msg.isDictated}
                                <div
                                    class="mt-2 flex items-center gap-1 opacity-50"
                                >
                                    <Mic size={10} />
                                    <span
                                        class="text-[9px] uppercase font-bold tracking-tighter"
                                        >Dictated - Please verify</span
                                    >
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}

            {#if $conciergeEngine.isThinking}
                <div class="flex justify-start" transition:fade>
                    <div
                        class="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-2"
                    >
                        <div class="flex gap-1">
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                                style="animation-delay: 0s"
                            ></span>
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                                style="animation-delay: 0.1s"
                            ></span>
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                                style="animation-delay: 0.2s"
                            ></span>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Extracted Card (Placeholder/Pattern) -->
            {#if $conciergeEngine.lastExtractedData}
                <div class="mt-4" transition:slide>
                    <div
                        class="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 space-y-4"
                    >
                        <div
                            class="flex items-center gap-2 text-indigo-300 font-bold text-sm uppercase tracking-wide"
                        >
                            <CheckCircle2 size={16} />
                            <span>Extracted Details</span>
                        </div>
                        <div
                            class="bg-black/20 rounded-xl p-3 border border-white/5 space-y-2"
                        >
                            {#each Object.entries($conciergeEngine.lastExtractedData) as [key, value]}
                                <div class="flex flex-col gap-1 text-sm">
                                    <span
                                        class="text-white/40 capitalize text-[10px]"
                                        >{key.replace("_", " ")}</span
                                    >
                                    {#if typeof value === "object" && value !== null}
                                        <div
                                            class="space-y-1 pl-2 border-l border-white/10"
                                        >
                                            {#each Object.entries(value) as [k, v]}
                                                <div
                                                    class="flex justify-between"
                                                >
                                                    <span
                                                        class="text-white/30 text-[10px] capitalize"
                                                        >{k}</span
                                                    >
                                                    <span
                                                        class="text-white font-medium text-[10px]"
                                                        >{v}</span
                                                    >
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        <span class="text-white font-medium"
                                            >{value}</span
                                        >
                                    {/if}
                                </div>
                            {/each}
                        </div>
                        <p class="text-[10px] text-white/50 italic">
                            I've parsed these details from our conversation. Are
                            they correct?
                        </p>
                        <div class="flex gap-2">
                            <button
                                onclick={() =>
                                    conciergeEngine.confirmExtractedData()}
                                class="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors"
                            >
                                Yes, Confirm
                            </button>
                            <button
                                onclick={() => conciergeEngine.clearHistory()}
                                class="px-4 py-2 bg-white/5 text-white/60 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Footer / Input -->
        <div class="p-6 border-t border-white/10 bg-black/40 space-y-4">
            <!-- Voice Pulse Visualizer -->
            {#if $conciergeEngine.isListening || $conciergeEngine.isSpeaking}
                <div
                    class="h-8 flex items-center justify-center gap-1"
                    transition:fade
                >
                    {#each Array(8) as _, i}
                        <div
                            class="w-1 bg-indigo-400/60 rounded-full animate-pulse"
                            style="height: {20 +
                                Math.random() * 60}%; animation-delay: {i *
                                0.1}s"
                        ></div>
                    {/each}
                </div>
            {/if}

            <div class="flex gap-2">
                <button
                    onclick={toggleVoice}
                    class="p-4 rounded-2xl transition-all shadow-lg {$conciergeEngine.isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/20'
                        : 'bg-slate-800 text-indigo-400 hover:bg-slate-700 shadow-black/20'}"
                >
                    {#if $conciergeEngine.isListening}
                        <MicOff size={24} />
                    {:else}
                        <Mic size={24} />
                    {/if}
                </button>

                <div class="flex-1 relative">
                    <textarea
                        bind:value={input}
                        onkeydown={handleKeydown}
                        placeholder={$conciergeEngine.isListening
                            ? "Listening..."
                            : "Provide your details here..."}
                        class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 pr-12 {fontSizeClass} text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none min-h-[60px] max-h-[120px]"
                        disabled={$conciergeEngine.isListening}
                    ></textarea>
                    <button
                        onclick={handleSend}
                        disabled={!input.trim() || $conciergeEngine.isThinking}
                        class="absolute right-3 bottom-3 p-2 text-indigo-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

            <div
                class="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/30 px-1"
            >
                <span>Start Talking</span>
                <button
                    onclick={onClose}
                    class="hover:text-white transition-colors"
                    >Look Around First</button
                >
            </div>
        </div>

        <!-- Resize Handle -->
        {#if popOutMode === "floating"}
            <div
                class="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[60] flex items-end justify-end p-1 group"
                onpointerdown={onResizeDown}
                onpointermove={onResizeMove}
                onpointerup={onPointerUp}
            >
                <div
                    class="w-1.5 h-1.5 border-r-2 border-b-2 border-white/20 group-hover:border-indigo-400 transition-colors rounded-br-sm"
                ></div>
            </div>
        {/if}
    </div>
{/if}

<style>
    /* Spectral Pulse Custom Scrollbar */
    div::-webkit-scrollbar {
        width: 4px;
    }
    div::-webkit-scrollbar-track {
        background: transparent;
    }
    div::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    div::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
