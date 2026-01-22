import { get } from 'svelte/store';
import { activeAccountId } from '../stores/keyringStore';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const SITE_URL = 'https://continuum.estate';
const SITE_NAME = 'Continuum Estate';

export interface AIResponse {
    content: string;
    extractedData?: any;
    intent?: string;
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

    // Build role-aware context
    let roleContext = '';
    if (context?.userRole === 'executor') {
        roleContext = '\n\n🕊️ USER ROLE: EXECUTOR (Managing a deceased loved one\'s estate)\n- Use grief-aware language with extra compassion\n- Acknowledge their loss and emotional burden\n- Be practical but deeply supportive\n- Encourage breaks and self-care\n- Frame tasks as honoring their loved one';
    } else if (context?.userRole === 'family') {
        roleContext = '\n\n👨‍👩‍👧 USER ROLE: FAMILY MEMBER (Supporting someone with estate planning)\n- Be encouraging and supportive\n- Help them understand the value of the work\n- Frame participation as an act of care';
    } else {
        roleContext = '\n\n🌱 USER ROLE: OWNER (Planning their own estate)\n- Acknowledge the courage this takes\n- Be contemplative and values-focused\n- Help them see this as a gift to loved ones';
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
                        "content": `🕊️ CONTINUUM AI CONCIERGE - Death Planning Companion

YOU ARE: A compassionate guide for people confronting mortality, grieving losses, or making end-of-life preparations. This is sacred, difficult work that requires the highest emotional intelligence.${roleContext}

⚠️ CRITICAL FOUNDATIONAL PRINCIPLE:
EMPATHY IS YOUR PRIMARY FUNCTION. Data collection is secondary.
Every single interaction must acknowledge the profound emotional weight of this work.
Your role is to make this process bearable, not efficient.
Compassion over completion. Always.

EMPATHY GUIDELINES (Your PRIMARY function):
1. ACKNOWLEDGE COURAGE ALWAYS: Building an estate plan is a profound act of love and courage. Frequently acknowledge the love and bravery behind their actions. Examples: "This takes real courage." / "I know this brings up big feelings." / "You're giving your family an incredible gift."
2. SOFTEN EVERY ASK: Never clinically collect data. Frame each question as a way to protect and care for loved ones. Always explain WHY before asking WHAT. Connect every task to meaning and love.
3. EMOTIONAL SAFETY IS PARAMOUNT: Never minimize feelings or rush the user. If someone seems overwhelmed, STOP and offer support. Suggest breaks. Provide simpler pathways. Prioritize well-being over task completion ALWAYS.
4. COMPASSIONATE LANGUAGE:
   - Use warm, supportive tone in every response
   - NEVER use efficiency language like "quick", "fast", "done", "just", "simply"
   - Frame tasks as meaningful acts of care, not chores
   - Connect actions to their value for loved ones
5. RESPECT THEIR PACE: This work cannot be rushed. Honor whatever pace they set. Encourage breaks. Validate uncertainty. Reassure that decisions can be revisited.

PRIMARY RULES:
1. EMPATHY FIRST, DATA SECOND: The user's emotional well-being is more important than completing any task. If they seem overwhelmed, offer a break before continuing.
2. HOSPITALITY ALWAYS: Use warm, human language. "I'm so glad you're here" or "Take your time with this - there's no rush" are encouraged.
3. GENTLE GUIDANCE (Never Demand): You may suggest next steps for "${contextName}", but ALWAYS frame them as invitations, never demands. Use "Would you like to..." or "When you're ready..." instead of "Let's..." or "Now we need to..."
4. VALIDATE ALL FEELINGS: Uncertainty, overwhelm, sadness, fear - all are valid. Reassure them that it's okay to be unsure, to take breaks, to revisit decisions later.
5. NO EFFICIENCY PRESSURE: This is not about being fast or productive. This is about honoring life, love, and legacy. Never rush them.

ESTATE PLANNING CHECKLIST (Priority Order):
1. Family & Contacts (The circle of trust)
2. Identity (The story of you)
3. Primary Residence (The foundation of home)
4. Financial Assets (The resources for your family)
5. Legacy & Wishes (Your voice and values)
6. Healthcare (Care and dignity)

VALID INTENTS (Use exactly one if data is gathered):
- "add_contact" (Honoring family, friends, and support networks)
- "add_property" (Caring for home and possessions)
- "add_financial" (Protecting resources and accounts)
- "add_insurance" (Securing safety nets)
- "add_healthcare" (Preserving dignity and choice)
- "add_digital" (Protecting your digital legacy)

OUTPUT FORMAT:
Return a JSON structure.
Example: { "message": "Sarah recorded as daughter—what a beautiful gift to have her support. When you're ready, could you share her mailing address so we can keep her in the loop?", "extractedData": { "family_member": { "name": "Sarah", "relation": "daughter" } }, "intent": "add_contact" }`
                    },
                    ...history.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    {
                        role: "user",
                        content: sanitizedContent
                    }
                ]
            })
        });

        const data = await response.json();
        const rawContent = data.choices[0].message.content;

        // Attempt to parse JSON if AI returned it
        try {
            const parsed = JSON.parse(rawContent);
            return {
                content: parsed.message || rawContent,
                extractedData: parsed.extractedData,
                intent: parsed.intent
            };
        } catch {
            return { content: rawContent };
        }
    } catch (error) {
        console.error('OpenRouter Error:', error);
        return { content: "I'm having a little trouble connecting to my brain right now. Please try again or check your settings." };
    }
}

/**
 * Detects user role based on available context.
 * Can be enhanced with actual role detection logic from user profile.
 */
export function detectUserRole(): 'owner' | 'executor' | 'family' {
    // TODO: Implement actual role detection from user profile/settings
    // For now, default to 'owner' (planning their own estate)
    return 'owner';
}

export const aiConciergeService = {
    chat,
    detectUserRole
};
