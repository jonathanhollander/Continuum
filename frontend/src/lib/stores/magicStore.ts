import { writable } from 'svelte/store';

export const magicTrigger = writable<{ type: 'success' | 'sparkle' | 'confetti', timestamp: number } | null>(null);

export function triggerMagic(type: 'success' | 'sparkle' | 'confetti' = 'success') {
    magicTrigger.set({ type, timestamp: Date.now() });
    setTimeout(() => magicTrigger.set(null), 2000);
}
