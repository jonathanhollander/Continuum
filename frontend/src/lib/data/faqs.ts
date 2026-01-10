export interface FAQItem {
    question: string;
    answer: string;
    category: "General" | "Legal" | "Technical" | "Security";
}

export const faqs: FAQItem[] = [
    {
        question: "Do I need to complete everything at once?",
        answer: "No! Start with the Quick Start (30 minutes), then build over time. The 30-Day Plan is a suggested pace, but go at your own speed. Even partial documentation is better than none.",
        category: "General"
    },
    {
        question: "What if I don't have a Will or Trust yet?",
        answer: "Start anyway! Document your assets, wishes, and family information. This prep work will make meeting with an attorney much more efficient (and often cheaper).",
        category: "Legal"
    },
    {
        question: "Is my information secure?",
        answer: "This system runs locally on your machine or private server. We recommend keeping sensitive passwords OUT of plain text fields (use password hints) and encrypting your backups.",
        category: "Security"
    },
    {
        question: "How do I share this with my Executor?",
        answer: "You can export the entire workspace to PDF/HTML for a physical 'Red Binder', or if hosted personally, create a user account for them in the Admin Hub.",
        category: "Technical"
    },
    {
        question: "Can I customize the databases?",
        answer: "Yes, the system is flexible. You can add custom assets, document types, or even new modules if you're comfortable with the code.",
        category: "Technical"
    }
];
