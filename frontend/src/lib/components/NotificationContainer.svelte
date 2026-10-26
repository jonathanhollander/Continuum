<script lang="ts">
	import { notifications } from '$lib/stores/notificationStore';
	import ErrorNotification from './ErrorNotification.svelte';
	import { CircleCheck, Info } from 'lucide-svelte';

	import { onMount } from 'svelte';

	let notificationList = $derived($notifications);

	// Keep the stack clear of any open dialog: use the free space beside it.
	const GAP = 20;
	const MIN_WIDTH = 280;
	let placement = $state('');

	let container: HTMLDivElement;

	// With no dialog open, the stack sits top right below the header. When it would sit on the
	// middle of a button, link, field or switch on the page, it moves to the bottom right if that
	// spot covers fewer, so the page stays usable while a notice is showing.
	function pagePlacement(): string {
		if (!container || container.childElementCount === 0 || window.innerWidth < 1024) return '';
		const w = container.offsetWidth;
		const h = container.offsetHeight;
		const right = window.innerWidth - GAP;
		const covered = (top: number) =>
			Array.from(
				document.querySelectorAll<HTMLElement>(
					'#main-content :is(button, a[href], input, select, textarea, [role="switch"])',
				),
			).filter((el) => {
				const r = el.getBoundingClientRect();
				const x = r.left + r.width / 2;
				const y = r.top + r.height / 2;
				return r.width > 0 && x > right - w && x < right && y > top && y < top + h;
			}).length;
		const atTop = covered(96);
		if (atTop === 0) return '';
		return covered(window.innerHeight - GAP - h) < atTop ? `top:auto;bottom:${GAP}px;` : '';
	}

	let queued = false;
	function schedulePlacement() {
		if (queued) return;
		queued = true;
		requestAnimationFrame(() => {
			queued = false;
			updatePlacement();
		});
	}

	function updatePlacement() {
		const dialog = document.querySelector('[aria-modal="true"]');
		if (!dialog) {
			placement = pagePlacement();
			return;
		}
		const panel =
			(dialog.querySelector(':scope > :not([role="presentation"])') as HTMLElement | null) ??
			(dialog as HTMLElement);
		const r = panel.getBoundingClientRect();
		const vw = window.innerWidth;
		if (r.width >= vw - 40 || r.width === 0) {
			placement = '';
			return;
		}
		const rightSpace = vw - r.right - GAP * 2;
		const leftSpace = r.left - GAP * 2;
		if (rightSpace >= 450) {
			placement = '';
		} else if (rightSpace >= MIN_WIDTH) {
			placement = `max-width:${Math.floor(rightSpace)}px;`;
		} else if (leftSpace >= MIN_WIDTH) {
			placement = `right:auto;left:${GAP}px;max-width:${Math.min(450, Math.floor(leftSpace))}px;`;
		} else {
			placement = '';
		}
	}

	onMount(() => {
		updatePlacement();
		const observer = new MutationObserver(schedulePlacement);
		observer.observe(document.body, { childList: true, subtree: true });
		window.addEventListener('resize', schedulePlacement);
		window.addEventListener('scroll', schedulePlacement, true);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', schedulePlacement);
			window.removeEventListener('scroll', schedulePlacement, true);
		};
	});
</script>

<div class="notification-container" style={placement} bind:this={container}>
	{#each notificationList as notification (notification.id)}
		{#if notification.type === 'error'}
			<ErrorNotification
				{notification}
				onDismiss={() => notifications.dismiss(notification.id)}
				onRetry={notifications.getRetryCallback(notification.id)}
			/>
		{:else if notification.type === 'success'}
			<div class="success-notification" role="alert">
				<div class="notification-icon" aria-hidden="true"><CircleCheck size={22} /></div>
				<div class="notification-content">
					<div class="notification-title">{notification.title}</div>
					{#if notification.secondaryMessage && notification.secondaryMessage !== notification.message}
						<div class="notification-secondary">{notification.secondaryMessage}</div>
					{:else}
						<div class="notification-message">{notification.message}</div>
					{/if}
				</div>
				<button
					class="close-button"
					onclick={() => notifications.dismiss(notification.id)}
					aria-label="Close notification"
				>
					×
				</button>
			</div>
		{:else if notification.type === 'info'}
			<div class="info-notification" role="status">
				<div class="notification-icon" aria-hidden="true"><Info size={22} /></div>
				<div class="notification-content">
					<div class="notification-title">{notification.title}</div>
					<div class="notification-message">{notification.message}</div>
				</div>
				<button
					class="close-button"
					onclick={() => notifications.dismiss(notification.id)}
					aria-label="Close notification"
				>
					×
				</button>
			</div>
		{/if}
	{/each}
</div>

<style>
	.notification-container {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 12px;
		pointer-events: none;
	}

	/* Desktop: start below the 80px app header so its controls stay reachable. */
	@media (min-width: 1024px) {
		.notification-container {
			top: 96px;
		}
	}

	.notification-container > :global(*) {
		pointer-events: auto;
	}

	.success-notification,
	.info-notification {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		max-width: 450px;
		width: 100%;
		box-sizing: border-box;
		padding-right: 52px;
		position: relative;
		animation: slideIn 0.3s ease-out;
	}

	/* Palette tokens from app.css, so both themes follow (V0e section 3). */
	.success-notification {
		--status: var(--color-success);
	}

	.info-notification {
		--status: var(--color-info);
	}

	.success-notification,
	.info-notification {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--status) 8%, var(--color-card)) 0%,
			var(--color-card) 100%
		);
		border: 1px solid var(--color-border);
		border-left: 4px solid var(--status);
	}

	.notification-icon {
		flex-shrink: 0;
		display: flex;
		color: var(--status);
		padding-top: 1px;
	}

	.notification-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.notification-title {
		font-weight: 600;
		color: var(--color-foreground);
		font-size: 15px;
	}

	.notification-message {
		color: var(--color-muted-foreground);
		font-size: 14px;
		line-height: 1.5;
	}

	.notification-secondary {
		color: var(--color-success);
		font-size: 13px;
		line-height: 1.4;
		font-weight: 500;
		margin-top: 2px;
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

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Responsive */
	@media (max-width: 640px) {
		.notification-container {
			top: 10px;
			right: 10px;
			left: 10px;
		}

		.success-notification,
		.info-notification {
			max-width: 100%;
		}
	}
</style>
