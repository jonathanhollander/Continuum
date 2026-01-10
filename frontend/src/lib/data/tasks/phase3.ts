export const phase3Tasks = [
    {
        id: "task-21",
        title: "Notify Banks & Credit Unions",
        desc: "Freeze accounts and stop auto-payments.",
        urgent: true,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 21: Notify Banks" },
            { type: "paragraph", content: "Banks must be notified to freeze accounts + stop automatic withdrawals. You'll need Letters Testamentary." },
            { type: "heading_2", content: "Action Steps" },
            { type: "numbered_list_item", content: "**Call Bank:** Ask for Estate Services" },
            { type: "numbered_list_item", content: "**Submit Docs:** Death cert + Letters Testamentary" },
            { type: "numbered_list_item", content: "**Freeze:** Stop all auto-debits" },
            { type: "callout", content: "OVERDRAFT WARNING: Stop auto-payments BEFORE closing accounts to avoid fees.", icon: "emoji:⚠️", color: "red_background" }
        ]
    },
    {
        id: "task-22",
        title: "Notify Credit Cards",
        desc: "Cancel cards and stop interest.",
        urgent: true,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 22: Cancel Credit Cards" },
            { type: "paragraph", content: "Cancel cards immediately to prevent fraud. You are NOT personally liable for debt (unless joint owner)." },
            { type: "callout", content: "LIABILITY: You are not responsible for deceased's debt. Estate pays it.", icon: "emoji:🛡️", color: "blue_background" },
            { type: "heading_2", content: "Steps" },
            { type: "numbered_list_item", content: "**Call Number on Card**" },
            { type: "numbered_list_item", content: "**Report Death**" },
            { type: "numbered_list_item", content: "**Cut/Destroy Cards**" }
        ]
    },
    {
        id: "task-23",
        title: "Notify Investment Firms",
        desc: "Freeze trading and value assets.",
        urgent: false,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 23: Investment Accounts" },
            { type: "paragraph", content: "Notify brokerages to freeze trading. Get Date-of-Death valuation for taxes." },
            { type: "heading_2", content: "Tax Note" },
            { type: "bulleted_list_item", content: "**Step-up in Basis:** Assets usually re-valued at death date." },
            { type: "callout", content: "VALUATION: Request official 'Date of Death Valuation' statement.", icon: "emoji:📊", color: "blue_background" }
        ]
    },
    {
        id: "task-24",
        title: "Notify Insurance Companies",
        desc: "Life, Auto, Home, Health.",
        urgent: true,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 24: Insurance Notifications" },
            { type: "paragraph", content: "File life insurance claims. Cancel health/auto if not needed. Keep homeowners insurance ACTIVE." },
            { type: "heading_2", content: "Categories" },
            { type: "bulleted_list_item", content: "**Life:** File claim (requires death cert)" },
            { type: "bulleted_list_item", content: "**Health:** Cancel (stop premiums)" },
            { type: "bulleted_list_item", content: "**Home:** UPDATE policy to 'Estate/Unoccupied' - DO NOT CANCEL." },
            { type: "callout", content: "HOME INSURANCE: Vacant homes need special coverage. Notify insurer immediately.", icon: "emoji:🏠", color: "red_background" }
        ]
    },
    {
        id: "task-25",
        title: "Notify Mortgage Company",
        desc: "Discuss payment options or assumption.",
        urgent: true,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 25: Mortgage Notification" },
            { type: "paragraph", content: "Mortgage must still be paid. Heirs can often assume the loan." },
            { type: "heading_2", content: "Options" },
            { type: "bulleted_list_item", content: "**Continue Payments:** From estate funds" },
            { type: "bulleted_list_item", content: "**Assumption:** Heir takes over loan" },
            { type: "bulleted_list_item", content: "**Sell:** Pay off loan from proceeds" },
            { type: "callout", content: "KEEP PAYING: Do not miss payments! Foreclosure is still possible.", icon: "emoji:⚠️", color: "red_background" }
        ]
    },
    {
        id: "task-26",
        title: "Notify Pension & 401(k)",
        desc: "Claim retirement benefits.",
        urgent: false,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 26: Retirement Accounts" },
            { type: "paragraph", content: "Beneficiaries (not will) control these accounts." },
            { type: "heading_2", content: "Steps" },
            { type: "numbered_list_item", content: "**Contact Administrator**" },
            { type: "numbered_list_item", content: "**Check Beneficiary**" },
            { type: "numbered_list_item", content: "**File Claim**" }
        ]
    },
    {
        id: "task-27",
        title: "Social Media Management",
        desc: "Memorialize or delete accounts.",
        urgent: false,
        phase: "Digital",
        blocks: [
            { type: "heading_1", content: "Task 27: Social Media" },
            { type: "paragraph", content: "Memorialize Facebook/Instagram. Close LinkedIn/Twitter." },
            { type: "heading_2", content: "Links" },
            { type: "bulleted_list_item", content: "Facebook: Request Memorialization" },
            { type: "bulleted_list_item", content: "Twitter: Request Deactivation" },
            { type: "callout", content: "HACKING: Close accounts to prevent identity theft/spam.", icon: "emoji:🔒", color: "yellow_background" }
        ]
    },
    {
        id: "task-28",
        title: "Cancel Subscriptions",
        desc: "Stop recurring charges (Netflix, Gym, etc).",
        urgent: false,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 28: Cancel Subscriptions" },
            { type: "paragraph", content: "Review bank/credit card statements for recurring fees." },
            { type: "heading_2", content: "Checklist" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Streaming (Netflix, Hulu)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Gym Memberships" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Magazines/Newspapers" } }] } },
            { type: "callout", content: "REFUNDS: Ask for pro-rated refunds for annual memberships.", icon: "emoji:💰", color: "blue_background" }
        ]
    },
    {
        id: "task-29",
        title: "Mail Forwarding",
        desc: "Redirect mail to executor.",
        urgent: true,
        phase: "Administrative",
        blocks: [
            { type: "heading_1", content: "Task 29: Mail Forwarding" },
            { type: "paragraph", content: "Forward mail to catch bills, tax forms, and legal notices." },
            { type: "heading_2", content: "How" },
            { type: "numbered_list_item", content: "**USPS.com:** 'Change of Address'" },
            { type: "numbered_list_item", content: "**Individual:** Select 'Individual' (not Family)" },
            { type: "callout", content: "DURATION: Valid for 12 months. Renew if probate takes longer.", icon: "emoji:📬", color: "yellow_background" }
        ]
    },
    {
        id: "task-30",
        title: "Notify Credit Bureaus",
        desc: "Prevent post-death identity theft.",
        urgent: true,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 30: Notify Credit Bureaus" },
            { type: "paragraph", content: "Flag credit file as 'Deceased' to stop new accounts." },
            { type: "heading_2", content: "Bureaus" },
            { type: "bulleted_list_item", content: "Equifax" },
            { type: "bulleted_list_item", content: "Experian" },
            { type: "bulleted_list_item", content: "TransUnion" },
            { type: "callout", content: "IDENTITY THEFT: 2.5 million deceased identities stolen yearly. Do this ASAP.", icon: "emoji:🛡️", color: "red_background" }
        ]
    }
];
