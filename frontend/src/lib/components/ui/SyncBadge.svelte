<script lang="ts">
    /**
     * SyncBadge - Displays sync status with compassionate, non-anxiety-inducing colors and labels.
     *
     * Colors intentionally avoid harsh red - using muted amber/orange for attention states.
     * Labels use positive, supportive language appropriate for end-of-life planning context.
     */

    export type CompassionateSyncStatus = "safe" | "saving" | "local" | "attention-needed" | "ready";

    const statusConfig: Record<CompassionateSyncStatus, {
        color: string;
        bgColor: string;
        label: string;
        tooltip: string;
        pulseClass?: string;
    }> = {
        safe: {
            color: "bg-emerald-400",
            bgColor: "bg-emerald-400/20",
            label: "Kept safe",
            tooltip: "Your thoughts are safely saved"
        },
        saving: {
            color: "bg-amber-400",
            bgColor: "bg-amber-400/20",
            label: "Saving...",
            tooltip: "We're keeping this safe for you...",
            pulseClass: "animate-pulse"
        },
        local: {
            color: "bg-sky-400",
            bgColor: "bg-sky-400/20",
            label: "On this device",
            tooltip: "Stored here - we'll save to your account when ready"
        },
        "attention-needed": {
            color: "bg-orange-400",
            bgColor: "bg-orange-400/20",
            label: "Needs attention",
            tooltip: "We couldn't save just now. Your words are still here."
        },
        ready: {
            color: "bg-slate-400",
            bgColor: "bg-slate-400/20",
            label: "Ready",
            tooltip: "When you're ready, your thoughts will be kept safe"
        }
    };

    interface Props {
        status?: CompassionateSyncStatus;
        showLabel?: boolean;
        size?: "sm" | "md" | "lg";
    }

    let { status = "ready", showLabel = false, size = "sm" }: Props = $props();

    let config = $derived(statusConfig[status]);
    let sizeClasses = $derived({
        sm: "w-2 h-2",
        md: "w-2.5 h-2.5",
        lg: "w-3 h-3"
    }[size]);
</script>

<span
    class="relative inline-flex items-center gap-1.5 group cursor-default"
    role="status"
    aria-label={config.tooltip}
>
    <span
        class="rounded-full {config.color} {sizeClasses} {config.pulseClass || ''} shadow-sm"
        style="box-shadow: 0 0 4px {status === 'safe' ? 'rgb(52 211 153 / 0.4)' : status === 'saving' ? 'rgb(251 191 36 / 0.4)' : 'transparent'};"
        title={config.tooltip}
    ></span>

    {#if showLabel}
        <span class="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
            {config.label}
        </span>
    {/if}
</span>
