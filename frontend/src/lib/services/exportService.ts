import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { get } from 'svelte/store';
import { propertyStore } from '$lib/stores/propertyStore';
import { heirloomStore } from '$lib/stores/heirloomStore';
import { timelineStore } from '$lib/stores/timelineStore';
import { medicalStore } from '$lib/stores/medicalStore';
import { insuranceStore } from '$lib/stores/insuranceStore';

export type ExportScope = 'full' | 'insurance' | 'medical';

export async function generatePDF(
    scope: ExportScope,
    includeImages: boolean,
    onProgress: (msg: string) => void
): Promise<void> {
    try {
        const blob = await createPDFBlob(scope, includeImages, onProgress);

        // Manual Blob Download
        const url = URL.createObjectURL(blob);
        const filename = "Continuum_export.pdf";

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("PDF Generation failed:", error);
        throw error;
    }
}

export async function createPDFBlob(
    scope: ExportScope,
    includeImages: boolean,
    onProgress: (msg: string) => void = () => { }
): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const placeholderText = "This section has not been completed on the Continuum website";

            const addSectionTitle = (title: string, y: number) => {
                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.text(title, 14, y);
                doc.setFontSize(10);
                return y + 10;
            };

            const addEmptyMessage = (y: number) => {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(placeholderText, 14, y);
                doc.setTextColor(0); // Reset
                return y + 15;
            };

            // --- 1. Cover Page ---
            onProgress("Generating Cover Page...");
            doc.setFontSize(24);
            doc.text("Continuum Estate Report", pageWidth / 2, 40, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(100);
            doc.text(`Scope: ${scope.charAt(0).toUpperCase() + scope.slice(1)}`, pageWidth / 2, 50, { align: 'center' });
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 60, { align: 'center' });

            doc.addPage();

            let currentY = 20;

            // --- 2. Property & Assets ---
            if (scope === 'full' || scope === 'insurance') {
                onProgress("Processing Assets...");
                const assets = get(propertyStore) || [];

                currentY = addSectionTitle("Property & Assets", currentY);

                if (assets.length === 0) {
                    currentY = addEmptyMessage(currentY);
                } else {
                    const tableBody = assets.map(item => [
                        item.name,
                        item.type,
                        item.location,
                        `$${item.valuation.toLocaleString()}`,
                        item.status
                    ]);

                    autoTable(doc, {
                        startY: currentY,
                        head: [['Asset Name', 'Type', 'Location', 'Value', 'Status']],
                        body: tableBody,
                        theme: 'grid',
                        headStyles: { fillColor: [74, 124, 116] }
                    });

                    // @ts-ignore
                    currentY = doc.lastAutoTable.finalY + 15;
                }
            }

            // --- 3. Insurance Policies ---
            if (scope === 'full' || scope === 'insurance') {
                onProgress("Processing Insurance...");
                // Basic spacing check
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                const policies = get(insuranceStore) || [];
                currentY = addSectionTitle("Insurance Policies", currentY);

                if (policies.length === 0) {
                    currentY = addEmptyMessage(currentY);
                } else {
                    const tableBody = policies.map(p => [
                        p.policyName,
                        p.insuranceType,
                        p.insurer,
                        `$${p.premiumAmount}/${p.premiumFrequency.charAt(0)}`,
                        p.status
                    ]);

                    autoTable(doc, {
                        startY: currentY,
                        head: [['Policy', 'Type', 'Insurer', 'Premium', 'Status']],
                        body: tableBody,
                        theme: 'grid',
                        headStyles: { fillColor: [74, 124, 116] }
                    });
                    // @ts-ignore
                    currentY = doc.lastAutoTable.finalY + 15;
                }
            }

            // --- 4. Heirlooms ---
            if (scope === 'full') {
                onProgress("Processing Heirlooms...");
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                const heirlooms = get(heirloomStore) || [];
                currentY = addSectionTitle("Family Heirlooms", currentY);

                if (heirlooms.length === 0) {
                    currentY = addEmptyMessage(currentY);
                } else {
                    const tableBody = heirlooms.map(h => [
                        h.name,
                        h.recipient,
                        h.value || 'N/A',
                        h.story.substring(0, 50) + (h.story.length > 50 ? '...' : '')
                    ]);

                    autoTable(doc, {
                        startY: currentY,
                        head: [['Item', 'Recipient', 'Value', 'Story']],
                        body: tableBody,
                        theme: 'grid',
                        headStyles: { fillColor: [74, 124, 116] }
                    });
                    // @ts-ignore
                    currentY = doc.lastAutoTable.finalY + 15;
                }
            }

            // --- 5. Timeline ---
            if (scope === 'full') {
                onProgress("Processing Timeline...");
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                const events = get(timelineStore) || [];
                currentY = addSectionTitle("Life Timeline", currentY);

                if (events.length === 0) {
                    currentY = addEmptyMessage(currentY);
                } else {
                    // Sort by year
                    const sorted = [...events].sort((a, b) => a.year - b.year);
                    const tableBody = sorted.map(e => [
                        e.year.toString(),
                        e.label,
                        e.type,
                        e.description || ''
                    ]);

                    autoTable(doc, {
                        startY: currentY,
                        head: [['Year', 'Event', 'Type', 'Description']],
                        body: tableBody,
                        theme: 'grid',
                        headStyles: { fillColor: [74, 124, 116] }
                    });
                    // @ts-ignore
                    currentY = doc.lastAutoTable.finalY + 15;
                }
            }

            // --- 6. Medical Summary ---
            if (scope === 'full' || scope === 'medical') {
                onProgress("Processing Medical...");
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                const medical = get(medicalStore);
                const directives = medical?.directives || [];

                currentY = addSectionTitle("Medical directives", currentY); // Using "directives" as "Summary" might be broader

                if (directives.length === 0 && !medical?.organDonor && !medical?.bloodType) {
                    currentY = addEmptyMessage(currentY);
                } else {
                    // Profile Info
                    doc.setFontSize(11);
                    doc.text(`Organ Donor: ${medical.organDonor ? 'Yes' : 'No'}`, 14, currentY);
                    currentY += 7;
                    doc.text(`Blood Type: ${medical.bloodType || 'Not listed'}`, 14, currentY);
                    currentY += 10;

                    if (directives.length > 0) {
                        const tableBody = directives.map(d => [
                            d.title,
                            d.type,
                            d.locationOfOriginal,
                            d.primaryContact
                        ]);

                        autoTable(doc, {
                            startY: currentY,
                            head: [['Directive', 'Type', 'Location', 'Primary Contact']],
                            body: tableBody,
                            theme: 'grid',
                            headStyles: { fillColor: [74, 124, 116] }
                        });
                        // @ts-ignore
                        currentY = doc.lastAutoTable.finalY + 15;
                    } else {
                        doc.setFontSize(10);
                        doc.text("No specific directives recorded.", 14, currentY);
                        currentY += 15;
                    }
                }
            }

            resolve(doc.output('blob'));
        } catch (e) {
            reject(e);
        }
    });
}
