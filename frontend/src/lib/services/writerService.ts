import { callAiProxy } from "./aiConciergeService";

export type WriterContext = "heirloom" | "timeline" | "contact" | "pet" | "funeral" | "letter" | "ethical_will" | "life_lesson" | "storytelling";

export const CONTEXT_SUGGESTIONS: Record<WriterContext, string[]> = {
    heirloom: ["How did you acquire this?", "Who gave it to you?", "What is your favorite memory of it?"],
    timeline: ["What happened?", "Who was there?", "How did you feel?"],
    // Caller notes: guidance for the person who calls this contact with the news.
    contact: ["Best time to reach them", "How they would like to hear it", "Someone to have with them", "Words that would comfort them"],
    pet: ["How did they join the family?", "Funny quirks?", "What did you love most?"],
    funeral: ["Music requests", "Readings or poems", "Tone of the service"],
    letter: ["What do you want them to know?", "Life lessons", "Hopes for their future"],
    ethical_will: ["What are your core values?", "What mistakes did you learn from?", "What tradition appeals to you?"],
    life_lesson: ["What was the hardest choice you made?", "What would you tell your younger self?", "What defines a good life?"],
    storytelling: ["Set the scene...", "Who was the main character?", "What was the turning point?"]
};

export async function draftFromBullets(bullets: string[], context: WriterContext = "letter"): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const core = bullets.map(b => b.trim()).filter(b => b).join(" ");

    // Context-aware mocking
    switch (context) {
        case "heirloom":
            return `This item has been a cherished part of our family history. ${core} It represents not just an object, but a tangible connection to the past.`;
        case "timeline":
            return `One of my most vivid memories is from this time. ${core} Looking back, I realize how pivotal this moment was in shaping who I am today.`;
        case "pet":
            return `My faithful companion brought so much joy to my life. ${core} Their loyalty and unconditional love taught me so much about friendship.`;
        case "contact":
            return `A few thoughts for whoever makes this call. ${core} Thank you for sharing the news with care.`;
        case "funeral":
            return `It is my wish that my final farewell reflects the values I held dear. ${core} I hope this brings comfort to those I leave behind.`;
        default:
            return `To My Loved Ones,\n\nI wanted to take a moment to write down some thoughts that have been on my mind. ${core}\n\nI hope you always remember these words and know how much you mean to me.\n\nWith love,\n[Your Name]`;
    }
}

export async function softenTone(text: string, context: WriterContext = "letter"): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple mock variation logic
    const prefixes = [
        "I feel that ",
        "It is my hope that ",
        "With love and reflection, I want to say that "
    ];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    if (context === "heirloom") return `This piece holds a special place in my heart. ${text}`;
    if (context === "pet") return `Thinking of my furry friend fills me with warmth. ${text}`;

    return `${randomPrefix}${text}`;
}

// --- Letters: the writing helper beside a letter, through our own AI chat (/api/ai/chat). ---
// Each call returns a suggestion only; the page decides whether it replaces the letter.

const LETTER_SYSTEM = `You help someone write a personal letter to the people they love, as part of planning for the end of their life.
Write in their own voice, in the first person. Use only the facts, names and memories they give you; never invent people, events or details.
Keep any name or signature they wrote. Reply with the letter text alone: no title, no notes, no quotation marks, no markdown.`;

function cleanLetter(text: string): string {
    return String(text ?? "").replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "").trim();
}

/** A first draft from a few notes (a memory, what it taught, a wish). */
export async function aiDraftLetter(notes: string[]): Promise<string> {
    const list = notes.map((n) => n.trim()).filter(Boolean).map((n) => `- ${n}`).join("\n");
    return cleanLetter(await callAiProxy([
        { role: "system", content: LETTER_SYSTEM },
        { role: "user", content: `Please write a warm letter of three or four short paragraphs from these notes:\n${list}` },
    ]));
}

/** The same letter, rewritten with the chosen warmth (0 = plain and direct, 100 = tender and poetic). */
export async function aiSoftenLetter(text: string, warmth: number): Promise<string> {
    const w = Math.max(0, Math.min(100, Math.round(warmth)));
    const tone = w < 34 ? "plain, clear and direct" : w < 67 ? "warm and gentle" : "tender and poetic";
    return cleanLetter(await callAiProxy([
        { role: "system", content: LETTER_SYSTEM },
        { role: "user", content: `Please gently rewrite this letter so it reads ${tone} (warmth ${w} out of 100). Keep its meaning, its facts and roughly its length.\n\n${text}` },
    ]));
}
