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
            "Certified Death Certificate",
            "Letters Testamentary",
            "Executor ID",
            "Latest Account Statement"
        ],
        followUp: "If no response within 5 business days, call the bank's estate services department."
    },
    {
        id: "credit-card-cancel",
        title: "Credit Card Cancellation",
        category: "Financial",
        audience: "Card Issuer",
        subject: "Notification of Death - Account Closure Request",
        body: `To Customer Service,

Please be advised that [Cardholder Name] passed away on [Date of Death].

I am requesting that you immediately close the following credit card account(s) to prevent any new charges:
- Card Ending In: [Last 4 Digits]

Please send a final statement to the estate address listed below.

Sincerely,
[Your Name]
[Executor/Administrator]`,
        requiredDocs: [
            "Certified Death Certificate",
            "Executor status proof"
        ],
        followUp: "Stop automatic payments immediately and notify all merchants with recurring charges."
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
            "Death Certificate",
            "Executor Appointment"
        ],
        followUp: "Maintain homeowners insurance payments during probate to prevent policy cancellation."
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
            "Death Certificate",
            "Letters Testamentary",
            "Beneficiary Designation Forms",
            "W-9 Forms"
        ],
        followUp: "Brokerage transfers typically take 4-8 weeks. Request account freeze to prevent trades during probate."
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
            "Certified Death Certificate",
            "Proof of Executor Status",
            "Marriage Certificate (if survivor benefits)"
        ],
        followUp: "SSA is often notified by funeral home, but confirm. Return any benefits received after death immediately."
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
            "Death Certificate",
            "Letters Testamentary",
            "Last filed tax return"
        ],
        followUp: "Final 1040 due April 15 of year after death. Estate tax return (Form 706) due 9 months after death if required."
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
            "Death Certificate",
            "Executor Appointment",
            "Current Vehicle Title"
        ],
        followUp: "Notify auto insurance provider of the transfer to ensure coverage remains valid."
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
            "Certified Death Certificate"
        ],
        followUp: "Send to all three bureaus (Equifax, Experian, TransUnion) separately."
    },
    {
        id: "utility-cancel",
        title: "Utility Transfer/Cancel",
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
            "Death Certificate",
            "Executor Status proof"
        ],
        followUp: "Don't disconnect utilities if property is being shown to buyers or needs maintenance."
    },
    {
        id: "subscription-cancel",
        title: "Subscription Cancellation",
        category: "Service",
        audience: "Service Provider",
        subject: "Cancellation Request - Deceased Subscriber",
        body: `To Support Team,

Please cancel the subscription for account email [Email Address] immediately due to the death of the subscriber.

Please refund any prepaid amounts to the original payment method.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Death Certificate (copy)",
            "Executor proof"
        ],
        followUp: "Check bank/credit card statements for last 3 months to identify all recurring subscriptions."
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
            "Executor Appointment",
            "Form 3575 (Official Forwarding Mail Order)"
        ],
        followUp: "Mail forwarding for deceased individuals must be done in person at a post office."
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
            "Death Certificate",
            "Letters Testamentary"
        ],
        followUp: "Contact HR within 30 days. COBRA election must be made within 60 days of loss of coverage."
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
            "Certified Death Certificate",
            "Original Policy (if available)"
        ],
        followUp: "Check if the policy has an 'Accelerated Death Benefit' or 'Waiver of Premium' that applies."
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
            "Death Certificate",
            "Beneficiary Designation Proof",
            "Executor Authorization"
        ],
        followUp: "IRA/401(k) beneficiaries have distribution timelines to follow. Consult CPA about tax implications."
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
            "Death Certificate",
            "ID of requestor",
            "Proof of relationship"
        ],
        followUp: "Facebook offers memorialization, Twitter allows deletion by verified family, LinkedIn removes profiles."
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
            "Death Certificate",
            "Letters Testamentary"
        ],
        followUp: "Secure the property immediately and change locks if necessary (and legal) to protect assets."
    },
    {
        id: "cover-letter-family-qr",
        title: "Cover Letter – Family Essentials QR Pack",
        category: "Emotional",
        audience: "Family Members",
        subject: "Estate Information - Essentials Access",
        body: `Dear Family,

I have organized the essential information you might need immediately into this secure package.

I’ve included a few QR codes that open only the pages you’ll likely need first (funeral wishes, immediate contacts, etc). They don’t expose everything—just the essentials.

Please scan the codes with your phone camera to access the digital copies.

With love,
[Your Name]`,
        requiredDocs: [],
        followUp: "Ensure all family members know how to use the QR codes and who has the physical pack."
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

Please keep this document extremely secure, as it provides high-level access to the entire estate plan.

Sincerely,
[Your Name]`,
        requiredDocs: [],
        followUp: "Store this letter and the QR codes in a fireproof safe or safety deposit box."
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
            "DD Form 214 (Discharge Papers)",
            "Certified Death Certificate",
            "Proof of Relationship (for survivors)"
        ],
        followUp: "The VA may provide a burial flag, a headstone/marker, and burial in a national cemetery."
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

Please provide a summary of any current deadlines or urgent actions required.

Sincerely,
[Your Name]
[Executor/Administrator]`,
        requiredDocs: [
            "Letters Testamentary",
            "Death Certificate"
        ],
        followUp: "Ask for a complete list of assets they managed and any outstanding invoices."
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

We request that you do not send further correspondence to the primary residence.

Sincerely,
[Your Name]
[Executor/Administrator]`,
        requiredDocs: [
            "Death Certificate (copy)"
        ],
        followUp: "Ensure all medical records are requested if needed for insurance claims or legal reasons."
    },
    {
        id: "club-resignation",
        title: "Club/Organization Resignation",
        category: "Social",
        audience: "Membership Director",
        subject: "Resignation of Membership - Deceased Member [Name]",
        body: `To the Membership Committee,

I am writing to resign the membership of [Name] at [Club/Organization Name] effective immediately, due to their passing on [Date of Death].

Please stop all future dues and assessments. We would appreciate a refund of any prepaid membership fees or security deposits to the Estate.

Sincerely,
[Your Name]`,
        requiredDocs: [
            "Notice of Death"
        ],
        followUp: "Check if there's an 'equity' membership that needs to be sold or transferred."
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
        requiredDocs: [],
        followUp: "Keep a list of charities the deceased supported to include in the obituary."
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
            "Microchip Number",
            "Copy of Will or Guardian Agreement"
        ],
        followUp: "Update the vet's records as well to ensure the new guardian has medical authority."
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
