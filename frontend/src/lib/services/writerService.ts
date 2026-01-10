export type WriterContext = "heirloom" | "timeline" | "contact" | "pet" | "funeral" | "letter" | "ethical_will" | "life_lesson" | "storytelling";

const VARIATIONS = [
    "This is a first variation using a warm and sentimental tone.",
    "Here is a second option that is slightly more formal and structured.",
    "A third possibility, focusing on the emotional impact and legacy."
];

export const CONTEXT_SUGGESTIONS: Record<WriterContext, string[]> = {
    heirloom: ["How did you acquire this?", "Who gave it to you?", "What is your favorite memory of it?"],
    timeline: ["What happened?", "Who was there?", "How did you feel?"],
    contact: ["How did you meet?", "What do you admire about them?", "Favorite shared experience?"],
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
    const randomVar = VARIATIONS[Math.floor(Math.random() * VARIATIONS.length)];

    // Context-aware mocking
    switch (context) {
        case "heirloom":
            return `This item has been a cherished part of our family history. ${core} It represents not just an object, but a tangible connection to the past.`;
        case "timeline":
            return `One of my most vivid memories is from this time. ${core} Looking back, I realize how pivotal this moment was in shaping who I am today.`;
        case "pet":
            return `My faithful companion brought so much joy to my life. ${core} Their loyalty and unconditional love taught me so much about friendship.`;
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

export async function expandThought(shortText: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `${shortText} This is something I've held close to my heart for many years, and I believe it's important to pass this wisdom on to you.`;
}
