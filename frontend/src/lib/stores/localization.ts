import { writable, derived } from "svelte/store";

export const activeLanguage = writable<"en" | "es">("en");

const dictionary = {
    en: {
        "dashboard.welcome": "Good Morning",
        "dashboard.protection": "Protection Score",
        "dashboard.concierge": "Concierge",
        "nav.dashboard": "Dashboard",
        "nav.assets": "Assets",
        "nav.vault": "Legal Vault",
        "nav.family": "Family Hub",
        "nav.timeline": "Timeline",
        "nav.executor": "Executor Toolkit",
        "common.add": "Add",
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "welcome.subtitle": "Your legacy is secure. Here is your daily briefing.",
        "status.healthy": "Healthy",
        "status.action_needed": "Action Needed"
    },
    es: {
        "dashboard.welcome": "Buenos Días",
        "dashboard.protection": "Nivel de Protección",
        "dashboard.concierge": "Conserje",
        "nav.dashboard": "Panel Principal",
        "nav.assets": "Activos",
        "nav.vault": "Bóveda Legal",
        "nav.family": "Centro Familiar",
        "nav.timeline": "Línea de Tiempo",
        "nav.executor": "Herramientas de Ejecutor",
        "common.add": "Agregar",
        "common.save": "Guardar",
        "common.cancel": "Cancelar",
        "common.delete": "Eliminar",
        "common.edit": "Editar",
        "welcome.subtitle": "Tu legado está seguro. Aquí está tu informe diario.",
        "status.healthy": "Saludable",
        "status.action_needed": "Acción Necesaria"
    }
};

export const t = derived(activeLanguage, ($lang) => {
    return (key: string) => {
        return (dictionary[$lang] as any)[key] || key;
    };
});
