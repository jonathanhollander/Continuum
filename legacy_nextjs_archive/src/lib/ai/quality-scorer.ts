import { aiClient } from "./openrouter-client";

interface EvaluationResult {
    score: number;
    feedback: string;
    improvedPrompt?: string;
}

export class QualityScorer {

    /**
     * Evaluates a prompt using an AI Judge model.
     * Ported from `_build_evaluation_prompt` in python.
     */
    static async evaluatePrompt(originalPrompt: string, context: string): Promise<EvaluationResult> {
        const systemPrompt = `
      You are an expert AI Prompt Engineer and Estate Planning Visual Director.
      Evaluate the following image generation prompt based on:
      1. Emotional Intelligence (Does it convey the right mood?)
      2. Visual Hierarchy (Is the subject clear?)
      3. Brand Consistency (Does it fit the 'Heirloom' aesthetic?)
      
      Return a JSON object with:
      - score (0-100)
      - feedback (short critique)
      - improvedPrompt (a better version of the prompt)
    `;

        const userMessage = `
      Context: ${context}
      Prompt: "${originalPrompt}"
    `;

        const response = await aiClient.complete({
            model: "anthropic/claude-3-sonnet", // Or preferred model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.2
        });

        if (!response) {
            return { score: 0, feedback: "AI Service Unavailable" };
        }

        try {
            // Basic parsing, assuming model returns JSON (should enforce JSON mode in real implementation)
            // For now, extracting JSON from potential markdown blocks
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as EvaluationResult;
            }
            return { score: 50, feedback: "Could not parse AI response", improvedPrompt: response };
        } catch (e) {
            return { score: 0, feedback: "Error parsing evaluation result" };
        }
    }
}
