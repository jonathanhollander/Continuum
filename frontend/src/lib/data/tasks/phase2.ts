export const phase2Tasks = [
    {
        id: "task-11",
        title: "File Will with Probate Court",
        desc: "File original will within 30 days (mandatory).",
        urgent: true,
        phase: "Legal",
        blocks: [
            { type: "heading_1", content: "Task 11: File Will with Probate Court" },
            { type: "paragraph", content: "Most states ask for the will to be filed with the probate court within about 30 days. Filing it keeps things in good order." },
            { type: "callout", content: "Most states ask for filing within 30 days, and a few allow up to 4 years. Filing early keeps things simple.", icon: "emoji:⚠️", color: "red_background" },
            { type: "heading_2", content: "What You Need to File" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Original will (NOT a photocopy - court requires original)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Certified death certificate" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Petition for probate (court form)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "List of heirs and beneficiaries with addresses" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Filing fee ($200-$400 varies by county)" } }] } },
            { type: "heading_2", content: "Where to File" },
            { type: "bulleted_list_item", content: "Probate court in the county where deceased lived" },
            { type: "bulleted_list_item", content: "If property in multiple states, may need ancillary probate" },
            { type: "heading_2", content: "Filing Process" },
            { type: "numbered_list_item", content: "**Locate probate court:** Google '[County] probate court'" },
            { type: "numbered_list_item", content: "**Obtain forms:** Download from court website" },
            { type: "numbered_list_item", content: "**Complete petition:** List all beneficiaries" },
            { type: "numbered_list_item", content: "**File documents:** Submit will + petition + fee" },
            { type: "numbered_list_item", content: "**Schedule hearing:** Court will set date (2-4 weeks)" },
            { type: "callout", content: "ATTORNEY HELP: If estate is complex (over $500K, multiple properties), consider hiring probate attorney before filing.", icon: "emoji:💡", color: "blue_background" }
        ]
    },
    {
        id: "task-12",
        title: "Obtain Letters Testamentary",
        desc: "Get court authority to act as executor.",
        urgent: true,
        phase: "Legal",
        blocks: [
            { type: "heading_1", content: "Task 12: Obtain Letters Testamentary" },
            { type: "paragraph", content: "Letters Testamentary (or Letters of Administration) prove you're the legal executor. With them, banks and agencies can work with you." },
            { type: "heading_2", content: "How to Obtain" },
            { type: "numbered_list_item", content: "**File will with court** (Task 11)" },
            { type: "numbered_list_item", content: "**Attend probate hearing** (2-4 weeks later)" },
            { type: "numbered_list_item", content: "**Court approves executor**" },
            { type: "numbered_list_item", content: "**Request Letters from clerk**" },
            { type: "numbered_list_item", content: "**Order 10-15 certified copies**" },
            { type: "callout", content: "COST: Each certified copy costs $5-$15. Order 10-15 copies now - you'll need one for each institution.", icon: "emoji:💰", color: "yellow_background" }
        ]
    },
    {
        id: "task-13",
        title: "Publish Death Notice",
        desc: "Legal requirement to notify creditors.",
        urgent: true,
        phase: "Legal",
        blocks: [
            { type: "heading_1", content: "Task 13: Publish Death Notice" },
            { type: "paragraph", content: "Most states require publishing a death notice in local newspapers to notify creditors. This is different from an obituary." },
            { type: "heading_2", content: "Requirements" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Check probate court requirements" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Identify court-approved newspaper" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Publish for required duration (3-4 weeks)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Obtain Affidavit of Publication" } }] } },
            { type: "callout", content: "COURT TEMPLATE: Use the exact wording provided by the court clerk to ensure compliance.", icon: "emoji:📋", color: "red_background" }
        ]
    },
    {
        id: "task-14",
        title: "Notify Social Security",
        desc: "Stop benefits and claim survivor payments.",
        urgent: true,
        phase: "Government",
        blocks: [
            { type: "heading_1", content: "Task 14: Notify Social Security Administration" },
            { type: "paragraph", content: "Reporting early helps benefits stop smoothly and opens survivor payments." },
            { type: "callout", content: "Payments received in the month of death are reclaimed, so it helps to set that money aside.", icon: "emoji:⚠️", color: "red_background" },
            { type: "heading_2", content: "How to Notify" },
            { type: "numbered_list_item", content: "**Funeral home:** Usually reports automatically" },
            { type: "numbered_list_item", content: "**Phone:** 1-800-772-1213" },
            { type: "heading_2", content: "Information Needed" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "SSN" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Date of death" } }] } },
            { type: "heading_2", content: "Survivor Benefits" },
            { type: "bulleted_list_item", content: "Spouse (age 60+)" },
            { type: "bulleted_list_item", content: "Children (under 18)" },
            { type: "bulleted_list_item", content: "Lump sum death benefit ($255)" },
            { type: "callout", content: "Survivor benefits begin when you call to request them.", icon: "emoji:📞", color: "blue_background" }
        ]
    },
    {
        id: "task-15",
        title: "Notify IRS & Tax Authorities",
        desc: "Prepare for final tax return filing.",
        urgent: false,
        phase: "Government",
        blocks: [
            { type: "heading_1", content: "Task 15: Notify IRS" },
            { type: "paragraph", content: "You'll need to file a final income tax return (Form 1040) for the deceased. You may also need to file an Estate Income Tax return (Form 1041)." },
            { type: "heading_2", content: "Steps" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Obtain EIN (Task 19)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Gather W-2s and 1099s" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "File final return by April 15" } }] } },
            { type: "callout", content: "HIRE HELP: For complex estates, hiring a CPA is highly recommended to avoid penalties.", icon: "emoji:💡", color: "yellow_background" }
        ]
    },
    {
        id: "task-16",
        title: "Cancel Driver's License",
        desc: "Prevent identity theft.",
        urgent: true,
        phase: "Government",
        blocks: [
            { type: "heading_1", content: "Task 16: Cancel Driver's License" },
            { type: "paragraph", content: "Canceling the license prevents identity theft and insurance fraud." },
            { type: "heading_2", content: "How to Cancel" },
            { type: "numbered_list_item", content: "**Mail:** Send license + death certificate to DMV" },
            { type: "numbered_list_item", content: "**In Person:** Visit local DMV office" },
            { type: "callout", content: "IDENTITY THEFT: Do this within 30 days to remove ID from active databases.", icon: "emoji:⚠️", color: "red_background" }
        ]
    },
    {
        id: "task-17",
        title: "Notify Voter Registration",
        desc: "Remove from voter rolls.",
        urgent: false,
        phase: "Government",
        blocks: [
            { type: "heading_1", content: "Task 17: Notify Voter Registration" },
            { type: "paragraph", content: "Remove deceased from voter rolls to prevent identity theft and election fraud." },
            { type: "heading_2", content: "How to Notify" },
            { type: "numbered_list_item", content: "**Detail:** Contact County Registrar of Voters" },
            { type: "numbered_list_item", content: "**Send:** Death certificate copy + removal request" }
        ]
    },
    {
        id: "task-18",
        title: "Set Up Estate Bank Account",
        desc: "Keep estate funds in their own account.",
        urgent: true,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 18: Estate Bank Account" },
            { type: "paragraph", content: "Keeping estate funds in their own account keeps things clear." },
            { type: "callout", content: "LEGAL PROTECTION: Commingling funds is illegal. Always use a separate account.", icon: "emoji:⚠️", color: "red_background" },
            { type: "heading_2", content: "Requirements" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Letters Testamentary" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Estate EIN (Task 19)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Death Certificate" } }] } }
        ]
    },
    {
        id: "task-19",
        title: "Obtain Estate EIN",
        desc: "Get Tax ID for the estate (Free).",
        urgent: true,
        phase: "Financial",
        blocks: [
            { type: "heading_1", content: "Task 19: Obtain Estate EIN" },
            { type: "paragraph", content: "An EIN is required for the estate bank account and tax filings. It's free and takes 15 minutes online at IRS.gov." },
            { type: "heading_2", content: "How to Apply" },
            { type: "numbered_list_item", content: "**Go to IRS.gov** search 'Apply for EIN online'" },
            { type: "numbered_list_item", content: "**Select 'Estate'**" },
            { type: "numbered_list_item", content: "**Complete Form SS-4**" },
            { type: "numbered_list_item", content: "**Save confirmation PDF** (Required for bank)" },
            { type: "callout", content: "This comes before the bank visit. They open the account once you have it.", icon: "emoji:⏰", color: "yellow_background" }
        ]
    },
    {
        id: "task-20",
        title: "Create Document System",
        desc: "Organize paper and digital files.",
        urgent: true,
        phase: "Administrative",
        blocks: [
            { type: "heading_1", content: "Task 20: Document Organization" },
            { type: "paragraph", content: "You'll handle hundreds of documents. Set up a system NOW." },
            { type: "heading_2", content: "Categories" },
            { type: "bulleted_list_item", content: "Legal (Will, Court Orders)" },
            { type: "bulleted_list_item", content: "Financial (Bank, Tax, Debts)" },
            { type: "bulleted_list_item", content: "Insurance" },
            { type: "bulleted_list_item", content: "Real Estate" },
            { type: "callout", content: "RECEIPT RULE: Keep EVERY receipt. Probate court may require proof of every penny.", icon: "emoji:🧾", color: "red_background" }
        ]
    }
];
