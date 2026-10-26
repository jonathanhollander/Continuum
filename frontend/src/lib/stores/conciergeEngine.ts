import { writable, get } from 'svelte/store';
import { aiConciergeService } from '../services/aiConciergeService';
import { overwhelmDetector } from '../services/overwhelmDetection';
import { auth } from './auth';
import { captureSession, isCurrentSession, type SessionOwnership } from '../services/sessionOwnership';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { navGroups } from '../config/navigation';

// Keyed by the navigation label (navigation.ts), which setContext uses as the context name.
const PIVOT_GREETINGS: Record<string, string> = {
    'Property & Real Estate': "We've moved to your properties. Taking care of your home—the place where so many memories are made—is a beautiful way to protect your legacy. Where shall we start?",
    'Financial Accounts': "Securing your financial resources is a vital act of protection for those you love. Which account shall we document first to ensure they're provided for?",
    'Document Vault': "Legal foundations bring such peace of mind to a family. Do you have a copy of your Will or Trust ready to secure here?",
    'Health & Medical': "These decisions are about your dignity and care. It takes courage to think through these. Have you designated a healthcare proxy?",
    'Family & Contacts': "Legacy is, above all, about the people we love. Who is the first person you'd like to include in your circle of trust?",
    'Legacy Correspondence': "Your voice is a gift that will last forever. These letters will mean so much. Who would you like to speak to first?",
    'The Life Timeline': "Every life is a profound story. Which milestone should we honor first on your timeline?",
    'Insurance Portfolio': "Insurance is a safety net you've built for your family's future. Do you have any active policies we should record so they're always easy to find?",
    'Digital Guardian': "Your digital life is part of your story. Let's make sure your family has the keys they'll need. Do you have a password manager we should record the location of?",
    'Wellness Check-in': "The Pulse system is like a steady hand, making sure you're okay. Who would you trust most to respond first when a check-in needs attention?",
    'Heirlooms & Treasures': "Objects carry the stories of our lives. What's a cherished heirloom you'd like to protect today?"
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
    accountId: number | null;
    accountEpoch: number;
    composerDraft: string;
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
    floatingPositionV?: number;
    floatingSize: { width: number; height: number } | null;
    popOutMode: 'pip' | 'floating' | null;
}

function createConciergeEngine() {
    const initialState: ConciergeState = {
        accountId: null,
        accountEpoch: 0,
        composerDraft: "",
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
        floatingPosition: null, // null = default spot, chosen by ConciergePanel
        floatingPositionV: 2,
        floatingSize: { width: 340, height: 580 }
    };

    const { subscribe, set, update: updateStore } = writable<ConciergeState>({ ...initialState });
    let accountId: number | null = null;
    let accountSession: SessionOwnership | null = null;
    let accountEpoch = 0;
    let conversationEpoch = 0;
    let syncChannel: BroadcastChannel | null = null;
    const stateKey = (id: number) => `continuum_concierge_state:user:${id}`;

    // The old unscoped key has no owner metadata. Keep it on disk, but never assign its
    // conversation to whichever person happens to sign in next.
    const loadState = (id: number): ConciergeState => {
        try {
            const saved = localStorage.getItem(stateKey(id));
            const parsed = saved ? JSON.parse(saved) : {};
            const p = parsed?.floatingPosition;
            const legacyDefault = parsed?.floatingPositionV !== 2 && p?.x === 50 && p?.y === 50;
            return {
                ...initialState,
                ...parsed,
                accountId: id,
                accountEpoch,
                messages: Array.isArray(parsed?.messages) ? parsed.messages : [],
                composerDraft: typeof parsed?.composerDraft === "string" ? parsed.composerDraft : "",
                floatingPosition: legacyDefault ? null : (parsed?.floatingPosition ?? null),
                floatingPositionV: 2,
                isOpen: false,
                isThinking: false,
                isListening: false,
                isSpeaking: false,
                isPoppedOut: false,
                popOutMode: null
            };
        } catch (e) {
            console.error("Failed to load concierge state:", e);
            return { ...initialState, accountId: id, accountEpoch };
        }
    };

    const persistState = (state: ConciergeState) => {
        if (!browser || accountId === null || state.accountId !== accountId
            || !accountSession || !isCurrentSession(accountSession)) return;
        try {
            localStorage.setItem(stateKey(accountId), JSON.stringify(state));
        } catch (e) {
            console.error("Failed to keep concierge state on this device:", e);
        }
    };

    // Every local change is kept for its authenticated owner. Replies and unconfirmed
    // extracted details therefore survive a reload just like the account's own thread.
    const update = (change: (state: ConciergeState) => ConciergeState) => updateStore(state => {
        if (accountId !== null && (!accountSession || !isCurrentSession(accountSession))) return state;
        const next = change(state);
        persistState(next);
        syncChannel?.postMessage({ type: 'STATE_UPDATE', accountId, state: next });
        return next;
    });

    const followAccount = (session: { isAuthenticated: boolean; user: { id: number } | null }) => {
        const owner = captureSession();
        const nextId = owner.ready && session.isAuthenticated && session.user ? session.user.id : null;
        if (nextId === accountId && (nextId === null || owner.generation === accountSession?.generation)) return;
        persistState(get({ subscribe }));
        accountEpoch++;
        conversationEpoch++;
        syncChannel?.close();
        syncChannel = null;
        accountId = nextId;
        accountSession = nextId === null ? null : owner;
        set(nextId === null ? { ...initialState, accountEpoch } : loadState(nextId));
        if (nextId === null) return;

        const channel = new BroadcastChannel(`continuum-concierge:user:${nextId}`);
        const epoch = accountEpoch;
        syncChannel = channel;
        channel.onmessage = event => {
            if (epoch !== accountEpoch || channel !== syncChannel || event.data?.accountId !== accountId
                || !accountSession || !isCurrentSession(accountSession)) return;
            const { type, state: remoteState } = event.data;
            if (type === 'STATE_UPDATE' && remoteState?.accountId === accountId) {
                updateStore(state => {
                    const next = { ...state, ...remoteState, accountId, accountEpoch };
                    persistState(next);
                    return next;
                });
            } else if (type === 'POPUP_CLOSED') {
                update(state => ({ ...state, isPoppedOut: false, isOpen: true }));
            }
        };
    };
    if (browser) {
        auth.subscribe(followAccount);
        window.addEventListener('storage', event => {
            if (event.key === 'continuum_auth_token' || event.key === null) followAccount(get(auth));
        });
    }

    const updateInitialGreeting = () => {
        const state = get({ subscribe });
        if (state.messages.length > 0) return;

        const contextName = state.currentContextName || 'Continuum Dashboard';
        const isHome = contextName === 'Continuum Dashboard' || contextName === 'Marketing' || contextName === 'Continuum';

        // Proactive Contextual Greetings
        const contextGreetings: Record<string, string> = {
            'Property & Real Estate': "I'm here to help you catalog your assets. Your home is the foundation of so much family history—where shall we begin?",
            'Financial Accounts': "Thinking ahead about these resources is such a kind thing to do for your family. Which account is most important to record first?",
            'Document Vault': "Building a solid legal foundation is an act of great care. Do you have a copy of your Will or Trust ready to upload?",
            'Health & Medical': "With medical clarity, doctors and family know what you would want. Have you designated a healthcare proxy or created a living will?",
            'Family & Contacts': "Legacy is all about the people you care for. Who is the first person you'd like to include in your circle of trust?",
            'Legacy Correspondence': "Your voice is a treasure for those you leave behind. Who would you like to write your first legacy letter to?",
            'The Life Timeline': "Your life is a story worth telling. What is a major life milestone we should honor first on your timeline?",
            'Insurance Portfolio': "Protection brings peace of mind. Do you have any active life or property insurance policies we should track to make sure your family is secure?",
            'Digital Guardian': "Your digital legacy is vital. Let's make sure your loved ones can reach the accounts that matter. Do you have a list of priority digital accounts to secure?",
            'Wellness Check-in': "The Pulse system is here to watch over you. Who should be your primary responder, the person you trust most to check in on you?",
            'Heirlooms & Treasures': "Every object has a story and a connection. What's a meaningful heirloom you'd like to register today?"
        };

        let prefix = "";
        if (!state.hasInteracted) {
            prefix = "Welcome to Continuum. I'm here to help you put your plan together. ";
        } else {
            prefix = "Ready to continue. ";
        }

        const greetingBody = contextGreetings[contextName] ||
            (isHome ? "To begin, let's gather your circle of trust. Who is your primary emergency contact?" : `What's the first detail we should record here in ${contextName}?`);

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
        setComposerDraft: (composerDraft: string) => update(state => ({ ...state, composerDraft })),
        toggle: () => update(s => {
            const newState = { ...s, isOpen: !s.isOpen };
            return newState;
        }),
        open: () => {
            update(s => {
                const newState = { ...s, isOpen: true };
                return newState;
            });

            // Check for pending context switch (Delayed Pivot)
            const state = get({ subscribe });
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
                updateInitialGreeting();
            }
        },
        close: () => {
            update(s => {
                const newState = { ...s, isOpen: false };
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
                    popOutMode: hasPiP ? ('pip' as const) : ('floating' as const),
                    isOpen: true
                };
                return newState;
            });
        },

        setFloatingPosition: (pos: { x: number; y: number }) => {
            update(s => {
                const newState = { ...s, floatingPosition: pos };
                return newState;
            });
        },

        setFloatingSize: (size: { width: number; height: number }) => {
            update(s => {
                const newState = { ...s, floatingSize: size };
                return newState;
            });
        },

        popIn: () => {
            update(s => {
                const newState = { ...s, isPoppedOut: false, popOutMode: null, isOpen: true };
                return newState;
            });
        },

        setListening: (val: boolean) => update(s => ({ ...s, isListening: val })),
        setSpeaking: (val: boolean) => update(s => ({ ...s, isSpeaking: val })),

        setContext: (route: string) => {
            const allItems = navGroups.flatMap(g => g.items);
            const item = allItems.find(i => i.href === route);
            const contextName = item ? item.label : (route === '/' ? 'Marketing' : (route.startsWith('/modules') ? (route.split('/').pop() ?? '').replace('-', ' ') : 'Continuum'));

            const state = get({ subscribe });
            const oldContext = state.currentContextName;

            update(s => {
                const newState = {
                    ...s,
                    currentRoute: route,
                    currentContextName: contextName
                };
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
                updateInitialGreeting();
            }
        },

        sendMessage: async (content: string, isDictated: boolean = false) => {
            const owner = accountId;
            const session = captureSession();
            const epoch = conversationEpoch;
            if (owner === null || !isCurrentSession(session)) return null;
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
                return newState;
            });

            try {
                const state = get({ subscribe });
                const response = await aiConciergeService.chat(content, state.messages, state.currentContextName);
                if (accountId !== owner || conversationEpoch !== epoch || !isCurrentSession(session)) return null;

                // chat() has already parsed the envelope. Display text is never parsed as another action.
                const resources = response.resources || [];
                const extractedDataFromResponse = response.extractedData || null;

                const assistantMsg: Message = {
                    id: Math.random().toString(36).substring(7),
                    role: 'assistant',
                    content: response.content,
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
                    return newState;
                });

                // Only the normalized action is consumed, once, after the ownership check above.
                if (browser && !response.failed && response.intent) {
                    if (response.intent === 'suggest_break') {
                        overwhelmDetector.triggerOverwhelm(['AI_SUGGESTION'], 'The AI guide suggested a pause.');
                    } else {
                        const intentMap: Partial<Record<NonNullable<typeof response.intent>, string>> = {
                            add_contact: '/modules/contacts',
                            add_property: '/modules/property',
                            add_financial: '/modules/financial-accounts',
                            add_insurance: '/modules/insurance',
                            add_healthcare: '/modules/medical',
                            add_digital: '/modules/digital-guardian'
                        };
                        const targetRoute = intentMap[response.intent];
                        if (targetRoute && window.location.pathname !== targetRoute) goto(targetRoute);
                    }
                }

                return response;
            } catch (error) {
                if (accountId !== owner || conversationEpoch !== epoch || !isCurrentSession(session)) return null;
                console.error('Concierge Error:', error);
                update(s => ({ ...s, isThinking: false }));
                return null;
            }
        },

        confirmExtractedData: () => {
            const owner = accountId;
            const session = captureSession();
            const epoch = conversationEpoch;
            if (owner === null || !isCurrentSession(session)) return;
            const data = get({ subscribe }).lastExtractedData;
            if (!data) return;

            import('./persistence').then(({ setStored }) => {
                if (accountId !== owner || conversationEpoch !== epoch || !isCurrentSession(session)) return;
                Object.entries(data).forEach(([key, value]) => {
                    setStored(key, value);
                });
            });

            update(s => ({ ...s, lastExtractedData: null }));
        },

        clearHistory: () => {
            conversationEpoch++; // a reply from the conversation being cleared stays with that conversation
            update(s => ({ ...s, messages: [], lastExtractedData: null, isThinking: false }));
            updateInitialGreeting();
        },

        updateInitialGreeting
    };
}

export const conciergeEngine = createConciergeEngine();
