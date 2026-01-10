export type TraditionConfig = {
    name: string;
    key: 'secular' | 'christian' | 'jewish' | 'muslim' | 'buddhist' | 'hindu' | 'other';
    commonRituals: string[];
    terminology: {
        service: string; // "Service", "Mass", "Janazah", etc.
        officiant: string; // "Celebrant", "Priest", "Rabbi", "Imam", "Monk"
        bodyPreparation: string; // "Embalming", "Tahara", "Ghusl", "Dressing"
    };
    dispositionPreference: 'burial' | 'cremation' | 'either';
    forbidden?: ('cremation' | 'embalming' | 'open_casket')[];
    smartTextareaPrompts: {
        atmosphere: string[];
        legacy: string[];
        foundation: string[];
    };
};

export const FUNERAL_TRADITIONS: Record<string, TraditionConfig> = {
    secular: {
        name: "Secular / Non-Religious",
        key: 'secular',
        commonRituals: ["Celebration of Life", "Toasts/Speeches", "Video Tribute", "Moment of Silence"],
        terminology: {
            service: "Celebration of Life",
            officiant: "Celebrant",
            bodyPreparation: "Dressing"
        },
        dispositionPreference: 'either',
        smartTextareaPrompts: {
            atmosphere: ["Focus on joyful memories", "Casual and uplifting", "Nature-connected"],
            legacy: ["Life lessons learned", "Favorite stories", "Impact on community"],
            foundation: ["Celebrating a life well lived", "Love and connection", "Simplicity and nature"]
        }
    },
    christian: {
        name: "Christian (General)",
        key: 'christian',
        commonRituals: ["Viewing/Wake", "Scripture Readings", "Hymns", "Committal Service"],
        terminology: {
            service: "Funeral Service",
            officiant: "Pastor/Minister",
            bodyPreparation: "Dressing"
        },
        dispositionPreference: 'either',
        smartTextareaPrompts: {
            atmosphere: ["Hopeful and reverent", "Celebration of homecoming", "Traditional hymns"],
            legacy: ["Faith journey", "Biblical values", "Service to the church"],
            foundation: ["Resurrection hope", "Stewardship", "Family and Faith"]
        }
    },
    jewish: {
        name: "Jewish",
        key: 'jewish',
        commonRituals: ["Keriah (Tearing Garment)", "Sitting Shiva", "Reciting Kaddish", "Shloshim", "Unveiling"],
        terminology: {
            service: "Funeral Service",
            officiant: "Rabbi",
            bodyPreparation: "Tahara"
        },
        dispositionPreference: 'burial',
        forbidden: ['cremation', 'embalming', 'open_casket'],
        smartTextareaPrompts: {
            atmosphere: ["Solemn and respectful", "Plain pine casket", "No flowers (Charity instead)"],
            legacy: ["Torah values", "Acts of Chesed (Kindness)", "Zionism/Community"],
            foundation: ["Tikkun Olam (Repairing the World)", "Family heritage", "Modesty and dignity"]
        }
    },
    muslim: {
        name: "Muslim",
        key: 'muslim',
        commonRituals: ["Janazah Prayer", "Prompt Burial (24h)", "Facing Qibla", "3-Day Mourning"],
        terminology: {
            service: "Janazah Prayer",
            officiant: "Imam",
            bodyPreparation: "Ghusl"
        },
        dispositionPreference: 'burial',
        forbidden: ['cremation', 'embalming'],
        smartTextareaPrompts: {
            atmosphere: ["Simple and humble", "Community prayer focus", "Swift procession"],
            legacy: ["Submission to Allah", "Charity (Sadaqah Jariyah)", "Family devotion"],
            foundation: ["Submission to Allah's will", "Simplicity", "Forgiveness"]
        }
    },
    hindu: {
        name: "Hindu",
        key: 'hindu',
        commonRituals: ["Antyesti (Last Sacrifice)", "Garlanding the Body", "Kapal Kriya", "Immersion of Ashes", "13-Day Mourning"],
        terminology: {
            service: "Antyesti",
            officiant: "Pandit/Priest",
            bodyPreparation: "Washing/Anointing"
        },
        dispositionPreference: 'cremation',
        smartTextareaPrompts: {
            atmosphere: ["Chanting Mantras", "White flowers/garlands", "Burning incense/ghee"],
            legacy: ["Karma and Dharma", "Liberation (Moksha)", "Ancestral connection"],
            foundation: ["Dharma (Duty)", "Moksha (Liberation)", "Cycle of Life"]
        }
    },
    buddhist: {
        name: "Buddhist",
        key: 'buddhist',
        commonRituals: ["Chanting Sutras", "Altar Offerings", "Merit Transference", "49-Day Transition"],
        terminology: {
            service: "Funeral Ceremony",
            officiant: "Monk",
            bodyPreparation: "Washing/Dressing"
        },
        dispositionPreference: 'cremation',
        smartTextareaPrompts: {
            atmosphere: ["Meditative and calm", "Sutra chanting", "Incense offerings"],
            legacy: ["Impermanence (Anicca)", "Compassion (Metta)", "Wisdom"],
            foundation: ["Peace and compassion", "Impermanence", "Mindfulness"]
        }
    },
    other: {
        name: "Other / Spiritual",
        key: 'other',
        commonRituals: ["Personalized Rituals"],
        terminology: {
            service: "Service",
            officiant: "Officiant",
            bodyPreparation: "Preparation"
        },
        dispositionPreference: 'either',
        smartTextareaPrompts: {
            atmosphere: ["Respectful tribute", "Unique cultural elements", "Personal spirituality"],
            legacy: ["Personal philosophy", "Creative spirit", "Love for family"],
            foundation: ["Personal truth", "Connection to nature", "Love"]
        }
    }
};
