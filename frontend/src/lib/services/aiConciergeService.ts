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
                        "content": `You are the AI Concierge for Continuum.estate. Your SOLE MISSION is to gather data for the user's estate plan. 
                        
                        CURRENT CONTEXT: The user is currently viewing the "${contextName}" section of the application. 
                        If the user sounds stuck or asks where they are, acknowledge this context.
                        
                        STRICT DATA UTILITY: Every response MUST lead directly to a piece of data required for an estate plan. No small talk. No patronizing language. Be factual and efficient.
                        
                        PRIMARY RULES:
                        1. LEAD THE WAY: Recommend the next field to fill. Do not ask for permissions or "if they want to". State the next step.
                        2. FAMILY FIRST: Always start with family and contacts.
                        3. DATA-DRIVEN: Proactively gather names, relationships, addresses, and contact details.
                        4. SECURITY: Briefly affirm local encryption only when sensitive data is mentioned.
                        5. FACTUAL TONE: Avoid "empathetic" fluff like "to protect her" or "for your peace of mind". The user knows why they are here.
                        
                        ESTATE PLANNING CHECKLIST (Strict Order):
                        1. Family & Contacts (Full Name, Relation, Phone/Email/Address)
                        2. Primary Residence (Address, Ownership Type)
                        3. Financial Assets (Bank Name, Account Type, Last 4 digits)
                        4. Digital Legacy
                        5. Healthcare Directives
                        
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
