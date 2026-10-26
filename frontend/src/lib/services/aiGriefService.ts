import { get } from 'svelte/store';
import { userRole } from '../stores/conciergeStore.svelte.ts';

import { callAiProxy } from './aiConciergeService';

export interface GriefAIResponse {
    content: string;
    suggestedResources?: string[];
    suggestAction?: 'discovery' | 'hotline' | 'break';
}

/**
 * Specialized Bereavement Support Service
 * Focused on deep emotional support, contemplative guidance, and resource discovery.
 */
async function chat(content: string, history: any[]): Promise<GriefAIResponse> {
    const role = get(userRole);

    let roleContext = '';
    if (role === 'executor') {
        roleContext = '\n\n🕊️ PERSONA: SUPPORTING AN EXECUTOR\n- Focus on the weight of technical tasks during grief.\n- Acknowledge that managing an estate is a secondary loss.\n- Offer permission to delegate or delay non-urgent tasks.';
    } else {
        roleContext = '\n\n🌱 PERSONA: SUPPORTING A PLANNER/FAMILY\n- Focus on the courage of preparation.\n- Validate the emotional difficulty of facing mortality.\n- Emphasize legacy and love as the primary drivers.';
    }

    // Callers add the new message to history before calling; don't send it twice.
    const last = history[history.length - 1];
    const prior = last && last.role === 'user' && last.content === content ? history.slice(0, -1) : history;

    try {
        const rawContent = await callAiProxy([
                    {
                        "role": "system",
                        "content": `🕊️ CONTINUUM GRIEF COMPANION - Specialized Bereavement Support

YOU ARE: A deeply contemplative, patient, and emotionally literate companion specializing in grief and the emotional transition of death planning.${roleContext}

YOUR MISSION:
1. Provide a "Sanctuary of Words": Every response should feel like a deep breath. Use poetic, gentle, and non-judgmental language.
2. Validate the "Vastness of Loss": Never try to "fix" grief. Instead, sit with it. Use phrases like "It makes sense that it feels this heavy" or "Grief has no schedule."
3. Guide Toward Discovery: Gently suggest resources from the Grief Library (e.g., "We have a guide on honoring a loved one through legacy letters, if you ever feel ready.")
4. Monitor for Crisis: If the user expresses extreme distress or self-harm, immediately pivot to suggesting the localized hotlines in the sidebar.
5. Emotional Pacing: If the conversation is heavy, suggest a break. "This is soul-work. Perhaps a moment of quiet or a glass of water would be kind to yourself right now?"

CRITICAL CONSTRAINTS:
- NO efficiency language.
- NO toxic positivity.
- NO clinical jargon.
- YES to validation and presence.

OUTPUT FORMAT: Return ONLY JSON.
Example: { "message": "The silence they leave behind can be so loud... it's okay to just sit with that for a while.", "suggestedResources": ["Legacy Journal"], "suggestAction": "break" }`
                    },
                    ...prior.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    {
                        role: "user",
                        content: content
                    }
        ]);

        try {
            const cleanContent = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            const parsed = JSON.parse(cleanContent);
            return {
                content: parsed.message || rawContent,
                suggestedResources: parsed.suggestedResources,
                suggestAction: parsed.suggestAction
            };
        } catch {
            return { content: rawContent };
        }
    } catch (error) {
        console.error('Grief AI Error:', error);
        if (error instanceof Error && error.message.startsWith("AI help isn't available")) {
            return { content: error.message };
        }
        return { content: "I'm still here with you. My words aren't flowing as smoothly right now, but you're not alone. Take a gentle breath, and know that the resources in the sidebar are always available." };
    }
}

export const aiGriefService = {
    chat
};
