/** The word for a count: pluralWord(1, 'policy', 'policies') → "policy", pluralWord(2, ...) → "policies". */
export function pluralWord(count: number, one: string, many: string = `${one}s`): string {
    return count === 1 ? one : many;
}

/** A count with its word: plural(1, 'account') → "1 account", plural(2, 'account') → "2 accounts". */
export function plural(count: number, one: string, many?: string): string {
    return `${count} ${pluralWord(count, one, many)}`;
}
