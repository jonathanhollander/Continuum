export type LetterTemplate = {
    id: string;
    title: string;
    category: "Financial" | "Government" | "Identity" | "Service" | "Employment" | "Asset" | "Emotional" | "Digital" | "Housing" | "Medical" | "Professional" | "Social" | "Saved";
    audience: string;
    subject: string;
    body: string;
    requiredDocs?: string[];
    followUp?: string;
};

export const LETTER_TEMPLATES: LetterTemplate[] = [
    // --- Financial ---
    {
        id: "bank-closure",
        title: "Bank Account Closure",
        category: "Financial",
        audience: "Bank Manager",
        subject: "Notification of Death and Request to Close Accounts - [Account Holder Name]",
        body: `To the Estate Unit Manager,

I am writing to notify you of the death of [Account Holder Name], who passed away on [Date of Death]. I am the [Executor/Administrator] of the estate.

Please close the following accounts and release the funds to the Estate of [Account Holder Name]:
- Account Type: [Checking/Savings]
- Account Number: [Last 4 Digits]

Enclosed are the Death Certificate and Letters Testamentary/Administration.

Please advise on the specific process to transfer remaining funds.

Sincerely,
[Your Name]
[Executor/Administrator]`,
        requiredDocs: [
            "Which proof of death and estate authority do you require?",
            "How should account references and supporting documents be provided?",
        ],
        followUp: "What are the next steps for this account, and when should the estate contact follow up?"
    },
    {
        id: "credit-card-cancel",
        title: "Closing a Credit Card",
        category: "Financial",
        audience: "Card Issuer",
        subject: "Notification of Death - Account Closure Request",
        body: `To Customer Service,

Please be advised that [Cardholder Name] passed away on [Date of Death].

I am requesting that you close the following credit card account(s) at your earliest convenience to prevent any new charges:
- Card Ending In: [Last 4 Digits]

Please send a final statement to the estate address listed below.

Sincerely,
[Your Name]
[Executor/Administrator]`,
        requiredDocs: [
            "Which account reference and proof of authority do you require?",
            "What documents are needed for closure and the final statement?",
        ],
        followUp: "Which recurring payments or pending charges need attention through your process?"
    },
    {
        id: "mortgage-notice",
        title: "Mortgage Servicer Notice",
        category: "Financial",
        audience: "Loan Servicer",
        subject: "Notification of Death - Loan [Loan Number]",
        body: `To the Mortgage Servicing Department,

I am writing to inform you of the passing of [Borrower Name] on [Date of Death].

Please update your records to reflect the estate contact information below. We intend to [Keep/Sell] the property located at:
[Property Address]

Please provide a current payoff statement and a list of any required documentation to transfer authority.

Sincerely,
[Your Name]
[Executor/Administrator]`,
        requiredDocs: [
            "Which loan reference and proof of authority do you require?",
            "What documents apply to the proposed next step for this property?",
        ],
        followUp: "Who should confirm the ongoing payment, insurance, and servicing arrangements for this loan?"
    },
    {
        id: "brokerage-transfer",
        title: "Brokerage Transfer Request",
        category: "Financial",
        audience: "Brokerage Firm",
        subject: "Authorization to Transfer Assets - Account [Account Number]",
        body: `To the Transfer Department,

I am the Executor for the Estate of [Account Holder Name]. Attached are the Death Certificate and Court Appointments.

Please transfer all assets in account [Account Number] to the Estate Account established at [Your Bank].

Please provide the necessary distribution forms or a Medallion Signature Guarantee requirement list.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which ownership and beneficiary records should be reviewed?",
            "What authority and forms are needed before a transfer?",
        ],
        followUp: "What steps, timing, and account-protection options apply to this particular account?"
    },

    // --- Government ---
    {
        id: "ssa-notification",
        title: "Social Security Notification",
        category: "Government",
        audience: "Social Security Administration",
        subject: "Report of Death - [Deceased Name], SSN [XXX-XX-XXXX]",
        body: `To the Social Security Administration,

I am reporting the death of [Deceased Name], SSN [XXX-XX-[Last 4 digits]], who died on [Date of Death].

Please stop any future benefit payments. If any payments were made after [Date of Death], please instruct me on how to return them.

Survivors who may be eligible for benefits include:
- [Spouse Name]
- [Child Name]

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which details and proof are needed to report the death?",
            "How should any survivor-benefit questions be raised through the official process?",
        ],
        followUp: "Which payments need review, and what instructions apply to any payment that must be returned?"
    },
    {
        id: "irs-ein",
        title: "IRS Notice & EIN Request",
        category: "Government",
        audience: "Internal Revenue Service",
        subject: "Form 56 - Notice Concerning Fiduciary Relationship",
        body: `To the Internal Revenue Service,

Enclosed is IRS Form 56 designating [Your Name] as the Fiduciary for the Estate of [Deceased Name].

We are also applying for an Employer Identification Number (EIN) for the estate to facilitate banking and tax filing.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which fiduciary notices or estate identifiers apply to these circumstances?",
            "Which records should the estate tax professional review?",
        ],
        followUp: "Which filing dates and forms should the estate tax professional confirm for this estate?"
    },
    {
        id: "dmv-transfer",
        title: "DMV Vehicle Transfer",
        category: "Government",
        audience: "Department of Motor Vehicles",
        subject: "Transfer of Title - Deceased Owner",
        body: `To the Title Bureau,

I am the Executor for the Estate of [Deceased Name]. 

I request to transfer the title of the following vehicle:
- Make/Model: [Vehicle Year/Make/Model]
- VIN: [Vehicle VIN]

Enclosed are the Death Certificate, Executor Appointment, and the current Title.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which title, vehicle reference, and proof of authority are required?",
            "Which transfer forms apply in the relevant jurisdiction?",
        ],
        followUp: "What title-transfer and insurance steps should the responsible parties confirm for this vehicle?"
    },

    // --- Identity & Services ---
    {
        id: "credit-bureau-freeze",
        title: "Credit Bureau Freeze",
        category: "Identity",
        audience: "Equifax/Experian/TransUnion",
        subject: "Request to Freeze Credit - Deceased Consumer",
        body: `To the Fraud Department,

Please place a "Deceased - Do Not Issue Credit" alert on the credit report of:
- Name: [Deceased Name]
- SSN: [XXX-XX-[Last 4 digits]]
- DOB: [Date of Birth]
- Date of Death: [Date of Death]

Enclosed is the Death Certificate.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which proof of death and authority does this bureau require?",
            "How should identifying information be supplied securely?",
        ],
        followUp: "Does each relevant bureau require a separate request or supporting documentation?"
    },
    {
        id: "utility-cancel",
        title: "Utility Transfer or Closure",
        category: "Service",
        audience: "Utility Provider",
        subject: "Account Change Request - [Account Number]",
        body: `To Customer Service,

The account holder, [Name], has passed away.

Please [Cancel Service / Transfer Account] effective [Date].

Service Address: [Address]
Account Number: [Account Number]
Final Bill Address: [Address]

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which service and account references do you require?",
            "What authority and documents are needed for the requested change?",
        ],
        followUp: "What service dates and ongoing property needs should be confirmed before making the change?"
    },
    {
        id: "subscription-cancel",
        title: "Closing a Subscription",
        category: "Service",
        audience: "Service Provider",
        subject: "Cancellation Request - Deceased Subscriber",
        body: `To Support Team,

Please cancel the subscription for account email [Email Address] at your earliest convenience, due to the death of the subscriber.

Please refund any prepaid amounts to the original payment method.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which subscriber reference or account email is needed?",
            "What authority and supporting documents does the provider require?",
        ],
        followUp: "What cancellation date, final charges, and possible refunds apply to this subscription?"
    },
    {
        id: "usps-forwarding",
        title: "USPS Mail Forwarding",
        category: "Service",
        audience: "Postmaster",
        subject: "Estate Mail Forwarding Order",
        body: `To the Postmaster,

As Executor of the Estate of [Deceased Name], I am filing a "Deceased Do Not Contact" registration and requesting all mail addressed to [Old Address] be forwarded to the Estate Address:

[Estate Address]
[City, State, Zip]

Enclosed is the Executor Appointment.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which addresses and proof of authority are required?",
            "What is the current official forwarding procedure for this situation?",
        ],
        followUp: "Which forwarding and mailing-preference steps apply, and how should each be requested?"
    },

    // --- Employment ---
    {
        id: "employer-hr",
        title: "Employer HR Notice",
        category: "Employment",
        audience: "Human Resources",
        subject: "Notification of Death - Employee [Employee Name]",
        body: `To the HR Director,

It is with sadness that I inform you of the death of [Employee Name] on [Date].

Please provide information regarding:
1. Final paycheck and accrued vacation pay.
2. Life insurance policies provided by the company.
3. 401(k) or pension plan options for beneficiaries.
4. Health insurance continuation (COBRA) for survivors.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which employee reference and proof of authority are required?",
            "Which employment and benefit-plan documents should the family obtain?",
        ],
        followUp: "Which benefit options, forms, and response dates apply to the people concerned?"
    },

    // --- Assets ---
    {
        id: "insurance-claim",
        title: "Insurance Claim Initiation",
        category: "Asset",
        audience: "Claims Department",
        subject: "Life Insurance Claim - Policy [Policy Number]",
        body: `To the Claims Department,

I am writing to file a claim on Policy [Policy Number] for [Insured Name], who passed away on [Date].

Enclosed is the Death Certificate. Please send the necessary claim forms and lists of requirements to process the benefit.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which policy reference and claimant details are needed?",
            "Which proof and claim forms does the insurer require?",
        ],
        followUp: "Which benefits, conditions, and supporting documents apply to this particular policy?"
    },
    {
        id: "pension-claim",
        title: "Pension/401(k) Claim",
        category: "Asset",
        audience: "Plan Administrator",
        subject: "Beneficiary Claim - Plan [Plan Name/Number]",
        body: `To the Plan Administrator,

I am notifying you of the death of the plan participant, [Name], on [Date].

Please confirm the listed beneficiaries and provide the necessary forms to claim the distribution of assets.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which participant and beneficiary details should be confirmed?",
            "What authority, forms, and supporting documents does the plan require?",
        ],
        followUp: "Which distribution options and dates should the beneficiary review with the plan and their tax professional?"
    },
    {
        id: "social-media",
        title: "Social Media Memorialization",
        category: "Digital",
        audience: "Platform Support",
        subject: "Memorialization Request - [Username/Email]",
        body: `To User Support,

I am writing to request the memorialization of the account for [Username], who passed away on [Date].

Account Details:
- Platform: [Facebook/Instagram/Twitter]
- Username/Handle: [Username]
- Email associated with account: [Email Address]

I have attached the Death Certificate and proof of my authority as Executor.

Please let me know if you require any further information.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "What is the platform's current memorialization or removal process?",
            "Which authority and supporting documents does that process require?",
        ],
        followUp: "Which official request route applies to the account and the action the family has chosen?"
    },
    {
        id: "landlord-hoa",
        title: "Landlord/HOA Notification",
        category: "Housing",
        audience: "Property Manager/Board",
        subject: "Notification of Death - Tenant/Owner [Name]",
        body: `To the Property Manager,

I am informing you of the passing of [Name], who resided at [Address].

We will be coordinating the clearing of the property and handling of keys/access.

Please confirm the procedure for:
1. Returning keys/fobs.
2. Settling any outstanding rent or dues.
3. Access rights for family members trying to retrieve belongings.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which lease, property, or membership reference is needed?",
            "What authority is required to discuss access, keys, and outstanding charges?",
        ],
        followUp: "Who should confirm access arrangements and any property or payment obligations before changes are made?"
    },
    {
        id: "cover-letter-family-qr",
        title: "Cover Letter – Family Essentials QR Pack",
        category: "Emotional",
        audience: "Family Members",
        subject: "Estate Information - Essentials Access",
        body: `Dear Family,

I have gathered the essential information you will want close at hand into this secure package.

I’ve included a few QR codes that open only the pages you’ll likely need first (funeral wishes, immediate contacts, etc). They open only the essentials.

Please scan the codes with your phone camera to access the digital copies.

With love,
[Your Name]`,
        requiredDocs: [
            "Where is the chosen recipient link or printed copy kept?",
            "Who can help the family find the recorded handover instructions?",
        ],
        followUp: "Has the intended recipient been shown how to find the chosen link or printed copy?"
    },
    {
        id: "cover-letter-executor-qr",
        title: "Cover Letter – Full Executor QR Pack",
        category: "Emotional",
        audience: "Executor",
        subject: "Executor Access - Full Digital Vault",
        body: `To the Executor,

This package contains the master keys to the digital estate.

These QR codes open all sections you will need to manage the estate, including financial accounts, legal documents, and passwords.

Thank you for keeping this document somewhere safe, as it opens the whole estate plan.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Where are the separate access and handover instructions kept?",
            "Who should the executor contact about the records and originals?",
        ],
        followUp: "Can the executor find the supplied recipient link, printed copy, and original-document locations?"
    },
    // --- New Expanded Templates ---
    {
        id: "va-notification",
        title: "Veterans Affairs (VA) Notice",
        category: "Government",
        audience: "Department of Veterans Affairs",
        subject: "Notification of Death - [Deceased Name], VA File #[Number]",
        body: `To the Department of Veterans Affairs,

I am reporting the death of [Deceased Name], who was a veteran of the United States Armed Forces. 

VA File Number: [VA File Number]
Service Number: [Service Number]
Branch of Service: [Branch]
Date of Death: [Date of Death]

Please stop any future benefit payments and advise on eligibility for burial benefits or survivor's pension.

Sincerely,
[Your Name]
[Relationship/Executor]`,
        requiredDocs: [
            "Which service or benefit references are needed?",
            "Which proof and authority does the relevant program require?",
        ],
        followUp: "Which burial or survivor benefits, forms, and response dates apply to the stated circumstances?"
    },
    {
        id: "professional-team-notice",
        title: "Notice to Professional Team",
        category: "Professional",
        audience: "Attorney / CPA / Advisor",
        subject: "Notification of Death - Estate of [Deceased Name]",
        body: `Dear [Name of Professional],

I am writing to formally notify you of the passing of [Deceased Name] on [Date of Death]. 

As the appointed Executor, I request that you secure all files and records related to [Deceased Name]. We will need to schedule a meeting to discuss:
1. Previous tax filings and outstanding returns.
2. Existing legal files and active matters.
3. Current asset management and transition steps.

Please provide a summary of any upcoming dates the estate should know about.

Sincerely,
[Your Name]
[Executor/Administrator]`,
        requiredDocs: [
            "Which proof of authority is needed to discuss the records?",
            "Which account, matter, or client references should be provided?",
        ],
        followUp: "Which active matters, outstanding records, invoices, and dates should the estate contact confirm?"
    },
    {
        id: "medical-provider-notice",
        title: "Medical Provider Notice",
        category: "Medical",
        audience: "Clinic / Hospital Billing",
        subject: "Notice of Death - [Patient Name] - Account Closure",
        body: `To the Billing Department,

Please be advised that [Patient Name] passed away on [Date of Death].

Please cancel all future appointments and close the patient's billing account. Please send any final statements or insurance processing notices to the Estate Address:

[Estate Address]

Please direct all further correspondence to the Estate Address below.

Sincerely,
[Your Name]
[Executor/Administrator]`,
        requiredDocs: [
            "Which patient reference and proof of authority are needed?",
            "What is the provider's process for appointments, billing, and record requests?",
        ],
        followUp: "Which outstanding appointments, statements, insurance matters, or records need follow-up through the provider?"
    },
    {
        id: "club-resignation",
        title: "Club/Organization Resignation",
        category: "Social",
        audience: "Membership Director",
        subject: "Resignation of Membership - Deceased Member [Name]",
        body: `To the Membership Committee,

I am writing to resign the membership of [Name] at [Club/Organization Name] effective at your earliest convenience, due to their passing on [Date of Death].

Please stop all future dues and assessments. We would appreciate a refund of any prepaid membership fees or security deposits to the Estate.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which membership reference and authority are required?",
            "What notice and supporting documents apply to the requested change?",
        ],
        followUp: "Which final charges, deposits, refunds, or transfer options apply to this membership?"
    },
    {
        id: "charity-alumni-notice",
        title: "Charity/Alumni Record Update",
        category: "Social",
        audience: "Development Office",
        subject: "Record Update Notification - [Name]",
        body: `To the Development Office,

Please update your records to reflect the passing of [Name] on [Date]. 

[Name] was a proud [Alumnus/Supporter] of your organization. We request that you remove [Name] from your mailing and solicitation lists to avoid causing further distress to the family.

In lieu of flowers, the family has designated [Optional Charity] for donations in [Name]'s memory.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Which supporter or alumni reference will identify the record?",
            "Who should confirm the estate's chosen mailing and contact preferences?",
        ],
        followUp: "What record updates and optional family instructions should the organization confirm?"
    },
    {
        id: "pet-registry-update",
        title: "Pet Registry/Microchip Update",
        category: "Service",
        audience: "Registry Administrator",
        subject: "Transfer of Ownership - Pet [Pet Name] - Chip #[Number]",
        body: `To whom it may concern,

The registered owner of [Pet Name], [Deceased Name], passed away on [Date]. 

Ownership of [Pet Name] (Microchip #[Microchip Number]) has been transferred to:
Guardian Name: [New Guardian Name]
Address: [New Address]
Phone: [New Phone]

Please update your records to ensure the pet can be returned to the correct person if lost.

Sincerely,
[Your Name]
[Executor]`,
        requiredDocs: [
            "Which microchip or registration reference is needed?",
            "What authority and documents are required to update the registered owner?",
        ],
        followUp: "Which registry and veterinary records should the proposed guardian confirm through the relevant processes?"
    }
];


export const EMOTIONAL_PROMPTS = {
    spouse: {
        title: "Letter to a Loved One",
        questions: [
            "What is your favorite memory of us together?",
            "What do you admire most about your partner?",
            "What is one wish you have for their future happiness?",
        ]
    },
    ethical_will: {
        title: "Ethical Will",
        questions: [
            "What are the 3 core values that guided your life?",
            "What is the most important lesson you learned the hard way?",
            "What do you want your family to remember when times are tough?",
        ]
    }
};
