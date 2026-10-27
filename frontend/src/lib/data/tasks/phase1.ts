export const phase1Tasks = [
    {
        id: "task-01",
        title: "Locate Will & Legal Documents",
        desc: "Find the originals and record who holds them.",
        urgent: true,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 01: Locate Will & Legal Documents"},
            {"type": "paragraph", "content": "Start with the saved legal records, then locate the signed papers and anyone who holds them."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Where is the latest signed will, and who has access to the original?"},
            {"type": "numbered_list_item", "content": "Ask the relevant court or estate adviser what must be filed, by whom and by what date. Record their answer and contact details."},
            {"type": "numbered_list_item", "content": "List each original’s location and any copies gathered. Keep questions about authority alongside the documents for the adviser."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Last Will and Testament (the signed original)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Trust documents (if applicable)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Power of Attorney documents" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Healthcare directive / Living will" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Marriage certificate, divorce decrees" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Birth certificates (deceased and beneficiaries)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Property deeds and titles" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-02",
        title: "Order Death Certificates",
        desc: "Confirm which certified copies are needed before ordering.",
        urgent: true,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 02: Order Death Certificates"},
            {"type": "paragraph", "content": "Make an institution-by-institution list so you can request the right documents."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask each bank, insurer and other institution whether it needs a certified copy, a scan or another document, and whether it returns originals."},
            {"type": "numbered_list_item", "content": "Ask the funeral director or relevant vital-records office how to order, who can request copies, the current price and expected availability."},
            {"type": "numbered_list_item", "content": "Record the quantity ordered, order reference, delivery address and which institution received each copy."},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-03",
        title: "Secure Property & Valuables",
        desc: "Record who is looking after the home and valuables.",
        urgent: true,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 03: Secure Property & Valuables"},
            {"type": "paragraph", "content": "Use the property records and Home manual to organize access, safety and ongoing care."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Who can lawfully access the property, and who has keys? Agree who will inspect it and record their contact details."},
            {"type": "numbered_list_item", "content": "Check current insurance, occupancy conditions, alarm instructions and essential utilities before changing arrangements."},
            {"type": "numbered_list_item", "content": "Photograph items and note their locations before an authorized move. Record who holds keys and where valuables are kept."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Access and lock arrangements agreed with the authorized person" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Collect all keys (home, car, storage, office)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Secure vehicles (garage or off-street parking)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Valuables secured by the authorized person; location recorded" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Set up mail hold or forwarding" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Notify neighbors/building management of executor role" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-04",
        title: "Pet Care Arrangements",
        desc: "Arrange care using the recorded pet instructions.",
        urgent: true,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 04: Pet Care Arrangements"},
            {"type": "paragraph", "content": "Find the pets, their current carers and any immediate food, medication or shelter needs."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Open the Pets record for the intended carer, vet, routine, medications and owner’s wishes."},
            {"type": "numbered_list_item", "content": "Confirm that the named person can provide care, or agree a temporary arrangement and record where each pet is staying."},
            {"type": "numbered_list_item", "content": "Ask the vet or care provider about supplies and costs. Note who will pay and any instructions still needed."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Ensure pets have food, water, shelter TODAY" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Check will for pet guardian designation" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Contact designated pet guardian if named" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Arrange temporary foster if no immediate solution" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-05",
        title: "Family & Friend Notifications",
        desc: "Follow the recorded contact order and track who has heard.",
        urgent: true,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 05: Family & Friend Notifications"},
            {"type": "paragraph", "content": "Start with the owner’s saved contact choices rather than assuming a family relationship determines priority."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Review Contacts for who should hear first, who can help notify others and anyone marked kept private."},
            {"type": "numbered_list_item", "content": "Agree who will contact each person and what information the family wants shared. Check service details before including them."},
            {"type": "numbered_list_item", "content": "Record who was contacted, by whom, when and any follow-up needed. Example: “Alex called Sam; service details to follow.”"},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-06",
        title: "Funeral Director Contact",
        desc: "Confirm arrangements, wishes, documents and costs.",
        urgent: true,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 06: Funeral Director Contact"},
            {"type": "paragraph", "content": "Open the recorded funeral wishes before discussing arrangements with a funeral director."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Which wishes, cultural practices, burial or cremation preferences and existing arrangements are recorded? Ask what decisions are needed now."},
            {"type": "numbered_list_item", "content": "Request a written description and price for the proposed services. Ask which authorizations and documents are needed and who can provide them."},
            {"type": "numbered_list_item", "content": "Record the agreed contact, arrangements, costs, decisions still open and who will confirm them."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Deceased's clothing for viewing/burial (if applicable)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Wedding ring or jewelry preferences" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Recent photo for obituary" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Deceased's funeral preferences (the Funeral wishes page in Continuum)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Family information for obituary" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Written costs and payment arrangements reviewed" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-07",
        title: "Safe Deposit Box Access",
        desc: "Ask the bank about access and keep a contents record.",
        urgent: true,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 07: Safe Deposit Box Access"},
            {"type": "paragraph", "content": "Use the account records to identify the bank, box reference and anyone recorded as having access."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask the bank who can access this box and what identification, authority and documents it requires."},
            {"type": "numbered_list_item", "content": "If an original will may be inside, ask the bank and estate adviser how it can be located under the applicable procedure."},
            {"type": "numbered_list_item", "content": "For an authorized opening, record who attended, list or photograph the contents and note any items moved and their new location."},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-08",
        title: "Estate Expense Tracking",
        desc: "Keep receipts and ask how expenses will be approved.",
        urgent: false,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 08: Estate Expense Tracking"},
            {"type": "paragraph", "content": "Record estate-related spending separately so the responsible person can review it."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "For each expense, note date, supplier, purpose, amount, currency, payer and receipt location."},
            {"type": "numbered_list_item", "content": "Ask the estate adviser which expenses, reimbursements and fees require approval and what supporting records to keep."},
            {"type": "numbered_list_item", "content": "Agree how authorized expenses will be paid and reviewed. Record any reimbursement request and its outcome."},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-09",
        title: "Master Contact List",
        desc: "Build a contact list with the next action for each institution.",
        urgent: false,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 09: Master Contact List"},
            {"type": "paragraph", "content": "Use saved people, accounts and policies to identify the institutions you need to speak with."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Record the institution, account or policy reference, department, contact person and a verified contact method."},
            {"type": "numbered_list_item", "content": "Ask what documents or authority are required, the next step, any applicable date and the reference for the conversation."},
            {"type": "numbered_list_item", "content": "Use your notes to track the last contact and next follow-up. Link any reply or document to the relevant record."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Banks & credit unions" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Credit card companies" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Investment firms & brokerage accounts" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Retirement accounts (401k, IRA)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Life insurance companies" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Social Security Administration (1-800-772-1213)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "IRS (to file final tax return)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "DMV (driver's license, vehicle titles)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Utilities (electric, gas, water, trash)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Subscription services (Netflix, gym, clubs)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Employer/HR department" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-10",
        title: "Employer Notification",
        desc: "Ask HR about final pay, benefits and company property.",
        urgent: true,
        phase: "Immediate",
        blocks: [
            {"type": "heading_1", "content": "Task 10: Employer Notification"},
            {"type": "paragraph", "content": "Find the employer contact and any recorded employment or benefit details."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask HR who handles a death notification and what documents they need."},
            {"type": "numbered_list_item", "content": "Ask about outstanding pay, retirement plans, insurance and any survivor or continuation options; record eligibility questions and applicable claim dates."},
            {"type": "numbered_list_item", "content": "Agree how company property and personal belongings will be handled, and record each contact and next action."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Final paycheck (unpaid wages, vacation/PTO payout)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "401(k) or pension account details" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Life insurance policy information" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Health insurance continuation options (COBRA)" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    }
];
