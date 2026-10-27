import { API_BASE_URL } from '$lib/config';
import { assertCurrentSession, captureSession, sessionToken, type SessionOwnership } from './sessionOwnership';

export interface AISetting {
    purpose: string;
    variant: string;
    model_id: string | null;
    additional_context: string;
    effective_model_id: string;
    configured: boolean;
}
export interface AIPurpose {
    id: string;
    label: string;
    variants: string[];
    output_format: 'json' | 'text';
}
export interface AISettings {
    gateway_configured: boolean;
    shipped_model_id: string;
    shared: AISetting;
    purposes: AIPurpose[];
    overrides: AISetting[];
    selected: AISelectedConfiguration;
    config_fields: AIConfigurationField[];
    input_slots: AIInputSlot[];
    asset_fields: AIAssetField[];
    assembly_order: string[];
    implementation_constraints: Record<string, unknown>;
    transport_limits: Record<string, unknown>;
}
export type AIRequestConfig = Record<string, unknown>;
export interface AISelectedConfiguration {
    request_config: AIRequestConfig;
    effective_config: AIRequestConfig;
    default_config: AIRequestConfig;
    inherited_config: AIRequestConfig;
    sources: Record<string, string>;
}
export interface AIConfigurationField {
    key: string;
    label: string;
    type: 'text' | 'integer' | 'number' | 'boolean' | 'choices' | 'object';
    nullable?: boolean;
    options?: string[];
    min?: number;
    max?: number;
    slots?: string[];
    max_length?: number;
    keys?: string[];
    value_type?: string;
}
export interface AIInputSlot {
    key: string;
    label: string;
    type: 'text' | 'text_list' | 'number';
    description: string;
    max_length?: number;
    max_items?: number;
    min?: number;
    max?: number;
    nullable?: boolean;
    options?: string[];
}
export interface AIAssetField {
    key: string;
    label: string;
    purpose: string;
    variant?: string;
    surface: string;
    kind: 'text' | 'list' | 'template' | 'object';
    placeholders: string[];
    consumers: { purpose: string; variant?: string }[];
}
export interface AIConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    source: 'user' | 'model' | 'app';
}
export interface AIRequestInput {
    purpose: string;
    variant: string;
    inputs: Record<string, string | string[] | number | null>;
    history: AIConversationMessage[];
}
export interface AIPreparedRequest {
    purpose: string;
    variant: string;
    request: { model: string; messages: { role: string; content: string }[]; max_tokens: number; temperature?: number };
    selected_model_id: string;
    transport: string;
    application_name: string;
    user_agent: string;
    sources: Record<string, string>;
    included_inputs: { key: string; value: unknown }[];
    omitted_inputs: { key: string; reason: string }[];
    limits: { max_input_chars: number; input_chars: number; max_history_messages: number | null; history_messages: number; max_tokens: number; overflow: 'refuse'; exceeded: boolean; reasons: string[]; character_counting: string; transport_envelope_chars: number; transport_limits: Record<string, unknown> };
    can_send: boolean;
    attempt_status?: 'attempted' | 'completed';
    captured_at?: string;
}
export interface AIModel {
    id: string;
    provider: string;
    name: string | null;
    created: number | null;
    context_length: number | null;
    max_output_tokens: number | null;
    input_price_per_token: string | null;
    output_price_per_token: string | null;
    capabilities: string[];
}
export interface AIModelCatalogue {
    status: 'ready' | 'unavailable' | 'not_configured';
    models: AIModel[];
    fetched_at: string | null;
    message?: string;
}
export type AISettingInput = Pick<AISetting, 'purpose' | 'variant' | 'model_id' | 'additional_context'> & { request_config: AIRequestConfig };

async function request<T>(path: string, owner: SessionOwnership, method = 'GET', body?: unknown): Promise<T> {
    assertCurrentSession(owner);
    const response = await fetch(`${API_BASE_URL}/api/ai/admin/${path}`, {
        method,
        headers: { Authorization: `Bearer ${sessionToken(owner)}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    assertCurrentSession(owner);
    let data: any;
    try { data = await response.json(); }
    catch {
        assertCurrentSession(owner);
        throw new Error('Please try the request again.');
    }
    assertCurrentSession(owner);
    if (!response.ok) {
        const detail = data?.detail;
        const fields = data?.error?.details?.fields;
        const message = typeof detail === 'string' ? detail : Array.isArray(detail)
            ? detail.map((item: any) => `${Array.isArray(item.loc) ? item.loc.filter((part: unknown) => part !== 'body').join(' · ') : 'Settings'}: ${typeof item.msg === 'string' ? item.msg : 'Review this value.'}`).join('\n')
            : Array.isArray(fields) && fields.length
            ? fields.map((item: any) => `${item.field || 'Settings'}: ${item.message || 'Review this value.'}`).join('\n')
            : data?.error?.message || 'Please try the request again.';
        throw new Error(message);
    }
    return data as T;
}
export const loadAISettings = (owner = captureSession(), purpose = 'shared', variant = '') => request<AISettings>(`settings?purpose=${encodeURIComponent(purpose)}&variant=${encodeURIComponent(variant)}`, owner);
export const loadAIModels = (refresh = false, owner = captureSession()) => request<AIModelCatalogue>(`models?refresh=${refresh}`, owner);
export const saveAISetting = (value: AISettingInput, owner = captureSession()) => request<AISettings>('settings', owner, 'PUT', value);
export const resetAISetting = (purpose: string, variant: string, owner = captureSession()) => request<AISettings>('settings/reset', owner, 'POST', { purpose, variant });
export const previewAIRequest = (value: AIRequestInput, owner = captureSession()) => request<AIPreparedRequest>('preview', owner, 'POST', value);
