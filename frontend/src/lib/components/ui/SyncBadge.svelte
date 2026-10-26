<script lang="ts">
    /**
     * SyncBadge - Displays sync status with compassionate, non-anxiety-inducing colors and labels.
     *
     * Colours come from the app.css status tokens: success (kept safe), info (saving) and the
     * gentle warning for "needs attention". "On this device" and "Ready" share the quiet slate
     * of the label, which reads on the dark dashboard in both themes.
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
            color: "bg-success",
            bgColor: "bg-success/20",
            label: "Kept safe",
            tooltip: "Your thoughts are safely saved"
        },
        saving: {
            color: "bg-info",
            bgColor: "bg-info/20",
            label: "Saving...",
            tooltip: "We're keeping this safe for you...",
            pulseClass: "animate-pulse"
        },
        local: {
            color: "bg-slate-400",
            bgColor: "bg-slate-400/20",
            label: "On this device",
            tooltip: "Stored here - we'll save to your account when ready"
        },
        "attention-needed": {
            color: "bg-warning",
            bgColor: "bg-warning/20",
            label: "Needs attention",
            tooltip: "Saving is taking a moment. Your words are still here, and we'll try again."
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
        style="box-shadow: 0 0 4px {status === 'safe' ? 'color-mix(in srgb, var(--color-success) 40%, transparent)' : status === 'saving' ? 'color-mix(in srgb, var(--color-info) 40%, transparent)' : 'transparent'};"
        title={config.tooltip}
    ></span>

    {#if showLabel}
        <span class="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
            {config.label}
        </span>
    {/if}
</span>
