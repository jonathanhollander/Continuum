import { writable, get } from 'svelte/store';
import { aiConciergeService } from '../services/aiConciergeService';
import { overwhelmDetector } from '../services/overwhelmDetection';
import { auth } from './auth';
import { captureSession, isCurrentSession, type SessionOwnership } from '../services/sessionOwnership';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { loadAIConfig, aiAsset, renderAIAsset, currentAIJob, type AIWritingJob } from '../services/aiCapabilities';
import { navGroups } from '../config/navigation';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    isDictated?: boolean;
    source?: 'user' | 'model' | 'app';
    status?: boolean;
    historyContent?: string;
    job_id?: string;
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
    writingJob?: AIWritingJob;
    writingJobSource?: string;
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
                messages: Array.isArray(parsed?.messages) ? parsed.messages.map((message: Message) => ({...message,source:message.source ?? (message.role === 'user' ? 'user' : message.id === '1' ? 'app' : 'model')})) : [],
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

    const addConfiguredGreeting = async (pivot = false) => {
        const owner = captureSession(), epoch = conversationEpoch;
        const contextName = get({subscribe}).currentContextName;
        try {
            await loadAIConfig({purpose:'concierge.chat'});
            if (!isCurrentSession(owner) || epoch !== conversationEpoch || contextName !== get({subscribe}).currentContextName) return;
            const state = get({subscribe});
            if (!pivot && state.messages.length) return;
            const asset = <T>(name: string) => aiAsset<T>(`lib/stores/conciergeEngine.ts:${name}`, {purpose:'concierge.chat'});
            const render = (name: string, values: Record<string,string>) => renderAIAsset(asset<string>(name) ?? '', values);
            let content: string;
            if (pivot) {
                const lead = asset<Record<string,string>>('PIVOT_GREETINGS')?.[contextName] ?? render('pivot_fallback', {context_name:contextName});
                content = render('pivot_join', {context_name:contextName,lead_question:lead});
            } else {
                const home = ['Continuum Dashboard','Marketing','Continuum'].includes(contextName);
                const body = asset<Record<string,string>>('contextGreetings')?.[contextName] ?? (home ? asset<string>('greeting_home') ?? '' : render('greeting_other', {context_name:contextName}));
                content = render('greeting_join', {prefix:asset<string>(state.hasInteracted ? 'greeting_prefix_return' : 'greeting_prefix_first') ?? '',body});
            }
            if (!content) return;
            update(state => ({...state, messages:[...state.messages,{id:crypto.randomUUID(),role:'assistant',source:'app',content,timestamp:Date.now()}],hasInteracted:true,hasPendingContextSwitch:false}));
        } catch { /* Configuration is required; keep the existing thread available for retry. */ }
    };
    const updateInitialGreeting = () => { void addConfiguredGreeting(); };

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
                void addConfiguredGreeting(true);
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
                    void addConfiguredGreeting(true);
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
            const before = get({subscribe});
            const selectedJob = currentAIJob();
            // Svelte fields may be proxies; persist/broadcast an immutable plain job snapshot.
            const activeJob: AIWritingJob | undefined = selectedJob ? {...JSON.parse(JSON.stringify(selectedJob)),current_draft_source:selectedJob.current_draft_source ?? 'edited'} : undefined;
            const jobSource = JSON.stringify(selectedJob);
            const job = activeJob && jobSource !== before.writingJobSource
                ? {...activeJob,job_brief:activeJob.job_brief ?? content}
                : before.writingJob ?? activeJob;
            const userMsg: Message = {
                id: Math.random().toString(36).substring(7),
                role: 'user',
                source: 'user',
                job_id: job?.job_id,
                content,
                timestamp: Date.now(),
                isDictated
            };

            update(s => {
                const newState = {
                    ...s,
                    messages: [...s.messages, userMsg],
                    writingJob: job,
                    writingJobSource: activeJob ? jobSource : s.writingJobSource,
                    isThinking: true,
                    hasInteracted: true
                };
                return newState;
            });

            try {
                const state = get({ subscribe });
                const response = await aiConciergeService.chat(content, state.messages.filter(message => !message.status && message.job_id === job?.job_id).map(message => ({...message,source:message.source ?? (message.role === 'user' ? 'user' : 'model')})), state.currentContextName, undefined, {purpose:'concierge.chat'}, job);
                if (accountId !== owner || conversationEpoch !== epoch || !isCurrentSession(session)) return null;
                if (currentAIJob() && JSON.stringify(currentAIJob()) !== jobSource) { update(state => ({...state,isThinking:false})); return null; }

                // chat() has already parsed the envelope. Display text is never parsed as another action.
                const resources = response.resources || [];
                const extractedDataFromResponse = response.extractedData || null;

                const assistantMsg: Message = {
                    id: Math.random().toString(36).substring(7),
                    role: 'assistant',
                    source: response.failed ? undefined : 'model',
                    status: response.failed === true,
                    job_id: job?.job_id,
                    content: response.content,
                    historyContent: response.historyContent,
                    timestamp: new Date().getTime(),
                    resources: resources.length > 0 ? resources : undefined
                };

                update(s => {
                    const newState = {
                        ...s,
                        messages: [...s.messages, assistantMsg],
                        isThinking: false,
                        lastExtractedData: extractedDataFromResponse,
                        writingJob: job && !response.failed ? {...job,current_draft:response.content,current_draft_source:'proposed' as const} : job
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
            update(s => ({ ...s, messages: [], writingJob: undefined, writingJobSource: undefined, lastExtractedData: null, isThinking: false }));
            updateInitialGreeting();
        },

        updateInitialGreeting
    };
}

export const conciergeEngine = createConciergeEngine();
