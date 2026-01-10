export interface TraditionGuide {
    id: string;
    title: string;
    description: string;
    icon: string;
    sections: {
        title: string;
        content: string[]; // Array of paragraphs
        checklist?: string[];
    }[];
}

export const culturalTraditions: Record<string, TraditionGuide> = {
    christian: {
        id: "christian",
        title: "Christian Traditions",
        description: "Guidance for Catholic, Protestant, and Orthodox funeral practices.",
        icon: "✝️",
        sections: [
            {
                title: "The Service (Liturgy)",
                content: [
                    "Christian funerals focus on the hope of resurrection. The service typically includes scripture readings, hymns, a homily (sermon), and prayers.",
                    "Catholic services may include a Funeral Mass with communion. Protestant services vary more widely but generally follow a structure of worship."
                ],
                checklist: [
                    "Select scripture readings (Old Testament, Psalms, New Testament)",
                    "Choose hymns or worship songs",
                    "Decide on open vs. closed casket",
                    "Coordinate with clergy for the eulogy"
                ]
            },
            {
                title: "Burial & Committal",
                content: [
                    "Traditional burial is common, often preceded by a graveside 'Committal Service'.",
                    "Cremation is increasingly accepted in many denominations, though some traditions prefer the ashes be present at the service."
                ]
            },
            {
                title: "The Reception (Repast)",
                content: [
                    "A gathering often follows the burial, allowing family and community to share a meal and memories.",
                    "This is typically held at the church hall, the family home, or a restaurant."
                ]
            }
        ]
    },
    jewish: {
        id: "jewish",
        title: "Jewish Traditions",
        description: "Customs for Shiva, Tahara, and burial practices.",
        icon: "✡️",
        sections: [
            {
                title: "Immediate Actions (Aninut)",
                content: [
                    "Burial traditionally takes place as soon as possible, ideally within 24 hours (excluding Shabbat).",
                    "The body is washed (Tahara) and dressed in simple white shrouds (Tachrichim) by the Chevra Kadisha (holy society)."
                ],
                checklist: [
                    "Contact the local Chevra Kadisha",
                    "Suspend daily religious obligations (for immediate mourners)",
                    "Do not leave the body alone (Shmira)"
                ]
            },
            {
                title: "The Funeral (Levayah)",
                content: [
                    "The service is simple, emphasizing the reality of death and the soul's return to God.",
                    "Flowers are traditionally NOT displayed. Instead, visitors may make charitable donations."
                ]
            },
            {
                title: "Shiva (Mourning)",
                content: [
                    "The family sits 'Shiva' for seven days at home, receiving visitors.",
                    "Mirrors are covered, and mourners utilize low stools. A memorial candle burns for the duration."
                ]
            }
        ]
    },
    secular: {
        id: "secular",
        title: "Secular / Humanist",
        description: "Non-religious celebrations of life and personal legacies.",
        icon: "🌿",
        sections: [
            {
                title: "Celebration of Life",
                content: [
                    "The focus is entirely on the life lived, relationships, and impact on others.",
                    "There is no set structure—it can be a party, a dinner, a hike, or a formal seated event."
                ],
                checklist: [
                    "Choose a meaningful venue (park, favorite restaurant, community center)",
                    "Appoint a master of ceremonies (friend or professional celebrant)",
                    "Collect photos and videos for a slideshow",
                    "Create a playlist of their favorite music"
                ]
            },
            {
                title: "Eco-Friendly Options",
                content: [
                    "Many secular services align with green burial practices, using biodegradable materials or tree-planting urns.",
                    "Donations to environmental causes are often preferred over flowers."
                ]
            }
        ]
    }
};
