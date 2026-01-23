/**
 * Global notification store for error and success messages.
 */
import { writable } from 'svelte/store';
import type { ErrorNotification } from '$lib/services/errorHandler';
import { createErrorNotification, type ErrorDetails } from '$lib/services/errorHandler';
import { getRandomAffirmation, type Affirmation } from '$lib/data/affirmations';

export interface Notification extends ErrorNotification {
	type: 'error' | 'success' | 'info';
	/** Optional secondary message for affirmations */
	secondaryMessage?: string;
}

function createNotificationStore() {
	const { subscribe, update } = writable<Notification[]>([]);

	const dismiss = (id: string) => {
		update((notifications) => notifications.filter((n) => n.id !== id));
		retryCallbacks.delete(id);
	};

	const dismissAll = () => {
		update(() => []);
		retryCallbacks.clear();
	};

	return {
		subscribe,

		/**
		 * Show an error notification.
		 */
		showError(error: ErrorDetails | Error | string, retryFn?: () => void) {
			let errorObj: ErrorDetails;

			if (typeof error === 'string') {
				errorObj = { message: error };
			} else if (error instanceof Error) {
				errorObj = {
					message: error.message,
					code: (error as any).code
				};
			} else {
				errorObj = error;
			}

			const errorNotification = createErrorNotification(errorObj);
			const notification: Notification = {
				...errorNotification,
				type: 'error'
			};

			update((notifications) => [...notifications, notification]);

			// Store retry function if provided
			if (retryFn) {
				// Wrap retry function to dismiss notification automatically
				const wrappedRetry = () => {
					dismiss(notification.id);
					retryFn();
				};
				retryCallbacks.set(notification.id, wrappedRetry);
			}

			return notification.id;
		},

		/**
		 * Show a success notification.
		 */
		showSuccess(message: string, title: string = 'Success') {
			const notification: Notification = {
				id: `success-${Date.now()}-${Math.random()}`,
				title,
				message,
				type: 'success',
				canRetry: false,
				timestamp: new Date()
			};

			update((notifications) => [...notifications, notification]);

			// Auto-dismiss success after 5 seconds
			setTimeout(() => {
				dismiss(notification.id);
			}, 5000);

			return notification.id;
		},

		/**
		 * Show an affirmation-based success notification.
		 * Uses the affirmations library for meaningful, context-aware messages.
		 */
		showAffirmation(
			module: 'general' | 'documents' | 'wishes' | 'contacts' | 'medical' | 'pets' | 'insurance' | 'funeral' | 'subscriptions' | 'heirlooms' | 'timeline' | 'letters' | 'timeCapsule' | 'pulse' = 'general'
		) {
			const affirmation = getRandomAffirmation(module);

			const notification: Notification = {
				id: `affirmation-${Date.now()}-${Math.random()}`,
				title: affirmation.primary,
				message: affirmation.secondary,
				secondaryMessage: affirmation.secondary,
				type: 'success',
				canRetry: false,
				timestamp: new Date()
			};

			update((notifications) => [...notifications, notification]);

			// Auto-dismiss after 7 seconds (longer for affirmations to be read)
			setTimeout(() => {
				dismiss(notification.id);
			}, 7000);

			return notification.id;
		},

		/**
		 * Show an info notification.
		 */
		showInfo(message: string, title: string = 'Info') {
			const notification: Notification = {
				id: `info-${Date.now()}-${Math.random()}`,
				title,
				message,
				type: 'info',
				canRetry: false,
				timestamp: new Date()
			};

			update((notifications) => [...notifications, notification]);

			// Auto-dismiss info after 7 seconds
			setTimeout(() => {
				dismiss(notification.id);
			}, 7000);

			return notification.id;
		},

		/**
		 * Dismiss a notification.
		 */
		dismiss,

		/**
		 * Dismiss all notifications.
		 */
		dismissAll,

		/**
		 * Get retry callback for a notification.
		 */
		getRetryCallback(id: string): (() => void) | undefined {
			return retryCallbacks.get(id);
		}
	};
}

// Store retry callbacks separately
const retryCallbacks = new Map<string, () => void>();

export const notifications = createNotificationStore();
