import { writable, get } from 'svelte/store';
import { aiConciergeService } from '../services/aiConciergeService';
import { overwhelmDetector } from '../services/overwhelmDetection';
import { activeAccountId } from './keyringStore';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { navGroups } from '../config/navigation';

const PIVOT_GREETINGS: Record<string, string> = {
    'Real Estate': "We've moved to your properties. Taking care of your home—the place where so many memories are made—is a beautiful way to protect your legacy. Where shall we start?",
    'Financial Accounts': "Securing your financial resources is a vital act of protection for those you love. Which account shall we document first to ensure they're provided for?",
    'Document Vault': "Your digital life is part of your story. Let's make sure your family has the keys they'll need. Do you have a password manager we should record the location of?",
    'Health & Medical': "These decisions are about your dignity and care. It takes courage to think through these. Have you designated a healthcare proxy yet?",
    'Family & Contacts': "Legacy is, above all, about the people we love. Who is the first person you'd like to include in your circle of trust?",
    'Legacy Letters': "Your voice is a gift that will last forever. These letters will mean so much. Who would you like to speak to first?",
    'Life Timeline': "Every life is a profound story. Which milestone should we honor first on your timeline?",
    'Insurance Portfolio': "Insurance is a safety net you've built for your family's future. Do you have any active policies we should record to ensure they're never lost?",
    'Digital Guardian': "The Pulse system is like a steady hand, making sure you're okay. Who would you trust most to respond if you're ever unable to check in?",
    'Heirloom Registry': "Objects carry the stories of our lives. What's a cherished heirloom you'd like to protect today?",
    'Legal Documents': "Legal foundations bring such peace of mind to a family. Do you have a copy of your Will or Trust ready to secure here?"
};

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    isDictated?: boolean;
    resources?: Array<{
        title: string;
        description: string;
        link: string;
        type: 'article' | 'video' | 'tool';
    }>;
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
    isPoppedOut: boolean;
    floatingPosition: { x: number; y: number } | null;
    floatingSize: { width: number; height: number } | null;
    popOutMode: 'pip' | 'floating' | null;
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

    const updateInitialGreeting = () => {
        const state = get({ subscribe });
        if (state.messages.length > 0) return;

        const contextName = state.currentContextName || 'Continuum Dashboard';
        const isHome = contextName === 'Continuum Dashboard' || contextName === 'Marketing' || contextName === 'Continuum';

        // Proactive Contextual Greetings
        const contextGreetings: Record<string, string> = {
            'Real Estate': "I'm here to help you catalog your assets. Your home is the foundation of so much family history—where shall we begin?",
            'Financial Accounts': "Let's secure your financial legacy. Thinking ahead about these resources is such a kind thing to do for your family. Which account is most important to record first?",
            'Document Vault': "Your digital legacy is vital. Let's ensure your loved ones aren't locked out of the accounts that matter. Do you have a list of priority digital accounts to secure?",
            'Health & Medical': "Medical clarity ensures your wishes are honored with dignity. Have you designated a healthcare proxy or created a living will yet?",
            'Family & Contacts': "Legacy is all about the people you care for. Who is the first person you'd like to include in your circle of trust?",
            'Legacy Letters': "Your voice is a treasure for those you leave behind. Who would you like to write your first legacy letter to?",
            'Life Timeline': "Your life is a story worth telling. What is a major life milestone we should honor first on your timeline?",
            'Insurance Portfolio': "Protection brings peace of mind. Do you have any active life or property insurance policies we should track to make sure your family is secure?",
            'Digital Guardian': "The Pulse system is here to watch over you. Who should be your primary responder, the person you trust most to check in if we don't hear from you?",
            'Heirloom Registry': "Every object has a story and a connection. What's a meaningful heirloom you'd like to register today?",
            'Legal Documents': "Building a solid legal foundation is an act of great care. Do you have a copy of your Will or Trust ready to upload?"
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
    };

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

            updateInitialGreeting();
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

            const state = get({ subscribe });
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
                }
            } else if (state.isOpen && state.messages.length === 0) {
                updateInitialGreeting();
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
                const state = get({ subscribe });
                const response = await aiConciergeService.chat(content, state.messages, state.currentContextName);

                // Parse response if it's JSON
                let displayContent = response.content;
                let extractedDataFromResponse: any | null = response.extractedData || null;
                let resources: any[] = []; // Declare output variable here

                if (response.content.includes('{') && (response.content.includes('message') || response.content.includes('extractedData'))) {
                    try {
                        // Strip markdown code blocks if present
                        const cleanJson = response.content.replace(/```json|```/g, '').trim();
                        const parsed = JSON.parse(cleanJson);
                        displayContent = parsed.message || displayContent;

                        if (parsed.extractedData) {
                            extractedDataFromResponse = parsed.extractedData;
                        }

                        if (parsed.resources) {
                            resources = parsed.resources;
                        }

                        // Contextual Navigation & Actions
                        if (browser && parsed.intent) {
                            if (parsed.intent === 'suggest_break') {
                                console.log(`[Concierge] Triggering break suggestion based on intent`);
                                overwhelmDetector.triggerOverwhelm(['AI_SUGGESTION'], 'The AI guide suggested a pause.');
                            } else {
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
                        }
                    } catch (e) {
                        console.error("Failed to parse AI JSON response:", e);
                    }
                } else if (response.resources) {
                    // Handle case where resources come directly from response object not in JSON content string
                    resources = response.resources;
                }

                const assistantMsg: Message = {
                    id: Math.random().toString(36).substring(7),
                    role: 'assistant',
                    content: displayContent,
                    timestamp: new Date().getTime(),
                    resources: resources.length > 0 ? resources : undefined
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
            const data = get({ subscribe }).lastExtractedData;
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
            updateInitialGreeting();
        },

        updateInitialGreeting
    };
}

export const conciergeEngine = createConciergeEngine();
