export interface Professional {
    id: string;
    name: string;
    role: "Attorney" | "CPA" | "Financial Advisor" | "Geriatric Care" | "Funeral Director";
    company: string;
    phone: string;
    email: string;
    specialty: string;
    verified: boolean;
}

export const mockProfessionals: Professional[] = [
    {
        id: "1",
        name: "Sarah Jenkins, Esq.",
        role: "Attorney",
        company: "Jenkins & Associates Estate Law",
        phone: "(555) 123-4567",
        email: "sarah@ja-law.com",
        specialty: "Trusts & Probate",
        verified: true
    },
    {
        id: "2",
        name: "Robert Chen, CPA",
        role: "CPA",
        company: "Chen Tax Partners",
        phone: "(555) 987-6543",
        email: "rob@chentax.com",
        specialty: "Estate Tax Filing",
        verified: true
    },
    {
        id: "3",
        name: "Amanda Wright, CFP",
        role: "Financial Advisor",
        company: "Wright Wealth Management",
        phone: "(555) 456-7890",
        email: "amanda@wrightwealth.com",
        specialty: "Legacy Planning",
        verified: true
    },
    {
        id: "4",
        name: "Evergreen Memorial",
        role: "Funeral Director",
        company: "Evergreen Funerals",
        phone: "(555) 222-3333",
        email: "contact@evergreen.com",
        specialty: "Green Burials",
        verified: true
    }
];
