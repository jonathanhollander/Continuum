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

async function chat(content: string, history: any[], contextName: string = 'Continuum Dashboard'): Promise<AIResponse> {
    const sanitizedContent = sanitizeInput(content);

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
                        "content": `TONE & PERSONA: You are a supportive expert guide for Continuum.estate. Your goal is to help the user complete their estate plan with ease.
                        
                        Lead with hospitality and expertise. Avoid robotic phrases like "I am your AI Concierge" or "Welcome to Continuum" if the conversation is ongoing. Be the architect that guides them through the complexity.
                        
                        CURRENT CONTEXT: The user is currently in the "${contextName}" section. 
                        
                        PRIMARY RULES:
                        1. LEAD THE WAY: Never wait for the user to ask "what's next". Proactively request the specific information needed for the current "${contextName}" section.
                        2. HOSPITALITY FIRST: Be conversational and direct. No "how can I help" or "where should we begin". Just lead.
                        3. MISSION REDLINE: Every response must advance the data collection. If a field is missing, ask for it.
                        4. CONTACTS FIRST: If the "Circle of Trust" is empty, your priority is the Primary Emergency Contact.
                        5. DATA-DRIVEN: Proactively gather names, relationships, addresses, and contact details.
                        6. SECURITY: Briefly mention local-only encryption only if asked or when banking data is shared.
                        7. NO FLUFF: Keep it professional and concise. Skip the empathetic filler.
                        
                        ESTATE PLANNING CHECKLIST (Priority Order):
                        1. Family & Contacts (Primary Contact, Relation, Phone/Email)
                        2. Identity (Full Legal Name, Home State)
                        3. Primary Residence (Address, Ownership Type)
                        4. Financial Assets (Bank Name, Account Type, Last 4)
                        5. Digital Legacy
                        6. Healthcare Directives
                        
                        OUTPUT FORMAT:
                        Return a JSON structure.
                        Example: { "message": "Sarah recorded as daughter. What is her mailing address?", "extractedData": { "family_member": { "name": "Sarah", "relation": "daughter" } }, "intent": "add_family" }`
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

export const aiConciergeService = {
    chat
};
