import { get, writable } from 'svelte/store';
import { apiFetch } from '../api/client';
import { auth } from '../stores/auth';
import { captureSession, assertCurrentSession, isCurrentSession, type SessionOwnership } from './sessionOwnership';

/** Stable selectors and dynamic input slots. The server owns model-bound assembly. */
export const AI_MODULE_VARIANTS = [
    'obituary', 'letters', 'executor', 'heirlooms', 'legal_explainer', 'contacts',
    'medical', 'pets', 'property', 'insurance', 'digital-guardian', 'visual-memories',
    'financial', 'activity-log', 'subscriptions', 'advanced-registry', 'qr-codes',
    'home-manual', 'calendar'
] as const;

export const AI_WRITER_VARIANTS = [
    'heirloom', 'timeline', 'contact', 'pet', 'funeral', 'letter', 'ethical_will',
    'life_lesson', 'storytelling'
] as const;

export type AIModuleVariant = typeof AI_MODULE_VARIANTS[number];
export type AIWriterVariant = typeof AI_WRITER_VARIANTS[number];

export const AI_CAPABILITIES = {
    'concierge.chat': [''],
    'concierge.module_prompt': AI_MODULE_VARIANTS,
    'grief.chat': [''],
    'writer.draft_text': AI_WRITER_VARIANTS,
    'writer.rewrite_text': AI_WRITER_VARIANTS,
    'letter.draft': [''],
    'letter.rewrite': ['']
} as const;

export type AIPurpose = keyof typeof AI_CAPABILITIES;
type Variant<P extends AIPurpose> = typeof AI_CAPABILITIES[P][number];
export type AICapability = {
    [P in AIPurpose]: '' extends Variant<P>
        ? { purpose: P; variant?: '' }
        : { purpose: P; variant: Variant<P> }
}[AIPurpose];

/** Validate JavaScript callers too, and serialize only the two settings selectors. */
export function aiCapability(selection: AICapability): { purpose: AIPurpose; variant: string } {
    const purpose = selection?.purpose;
    const variant = selection?.variant === undefined ? '' : selection.variant;
    if (!Object.hasOwn(AI_CAPABILITIES, purpose)
        || !(AI_CAPABILITIES[purpose] as readonly unknown[]).includes(variant)) {
        throw new TypeError('Unknown AI purpose or variant');
    }
    return { purpose, variant };
}

export interface AIInputs {
    user_text?: string;
    notes?: string[];
    current_draft?: string;
    current_draft_source?: 'edited' | 'proposed';
    job_brief?: string;
    document_title?: string;
    document_type?: string;
    recipient_name?: string;
    recipient_relationship?: string;
    source_facts?: string[];
    context_name?: string;
    user_role?: string;
    emotional_state?: string;
    warmth?: number;
    job_id?: string;
}
export type AIWritingJob = Omit<AIInputs, 'user_text' | 'warmth'>;
export interface AIHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    source: 'user' | 'model' | 'app';
}
export interface AIRuntimeConfig {
    effective_config: Record<string, unknown>;
    ui_assets: Record<string, unknown>;
    input_slots: unknown;
}

export const aiRuntimeAssets = writable<Record<string, Record<string, unknown>>>({});
const configurations = new Map<string, { owner: SessionOwnership; value: Promise<AIRuntimeConfig> }>();
export const aiJobChanges = writable(0);
export const notifyAIJobChanged = () => aiJobChanges.update(version => version + 1);
const jobs = new Map<symbol, { owner: SessionOwnership; read: () => AIWritingJob | undefined }>();
let runtimeOwner: SessionOwnership | null = null;
const refreshers = new Set<() => void>();
let configEpoch = 0;
export function invalidateAIConfig() { configEpoch++; configurations.clear(); aiRuntimeAssets.set({}); refreshers.forEach(refresh => refresh()); }
export function aiAssets(selection: AICapability, values = get(aiRuntimeAssets)): Record<string, unknown> {
    const { purpose, variant } = aiCapability(selection);
    return values[`${purpose}:${variant}`] ?? {};
}

function followSession() {
    if (runtimeOwner && !isCurrentSession(runtimeOwner)) {
        configurations.clear();
        jobs.clear();
        notifyAIJobChanged();
        aiRuntimeAssets.set({});
        runtimeOwner = null;
    }
}

export async function loadAIConfig(selection: AICapability, refresh = false): Promise<AIRuntimeConfig> {
    const { purpose, variant } = aiCapability(selection);
    followSession();
    const owner = captureSession();
    assertCurrentSession(owner);
    runtimeOwner = owner;
    const key = `${purpose}:${variant}`;
    const cached = configurations.get(key);
    if (!refresh && cached && isCurrentSession(cached.owner)) return cached.value;
    const epoch = configEpoch;
    const value = (async () => {
        const response = await apiFetch(`/api/ai/config?${new URLSearchParams({ purpose, variant })}`);
        assertCurrentSession(owner);
        if (!response.ok) throw new Error('AI configuration could not be loaded');
        const data: AIRuntimeConfig = await response.json();
        assertCurrentSession(owner);
        if (!data.ui_assets || typeof data.ui_assets !== 'object' || Array.isArray(data.ui_assets)) throw new Error('Invalid AI configuration');
        if (epoch !== configEpoch) throw new Error("AI configuration changed");
        aiRuntimeAssets.update(values => ({...values, [key]: data.ui_assets}));
        return data;
    })();
    configurations.set(key, { owner, value });
    value.catch(() => { if (configurations.get(key)?.value === value) configurations.delete(key); });
    return value;
}

/** Components load assets once their authenticated session is ready, then drop them on change. */
export function observeAIConfig(selection: AICapability): () => void {
    const refresh = () => { followSession(); if (captureSession().ready) void loadAIConfig(selection).catch(() => undefined); };
    refreshers.add(refresh);
    const stop = auth.subscribe(refresh);
    return () => { refreshers.delete(refresh); stop(); };
}

export function aiAsset<T>(key: string, selection: AICapability): T | undefined {
    followSession();
    return aiAssets(selection)[key] as T | undefined;
}

export const assetStrings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
export function renderAIAsset(template: string, values: Record<string, string>): string {
    return template.replace(/\{\{([a-zA-Z_]+)\}\}/g, (match, key) => Object.hasOwn(values, key) ? values[key] : match);
}

/** The active editor supplies only its own record; this is not an estate-wide data collector. */
export function registerAIJob(read: () => AIWritingJob | undefined): () => void {
    const id = Symbol();
    jobs.set(id, { owner: captureSession(), read });
    notifyAIJobChanged();
    return () => { jobs.delete(id); notifyAIJobChanged(); };
}
export function currentAIJob(): AIWritingJob | undefined {
    followSession();
    for (const [id, job] of [...jobs].reverse()) {
        if (!isCurrentSession(job.owner)) { jobs.delete(id); continue; }
        const value = job.read();
        if (value) return value;
    }
}

const draftIds = new WeakMap<object, string>();
export function aiJobId(kind: string, record: object, id?: string | number | null): string {
    if (id !== undefined && id !== null && id !== '') return `${kind}:${id}`;
    let key = draftIds.get(record);
    if (!key) { key = crypto.randomUUID(); draftIds.set(record, key); }
    return `${kind}:draft:${key}`;
}
export function aiSourceFacts(record: Record<string, unknown>): string[] {
    return Object.entries(record).flatMap(([key, value]) => value !== null && value !== undefined && value !== ''
        && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        && !/^(?:data:|blob:)/.test(String(value))
        ? [`${key}: ${value}`] : []);
}
