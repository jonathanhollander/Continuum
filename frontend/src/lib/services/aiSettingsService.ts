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
export type AISettingInput = Pick<AISetting, 'purpose' | 'variant' | 'model_id' | 'additional_context'>;

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
    if (!response.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : 'Please try the request again.');
    return data as T;
}
export const loadAISettings = (owner = captureSession()) => request<AISettings>('settings', owner);
export const loadAIModels = (refresh = false, owner = captureSession()) => request<AIModelCatalogue>(`models?refresh=${refresh}`, owner);
export const saveAISetting = (value: AISettingInput, owner = captureSession()) => request<AISettings>('settings', owner, 'PUT', value);
export const resetAISetting = (purpose: string, variant: string, owner = captureSession()) => request<AISettings>('settings/reset', owner, 'POST', { purpose, variant });
