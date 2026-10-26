/**
 * Privacy filter: masks sensitive patterns before any text is sent to the AI.
 * SSNs, account-like numbers, email addresses and phone numbers stay in the browser.
 */
export function sanitizeInput(content: string): string {
    let sanitized = String(content ?? '');

    // SSNs (xxx-xx-xxxx)
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');

    // Account numbers: runs of 8-17 digits
    sanitized = sanitized.replace(/\b\d{8,17}\b/g, '[REDACTED_ACCOUNT]');

    // Email addresses
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]');

    // Phone numbers (555-123-4567, (555) 123-4567, +1 555.123.4567)
    sanitized = sanitized.replace(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[REDACTED_PHONE]');

    return sanitized;
}
