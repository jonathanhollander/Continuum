export type AnalyzedLegalese = {
    fullText: string;
    terms: {
        term: string;
        definition: string;
        severity: "info" | "warning";
    }[];
};

const MOCK_DEFINITIONS = {
    "Per Stirpes": "A legal term meaning that if a beneficiary dies before you, their share goes to their children.",
    "Fiduciary": "A person or organization that acts on behalf of another person or persons, putting their clients' interest ahead of their own.",
    "Probate": "The legal process of verifying a will and distributing assets.",
    "Intestate": "Dying without a valid will.",
    "Executor": " The person named in the will to manage the estate.",
};

export async function analyzeLegalDoc(docType: string): Promise<AnalyzedLegalese> {
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate OCR/Processing

    if (docType === "Will") {
        return {
            fullText: `LAST WILL AND TESTAMENT\n\nI, [Name], being of sound mind, declare this to be my Last Will and Testament.\n\nARTICLE I: I direct that all my debts and funeral expenses be paid as soon after my death as may be reasonably convenient.\n\nARTICLE II: I give, devise, and bequeath all the rest, residue, and remainder of my estate to my spouse. If my spouse does not survive me, I give one-half of my estate to my children, per stirpes.\n\nARTICLE III: I hereby appoint my spouse as Executor of this Will. If they are unable to serve, I appoint [Name] as successor Executor, to serve without bond.`,
            terms: [
                {
                    term: "per stirpes",
                    definition: "A method of distributing your estate where if a beneficiary dies before you, their share is passed down to their children.",
                    severity: "info"
                },
                {
                    term: "Executor",
                    definition: "The person you choose to carry out the instructions in your will.",
                    severity: "info"
                },
                {
                    term: "devise, and bequeath",
                    definition: "Legal fancy talk for 'give'. Devise usually refers to real estate, bequeath to personal property.",
                    severity: "info"
                },
                {
                    term: "without bond",
                    definition: "Means your Executor doesn't have to pay for insurance to prove they won't steal from the estate. Saves money but requires trust.",
                    severity: "warning"
                }
            ]
        };
    }

    // Default dummy
    return {
        fullText: "This document appears to be a standard record. Our AI didn't detect specific complex clauses to explain, or the document quality was low.",
        terms: []
    };
}
