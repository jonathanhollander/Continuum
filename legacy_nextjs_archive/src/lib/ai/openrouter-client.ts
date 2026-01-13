
export interface AICompletionRequest {
    model: string;
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    temperature?: number;
    max_tokens?: number;
}

export class OpenRouterClient {
    private apiKey: string;
    private baseUrl = "https://openrouter.ai/api/v1";

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || "";
        if (!this.apiKey) {
            console.warn("OPENROUTER_API_KEY is not set.");
        }
    }

    async complete(request: AICompletionRequest): Promise<string | null> {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://antigravity.saas",
                    "X-Title": "Estate Planning Concierge"
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: request.messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.max_tokens,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenRouter API Error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || null;
        } catch (error) {
            console.error("AI Completion Failed:", error);
            return null;
        }
    }
}

export const aiClient = new OpenRouterClient();
