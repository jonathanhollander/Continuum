
import type { FamilyMember } from "$lib/stores/familyStore.svelte";
import type { InsurancePolicy } from "$lib/stores/insuranceStore.svelte";
import type { PropertyItem } from "$lib/stores/propertyStore.svelte";
import { digitalAssetsStore, type DigitalAccount } from "$lib/stores/digitalAssetsStore.svelte";
import type { Heirloom } from "$lib/stores/heirloomStore.svelte";
import type { MedicalDirective } from "$lib/stores/medicalStore.svelte";
import type { PetEntry } from "$lib/stores/petStore.svelte";

// Common Financial Asset Type (matches AssetManager)
export interface FinancialAsset {
    id: string;
    name: string;
    type: string;
    value: number;
    location: string;
    notes: string;
    valueHistory: any[];
    beneficiaries: string;
    isSmartSample?: boolean; // Marker to identify sample data
}

export interface SmartSampleCollection {
    financial: FinancialAsset[];
    insurance: InsurancePolicy[];
    property: PropertyItem[];
    family: FamilyMember[];
    digital: DigitalAccount[];
    heirlooms: Heirloom[];
    medical: MedicalDirective[];
    pets: PetEntry[];
    subscriptions: any[]; // Subscriptions use a simpler generic structure often
    contacts: any[];
    memories: any[];
    funeral: any[];
    calendar: any[];
    homeManual: {
        vendors: any[];
        accessCodes: any[];
        utilities: any[];
    };
    anniversary: any[];
    timeCapsule: any[];
    timeline: any[];
}

const dictionaries = {
    en: {
        financial: {
            check: "Chase Total Checking",
            savings: "Amex High Yield Savings",
            crypto: "Ledger Nano X (Bitcoin)",
            notes_check: "Primary bill pay account.",
            notes_savings: "Emergency fund.",
            notes_crypto: "Cold storage device in safe."
        },
        insurance: {
            life: "Term Life Policy",
            auto: "Tesla Model Y Coverage",
            insurer: "State Farm",
            notes: "20-year term, expires 2040."
        },
        property: {
            home: "Primary Residence",
            car: "Tesla Model Y",
            loc_home: "123 Maple St, Austin TX",
            loc_car: "Garage"
        },
        family: {
            doc: "Dr. Sarah Smith",
            lawyer: "James McGill, Esq.",
            relation_doc: "Primary Care Physician",
            relation_lawyer: "Estate Attorney"
        },
        digital: {
            pw: "1Password Master Account",
            email: "Primary Gmail",
            instr_pw: "Emergency kit is in the safe.",
            instr_email: "Use Inactive Account Manager."
        },
        heirlooms: {
            watch: "Grandfather's Rolex",
            story: "Given to him in 1955 after the war. Needs servicing every 5 years.",
            photos: "Old Family Photos",
            story_photos: "Box of original prints from the 1920s."
        },
        pets: {
            dog: "Bruno (Golden Retriever)",
            notes: "Allergic to chicken. Vet is Dr. Bond."
        },
        medical: {
            dnr: "Do Not Resuscitate (DNR)",
            proxy: "Healthcare Proxy Form",
            loc: "Filing Cabinet / Cloud",
            summary_dnr: "Standard DNR form.",
            summary_proxy: "Spouse designated as primary proxy."
        },
        contacts: {
            doc: "Dr. Sarah Smith",
            lawyer: "James McGill, Esq.",
            relation_doc: "Primary Care Physician",
            relation_lawyer: "Estate Attorney",
            notes: "Available for consultation."
        },
        subscriptions: {
            netflix: "Netflix",
            amazon: "Amazon Prime",
            cycle_monthly: "Monthly",
            cycle_yearly: "Yearly",
            cat_ent: "Entertainment",
            cat_shop: "Shopping",
            notes_netflix: "Family plan shared with kids.",
            notes_amazon: "Primary account for household."
        },
        memories: {
            beach: "Family Beach Trip 2023",
            wedding: "Our Wedding Day",
            notes_beach: "Beautiful sunset at Cancun.",
            notes_wedding: "The best day of our lives."
        },
        funeral: {
            music1: "Amazing Grace",
            music2: "What a Wonderful World",
            flowers: "White lilies and roses",
            venue: "St. Mary's Church",
            dress_code: "Celebration of life - wear bright colors"
        },
        calendar: {
            birthday: "My Birthday",
            anniversary: "Wedding Anniversary",
            wish_birthday: "Have a slice of cheesecake for me. It was my favorite.",
            wish_anniversary: "Play our song and dance together."
        },
        homeManual: {
            plumber: "Joe's Plumbing",
            electrician: "City Electric Co.",
            gate_code: "Front Gate",
            alarm_code: "House Alarm",
            water_shutoff: "Water Main",
            gas_shutoff: "Gas Line"
        },
        anniversary: {
            mom_birthday: "Mom's Birthday",
            dad_passing: "Dad's Passing",
            ritual_birthday: "Visit her favorite garden and leave flowers.",
            ritual_passing: "Light a candle and share a memory."
        },
        timeCapsule: {
            graduation: "Graduation Message",
            wedding: "Wedding Day Wishes",
            preview_graduation: "I'm so proud of how far you've come...",
            preview_wedding: "Today marks the beginning of a beautiful journey..."
        },
        timeline: {
            birth: "Born",
            graduation: "College Graduation",
            career: "Started Career",
            marriage: "Got Married"
        }
    },
    es: {
        financial: {
            check: "Cuenta Corriente Principal",
            savings: "Ahorros de Alto Rendimiento",
            crypto: "Billetera Fría (Bitcoin)",
            notes_check: "Cuenta de gastos principales.",
            notes_savings: "Fondo de emergencia.",
            notes_crypto: "Dispositivo en caja fuerte."
        },
        insurance: {
            life: "Seguro de Vida a Término",
            auto: "Seguro de Auto",
            insurer: "Mapfre",
            notes: "Término de 20 años."
        },
        property: {
            home: "Residencia Principal",
            car: "Vehículo Familiar",
            loc_home: "Calle Principal 123",
            loc_car: "Garaje"
        },
        family: {
            doc: "Dra. Elena Garcia",
            lawyer: "Lic. Roberto Martinez",
            relation_doc: "Médico de Cabecera",
            relation_lawyer: "Abogado de Patrimonio"
        },
        digital: {
            pw: "Cuenta Maestra 1Password",
            email: "Gmail Principal",
            instr_pw: "Kit de emergencia en la caja fuerte.",
            instr_email: "Usar Gestor de Cuentas Inactivas."
        },
        heirlooms: {
            watch: "Reloj del Abuelo",
            story: "Regalo de 1955. Necesita servicio cada 5 años.",
            photos: "Fotos Familiares Antiguas",
            story_photos: "Caja de fotos originales de los años 20."
        },
        pets: {
            dog: "Bruno (Golden Retriever)",
            notes: "Alérgico al pollo."
        },
        medical: {
            dnr: "Orden de No Resucitar",
            proxy: "Poder Médico",
            loc: "Archivador / Nube",
            summary_dnr: "Formulario estándar de DNR.",
            summary_proxy: "Esposa designada como apoderada principal."
        },
        contacts: {
            doc: "Dra. Elena Garcia",
            lawyer: "Lic. Roberto Martinez",
            relation_doc: "Médico de Cabecera",
            relation_lawyer: "Abogado de Patrimonio",
            notes: "Disponible para consultas."
        },
        subscriptions: {
            netflix: "Netflix",
            amazon: "Amazon Prime",
            cycle_monthly: "Mensual",
            cycle_yearly: "Anual",
            cat_ent: "Entretenimiento",
            cat_shop: "Compras",
            notes_netflix: "Plan familiar compartido con los niños.",
            notes_amazon: "Cuenta principal del hogar."
        },
        memories: {
            beach: "Viaje Familiar a la Playa 2023",
            wedding: "El Día de Nuestra Boda",
            notes_beach: "Hermoso atardecer en Cancún.",
            notes_wedding: "El mejor día de nuestras vidas."
        },
        funeral: {
            music1: "Amazing Grace",
            music2: "Qué Mundo Tan Maravilloso",
            flowers: "Lirios blancos y rosas",
            venue: "Iglesia Santa María",
            dress_code: "Celebración de vida - usar colores alegres"
        },
        calendar: {
            birthday: "Mi Cumpleaños",
            anniversary: "Aniversario de Boda",
            wish_birthday: "Coman un trozo de pastel por mí. Era mi favorito.",
            wish_anniversary: "Pongan nuestra canción y bailen juntos."
        },
        homeManual: {
            plumber: "Plomería de José",
            electrician: "Electricidad de la Ciudad",
            gate_code: "Portón Principal",
            alarm_code: "Alarma de Casa",
            water_shutoff: "Llave de Agua Principal",
            gas_shutoff: "Llave de Gas"
        },
        anniversary: {
            mom_birthday: "Cumpleaños de Mamá",
            dad_passing: "Fallecimiento de Papá",
            ritual_birthday: "Visitar su jardín favorito y dejar flores.",
            ritual_passing: "Encender una vela y compartir un recuerdo."
        },
        timeCapsule: {
            graduation: "Mensaje de Graduación",
            wedding: "Deseos para el Día de la Boda",
            preview_graduation: "Estoy tan orgulloso de lo lejos que has llegado...",
            preview_wedding: "Hoy marca el comienzo de un hermoso viaje..."
        },
        timeline: {
            birth: "Nacimiento",
            graduation: "Graduación Universitaria",
            career: "Inicio de Carrera",
            marriage: "Matrimonio"
        }
    }
    // Add other languages as needed, default to EN
};

export const getSmartSamples = (locale: string = 'en'): SmartSampleCollection => {
    // Fallback to EN if locale not found
    const dict = (dictionaries as any)[locale] || dictionaries.en;

    const commonId = (prefix: string) => `sample-${prefix}-${Math.random().toString(36).substr(2, 5)}`;

    return {
        financial: [
            {
                id: commonId('fin-1'),
                name: dict.financial.check,
                type: 'Financial',
                value: 15000,
                location: 'Chase Bank',
                notes: dict.financial.notes_check,
                valueHistory: [],
                beneficiaries: 'Spouse',
                isSmartSample: true
            },
            {
                id: commonId('fin-2'),
                name: dict.financial.savings,
                type: 'Financial',
                value: 50000,
                location: 'American Express',
                notes: dict.financial.notes_savings,
                valueHistory: [],
                beneficiaries: 'Spouse',
                isSmartSample: true
            },
            {
                id: commonId('fin-3'),
                name: dict.financial.crypto,
                type: 'Financial',
                value: 12000,
                location: 'Safe',
                notes: dict.financial.notes_crypto,
                valueHistory: [],
                beneficiaries: 'Children',
                isSmartSample: true
            }
        ],
        insurance: [
            {
                id: commonId('ins-1'),
                policyName: dict.insurance.life,
                insuranceType: 'Life',
                insurer: dict.insurance.insurer,
                policyNumber: 'POL-99887766',
                premiumAmount: 85,
                premiumFrequency: 'Monthly',
                beneficiaries: 'Spouse',
                agentName: 'John Doe',
                agentContact: '555-0123',
                claimsProcedure: 'Call agent',
                policyDocuments: '',
                status: 'Active',
                notes: dict.insurance.notes
            },
            {
                id: commonId('ins-2'),
                policyName: dict.insurance.auto,
                insuranceType: 'Auto',
                insurer: 'Geico',
                policyNumber: 'AUTO-112233',
                premiumAmount: 120,
                premiumFrequency: 'Monthly',
                beneficiaries: '',
                agentName: '',
                agentContact: '',
                claimsProcedure: 'App',
                policyDocuments: '',
                status: 'Active',
                notes: ''
            }
        ],
        property: [
            {
                id: commonId('prop-1'),
                name: dict.property.home,
                type: 'Real Estate',
                location: dict.property.loc_home,
                valuation: 550000,
                status: 'Mortgaged',
                ownershipDetails: 'Joint Tenant',
                documents: 'Deed in safe',
                notes: 'Primary Asset',
                thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'
            },
            {
                id: commonId('prop-2'),
                name: dict.property.car,
                type: 'Vehicle',
                location: dict.property.loc_car,
                valuation: 45000,
                status: 'Owned',
                ownershipDetails: 'Sole',
                documents: 'Title in safe',
                notes: 'Daily driver',
                thumbnail: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=400&q=80'
            }
        ],
        family: [
            {
                id: commonId('fam-1'),
                name: dict.family.doc,
                role: 'professional',
                relationToOwner: dict.family.relation_doc,
                isExecutor: false,
                isBeneficiary: false,
                isEmergencyContact: true,
                avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80'
            },
            {
                id: commonId('fam-2'),
                name: dict.family.lawyer,
                role: 'professional',
                relationToOwner: dict.family.relation_lawyer,
                isExecutor: false,
                isBeneficiary: false,
                isEmergencyContact: false,
                avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80'
            }
        ],
        digital: [
            {
                id: commonId('dig-1'),
                platform: '1Password',
                username: 'contracts@example.com',
                preference: 'transfer',
                instructions: dict.digital.instr_pw,
                priority: 'high',
                isClosed: false
            },
            {
                id: commonId('dig-2'),
                platform: 'Gmail',
                username: 'personal@gmail.com',
                preference: 'memorialize',
                instructions: dict.digital.instr_email,
                priority: 'high',
                isClosed: false
            }
        ],
        heirlooms: [
            {
                id: commonId('heir-1'),
                name: dict.heirlooms.watch,
                recipient: 'Eldest Grandson',
                story: dict.heirlooms.story,
                image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=80',
                value: '$5,000'
            },
            {
                id: commonId('heir-2'),
                name: dict.heirlooms.photos || "Old Family Photos",
                recipient: 'Daughter',
                story: dict.heirlooms.story_photos || "Box of photos from the 1920s.",
                image: '/images/heirlooms/heirloom_books_placeholder_1767552150155.png', // Using local placeholder
                value: 'Priceless'
            }
        ],
        pets: [
            {
                id: commonId('pet-1'),
                name: dict.pets.dog,
                type: 'dog',
                breed: 'Golden Retriever',
                guardian: 'Sister',
                vetName: 'Dr. Bond',
                vetPhone: '555-9999',
                foodInstructions: '2 cups dry food am/pm',
                medicalNeeds: 'None',
                notes: dict.pets.notes
            }
        ],
        medical: [
            {
                id: commonId('med-1'),
                type: 'dnr',
                title: dict.medical.dnr,
                locationOfOriginal: dict.medical.loc,
                primaryContact: dict.family.doc,
                contactPhone: '555-0123',
                summary: dict.medical.summary_dnr || 'Standard DNR form.',
                organDonor: true,
                bloodType: 'O+',
                allergies: 'Penicillin'
            },
            {
                id: commonId('med-2'),
                type: 'healthcare_proxy',
                title: dict.medical.proxy,
                locationOfOriginal: dict.medical.loc,
                primaryContact: 'Spouse',
                contactPhone: '555-0987',
                summary: dict.medical.summary_proxy || 'Spouse designated as primary proxy.',
                organDonor: true,
                bloodType: 'O+',
                allergies: 'Penicillin'
            }
        ],
        subscriptions: [
            {
                id: commonId('sub-1'),
                name: dict.subscriptions?.netflix || "Netflix",
                cost: 15.99,
                cycle: dict.subscriptions?.cycle_monthly || "Monthly",
                category: dict.subscriptions?.cat_ent || "Entertainment",
                notes: dict.subscriptions?.notes_netflix || "Family plan shared with kids."
            },
            {
                id: commonId('sub-2'),
                name: dict.subscriptions?.amazon || "Amazon Prime",
                cost: 139,
                cycle: dict.subscriptions?.cycle_yearly || "Yearly",
                category: dict.subscriptions?.cat_shop || "Shopping",
                notes: dict.subscriptions?.notes_amazon || "Primary account for household."
            }
        ],
        contacts: [
            {
                id: commonId('cont-1'),
                name: dict.contacts.doc,
                role: 'Medical',
                relation: dict.contacts.relation_doc,
                phone: '555-0123',
                email: 'dr.smith@example.com',
                tier: '1_Immediate',
                notificationStatus: 'Pending',
                notes: dict.contacts.notes,
                isExecutor: false,
                isBeneficiary: false,
                isEmergencyContact: false
            },
            {
                id: commonId('cont-2'),
                name: dict.contacts.lawyer,
                role: 'Legal',
                relation: dict.contacts.relation_lawyer,
                phone: '555-0987',
                email: 'lawyer@example.com',
                tier: '2_SameDay',
                notificationStatus: 'Pending',
                notes: dict.contacts.notes,
                isExecutor: false,
                isBeneficiary: false,
                isEmergencyContact: false
            }
        ],
        memories: [
            {
                id: commonId('mem-1'),
                title: dict.memories.beach,
                date: '2023-07-15',
                location: 'Cancun, Mexico',
                description: dict.memories.notes_beach,
                tags: ['vacation', 'family'],
                mediaUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=400&q=80'
            },
            {
                id: commonId('mem-2'),
                title: dict.memories.wedding,
                date: '2010-06-20',
                location: 'New York, NY',
                description: dict.memories.notes_wedding,
                tags: ['milestone', 'wedding'],
                mediaUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80'
            }
        ],
        funeral: [
            {
                id: commonId('fun-1'),
                name: dict.funeral?.music1 || "Amazing Grace",
                type: 'music',
                description: 'Traditional hymn for the service'
            },
            {
                id: commonId('fun-2'),
                name: dict.funeral?.music2 || "What a Wonderful World",
                type: 'music',
                description: 'Louis Armstrong - play during reception'
            },
            {
                id: commonId('fun-3'),
                name: dict.funeral?.flowers || "White lilies and roses",
                type: 'flowers',
                description: 'Simple, elegant arrangements'
            }
        ],
        calendar: [
            {
                id: commonId('cal-1'),
                title: dict.calendar?.birthday || "My Birthday",
                date: '0615',
                type: 'birthday',
                isRecurring: true,
                wish: dict.calendar?.wish_birthday || "Have a slice of cheesecake for me."
            },
            {
                id: commonId('cal-2'),
                title: dict.calendar?.anniversary || "Wedding Anniversary",
                date: '0620',
                type: 'anniversary',
                isRecurring: true,
                wish: dict.calendar?.wish_anniversary || "Play our song and dance together."
            }
        ],
        homeManual: {
            vendors: [
                {
                    id: commonId('ven-1'),
                    category: 'Plumber',
                    name: dict.homeManual?.plumber || "Joe's Plumbing",
                    phone: '(555) 123-4567',
                    notes: 'Reliable, knows our old pipes well'
                },
                {
                    id: commonId('ven-2'),
                    category: 'Electrician',
                    name: dict.homeManual?.electrician || "City Electric Co.",
                    phone: '(555) 987-6543',
                    notes: 'Licensed and bonded'
                }
            ],
            accessCodes: [
                {
                    id: commonId('acc-1'),
                    location: dict.homeManual?.gate_code || "Front Gate",
                    code_encrypted: '1234',
                    instructions: 'Press # after code'
                },
                {
                    id: commonId('acc-2'),
                    location: dict.homeManual?.alarm_code || "House Alarm",
                    code_encrypted: '5678',
                    instructions: 'Disarm within 30 seconds'
                }
            ],
            utilities: [
                {
                    id: commonId('util-1'),
                    service_type: 'Water',
                    provider: 'City Water Dept',
                    location: dict.homeManual?.water_shutoff || "Basement, left of water heater",
                    shutoffInstructions: 'Turn red valve clockwise'
                },
                {
                    id: commonId('util-2'),
                    service_type: 'Gas',
                    provider: 'PG&E',
                    location: dict.homeManual?.gas_shutoff || "Outside, east wall",
                    shutoffInstructions: 'Use wrench, quarter turn'
                }
            ]
        },
        anniversary: [
            {
                id: commonId('ann-1'),
                title: dict.anniversary?.mom_birthday || "Mom's Birthday",
                date: '03-15',
                type: 'birthday',
                description: 'She loved yellow roses',
                ritualInstructions: dict.anniversary?.ritual_birthday || "Visit her favorite garden and leave flowers."
            },
            {
                id: commonId('ann-2'),
                title: dict.anniversary?.dad_passing || "Dad's Passing",
                date: '11-22',
                type: 'passing',
                description: 'A day for quiet reflection',
                ritualInstructions: dict.anniversary?.ritual_passing || "Light a candle and share a memory."
            }
        ],
        timeCapsule: [
            {
                id: commonId('cap-1'),
                title: dict.timeCapsule?.graduation || "Graduation Message",
                recipient: 'Emily (Daughter)',
                contentPreview: dict.timeCapsule?.preview_graduation || "I'm so proud of how far you've come...",
                triggerType: 'milestone',
                triggerValue: 'graduation'
            },
            {
                id: commonId('cap-2'),
                title: dict.timeCapsule?.wedding || "Wedding Day Wishes",
                recipient: 'James (Son)',
                contentPreview: dict.timeCapsule?.preview_wedding || "Today marks the beginning of a beautiful journey...",
                triggerType: 'milestone',
                triggerValue: 'wedding'
            }
        ],
        timeline: [
            {
                id: commonId('time-1'),
                year: 1990,
                label: dict.timeline?.birth || "Born",
                type: 'milestone',
                description: 'The beginning of everything'
            },
            {
                id: commonId('time-2'),
                year: 2012,
                label: dict.timeline?.graduation || "College Graduation",
                type: 'education',
                description: 'First in the family to graduate'
            },
            {
                id: commonId('time-3'),
                year: 2013,
                label: dict.timeline?.career || "Started Career",
                type: 'work',
                description: 'Joined the company that shaped my life'
            },
            {
                id: commonId('time-4'),
                year: 2018,
                label: dict.timeline?.marriage || "Got Married",
                type: 'relationship',
                description: 'The best decision I ever made'
            }
        ]
    };
};
