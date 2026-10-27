import { get, writable } from 'svelte/store';
import { userRole } from '../stores/conciergeStore.svelte';
import { auth } from '../stores/auth';
import { apiFetch } from '../api/client';
import { parseApiError } from './errorHandler';
import { createRedactionSession } from '../utils/sanitize';
import { captureSession, assertCurrentSession, isCurrentSession, sessionToken, type SessionOwnership } from './sessionOwnership';
import { aiCapability, aiAsset, currentAIJob, type AICapability, type AIModuleVariant, type AIInputs, type AIHistoryMessage, type AIWritingJob } from './aiCapabilities';
import { overwhelmState } from './overwhelmDetection';

// UI-only fallback; native model instructions and configured history rules live on the server.
export const AI_UNAVAILABLE = "AI help is resting right now. Everything else is here for you, and you can come back whenever you're ready.";
const unavailable = () => aiAsset<string>('lib/services/aiConciergeService.ts:AI_UNAVAILABLE', {purpose:'concierge.chat'}) ?? AI_UNAVAILABLE;

function strings(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(strings);
    if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
    return [];
}
function mapStrings<T>(value: T, change: (value: string) => string): T {
    if (typeof value === 'string') return change(value) as T;
    if (Array.isArray(value)) return value.map((v) => mapStrings(v, change)) as T;
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, mapStrings(v, change)])) as T;
    return value;
}

/** Shared privacy adapter for send and Admin preview. Its private restoration map stays local. */
export function prepareAIRequest(selection: AICapability, inputs: AIInputs, history: AIHistoryMessage[] = [], requiredOriginals?: readonly string[]) {
    const capability = aiCapability(selection);
    const redactions = createRedactionSession([...strings(inputs), ...strings(history)], requiredOriginals);
    return { body: { ...capability, inputs: mapStrings(inputs, redactions.redact), history: mapStrings(history, redactions.redact) },
        restoreResponse: redactions.restoreResponse };
}

const latest = writable<unknown | null>(null);
let latestOwner: SessionOwnership | null = null;
let requestSequence = 0;
function clearChangedRequest() {
    if (latestOwner && (!isCurrentSession(latestOwner) || !get(auth).user?.is_admin)) {
        latestOwner = null;
        requestSequence++;
        latest.set(null);
    }
}
export const lastAIRequest = { subscribe: (run: (value: unknown | null) => void) => {
    const stopAuth = auth.subscribe(clearChangedRequest);
    const stop = latest.subscribe((value) => { clearChangedRequest(); run(latestOwner && isCurrentSession(latestOwner) ? value : null); });
    return () => { stop(); stopAuth(); };
} };
export function getLastAIRequest(): unknown | null { clearChangedRequest(); return latestOwner ? get(latest) : null; }
// Clear memory even while the Admin inspection surface is closed.
void import('../stores/auth').then(({ auth }) => auth.subscribe(clearChangedRequest));

export async function callAiProxy(inputs: AIInputs, history: AIHistoryMessage[], options: AICapability & {
    preserveSensitiveValues?: boolean; requiredOriginals?: readonly string[];
}): Promise<string> {
    const owner = captureSession();
    assertCurrentSession(owner);
    const sequence = ++requestSequence;
    const prepared = prepareAIRequest(options, inputs, history, options.requiredOriginals);
    const headers: Record<string, string> = {};
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
        if (match) headers['X-CSRF-Token'] = decodeURIComponent(match[1]);
    }
    const token = sessionToken(owner);
    if (token) headers.Authorization = `Bearer ${token}`;
    assertCurrentSession(owner);
    const response = await apiFetch('/api/ai/chat', { method: 'POST', headers, body: JSON.stringify(prepared.body) });
    assertCurrentSession(owner);
    const metadata = await response.clone().json().catch(() => null);
    assertCurrentSession(owner);
    if (sequence === requestSequence && get(auth).user?.is_admin && metadata?.continuum_request) {
        latestOwner = owner;
        latest.set({...metadata.continuum_request, captured_at: new Date().toISOString()});
    }
    if (!response.ok) {
        const error = new Error((await parseApiError(response)).message);
        (error as any).gentle = true;
        throw error;
    }
    const data = await response.json();
    assertCurrentSession(owner);
    try { return prepared.restoreResponse(String(data.choices[0].message.content), options.preserveSensitiveValues); }
    catch {
        const error = new Error("Your words are still here. You can try another version whenever you're ready.");
        (error as any).gentle = true;
        throw error;
    }
}

const AI_INTENTS = ['add_contact', 'add_property', 'add_financial', 'add_insurance', 'add_healthcare', 'add_digital', 'suggest_break', 'provide_resource'] as const;
export type AIIntent = typeof AI_INTENTS[number];
export interface AIResponse {
    content: string; historyContent?: string; failed?: boolean; extractedData?: any; intent?: AIIntent;
    resources?: Array<{ title: string; description: string; link: string; type: 'article' | 'video' | 'tool' }>;
}
export interface AIContext { userRole?: 'owner' | 'executor' | 'family'; moduleName?: string; emotionalState?: 'calm' | 'overwhelmed' | 'uncertain' }
type ConciergeCapability = Extract<AICapability, { purpose: 'concierge.chat' | 'concierge.module_prompt' }>;
export function aiHistory(history: Array<{ role: string; content: string; historyContent?: string; source?: AIHistoryMessage['source'] }>): AIHistoryMessage[] {
    return history.filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => ({
        role: m.role as 'user' | 'assistant', content: String(m.role === 'assistant' ? m.historyContent ?? m.content : m.content), source: m.source ?? (m.role === 'user' ? 'user' : 'model')
    }));
}
async function chat(content: string, history: Array<{ role: string; content: string; historyContent?: string; source?: AIHistoryMessage['source'] }>,
    contextName = 'Continuum Dashboard', context?: AIContext, capability: ConciergeCapability = { purpose: 'concierge.chat' }, job: AIWritingJob | undefined = currentAIJob()): Promise<AIResponse> {
    const last = history.at(-1);
    const prior = last?.role === 'user' && last.content === content ? history.slice(0, -1) : history;
    try {
        const raw = await callAiProxy({ ...job, user_text: content, context_name: contextName, user_role: context?.userRole ?? detectUserRole(),
            emotional_state: context?.emotionalState ?? (get(overwhelmState).isOverwhelmed ? 'overwhelmed' : 'calm') }, aiHistory(prior), capability);
        try {
            const parsed = JSON.parse(raw.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, ''));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { content: raw, historyContent: raw };
            return { historyContent: raw, content: typeof parsed.message === 'string' ? parsed.message : raw, extractedData: parsed.extractedData,
                intent: AI_INTENTS.includes(parsed.intent) ? parsed.intent : undefined, resources: Array.isArray(parsed.resources) ? parsed.resources : undefined };
        } catch { return { content: raw, historyContent: raw }; }
    } catch (error) {
        if ((error as any)?.code !== 'SESSION_CHANGED') console.error('AI Error:', error);
        return { failed: true, content: error instanceof Error && (error as any).gentle ? error.message : unavailable() };
    }
}
export function detectUserRole(): 'owner' | 'executor' | 'family' { return get(userRole).toLowerCase() as 'owner' | 'executor' | 'family'; }
export const aiConciergeService = {
    chat,
    modulePrompt: (content: string, variant: AIModuleVariant, history: AIHistoryMessage[] = [], job?: AIWritingJob) =>
        chat(content, history, variant, undefined, { purpose: 'concierge.module_prompt', variant }, job ?? currentAIJob()),
    detectUserRole
};
