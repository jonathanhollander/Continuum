<script lang="ts">
    import { Loader2, Check, AlertCircle, Save } from "lucide-svelte";
    import { scale, fade } from "svelte/transition";

    type SaveState = "idle" | "saving" | "saved" | "error";

    interface Props {
        state?: SaveState;
        idleText?: string;
        savingText?: string;
        savedText?: string;
        errorText?: string;
        onclick?: () => Promise<void> | void;
        disabled?: boolean;
        variant?: "primary" | "secondary" | "ghost";
        size?: "sm" | "md" | "lg";
        fullWidth?: boolean;
        showIcon?: boolean;
        class?: string;
    }

    let {
        state = $bindable("idle"),
        idleText = "Save changes",
        savingText = "Saving...",
        savedText = "Saved!",
        errorText = "Try again",
        onclick,
        disabled = false,
        variant = "primary",
        size = "md",
        fullWidth = false,
        showIcon = true,
        class: className = "",
    }: Props = $props();

    // Auto-reset to idle after saved/error state
    $effect(() => {
        if (state === "saved") {
            const timeout = setTimeout(() => {
                state = "idle";
            }, 2000);
            return () => clearTimeout(timeout);
        }
        if (state === "error") {
            const timeout = setTimeout(() => {
                state = "idle";
            }, 3000);
            return () => clearTimeout(timeout);
        }
    });

    // Haptic feedback on mobile
    function triggerHaptic(type: "success" | "error") {
        if ("vibrate" in navigator) {
            const patterns = {
                success: [50],
                error: [100, 50, 100],
            };
            navigator.vibrate(patterns[type]);
        }
    }

    async function handleClick() {
        if (state === "saving" || disabled) return;

        state = "saving";

        try {
            if (onclick) {
                await onclick();
            }
            state = "saved";
            triggerHaptic("success");
        } catch (e) {
            state = "error";
            triggerHaptic("error");
            throw e;
        }
    }

    // Variant styles
    const variantStyles = {
        primary: {
            idle: "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20",
            saving: "bg-slate-700 text-white cursor-wait",
            saved: "bg-green-600 text-white",
            error: "bg-red-600 hover:bg-red-700 text-white",
        },
        secondary: {
            idle: "bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50",
            saving: "bg-slate-50 border-2 border-slate-200 text-slate-500 cursor-wait",
            saved: "bg-green-50 border-2 border-green-200 text-green-700",
            error: "bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100",
        },
        ghost: {
            idle: "bg-transparent hover:bg-slate-100 text-slate-700",
            saving: "bg-slate-50 text-slate-500 cursor-wait",
            saved: "bg-green-50 text-green-700",
            error: "bg-red-50 text-red-700 hover:bg-red-100",
        },
    };

    // Size styles
    const sizeStyles = {
        sm: "py-2 px-4 text-sm rounded-xl",
        md: "py-3 px-6 text-base rounded-xl",
        lg: "py-4 px-8 text-lg rounded-2xl",
    };

    let buttonClass = $derived(
        `inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ${
            variantStyles[variant][state]
        } ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${state === "saved" ? "scale-[1.02]" : ""} ${
            state === "error" ? "animate-shake" : ""
        } ${className}`
    );

    let displayText = $derived(
        state === "idle"
            ? idleText
            : state === "saving"
              ? savingText
              : state === "saved"
                ? savedText
                : errorText
    );
</script>

<button
    class={buttonClass}
    onclick={handleClick}
    disabled={disabled || state === "saving"}
    aria-busy={state === "saving"}
>
    {#if showIcon}
        <span class="relative w-5 h-5">
            {#if state === "idle"}
                <span in:scale={{ duration: 200 }} class="absolute inset-0 flex items-center justify-center">
                    <Save class="w-5 h-5" />
                </span>
            {:else if state === "saving"}
                <span in:scale={{ duration: 200 }} class="absolute inset-0 flex items-center justify-center">
                    <Loader2 class="w-5 h-5 animate-spin" />
                </span>
            {:else if state === "saved"}
                <span in:scale={{ duration: 200 }} class="absolute inset-0 flex items-center justify-center">
                    <Check class="w-5 h-5" />
                </span>
            {:else}
                <span in:scale={{ duration: 200 }} class="absolute inset-0 flex items-center justify-center">
                    <AlertCircle class="w-5 h-5" />
                </span>
            {/if}
        </span>
    {/if}

    <span class="transition-opacity" class:opacity-70={state === "saving"}>
        {displayText}
    </span>
</button>

<style>
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
    }

    .animate-shake {
        animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
</style>
