/** Stable settings selectors; prompts and private detail restoration stay with each caller. */
export const AI_MODULE_VARIANTS = [
    'obituary', 'letters', 'executor', 'heirlooms', 'legal_explainer', 'contacts',
    'medical', 'pets', 'property', 'insurance', 'digital-guardian', 'visual-memories',
    'financial', 'activity-log', 'subscriptions', 'advanced-registry', 'qr-codes',
    'home-manual', 'calendar'
] as const;

export const AI_WRITER_VARIANTS = [
    'heirloom', 'timeline', 'contact', 'pet', 'funeral', 'letter', 'ethical_will',
    'life_lesson', 'storytelling'
] as const;

export type AIModuleVariant = typeof AI_MODULE_VARIANTS[number];
export type AIWriterVariant = typeof AI_WRITER_VARIANTS[number];

export const AI_CAPABILITIES = {
    'concierge.chat': [''],
    'concierge.module_prompt': AI_MODULE_VARIANTS,
    'grief.chat': [''],
    'writer.draft_text': AI_WRITER_VARIANTS,
    'writer.rewrite_text': AI_WRITER_VARIANTS,
    'letter.draft': [''],
    'letter.rewrite': ['']
} as const;

export type AIPurpose = keyof typeof AI_CAPABILITIES;
type Variant<P extends AIPurpose> = typeof AI_CAPABILITIES[P][number];
export type AICapability = {
    [P in AIPurpose]: '' extends Variant<P>
        ? { purpose: P; variant?: '' }
        : { purpose: P; variant: Variant<P> }
}[AIPurpose];

/** Validate JavaScript callers too, and serialize only the two settings selectors. */
export function aiCapability(selection: AICapability): { purpose: AIPurpose; variant: string } {
    const purpose = selection?.purpose;
    const variant = selection?.variant === undefined ? '' : selection.variant;
    if (!Object.hasOwn(AI_CAPABILITIES, purpose)
        || !(AI_CAPABILITIES[purpose] as readonly unknown[]).includes(variant)) {
        throw new TypeError('Unknown AI purpose or variant');
    }
    return { purpose, variant };
}
