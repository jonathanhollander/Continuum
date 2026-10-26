import { get } from 'svelte/store';
import { activeAccountId } from '../stores/keyringStore';
import { userRole } from '../stores/conciergeStore.svelte.ts';

import { apiFetch } from '../api/client';
import { parseApiError } from './errorHandler';

export const AI_UNAVAILABLE = "AI help is resting right now. Everything else is here for you, and you can come back whenever you're ready.";

/**
 * Sends a chat request to our own server (which holds the AI key).
 * Returns the model's text, or throws an Error carrying a gentle message.
 */
export async function callAiProxy(messages: Array<{ role: string; content: string }>): Promise<string> {
    const headers: Record<string, string> = {};
    if (typeof document !== 'undefined') {
        const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
        if (m) headers['X-CSRF-Token'] = decodeURIComponent(m[1]);
    }
    const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: 'google/gemini-2.0-flash-001', messages })
    });
    if (!response.ok) {
        const serverError = new Error((await parseApiError(response)).message);
        (serverError as any).gentle = true;
        throw serverError;
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

import { overwhelmState } from './overwhelmDetection';

export interface AIResponse {
    content: string;
    /** True when the AI couldn't be reached; `content` then holds a gentle notice, not a reply. */
    failed?: boolean;
    extractedData?: any;
    intent?: string;
    resources?: Array<{
        title: string;
        description: string;
        link: string;
        type: 'article' | 'video' | 'tool';
    }>;
}

export interface AIContext {
    userRole?: 'owner' | 'executor' | 'family';
    moduleName?: string;
    emotionalState?: 'calm' | 'overwhelmed' | 'uncertain';
}

/**
 * Privacy Filter: Redacts sensitive patterns before sending to LLM.
 * This ensures bank accounts, SSNs, etc., never leave the browser.
 */
function sanitizeInput(content: string): string {
    let sanitized = content;

    // 1. Mask SSNs (xxx-xx-xxxx)
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');

    // 2. Mask Bank Account Numbers (8-17 digits)
    // We target numbers that are 8-17 digits long and not likely dates
    sanitized = sanitized.replace(/\b\d{8,17}\b/g, (match) => {
        // Exclude common year patterns or short IDs
        const year = parseInt(match);
        if (year > 1900 && year < 2100 && match.length === 4) return match;
        return '[REDACTED_ACCOUNT]';
    });

    // 3. Mask Emails (common pattern)
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');

    // 4. Mask Phone Numbers (various formats)
    sanitized = sanitized.replace(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[REDACTED_PHONE]');

    return sanitized;
}

async function chat(content: string, history: any[], contextName: string = 'Continuum Dashboard', context?: AIContext): Promise<AIResponse> {
    const sanitizedContent = sanitizeInput(content);

    // Detect role if not explicitly provided
    const userRole = context?.userRole || detectUserRole();

    // Build role-aware context
    let roleContext = '';
    if (userRole === 'executor') {
        roleContext = '\n\n🕊️ USER ROLE: EXECUTOR (Managing a deceased loved one\'s estate)\n- Use grief-aware language with extra compassion\n- Acknowledge their loss and emotional burden\n- Be practical but deeply supportive\n- Encourage breaks and self-care\n- Frame tasks as honoring their loved one';
    } else if (userRole === 'family') {
        roleContext = '\n\n👨‍👩‍👧 USER ROLE: FAMILY MEMBER (Supporting someone with estate planning)\n- Be encouraging and supportive\n- Help them understand the value of the work\n- Frame participation as an act of care';
    } else {
        roleContext = '\n\n🌱 USER ROLE: OWNER (Planning their own estate)\n- Acknowledge the courage this takes\n- Be contemplative and values-focused\n- Help them see this as a gift to loved ones';
    }

    // Check for overwhelm state
    const currentOverwhelm = get(overwhelmState);
    let emotionalContext = '';

    if (context?.emotionalState === 'overwhelmed' || currentOverwhelm.isOverwhelmed) {
        emotionalContext = `
\n⚠️ USER EMOTIONAL STATE: OVERWHELMED
- The user is showing signs of distress (rapid navigation, errors, or long inactivity).
- SLOW DOWN. Be exceptionally gentle.
- SUGGEST A BREAK: "You've been doing a lot. Would you like to pause for a moment?"
- Set intent to "suggest_break" to offer a guided breathing exercise.
`;
    }

    // Callers add the new message to history before calling; don't send it twice.
    const last = history[history.length - 1];
    const prior = last && last.role === 'user' && last.content === content ? history.slice(0, -1) : history;

    try {
        const rawContent = await callAiProxy([
                    {
                        "role": "system",
                        "content": `🕊️ CONTINUUM AI CONCIERGE - Death Planning Companion

YOU ARE: A compassionate guide for people confronting mortality, grieving losses, or making end-of-life preparations. This is sacred, difficult work that requires the highest emotional intelligence.${roleContext}${emotionalContext}

⚠️ CRITICAL FOUNDATIONAL PRINCIPLE:
EMPATHY IS YOUR PRIMARY FUNCTION. Data collection is secondary.
Every single interaction must acknowledge the profound emotional weight of this work.
Your role is to make this process bearable, not efficient.
Compassion over completion. Always.

EMPATHY GUIDELINES:
1. ACKNOWLEDGE COURAGE ALWAYS: Building an estate plan is a profound act of love and courage. Frequently acknowledge the love and bravery behind their actions. Examples: "This takes real courage." / "I know this brings up big feelings." / "You're giving your family an incredible gift."
2. SOFTEN EVERY ASK: Never clinically collect data. Frame each question as a way to protect and care for loved ones. Always explain WHY before asking WHAT. Connect every task to meaning and love.
3. EMOTIONAL SAFETY IS PARAMOUNT: Never minimize feelings or rush the user. If someone seems overwhelmed, STOP and offer support. Suggest breaks. Provide simpler pathways. Prioritize well-being over task completion ALWAYS.
4. COMPASSIONATE LANGUAGE:
   - Use warm, supportive tone in every response.
   - NEVER use efficiency language like "quick", "fast", "done", "just", "simply".
   - Frame tasks as meaningful acts of care, not chores.
   - Connect actions to their value for loved ones.
5. RESPECT THEIR PACE: This work cannot be rushed. Honor whatever pace they set. Encourage breaks. Validate uncertainty. Reassure that decisions can be revisited.
6. CELEBRATE MEANING, NOT JUST COMPLETION: Instead of "Task completed", use "What you've just documented will bring peace to your family."
7. DIFFERENT TONE FOR DIFFERENT MODULES:
   - Funeral planning: Reverent, gentle, honoring a life.
   - Medical directives: Compassionate, validating, regarding dignity.
   - Legacy letters: Warm, meaningful, preserving a voice.
   - Insurance: Protective, family-focused, securing the future.
   - Time capsule: Poetic, timeless, legacy-focused.

PRIMARY RULES:
1. EMPATHY FIRST, DATA SECOND: The user's emotional well-being is more important than completing any task.
2. HOSPITALITY ALWAYS: Use warm, human language. "I'm so glad you're here" or "Take your time with this" are encouraged.
3. GENTLE GUIDANCE: Suggest next steps for "${contextName}", but frame them as invitations: "When you're ready..." or "Would you like to...".
4. VALIDATE UNCERTAINTY: It's okay to be unsure. Decisions can be changed. Breaks are welcome.
5. NO EFFICIENCY PRESSURE: This is not about productivity. It's about honoring life and love.
6. GENTLE PACING: If the conversation has been going for a while, suggest a break: "You've done a lot of meaningful work just now. Would you like to take a break and come back later?"

ESTATE PLANNING CHECKLIST (Priority Order):
1. Family & Contacts (Circle of trust)
2. Identity (The story of you)
3. Primary Residence (The foundation of home)
4. Financial Assets (Resources for family)
5. Legacy & Wishes (Voice and values)
6. Healthcare (Care and dignity)

VALID INTENTS: "add_contact", "add_property", "add_financial", "add_insurance", "add_healthcare", "add_digital", "suggest_break", "provide_resource".

OUTPUT FORMAT: Return ONLY JSON.
Example: { "message": "I understand this is a difficult time. Here is a guide that might help.", "resources": [{ "title": "Understanding Grief", "description": "A compassionate guide to the grieving process.", "link": "https://continuum.estate/resources/grief", "type": "article" }], "intent": "provide_resource" }
Example: { "message": "Sarah recorded as daughter—what a beautiful gift to have her support. When you're ready, could you share her mailing address so we can keep her in the loop?", "extractedData": { "family_member": { "name": "Sarah", "relation": "daughter" } }, "intent": "add_contact" }`
                    },
                    ...prior.slice(-10).map(m => ({
                        role: m.role,
                        content: m.role === 'user' ? sanitizeInput(String(m.content)) : m.content
                    })),
                    {
                        role: "user",
                        content: sanitizedContent
                    }
        ]);

        // Attempt to parse JSON if AI returned it
        try {
            // Clean markdown fences if present
            const cleanContent = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            const parsed = JSON.parse(cleanContent);
            return {
                content: parsed.message || rawContent,
                extractedData: parsed.extractedData,
                intent: parsed.intent,
                resources: parsed.resources
            };
        } catch {
            // Fallback for non-JSON responses
            return { content: rawContent };
        }
    } catch (error) {
        console.error('AI Error:', error);
        return {
            failed: true,
            content: error instanceof Error && ((error as any).gentle || error.message === AI_UNAVAILABLE)
                ? error.message
                : "I'm having a little trouble connecting right now. Please try again in a moment."
        };
    }
}

/**
 * Detects user role based on available context.
 * Can be enhanced with actual role detection logic from user profile.
 */
export function detectUserRole(): 'owner' | 'executor' | 'family' {
    const role = get(userRole);
    return role.toLowerCase() as 'owner' | 'executor' | 'family';
}

export const aiConciergeService = {
    chat,
    detectUserRole
};
