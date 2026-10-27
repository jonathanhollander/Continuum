export interface FAQItem {
    question: string;
    answer: string;
    category: "General" | "Legal" | "Technical" | "Security";
}

export const faqs: FAQItem[] = [
    {
        question: "Where should I begin?",
        answer: "Start with something your family will need: a person to contact, a letter, or an account. Save the record, then reopen it to check the details. You can add the rest over time.",
        category: "General"
    },
    {
        question: "Can I start before I have a will or trust?",
        answer: "You can still record accounts, people, wishes and questions for an adviser. In Legal documents, note which papers you have and where the originals are kept. A will and someone's authority to act come from signed legal documents; your notes here help you prepare them with your adviser.",
        category: "Legal"
    },
    {
        question: "What should I record about access to an account?",
        answer: "Record the institution, identifying details, contact person and where to find access instructions. Use a password manager for passwords rather than placing them in ordinary notes. Preview the recipient's page before sharing, and keep any downloaded copy somewhere you choose.",
        category: "Security"
    },
    {
        question: "How do I share records with my son or executor?",
        answer: "Open Family & Contacts, choose the person and create their recipient link. Add a note, then preview the page to check what they will see before you share the link yourself. Marking someone as executor records that role; sharing happens through the recipient link you send. Their page lets them read the shared records and download a copy with available files.",
        category: "Technical"
    },
    {
        question: "How do I keep a copy outside Continuum?",
        answer: "Open the Red Binder to print or save a PDF, or download the full record and files as a ZIP. Extract the ZIP, open packet.html and keep the files folder beside it. The ZIP also includes packet.pdf, the recorded data and a file manifest. Review any files-to-revisit notice before relying on the copy.",
        category: "Technical"
    },
    {
        question: "Where do I record details beyond the usual fields?",
        answer: "Use the record's notes and, where offered, custom fields. For example, add an account's branch contact or an heirloom's repair history. Save and reopen the record, then preview the recipient page or Red Binder to check how those details read.",
        category: "General"
    }
];
