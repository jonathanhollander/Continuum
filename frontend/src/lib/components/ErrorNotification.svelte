<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { ErrorNotification } from '$lib/services/errorHandler';
	import { CircleAlert, Clock, Lock, Paperclip, Search, WifiOff } from 'lucide-svelte';

	interface Props {
		notification: ErrorNotification;
		onDismiss: () => void;
		onRetry?: () => void;
	}

	let { notification, onDismiss, onRetry }: Props = $props();
	let showDetails = $state(false);

	// Stays until dismissed. When a save inside a dialog did not go through,
	// bring focus back to the dialog's save button so keyboard users stay in place.
	// The save button stays disabled while the save is still wrapping up, so try for a moment.
	$effect(() => {
		let tries = 0;
		const timer = window.setInterval(() => {
			tries += 1;
			const dialog = document.querySelector('[aria-modal="true"]');
			if (!dialog || dialog.contains(document.activeElement) || tries > 30) {
				clearInterval(timer);
				return;
			}
			const buttons = Array.from(dialog.querySelectorAll('button:not([disabled])')) as HTMLButtonElement[];
			const save =
				dialog.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled])') ??
				buttons.reverse().find((b) => b.classList.contains('bg-primary'));
			if (save) {
				save.focus();
				clearInterval(timer);
			}
		}, 100);
		return () => clearInterval(timer);
	});

	// Icon based on error code, drawn in the gentle warning colour
	const getIcon = (code?: string) => {
		if (code?.includes('AUTH') || code?.includes('TOKEN')) return Lock;
		if (code === 'NOT_FOUND') return Search;
		if (code === 'NETWORK_ERROR') return WifiOff;
		if (code?.includes('FILE')) return Paperclip;
		if (code === 'RATE_LIMITED') return Clock;
		return CircleAlert;
	};
	const Icon = $derived(getIcon(notification.code));

</script>

<div
	class="error-notification"
	transition:fly={{ y: -20, duration: 300 }}
	role="alert"
	aria-live="polite"
>
	<div class="error-icon" aria-hidden="true">
		<Icon size={22} />
	</div>

	<div class="error-content">
		<div class="error-title">{notification.title}</div>
		<div class="error-message">{notification.message}</div>

		{#if notification.technicalDetails}
			<button class="details-toggle" onclick={() => showDetails = !showDetails}>
				{showDetails ? 'Hide' : 'Show'} details
			</button>
			{#if showDetails}
				<div class="technical-details" transition:fade={{ duration: 150 }}>
					<pre>{notification.technicalDetails}</pre>
				</div>
			{/if}
		{/if}

		<div class="error-actions">
			{#if notification.canRetry && onRetry}
				<button class="retry-button" onclick={onRetry}>Try Again</button>
			{/if}
			<button class="dismiss-button" onclick={onDismiss}>Close for now</button>
		</div>
	</div>

	<button class="close-button" onclick={onDismiss} aria-label="Close notification">
		×
	</button>
</div>

<style>
	.error-notification {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		/* A save that didn't go through is a gentle "needs a look" (warning), never alarm red. */
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-warning) 8%, var(--color-card)) 0%,
			var(--color-card) 100%
		);
		border: 1px solid var(--color-border);
		border-left: 4px solid var(--color-warning);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		max-width: 450px;
		width: 100%;
		box-sizing: border-box;
		padding-right: 52px;
		position: relative;
	}

	.error-icon {
		flex-shrink: 0;
		display: flex;
		color: var(--color-warning);
		padding-top: 1px;
	}

	.error-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.error-title {
		font-weight: 600;
		color: var(--color-foreground);
		font-size: 15px;
		margin: 0;
	}

	.error-message {
		color: var(--color-muted-foreground);
		font-size: 14px;
		line-height: 1.5;
		margin: 0;
	}

	.error-actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.details-toggle {
		background: none;
		border: none;
		color: var(--color-primary-hover);
		font-size: 12px;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}

	.details-toggle:hover {
		color: var(--color-foreground);
	}

	.technical-details {
		background: var(--color-muted);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		padding: 8px;
		margin-top: 8px;
		max-height: 150px;
		overflow: auto;
	}

	.technical-details pre {
		margin: 0;
		font-size: 11px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		white-space: pre-wrap;
		word-break: break-word;
		color: var(--color-muted-foreground);
	}

	.retry-button,
	.dismiss-button {
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.retry-button {
		background: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.retry-button:hover {
		background: var(--color-primary-hover);
	}

	.dismiss-button {
		background: var(--color-muted);
		color: var(--color-foreground);
		border: 1px solid var(--color-border);
	}

	.dismiss-button:hover {
		background: var(--color-border);
	}

	.close-button {
		position: absolute;
		top: 8px;
		right: 8px;
		background: none;
		border: none;
		font-size: 24px;
		line-height: 1;
		color: var(--color-muted-foreground);
		cursor: pointer;
		padding: 4px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: var(--color-muted);
		color: var(--color-foreground);
	}

	/* Compassionate, gentle animations */
	@keyframes gentlePulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.02);
		}
	}

	.error-notification:hover {
		animation: gentlePulse 2s ease-in-out infinite;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.error-notification {
			max-width: 100%;
			margin: 0 16px;
		}
	}
</style>
