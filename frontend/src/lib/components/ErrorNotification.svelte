<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { ErrorNotification } from '$lib/services/errorHandler';

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

	// Icon based on error code
	const getIcon = (code?: string) => {
		if (code?.includes('AUTH') || code?.includes('TOKEN')) return '🔒';
		if (code === 'NOT_FOUND') return '🔍';
		if (code === 'NETWORK_ERROR') return '📡';
		if (code?.includes('FILE')) return '📎';
		if (code === 'RATE_LIMITED') return '⏱️';
		return '⚠️';
	};

</script>

<div
	class="error-notification"
	transition:fly={{ y: -20, duration: 300 }}
	role="alert"
	aria-live="polite"
>
	<div class="error-icon">
		{getIcon(notification.code)}
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
			<button class="dismiss-button" onclick={onDismiss}>Dismiss</button>
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
		background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
		border-left: 4px solid #ff4444;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		max-width: 450px;
		width: 100%;
		box-sizing: border-box;
		padding-right: 52px;
		position: relative;
	}

	.error-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.error-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.error-title {
		font-weight: 600;
		color: #2d3748;
		font-size: 15px;
		margin: 0;
	}

	.error-message {
		color: #4a5568;
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
		color: #3182ce;
		font-size: 12px;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}

	.details-toggle:hover {
		color: #2c5aa0;
	}

	.technical-details {
		background: #f7fafc;
		border: 1px solid #e2e8f0;
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
		color: #4a5568;
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
		background: #3182ce;
		color: white;
	}

	.retry-button:hover {
		background: #2c5aa0;
	}

	.dismiss-button {
		background: #e2e8f0;
		color: #4a5568;
	}

	.dismiss-button:hover {
		background: #cbd5e0;
	}

	.close-button {
		position: absolute;
		top: 8px;
		right: 8px;
		background: none;
		border: none;
		font-size: 24px;
		line-height: 1;
		color: #a0aec0;
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
		background: rgba(0, 0, 0, 0.05);
		color: #4a5568;
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
