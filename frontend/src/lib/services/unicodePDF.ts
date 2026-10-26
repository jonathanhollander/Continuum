/** Shared PDF fonts and logical-text writing for names and family prose (X317). */
import jsPDF from 'jspdf';
import regularUrl from '$lib/assets/fonts/DejaVuSans.ttf?url';
import boldUrl from '$lib/assets/fonts/DejaVuSans-Bold.ttf?url';
import italicUrl from '$lib/assets/fonts/DejaVuSans-Oblique.ttf?url';

export const PDF_FONT = 'ContinuumSans';
const FONT_FILES = [
    { name: 'DejaVuSans.ttf', url: regularUrl, style: 'normal' },
    { name: 'DejaVuSans-Bold.ttf', url: boldUrl, style: 'bold' },
    { name: 'DejaVuSans-Oblique.ttf', url: italicUrl, style: 'italic' },
];
let fontData: Promise<string[]> | null = null;

function loadFonts(): Promise<string[]> {
    // Font bytes load only when a PDF is requested; a failed request can be retried.
    return fontData ??= Promise.all(FONT_FILES.map(async ({ url }) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('You can prepare this PDF again whenever you are ready.');
        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i += 32768) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
        }
        return btoa(binary);
    })).catch((error) => {
        fontData = null;
        throw error;
    });
}

export async function createUnicodePDF(): Promise<jsPDF> {
    const fonts = await loadFonts();
    const doc = new jsPDF({ unit: 'pt', format: 'letter', putOnlyUsedFonts: true, compress: true });
    FONT_FILES.forEach(({ name, style }, index) => {
        doc.addFileToVFS(name, fonts[index]);
        doc.addFont(name, PDF_FONT, style);
    });
    doc.setFont(PDF_FONT, 'normal');
    return doc;
}

export interface PDFLine { text: string; rtl: boolean }

export function splitPDFText(doc: jsPDF, text: string, width: number): PDFLine[] {
    return text.replace(/\r\n?/g, '\n').split('\n').flatMap((paragraph) => {
        // Keep the paragraph's direction across wrapped lines, including lines starting in English.
        const firstLetter = paragraph.match(/\p{Letter}/u)?.[0] ?? '';
        const rtl = /[\u0590-\u08ff]/u.test(firstLetter);
        const lines: string[] = paragraph ? doc.splitTextToSize(paragraph, width) : [''];
        return lines.map((line) => ({ text: line, rtl }));
    });
}

export function writePDFLine(doc: jsPDF, line: PDFLine, x: number, y: number, width: number): void {
    if (!line.text) return;
    // PDF glyphs are positioned in visual order. ActualText retains the original logical Unicode
    // for readers/accessibility tools that support it, including mixed-direction family messages.
    const actualText = 'FEFF' + line.text.split('').map((c) => c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
    const stream = doc.internal as typeof doc.internal & { write: (value: string) => void };
    stream.write(`/Span << /ActualText <${actualText}> >> BDC`);
    doc.text(line.text, line.rtl ? x + width : x, y, {
        align: line.rtl ? 'right' : 'left',
        isInputVisual: false,
        isOutputVisual: true,
        isInputRtl: line.rtl,
        isOutputRtl: false,
        isSymmetricSwapping: true,
    });
    stream.write('EMC');
}
