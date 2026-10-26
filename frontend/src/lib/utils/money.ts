// One money rule for the screens and the packet: whole cents, rounded half-up in decimal.

/** An amount as whole cents, half-up on its decimal digits (3050.275 -> 305028), never on the binary float. */
export function toCents(v: unknown): number {
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return 0;
    // toFixed(8) drops float noise (6250.275 - 3200 = 3050.2749999...) and keeps a plain decimal string
    const s = Math.abs(n).toFixed(8);
    if (/e/i.test(s)) return Math.sign(n) * Math.round(Math.abs(n) * 100); // beyond 1e21: no cents to keep
    const [whole, frac] = s.split('.');
    const cents = Number(whole) * 100 + Number(frac.slice(0, 2)) + (Number(frac[2]) >= 5 ? 1 : 0);
    return Math.sign(n) * cents;
}

/** Dollars from whole cents. */
export const fromCents = (c: number): number => c / 100;

/** An amount rounded to the cent, as dollars. */
export const roundMoney = (v: unknown): number => fromCents(toCents(v));

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** "$3,050.28": the amount to the cent, half-up. */
export const formatMoney = (v: unknown): string => usd.format(roundMoney(v));
