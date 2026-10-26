export const phase4Tasks = [
    {
        id: "task-31",
        title: "Inventory Assets & Valuations",
        desc: "Catalog everything for probate and taxes.",
        urgent: true,
        phase: "Assets",
        blocks: [
            { type: "heading_1", content: "Task 31: Asset Inventory" },
            { type: "paragraph", content: "A complete inventory with 'Date of Death' values helps the probate court." },
            { type: "heading_2", content: "Key Categories" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Real Estate (an appraisal gives the value the court needs)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Bank Accounts" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Investment Accounts" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Vehicles (Kelley Blue Book)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Personal Property (Jewelry, Art)" } }] } },
            { type: "callout", content: "Courts usually ask for the inventory within 90 days.", icon: "emoji:⏰", color: "red_background" }
        ]
    },
    {
        id: "task-32",
        title: "Pay Debts & Expenses",
        desc: "Pay expenses in legal priority order.",
        urgent: true,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 32: Pay Debts" },
            { type: "paragraph", content: "Pay estate debts in strict legal order. If you pay low-priority debts first, you may be personally liable." },
            { type: "heading_2", content: "Typical Priority" },
            { type: "numbered_list_item", content: "**1. Funeral Costs**" },
            { type: "numbered_list_item", content: "**2. Admin Expenses** (Attorney, Court)" },
            { type: "numbered_list_item", content: "**3. Taxes** (Federal/State)" },
            { type: "numbered_list_item", content: "**4. Medical Bills** (Last illness)" },
            { type: "numbered_list_item", content: "**5. Unsecured Debts** (Credit Cards)" },
            { type: "callout", content: "If debts are larger than assets, the estate settles what it can. Your own funds stay yours.", icon: "emoji:🛡️", color: "yellow_background" }
        ]
    },
    {
        id: "task-33",
        title: "File Insurance Claims",
        desc: "Claim life insurance and death benefits.",
        urgent: false,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 33: Insurance Claims" },
            { type: "paragraph", content: "File claims for life insurance, accidental death, and employer benefits." },
            { type: "heading_2", content: "Checklist" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Life Insurance Policies" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Social Security ($255 lump sum)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Employer Death Benefits" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Veterans Benefits (Burial/Pension)" } }] } }
        ]
    },
    {
        id: "task-34",
        title: "Manage Real Estate",
        desc: "Maintain property value and safety.",
        urgent: true,
        phase: "Assets",
        blocks: [
            { type: "heading_1", content: "Task 34: Manage Real Estate" },
            { type: "paragraph", content: "Keep property secure, insured, and maintained. Keeping the home secure and insured keeps it safe." },
            { type: "heading_2", content: "Action Plan" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Notify Insurer (Vacancy Rider)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Maintain Utilities (Heat/Electric)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Weekly Inspections" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Lawn Care / Snow Removal" } }] } }
        ]
    },
    {
        id: "task-35",
        title: "Personal Property Management",
        desc: "Secure, appraise, and distribute belongings.",
        urgent: true,
        phase: "Assets",
        blocks: [
            { type: "heading_1", content: "Task 35: Personal Property" },
            { type: "paragraph", content: "Placing valuables somewhere safe early keeps everything accounted for." },
            { type: "heading_2", content: "Process" },
            { type: "numbered_list_item", content: "**Secure:** Lock up small valuables." },
            { type: "numbered_list_item", content: "**Inventory:** Photograph everything." },
            { type: "numbered_list_item", content: "**Appraise:** Jewelry/Art > $3,000." },
            { type: "numbered_list_item", content: "**Distribute:** Per will (use lottery system if unspecified)." },
            { type: "callout", content: "A round-robin selection works well for items the will leaves open.", icon: "emoji:💡", color: "blue_background" }
        ]
    }
];
