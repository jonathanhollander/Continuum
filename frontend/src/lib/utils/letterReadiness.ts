/** Recipient membership mirrors backend/routers/recipient.py: explicit id, then recorded words. */
export type LetterRecipient = {
    content?: string;
    recipientName?: string | null;
    recipientContactId?: number | string | null;
    isLocked?: boolean;
    type?: string;
};

export type LetterContact = { id: number | string; name?: string; relation?: string };
export type LetterReadState = 'ready' | 'held' | 'institution' | 'draft';

export function letterRecipients(letter: LetterRecipient, contacts: readonly LetterContact[]): LetterContact[] {
    const id = letter.recipientContactId;
    if (id !== null && id !== undefined && id !== '') {
        return contacts.filter((contact) => String(contact.id) === String(id));
    }
    const recorded = (letter.recipientName ?? '').trim().toLowerCase();
    if (!recorded) return [];
    return contacts.filter((contact) => {
        const name = (contact.name ?? '').trim().toLowerCase();
        const relation = (contact.relation ?? '').trim().toLowerCase();
        return recorded === name || (name !== '' && recorded === name.split(/\s+/)[0])
            || (relation !== '' && recorded === relation);
    });
}

export function letterReadState(letter: LetterRecipient, contacts: readonly LetterContact[]): LetterReadState {
    if (letter.isLocked) return 'held';
    // Institution correspondence remains in the full record, with its own drafting status.
    if (letter.type === 'transactional') return 'institution';
    return letter.type === 'emotional' && !!letter.content?.trim()
        && letterRecipients(letter, contacts).length > 0 ? 'ready' : 'draft';
}

export function letterStateLabel(state: LetterReadState): string {
    return { ready: 'Ready to read', held: 'On hold', institution: 'Institution draft', draft: 'Draft' }[state];
}
