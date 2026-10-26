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

// --- Writing help inside any field (SmartTextarea), through our own AI chat (/api/ai/chat). ---
// Each call returns a suggestion only; the field changes when the person chooses it.

const CONTEXT_SUBJECT: Record<WriterContext, string> = {
    heirloom: "the story of a family heirloom: where it came from and what it means to them",
    timeline: "a moment from their life story",
    contact: "notes for whoever calls this person with the news: when and how to reach them, and what would comfort them",
    pet: "a few words about a beloved pet and how to care for them",
    funeral: "their wishes for their own funeral or memorial",
    letter: "a personal letter to the people they love",
    ethical_will: "an ethical will: the values and beliefs they hope to pass on",
    life_lesson: "a life lesson they want to pass on",
    storytelling: "a story from their life",
};

function writerSystem(context: WriterContext): string {
    const subject = CONTEXT_SUBJECT[context] ?? CONTEXT_SUBJECT.letter;
    return `You help someone write ${subject}, as part of planning for the end of their life.
Write in their own voice, in the first person. Use only the facts, names and memories they give you; never invent people, events or details.
Keep any bracketed placeholder such as [REDACTED_PHONE] exactly as written. Reply with the text alone: no title, no notes, no quotation marks, no markdown.`;
}

function toneWords(warmth: number): { w: number; tone: string } {
    const w = Math.max(0, Math.min(100, Math.round(Number(warmth) || 0)));
    return { w, tone: w < 34 ? "plain, clear and direct" : w < 67 ? "warm and gentle" : "tender and poetic" };
}

/** A short passage for this field from a few notes. */
export async function aiDraftText(notes: string[], context: WriterContext = "letter"): Promise<string> {
    const list = notes.map((n) => n.trim()).filter(Boolean).map((n) => `- ${n}`).join("\n");
    return cleanLetter(await callAiProxy([
        { role: "system", content: writerSystem(context) },
        { role: "user", content: `Please write one or two short, warm paragraphs from these notes:\n${list}` },
    ]));
}

/** The field's text, rewritten with the chosen warmth (0 = plain and direct, 100 = tender and poetic). */
export async function aiSoftenText(text: string, warmth: number, context: WriterContext = "letter"): Promise<string> {
    const { w, tone } = toneWords(warmth);
    return cleanLetter(await callAiProxy([
        { role: "system", content: writerSystem(context) },
        { role: "user", content: `Please gently rewrite this so it reads ${tone} (warmth ${w} out of 100). Keep its meaning, its facts and roughly its length.\n\n${text}` },
    ]));
}

// --- Letters: the writing helper beside a letter, through our own AI chat (/api/ai/chat). ---
// Each call returns a suggestion only; the page decides whether it replaces the letter.

const LETTER_SYSTEM = `You help someone write a personal letter to the people they love, as part of planning for the end of their life.
Write in their own voice, in the first person. Use only the facts, names and memories they give you; never invent people, events or details.
Keep any name or signature they wrote, and any bracketed placeholder such as [REDACTED_PHONE] exactly as written. Reply with the letter text alone: no title, no notes, no quotation marks, no markdown.`;

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
    const { w, tone } = toneWords(warmth);
    return cleanLetter(await callAiProxy([
        { role: "system", content: LETTER_SYSTEM },
        { role: "user", content: `Please gently rewrite this letter so it reads ${tone} (warmth ${w} out of 100). Keep its meaning, its facts and roughly its length.\n\n${text}` },
    ]));
}
