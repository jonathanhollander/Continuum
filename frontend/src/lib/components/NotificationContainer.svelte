<script lang="ts">
	import { notifications } from '$lib/stores/notificationStore';
	import ErrorNotification from './ErrorNotification.svelte';

	let notificationList = $derived($notifications);
</script>

<div class="notification-container">
	{#each notificationList as notification (notification.id)}
		{#if notification.type === 'error'}
			<ErrorNotification
				{notification}
				onDismiss={() => notifications.dismiss(notification.id)}
				onRetry={notifications.getRetryCallback(notification.id)}
			/>
		{:else if notification.type === 'success'}
			<div class="success-notification" role="alert">
				<div class="notification-icon">✅</div>
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
		{:else if notification.type === 'info'}
			<div class="info-notification" role="status">
				<div class="notification-icon">ℹ️</div>
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
		position: relative;
		animation: slideIn 0.3s ease-out;
	}

	.success-notification {
		background: linear-gradient(135deg, #f0fff4 0%, #ffffff 100%);
		border-left: 4px solid #48bb78;
	}

	.info-notification {
		background: linear-gradient(135deg, #ebf8ff 0%, #ffffff 100%);
		border-left: 4px solid #4299e1;
	}

	.notification-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.notification-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.notification-title {
		font-weight: 600;
		color: #2d3748;
		font-size: 15px;
	}

	.notification-message {
		color: #4a5568;
		font-size: 14px;
		line-height: 1.5;
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
