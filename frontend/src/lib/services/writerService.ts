import { callAiProxy } from './aiConciergeService';
import { currentAIJob, type AIWriterVariant, type AIWritingJob } from './aiCapabilities';
export type WriterContext = AIWriterVariant;
function cleanLetter(text: string): string { return String(text ?? '').replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim(); }
export async function aiDraftText(notes: string[], context: WriterContext = 'letter', job: AIWritingJob | undefined = currentAIJob()): Promise<string> {
    return cleanLetter(await callAiProxy({ ...job, document_type: job?.document_type ?? context, current_draft_source: 'edited', notes: notes.map((n) => n.trim()).filter(Boolean) }, [],
        { purpose: 'writer.draft_text', variant: context, preserveSensitiveValues: true, requiredOriginals: notes }));
}
export async function aiSoftenText(text: string, warmth: number, context: WriterContext = 'letter', job: AIWritingJob | undefined = currentAIJob()): Promise<string> {
    return cleanLetter(await callAiProxy({ ...job, document_type: job?.document_type ?? context, current_draft_source: 'edited', current_draft: text, warmth }, [],
        { purpose: 'writer.rewrite_text', variant: context, preserveSensitiveValues: true, requiredOriginals: [text] }));
}
export async function aiDraftLetter(notes: string[], job: AIWritingJob | undefined = currentAIJob()): Promise<string> {
    return cleanLetter(await callAiProxy({ ...job, document_type: job?.document_type ?? 'letter', current_draft_source: 'edited', notes: notes.map((n) => n.trim()).filter(Boolean) }, [],
        { purpose: 'letter.draft', preserveSensitiveValues: true, requiredOriginals: notes }));
}
export async function aiSoftenLetter(text: string, warmth: number, job: AIWritingJob | undefined = currentAIJob()): Promise<string> {
    return cleanLetter(await callAiProxy({ ...job, document_type: job?.document_type ?? 'letter', current_draft_source: 'edited', current_draft: text, warmth }, [],
        { purpose: 'letter.rewrite', preserveSensitiveValues: true, requiredOriginals: [text] }));
}
