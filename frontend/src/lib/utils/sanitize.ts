/** A request-local privacy filter. Its original-value map is never sent or persisted. */
export function createRedactionSession(contents: readonly string[], requiredContents?: readonly string[]) {
    const originals = new Map<string, string>();
    const tokens = new Map<string, string>();
    const supplied = contents.join('\n');
    let prefix: string;
    do {
        prefix = `REDACTED_${crypto.randomUUID().replaceAll('-', '')}_`;
    } while (supplied.includes(prefix));

    function redact(content: string): string {
        // One pass prevents generated tokens being matched again as account/phone numbers.
        return String(content ?? '').replace(
            /(\b\d{3}-\d{2}-\d{4}\b)|(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)|((?<!\d)(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d))|(\b\d{8,17}\b)/g,
            (value: string, ssn: string, email: string, phone: string) => {
                const known = tokens.get(value);
                if (known) return known;
                const kind = ssn ? 'SSN' : email ? 'EMAIL' : phone ? 'PHONE' : 'ACCOUNT';
                const token = `[${prefix}${kind}_${originals.size + 1}]`;
                originals.set(token, value);
                tokens.set(value, token);
                return token;
            }
        );
    }

    function restoreResponse(content: string, requireEveryValue = false): string {
        const seen = new Set<string>();
        let unresolved = false;
        const tokenPattern = new RegExp(`\\[${prefix}(?:SSN|EMAIL|PHONE|ACCOUNT)_\\d+\\]`, 'g');
        const restoreString = (value: string): string => value.replace(tokenPattern, (token) => {
            const original = originals.get(token);
            if (original === undefined) {
                unresolved = true;
                return token;
            }
            seen.add(token);
            return original;
        });
        const restoreValue = (value: unknown): unknown => {
            if (typeof value === 'string') return restoreString(value);
            if (Array.isArray(value)) return value.map(restoreValue);
            if (value && typeof value === 'object') {
                return Object.fromEntries(Object.entries(value).map(([key, item]) => [restoreString(key), restoreValue(item)]));
            }
            return value;
        };

        // Restore decoded strings before serializing JSON: a phone containing a newline must
        // not introduce an unescaped literal newline into the Concierge's JSON response.
        let result: string;
        const unfenced = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        try {
            const decoded: unknown = JSON.parse(unfenced);
            result = JSON.stringify(restoreValue(decoded));
        } catch {
            result = restoreString(content);
        }
        if (requireEveryValue && (unresolved || [...(requiredTokens ?? originals.keys())].some((token) => !seen.has(token)))) {
            throw new Error('Writing suggestion omitted a private detail');
        }
        return result;
    }

    // Optional surrounding context uses this same map, while a writer still has to return
    // every protected value from its original text/notes. Existing callers require all values.
    const requiredTokens = requiredContents === undefined ? null : new Set<string>();
    if (requiredTokens) {
        requiredContents?.forEach(redact);
        originals.forEach((_, token) => requiredTokens.add(token));
    }
    return { redact, restoreResponse };
}

/** Privacy-only compatibility helper for callers that do not need a returned suggestion. */
export function sanitizeInput(content: string): string {
    return createRedactionSession([content]).redact(content);
}
