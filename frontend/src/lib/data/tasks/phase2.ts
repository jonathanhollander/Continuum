export const phase2Tasks = [
    {
        id: "task-11",
        title: "File Will with Probate Court",
        desc: "Confirm the correct court, filing requirements and deadline.",
        urgent: true,
        phase: "Legal",
        blocks: [
            {"type": "heading_1", "content": "Task 11: File Will with Probate Court"},
            {"type": "paragraph", "content": "Locate the original will and establish the applicable filing process with the relevant court or estate adviser."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask which court or procedure applies, who may file, what authority is needed and the actual filing deadline."},
            {"type": "numbered_list_item", "content": "Confirm required originals or copies, forms, beneficiary details, fees and how documents should be submitted."},
            {"type": "numbered_list_item", "content": "Record the submission receipt, case reference and any hearing or follow-up date provided by the court."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Original will located; confirm what the court requires" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Certified death certificate" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Petition for probate (court form)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "List of heirs and beneficiaries with addresses" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Current filing fee and payment method confirmed" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-12",
        title: "Obtain Letters Testamentary",
        desc: "Confirm the authority and evidence each institution requires.",
        urgent: true,
        phase: "Legal",
        blocks: [
            {"type": "heading_1", "content": "Task 12: Obtain Letters Testamentary"},
            {"type": "paragraph", "content": "Being named as executor in Continuum does not establish authority to act. Find out which appointment or other evidence applies."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask the relevant court or adviser which appointment process applies and which documents show the person’s authority."},
            {"type": "numbered_list_item", "content": "Record any application, hearing or appointment details and questions still outstanding."},
            {"type": "numbered_list_item", "content": "Ask each institution what evidence it accepts, whether certification is needed and whether documents are returned before ordering copies."},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-13",
        title: "Publish Death Notice",
        desc: "Check whether a creditor notice is required and how to give it.",
        urgent: true,
        phase: "Legal",
        blocks: [
            {"type": "heading_1", "content": "Task 13: Publish Death Notice"},
            {"type": "paragraph", "content": "Distinguish a legal creditor notice from a personal obituary or funeral announcement."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask the court or estate adviser whether a notice is required for this estate, who must receive it and which dates apply."},
            {"type": "numbered_list_item", "content": "If publication is needed, confirm the approved wording, publication method, duration and cost with the relevant authority."},
            {"type": "numbered_list_item", "content": "Keep the notice, submission reference and proof of publication or service, with any response dates in your notes."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Check probate court requirements" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Identify court-approved newspaper" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Publication duration confirmed and completed, if required" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Obtain Affidavit of Publication" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-14",
        title: "Notify Social Security",
        desc: "Confirm the death report and ask about benefit questions.",
        urgent: true,
        phase: "Government",
        blocks: [
            {"type": "heading_1", "content": "Task 14: Notify Social Security"},
            {"type": "paragraph", "content": "Find any recorded benefit details and establish who has already contacted Social Security."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask the funeral director or responsible person whether a report has been made; confirm what remains to be done through an official agency contact."},
            {"type": "numbered_list_item", "content": "Ask the agency how to handle payments already received and what evidence it needs before making changes."},
            {"type": "numbered_list_item", "content": "Ask about possible survivor benefits, who may apply, required documents and dates. Record the answer rather than assuming eligibility."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "SSN" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Date of death" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-15",
        title: "Notify IRS & Tax Authorities",
        desc: "Establish which tax filings, identifiers and dates apply.",
        urgent: false,
        phase: "Government",
        blocks: [
            {"type": "heading_1", "content": "Task 15: Notify IRS & Tax Authorities"},
            {"type": "paragraph", "content": "Gather the recorded tax contacts and papers for the person handling the estate’s tax work."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask the tax adviser or relevant authority which personal, estate and local filings are needed and who may sign them."},
            {"type": "numbered_list_item", "content": "Confirm whether a tax identifier is required; gather income statements and other documents requested by the preparer."},
            {"type": "numbered_list_item", "content": "Record each filing period, due date, extension decision, preparer and document still needed."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Tax identifier question confirmed (Task 19)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Gather W-2s and 1099s" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Applicable filing date confirmed and return submitted" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-16",
        title: "Cancel Driver's License",
        desc: "Ask the licensing authority how to update its record.",
        urgent: true,
        phase: "Government",
        blocks: [
            {"type": "heading_1", "content": "Task 16: Cancel Driver's License"},
            {"type": "paragraph", "content": "Find the licence details without sending originals or personal information to an unverified contact."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Use the licensing authority’s official contact to ask how to report a death and who may do so."},
            {"type": "numbered_list_item", "content": "Confirm the documents, accepted submission method and any applicable date before mailing or surrendering a licence."},
            {"type": "numbered_list_item", "content": "Keep the acknowledgment and record any related vehicle-title question separately."},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-17",
        title: "Notify Voter Registration",
        desc: "Confirm the registrar’s notification process.",
        urgent: false,
        phase: "Government",
        blocks: [
            {"type": "heading_1", "content": "Task 17: Notify Voter Registration"},
            {"type": "paragraph", "content": "Identify the relevant voter-registration office and whether it already received a death notification."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask the registrar through its official contact how to update the record and what evidence it requires."},
            {"type": "numbered_list_item", "content": "Confirm who should submit the request and how to keep a reference or acknowledgment."},
            {"type": "numbered_list_item", "content": "Record the date reported and any follow-up the office requests."},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-18",
        title: "Set Up Estate Bank Account",
        desc: "Ask the bank about the appropriate estate account.",
        urgent: true,
        phase: "Financial",
        blocks: [
            {"type": "heading_1", "content": "Task 18: Set Up Estate Bank Account"},
            {"type": "paragraph", "content": "Arrange a way to track authorized estate funds and payments separately from personal spending."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Ask the estate adviser who may open and operate an account and which arrangements apply to this estate."},
            {"type": "numbered_list_item", "content": "Ask the bank for its current list of authority documents, tax identifiers, fees and account requirements."},
            {"type": "numbered_list_item", "content": "Record the account’s purpose, authorized operators and statement location in the financial records."},
            {"type": "heading_2", "content": "Your saved checks"},
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Letters Testamentary" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Estate EIN (Task 19)" } }] } },
            { type: "to_do", to_do: { checked: false, rich_text: [{ text: { content: "Death Certificate" } }] } },
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-19",
        title: "Obtain Estate EIN",
        desc: "Confirm whether an estate tax identifier is needed.",
        urgent: true,
        phase: "Financial",
        blocks: [
            {"type": "heading_1", "content": "Task 19: Obtain Estate EIN"},
            {"type": "paragraph", "content": "Ask the tax preparer and bank which identifier applies before starting an application."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Confirm who should apply, which official process and form to use, and what information is needed."},
            {"type": "numbered_list_item", "content": "Use the tax authority’s official service and record the application reference and any response date."},
            {"type": "numbered_list_item", "content": "Keep the confirmation with the estate’s tax papers and tell the bank or preparer where it is recorded."},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    },
    {
        id: "task-20",
        title: "Create Document System",
        desc: "Organize originals, copies, correspondence and receipts.",
        urgent: true,
        phase: "Administrative",
        blocks: [
            {"type": "heading_1", "content": "Task 20: Create Document System"},
            {"type": "paragraph", "content": "Create a consistent record of the papers and files gathered during administration."},
            {"type": "heading_2", "content": "Questions and next actions"},
            {"type": "numbered_list_item", "content": "Group documents by legal, financial, insurance and property matters; name files so the person and purpose are clear."},
            {"type": "numbered_list_item", "content": "Record original locations and who holds each item. Keep institution replies and receipts beside their related record."},
            {"type": "numbered_list_item", "content": "Ask the court or adviser what records must be retained and for how long; note that answer and who will keep them."},
            {"type": "paragraph", "content": "Use your notes below for the contact, answer, source document and next action. Mark this step finished when the relevant work is complete or its outcome is recorded."}
        ]
    }
];
