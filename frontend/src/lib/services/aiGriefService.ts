import { get } from 'svelte/store';
import { userRole } from '../stores/concierge';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const SITE_URL = 'https://continuum.estate';
const SITE_NAME = 'Continuum Estate';

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

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": `${SITE_URL}`,
                "X-Title": `${SITE_NAME}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [
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
                    ...history.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    {
                        role: "user",
                        content: content
                    }
                ]
            })
        });

        const data = await response.json();
        const rawContent = data.choices[0].message.content;

        try {
            const parsed = JSON.parse(rawContent);
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
        return { content: "I'm still here with you. My words aren't flowing as smoothly right now, but you're not alone. Take a gentle breath, and know that the resources in the sidebar are always available." };
    }
}

export const aiGriefService = {
    chat
};
