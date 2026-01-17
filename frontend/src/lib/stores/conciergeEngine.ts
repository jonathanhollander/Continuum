import { writable, get } from 'svelte/store';
import { aiConciergeService } from '../services/aiConciergeService';
import { activeAccountId } from './keyringStore';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { navGroups } from '../config/navigation';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    isDictated?: boolean;
}

interface ConciergeState {
    isOpen: boolean;
    messages: Message[];
    isThinking: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    lastExtractedData: any | null;
    currentRoute: string;
    currentContextName: string;
}

function createConciergeEngine() {
    const { subscribe, set, update } = writable<ConciergeState>({
        isOpen: false,
        messages: [{
            id: '1',
            role: 'assistant',
            content: "Welcome to Continuum. I am your AI Concierge, here to help. You can provide your data through conversation using text or speech. We will start by listing your family and emergency contacts. What is the full name of your primary contact?",
            timestamp: Date.now()
        }],
        isThinking: false,
        isListening: false,
        isSpeaking: false,
        lastExtractedData: null,
        currentRoute: '',
        currentContextName: 'Continuum Dashboard'
    });

    return {
        subscribe,
        toggle: () => update(s => ({ ...s, isOpen: !s.isOpen })),
        open: () => {
            update(s => ({ ...s, isOpen: true }));
            conciergeEngine.updateInitialGreeting();
        },
        close: () => update(s => ({ ...s, isOpen: false })),

        setListening: (val: boolean) => update(s => ({ ...s, isListening: val })),
        setSpeaking: (val: boolean) => update(s => ({ ...s, isSpeaking: val })),

        setContext: (route: string) => {
            const allItems = navGroups.flatMap(g => g.items);
            const item = allItems.find(i => i.href === route);
            const contextName = item ? item.label : (route === '/' ? 'Marketing' : 'Continuum');

            update(s => ({
                ...s,
                currentRoute: route,
                currentContextName: contextName
            }));
        },

        sendMessage: async (content: string, isDictated: boolean = false) => {
            const userMsg: Message = {
                id: Math.random().toString(36).substring(7),
                role: 'user',
                content,
                timestamp: Date.now(),
                isDictated
            };

            update(s => ({ ...s, messages: [...s.messages, userMsg], isThinking: true }));

            try {
                const state = get(conciergeEngine);
                const response = await aiConciergeService.chat(content, state.messages, state.currentContextName);

                // Parse response if it's JSON
                let displayContent = response.content;
                let extractedDataFromResponse: any | null = response.extractedData || null;

                if (response.content.includes('{') && (response.content.includes('message') || response.content.includes('extractedData'))) {
                    try {
                        // Strip markdown code blocks if present
                        const cleanJson = response.content.replace(/```json|```/g, '').trim();
                        const parsed = JSON.parse(cleanJson);
                        displayContent = parsed.message || displayContent;

                        if (parsed.extractedData) {
                            extractedDataFromResponse = parsed.extractedData;
                        }

                        // Contextual Navigation
                        if (browser && parsed.intent) {
                            const intentMap: Record<string, string> = {
                                'add_family': '/modules/contacts',
                                'add_property': '/modules/property',
                                'add_financial': '/modules/financial-accounts',
                                'add_insurance': '/modules/insurance',
                                'add_healthcare': '/modules/medical',
                                'add_digital': '/modules/digital-guardian'
                            };

                            const targetRoute = intentMap[parsed.intent];
                            if (targetRoute && window.location.pathname !== targetRoute) {
                                console.log(`[Concierge] Navigating to ${targetRoute} based on intent: ${parsed.intent}`);
                                goto(targetRoute);
                            }
                        }
                    } catch (e) {
                        console.error("Failed to parse AI JSON response:", e);
                    }
                }

                const assistantMsg: Message = {
                    id: Math.random().toString(36).substring(7),
                    role: 'assistant',
                    content: displayContent,
                    timestamp: new Date().getTime()
                };

                update(s => ({
                    ...s,
                    messages: [...s.messages, assistantMsg],
                    isThinking: false,
                    lastExtractedData: extractedDataFromResponse
                }));

                return response;
            } catch (error) {
                console.error('Concierge Error:', error);
                update(s => ({ ...s, isThinking: false }));
                return null;
            }
        },

        confirmExtractedData: () => {
            const data = get(conciergeEngine).lastExtractedData;
            if (!data) return;

            console.log('[Concierge] Committing data to profile:', data);

            // In a real implementation, we would route these to propertyStore, estateStore, etc.
            // For now, we update the profile context which is used globally.
            import('./persistence').then(({ setStored }) => {
                Object.entries(data).forEach(([key, value]) => {
                    setStored(key, value);
                });
            });

            update(s => ({ ...s, lastExtractedData: null }));
        },

        clearHistory: () => {
            update(s => ({ ...s, messages: [], lastExtractedData: null }));
        },

        updateInitialGreeting: () => {
            const state = get(conciergeEngine);
            if (state.messages.length <= 1) {
                const contextName = state.currentContextName || 'Continuum Dashboard';
                const newGreeting = `Welcome to Continuum. I am your AI Concierge, focusing on "${contextName}". I'm here to help secure your legacy. Where shall we begin?`;

                update(s => ({
                    ...s,
                    messages: [{
                        id: '1',
                        role: 'assistant',
                        content: newGreeting,
                        timestamp: Date.now()
                    }]
                }));
            }
        }
    };
}

export const conciergeEngine = createConciergeEngine();
