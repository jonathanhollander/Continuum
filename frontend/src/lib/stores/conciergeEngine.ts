import { writable, get } from 'svelte/store';
import { aiConciergeService } from '../services/aiConciergeService';
import { activeAccountId } from './keyringStore';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { navGroups } from '../config/navigation';

const PIVOT_GREETINGS: Record<string, string> = {
    'Real Estate': "I see we're looking at your properties. Do you own any acreage or vehicles we should document first?",
    'Financial Accounts': "Securing these accounts is vital. Which bank holds your primary checking or savings?",
    'Document Vault': "Let's secure your digital life. Do you have a password manager we should record the location of?",
    'Health & Medical': "Medical clarity is essential. Have you designated a healthcare proxy yet?",
    'Family & Contacts': "Legacy is about people. Who is the first person you'd like to include in your circle of trust?",
    'Legacy Letters': "Your voice matters. Who would you like to write your first legacy letter to?",
    'Life Timeline': "What is a major life milestone we should record on your timeline?",
    'Insurance Portfolio': "Protection is key. Do you have any active life or property insurance policies?",
    'Digital Guardian': "The Pulse system ensures you're okay. Who should be your primary responder if you don't check in?",
    'Heirloom Registry': "What's a valuable heirloom you'd like to register today?",
    'Legal Documents': "Legal foundations are critical. Do you have a copy of your Will or Trust ready?"
};

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
    hasInteracted: boolean;
    hasPendingContextSwitch: boolean;
    isPoppedOut: boolean;
    floatingPosition: { x: number; y: number } | null;
    floatingSize: { width: number; height: number } | null;
}

function createConciergeEngine() {
    const initialState: ConciergeState = {
        isOpen: false,
        messages: [],
        isThinking: false,
        isListening: false,
        isSpeaking: false,
        lastExtractedData: null,
        currentRoute: '',
        currentContextName: 'Continuum Dashboard',
        hasInteracted: false,
        hasPendingContextSwitch: false,
        isPoppedOut: false,
        popOutMode: null,
        floatingPosition: { x: 50, y: 50 }, // Default top-right-ish
        floatingSize: { width: 340, height: 580 }
    };

    // Load from localStorage if browser
    let savedState = initialState;
    if (browser) {
        const saved = localStorage.getItem('continuum_concierge_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                savedState = {
                    ...initialState,
                    ...parsed,
                    isOpen: false,
                    isPoppedOut: false,
                    popOutMode: null
                };
            } catch (e) {
                console.error("Failed to load concierge state:", e);
            }
        }
    }

    const { subscribe, set, update } = writable<ConciergeState>(savedState);

    let syncChannel: BroadcastChannel | null = null;

    const broadcastState = (state: ConciergeState) => {
        if (browser) {
            localStorage.setItem('continuum_concierge_state', JSON.stringify(state));
        }
        if (syncChannel) {
            syncChannel.postMessage({ type: 'STATE_UPDATE', state });
        }
    };

    if (browser) {
        syncChannel = new BroadcastChannel('continuum-concierge');
        syncChannel.onmessage = (event) => {
            const { type, state: remoteState } = event.data;
            if (type === 'STATE_UPDATE') {
                update(s => {
                    const newState = { ...s, ...remoteState };
                    // Persist locally too
                    localStorage.setItem('continuum_concierge_state', JSON.stringify(newState));
                    return newState;
                });
            } else if (type === 'POPUP_CLOSED') {
                update(s => {
                    const newState = { ...s, isPoppedOut: false, isOpen: true };
                    broadcastState(newState);
                    return newState;
                });
            }
        };
    }

    return {
        subscribe,
        toggle: () => update(s => {
            const newState = { ...s, isOpen: !s.isOpen };
            broadcastState(newState);
            return newState;
        }),
        open: () => {
            update(s => {
                const newState = { ...s, isOpen: true };
                broadcastState(newState);
                return newState;
            });

            // Check for pending context switch (Delayed Pivot)
            const state = get(conciergeEngine);
            if (state.hasPendingContextSwitch) {
                const contextName = state.currentContextName;
                const leadQuestion = PIVOT_GREETINGS[contextName] || `Shall we start securing the details for ${contextName}?`;
                const pivotMsg = `We've moved into ${contextName}. ${leadQuestion}`;

                const assistantMsg: Message = {
                    id: Math.random().toString(36).substring(7),
                    role: 'assistant',
                    content: pivotMsg,
                    timestamp: Date.now()
                };

                update(s => ({
                    ...s,
                    messages: [...s.messages, assistantMsg],
                    hasPendingContextSwitch: false
                }));
            } else {
                conciergeEngine.updateInitialGreeting();
            }
        },
        close: () => {
            update(s => {
                const newState = { ...s, isOpen: false };
                broadcastState(newState);
                return newState;
            });
        },

        popOut: async () => {
            if (!browser) return;

            // Check Capability for Option B (Document PiP)
            // @ts-ignore - Document PiP is a new API
            const hasPiP = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

            update(s => {
                const newState = {
                    ...s,
                    isPoppedOut: true,
                    popOutMode: hasPiP ? 'pip' : 'floating',
                    isOpen: true
                };
                broadcastState(newState);
                return newState;
            });
        },

        setFloatingPosition: (pos: { x: number; y: number }) => {
            update(s => {
                const newState = { ...s, floatingPosition: pos };
                broadcastState(newState);
                return newState;
            });
        },

        setFloatingSize: (size: { width: number; height: number }) => {
            update(s => {
                const newState = { ...s, floatingSize: size };
                broadcastState(newState);
                return newState;
            });
        },

        popIn: () => {
            update(s => {
                const newState = { ...s, isPoppedOut: false, popOutMode: null, isOpen: true };
                broadcastState(newState);
                return newState;
            });
        },

        setListening: (val: boolean) => update(s => ({ ...s, isListening: val })),
        setSpeaking: (val: boolean) => update(s => ({ ...s, isSpeaking: val })),

        setContext: (route: string) => {
            const allItems = navGroups.flatMap(g => g.items);
            const item = allItems.find(i => i.href === route);
            const contextName = item ? item.label : (route === '/' ? 'Marketing' : (route.startsWith('/modules') ? route.split('/').pop()?.replace('-', ' ') : 'Continuum'));

            const state = get(conciergeEngine);
            const oldContext = state.currentContextName;

            update(s => {
                const newState = {
                    ...s,
                    currentRoute: route,
                    currentContextName: contextName
                };
                broadcastState(newState);
                return newState;
            });

            // Proactive Pivot: If panel is open and context changes, interject
            if (oldContext !== contextName && state.messages.length >= 1) {
                if (state.isOpen) {
                    const leadQuestion = PIVOT_GREETINGS[contextName] || `Shall we start securing the details for ${contextName}?`;
                    const pivotMsg = `We've moved into ${contextName}. ${leadQuestion}`;

                    const assistantMsg: Message = {
                        id: Math.random().toString(36).substring(7),
                        role: 'assistant',
                        content: pivotMsg,
                        timestamp: Date.now()
                    };
                    update(s => ({ ...s, messages: [...s.messages, assistantMsg] }));
                } else {
                    // Panel is closed, mark for pending pivot on next open
                    update(s => ({ ...s, hasPendingContextSwitch: true }));
                }
            } else if (state.isOpen && state.messages.length === 0) {
                conciergeEngine.updateInitialGreeting();
            }
        },

        sendMessage: async (content: string, isDictated: boolean = false) => {
            const userMsg: Message = {
                id: Math.random().toString(36).substring(7),
                role: 'user',
                content,
                timestamp: Date.now(),
                isDictated
            };

            update(s => {
                const newState = {
                    ...s,
                    messages: [...s.messages, userMsg],
                    isThinking: true,
                    hasInteracted: true
                };
                broadcastState(newState);
                return newState;
            });

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
                                'add_contact': '/modules/contacts',
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

                update(s => {
                    const newState = {
                        ...s,
                        messages: [...s.messages, assistantMsg],
                        isThinking: false,
                        lastExtractedData: extractedDataFromResponse
                    };
                    broadcastState(newState);
                    return newState;
                });

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

            import('./persistence').then(({ setStored }) => {
                Object.entries(data).forEach(([key, value]) => {
                    setStored(key, value);
                });
            });

            update(s => ({ ...s, lastExtractedData: null }));
        },

        clearHistory: () => {
            update(s => ({ ...s, messages: [], lastExtractedData: null }));
            conciergeEngine.updateInitialGreeting();
        },

        updateInitialGreeting: () => {
            const state = get(conciergeEngine);
            if (state.messages.length > 0) return;

            const contextName = state.currentContextName || 'Continuum Dashboard';
            const isHome = contextName === 'Continuum Dashboard' || contextName === 'Marketing' || contextName === 'Continuum';

            // Proactive Contextual Greetings
            const contextGreetings: Record<string, string> = {
                'Real Estate': "I'm ready to catalog your assets. Do you own any properties or vehicles we should document first?",
                'Financial Accounts': "Let's secure your financial legacy. Which bank or financial institution holds your primary accounts?",
                'Document Vault': "Your digital legacy is vital. Do you have a password manager or a list of priority digital accounts to secure?",
                'Health & Medical': "Medical clarity is essential. Have you designated a healthcare proxy or created a living will yet?",
                'Family & Contacts': "Legacy is about people. Who is the first person you'd like to include in your circle of trust?",
                'Legacy Letters': "Your voice matters. Who would you like to write your first legacy letter to?",
                'Life Timeline': "Every life is a story. What is a major life milestone we should record on your timeline?",
                'Insurance Portfolio': "Protection is key. Do you have any active life or property insurance policies we should track?",
                'Digital Guardian': "The Pulse system ensures you're okay. Who should be your primary responder if you don't check in?",
                'Heirloom Registry': "Every object has a story. What's a valuable heirloom you'd like to register today?",
                'Legal Documents': "Legal foundations are critical. Do you have a copy of your Will or Trust ready to upload?"
            };

            let prefix = "";
            if (!state.hasInteracted) {
                prefix = "Welcome to Continuum. I'm here to help you secure your legacy. ";
            } else {
                prefix = "Ready to continue. ";
            }

            const greetingBody = contextGreetings[contextName] ||
                (isHome ? "To begin, we need to secure your legacy by identifying your circle of trust. Who is your primary emergency contact?" : `What's the first detail we should record here in ${contextName}?`);

            const newGreeting = `${prefix}${greetingBody}`;

            update(s => ({
                ...s,
                messages: [{
                    id: '1',
                    role: 'assistant',
                    content: newGreeting,
                    timestamp: Date.now()
                }],
                // Mark as interacted once they've seen the first greeting
                hasInteracted: true
            }));
        }
    };
}

export const conciergeEngine = createConciergeEngine();
