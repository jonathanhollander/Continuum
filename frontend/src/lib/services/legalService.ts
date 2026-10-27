// An example will with common legal terms explained in plain words.
// Shown as an example only; it reads nothing from a person's own documents.
export type ExplainedTerm = {
    term: string;
    definition: string;
    severity: "info" | "warning";
};

export type ExampleLegalDoc = {
    fullText: string;
    terms: ExplainedTerm[];
};

export const EXAMPLE_WILL: ExampleLegalDoc = {
    fullText: `LAST WILL AND TESTAMENT\n\nI, [Name], being of sound mind, declare this to be my Last Will and Testament.\n\nARTICLE I: I direct that all my debts and funeral expenses be paid as soon after my death as may be reasonably convenient.\n\nARTICLE II: I give, devise, and bequeath all the rest, residue, and remainder of my estate to my spouse. If my spouse predeceases me, I give one-half of my estate to my children, per stirpes.\n\nARTICLE III: I hereby appoint my spouse as Executor of this Will. If they are unable to serve, I appoint [Name] as successor Executor, to serve without bond.`,
    terms: [
        {
            term: "per stirpes",
            definition:
                "A method of distributing your estate where if a beneficiary dies before you, their share is passed down to their children.",
            severity: "info",
        },
        {
            term: "Executor",
            definition:
                "The person you choose to carry out the instructions in your will.",
            severity: "info",
        },
        {
            term: "devise, and bequeath",
            definition:
                "Legal wording for 'give'. Devise usually refers to real estate, bequeath to personal property.",
            severity: "info",
        },
        {
            term: "without bond",
            definition:
                "Your Executor can serve without buying a bond (a kind of insurance that protects the estate). It saves money and rests on trust in the person you choose.",
            severity: "warning",
        },
    ],
};
