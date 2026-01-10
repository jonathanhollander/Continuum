export const phase5Tasks = [
    {
        id: "task-36",
        title: "Final Income Tax Return",
        desc: "File Form 1040 for the deceased.",
        urgent: true,
        phase: "Closing",
        blocks: [
            { type: "heading_1", content: "Task 36: Final Income Tax" },
            { type: "paragraph", content: "You must file a final Form 1040 covering Jan 1 through date of death." },
            { type: "heading_2", content: "Details" },
            { type: "numbered_list_item", content: "**Due Date:** April 15 of year following death." },
            { type: "numbered_list_item", content: "**Marking:** Write 'DECEASED' on top of return." },
            { type: "numbered_list_item", content: "**Refunds:** Go to estate account." },
            { type: "callout", content: "JOINT FILING: Surviving spouse can usually file jointly for death year (better rates).", icon: "emoji:💡", color: "blue_background" }
        ]
    },
    {
        id: "task-37",
        title: "Estate Tax Return (If Required)",
        desc: "File Form 706 if estate > $13.6M.",
        urgent: false,
        phase: "Closing",
        blocks: [
            { type: "heading_1", content: "Task 37: Estate Tax" },
            { type: "paragraph", content: "Federal return only needed if estate > $13.61 million (2024). State thresholds may be lower ($1M+)." },
            { type: "heading_2", content: "Portability" },
            { type: "paragraph", content: "Even if no tax owed, you may want to file to transfer unused exemption to spouse ('portability')." },
            { type: "callout", content: "PROFESSIONAL HELP: Never DIY an estate tax return. Hire a specialist.", icon: "emoji:⚠️", color: "red_background" }
        ]
    },
    {
        id: "task-38",
        title: "Final Debt Payment",
        desc: "Pay all remaining debts after claim period.",
        urgent: true,
        phase: "Closing",
        blocks: [
            { type: "heading_1", content: "Task 38: Final Debt Payment" },
            { type: "paragraph", content: "Make final payments once creditor claim period expires (4-6 months)." },
            { type: "heading_2", content: "Steps" },
            { type: "numbered_list_item", content: "**Verify:** All claims are valid." },
            { type: "numbered_list_item", content: "**Priority:** Pay in legal priority order." },
            { type: "numbered_list_item", content: "**Receipts:** Get 'Paid in Full' confirmation." }
        ]
    },
    {
        id: "task-39",
        title: "Distribute Assets",
        desc: "Transfer assets to beneficiaries.",
        urgent: true,
        phase: "Closing",
        blocks: [
            { type: "heading_1", content: "Task 39: Asset Distribution" },
            { type: "paragraph", content: "The finish line! Transfer assets per the Will. DO NOT do this until debts/taxes are paid." },
            { type: "heading_2", content: "Procedure" },
            { type: "numbered_list_item", content: "**Specific Bequests:** First (e.g., 'Ring to Sarah')." },
            { type: "numbered_list_item", content: "**Residue:** Percentage splits of remaining pot." },
            { type: "numbered_list_item", content: "**Receipts:** BENEFICIARIES MUST SIGN RECEIPTS." },
            { type: "callout", content: "CYA: Get a signed receipt and liability release from every beneficiary.", icon: "emoji:🛡️", color: "blue_background" }
        ]
    },
    {
        id: "task-40",
        title: "Close Estate",
        desc: "Final accounting and discharge.",
        urgent: true,
        phase: "Closing",
        blocks: [
            { type: "heading_1", content: "Task 40: Close Estate" },
            { type: "paragraph", content: "File final accounting with court and get discharged as executor." },
            { type: "heading_2", content: "Final Checklist" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Assets Distributed" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Debts Paid" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Final Accounting Filed" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Bank Account Closed" } }] } }
        ]
    },
    {
        id: "task-41",
        title: "Assemble Professional Team",
        desc: "Coordinate attorney, CPA, and financial advisor.",
        urgent: true,
        phase: "Expert",
        blocks: [
            { type: "heading_1", content: "Task 41: Professional Team Assembly" },
            { type: "paragraph", content: "For complex estates, you need a coordinated team. One wrong move can lead to personal liability." },
            { type: "heading_2", content: "The Core Three" },
            { type: "bulleted_list_item", content: "**Estate Attorney:** For court filings and legal interpretation." },
            { type: "bulleted_list_item", content: "**CPA:** For the complex 'Form 706' and final income taxes." },
            { type: "bulleted_list_item", content: "**Financial Advisor:** To manage and rebalance portfolios during probate." },
            { type: "callout", content: "TEAM LEAD: Usually the attorney acts as the quarterback. Ensure they are all talking to each other.", icon: "emoji:👥", color: "blue_background" }
        ]
    },
    {
        id: "task-42",
        title: "Emergency Business Management",
        desc: "Handle immediate decisions for decedent-owned businesses.",
        urgent: true,
        phase: "Expert",
        blocks: [
            { type: "heading_1", content: "Task 42: Business Continuity" },
            { type: "paragraph", content: "If the deceased owned a business, it must keep running or be legally paused to prevent value loss." },
            { type: "heading_2", content: "Action Plan" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Appoint Interim Manager" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Review Operating Agreement" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Notify Key Employees/Clients" } }] } }
        ]
    },
    {
        id: "task-43",
        title: "Secure High-Value Collections",
        desc: "Art, Jewelry, Antiques, and specialized assets.",
        urgent: true,
        phase: "Assets",
        blocks: [
            { type: "heading_1", content: "Task 43: Specialized Assets" },
            { type: "paragraph", content: "Standard homeowners insurance often excludes high-value items. Secure these immediately." },
            { type: "heading_2", content: "Steps" },
            { type: "numbered_list_item", content: "**Inventory:** Take high-res photos and video." },
            { type: "numbered_list_item", content: "**Appraisal:** Hire an USPAP-certified appraiser." },
            { type: "numbered_list_item", content: "**Storage:** Move to climate-controlled secure storage if the home is empty." }
        ]
    },
    {
        id: "task-44",
        title: "Review Operating Agreements",
        desc: "Legal review of business succession clauses.",
        urgent: false,
        phase: "Expert",
        blocks: [
            { type: "heading_1", content: "Task 44: Succession Review" },
            { type: "paragraph", content: "Read the 'Buy-Sell' agreements or Operating Agreements. They often mandate what happens to shares at death." },
            { type: "callout", content: "DEADLINES: Many agreements have 30/60/90 day windows to exercise buy-out options.", icon: "emoji:⏰", color: "red_background" }
        ]
    },
    {
        id: "task-45",
        title: "Real Property Portfolio Audit",
        desc: "Manage multiple properties or out-of-state real estate.",
        urgent: false,
        phase: "Assets",
        blocks: [
            { type: "heading_1", content: "Task 45: Property Portfolio" },
            { type: "paragraph", content: "Out-of-state property may require 'Ancillary Probate' in that state." },
            { type: "heading_2", content: "To Do" },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Verify Title/Deeds" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Check Local Tax Status" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Hire Local Property Manager (if distant)" } }] } }
        ]
    },
    {
        id: "task-46",
        title: "Investment Portfolio Rebalancing",
        desc: "Manage market risk during the probate period.",
        urgent: false,
        phase: "Expert",
        blocks: [
            { type: "heading_1", content: "Task 46: Portfolio Risk" },
            { type: "paragraph", content: "You are responsible for 'Prudent Management'. If the market crashes and you did nothing, beneficiaries might sue." },
            { type: "callout", content: "PRUDENT INVESTOR ACT: Consult with a financial advisor on whether to move to cash or stay invested.", icon: "emoji:📈", color: "yellow_background" }
        ]
    },
    {
        id: "task-47",
        title: "Trust Administration Coordination",
        desc: "Sync with trustees of any pouring-over trusts.",
        urgent: false,
        phase: "Expert",
        blocks: [
            { type: "heading_1", content: "Task 47: Trust Coordination" },
            { type: "paragraph", content: "Many 'Pour-over Wills' move assets into a trust. You must coordinate with the Trustee (who might be someone else)." },
            { type: "heading_2", content: "Coordination Items" },
            { type: "bulleted_list_item", content: "Transfer of titles to Trust name" },
            { type: "bulleted_list_item", content: "Final asset accounting for the Trustee" }
        ]
    },
    {
        id: "task-48",
        title: "Advanced Tax Strategy (Form 706)",
        desc: "Handle Federal Estate Tax and Portability.",
        urgent: false,
        phase: "Expert",
        blocks: [
            { type: "heading_1", content: "Task 48: Estate Tax Strategy" },
            { type: "paragraph", content: "Even if no tax is due, you may file to protect the 'Portability' of the exemption for the surviving spouse." },
            { type: "callout", content: "DEADLINE: Form 706 is usually due within 9 months of death.", icon: "emoji:📅", color: "red_background" }
        ]
    },
    {
        id: "task-49",
        title: "Complex Distribution Planning",
        desc: "Partial distributions, trusts, and minor beneficiaries.",
        urgent: false,
        phase: "Closing",
        blocks: [
            { type: "heading_1", content: "Task 49: Advanced Distribution" },
            { type: "paragraph", content: "Handling distributions to minors or through custodial accounts (UTMA/UGMA)." },
            { type: "heading_2", content: "Safety First" },
            { type: "bulleted_list_item", content: "**Partial Distributions:** Get court approval if doing these early." },
            { type: "bulleted_list_item", content: "**Indemnity:** Have beneficiaries sign agreements to return funds if new debts appear." }
        ]
    },
    {
        id: "task-50",
        title: "Long-term Estate Maintenance",
        desc: "Managing multi-year probate if needed.",
        urgent: false,
        phase: "Closing",
        blocks: [
            { type: "heading_1", content: "Task 50: The Long Haul" },
            { type: "paragraph", content: "Some estates take 2-3 years to close due to litigation or tax audits. Stay organized." },
            { type: "heading_2", content: "Persistence" },
            { type: "bulleted_list_item", content: "Renew mail forwarding annually." },
            { type: "bulleted_list_item", content: "Keep the estate bank account active until the very end." },
            { type: "bulleted_list_item", content: "Send regular status updates to beneficiaries to prevent friction." },
            { type: "callout", content: "YOU FINISHED: Congratulations on navigating this monumental responsibility.", icon: "emoji:🏁", color: "green_background" }
        ]
    }
];

