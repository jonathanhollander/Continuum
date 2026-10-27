import { contextStore } from '../stores/contextStore.svelte';
import { callAiProxy, aiHistory, AI_UNAVAILABLE } from './aiConciergeService';
import type { AIHistoryMessage } from './aiCapabilities';
export interface GriefAIResponse { content: string; historyContent?: string; failed?: boolean; suggestedResources?: string[]; suggestAction?: 'discovery' | 'hotline' | 'break' }
async function chat(content: string, history: Array<{ role: string; content: string; historyContent?: string; source?: AIHistoryMessage['source'] }>): Promise<GriefAIResponse> {
    const last = history.at(-1);
    const prior = last?.role === 'user' && last.content === content ? history.slice(0, -1) : history;
    try {
        const raw = await callAiProxy({ user_text: content, user_role: contextStore.isExecutor ? 'executor' : 'owner' }, aiHistory(prior), { purpose: 'grief.chat' });
        try {
            const parsed = JSON.parse(raw.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, ''));
            return { historyContent:raw, content: parsed.message || raw, suggestedResources: parsed.suggestedResources, suggestAction: parsed.suggestAction };
        } catch { return { content: raw, historyContent:raw }; }
    } catch (error) {
        if ((error as any)?.code !== 'SESSION_CHANGED') console.error('Grief AI Error:', error);
        return { failed: true, content: error instanceof Error && (error as any).gentle ? error.message : AI_UNAVAILABLE };
    }
}
export const aiGriefService = { chat };
