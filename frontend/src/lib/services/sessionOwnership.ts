/** Ownership of asynchronous work. Independent of auth/stores to avoid import cycles. */
export interface SessionOwnership {
    readonly generation: number;
    readonly token: string | null;
    readonly ready: boolean;
}

const TOKEN_KEY = 'continuum_auth_token';
const readToken = () => {
    try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY); }
    catch { return null; }
};

let generation = 0;
let currentToken = readToken();
// A stored token becomes ready once /me has identified its account.
let ready = false;
const sessionTokens = new Set<string>(currentToken ? [currentToken] : []);

function observeToken() {
    const stored = readToken();
    if (stored !== currentToken) {
        generation++;
        currentToken = stored;
        ready = false;
        sessionTokens.clear();
        if (stored) sessionTokens.add(stored);
    }
}

export function captureSession(): SessionOwnership {
    observeToken();
    return { generation, token: currentToken, ready };
}

/** Login/logout starts a new generation before any asynchronous work begins. */
export function beginSession(): SessionOwnership {
    observeToken();
    generation++;
    ready = false;
    sessionTokens.clear();
    if (currentToken) sessionTokens.add(currentToken);
    return captureSession();
}

/** allowTransition is reserved for auth's own token and /me requests. */
export function isCurrentSession(owner: SessionOwnership, allowTransition = false): boolean {
    observeToken();
    return owner.generation === generation
        && (owner.token === null ? currentToken === null : sessionTokens.has(owner.token))
        && (allowTransition || (ready && owner.ready));
}

export function sessionToken(owner: SessionOwnership, allowTransition = false): string | null {
    return isCurrentSession(owner, allowTransition) ? currentToken : null;
}

export function ownsSessionToken(owner: SessionOwnership, token: string, allowTransition = false): boolean {
    return isCurrentSession(owner, allowTransition) && sessionTokens.has(token);
}

export class SessionChangedError extends Error {
    readonly code = 'SESSION_CHANGED';
    constructor() {
        super('Your draft stays with the account where you started it.');
        this.name = 'SessionChangedError';
    }
}

export function assertCurrentSession(owner: SessionOwnership, allowTransition = false): void {
    if (!isCurrentSession(owner, allowTransition)) throw new SessionChangedError();
}

/** Auth alone persists credentials. A refresh retains ownership of older in-flight tokens. */
export function commitSessionToken(
    owner: SessionOwnership, token: string | null, persist: () => void, refresh = false,
): boolean {
    if (!isCurrentSession(owner, true)) return false;
    persist();
    currentToken = token;
    if (!refresh) {
        sessionTokens.clear();
        ready = false;
    }
    if (token) sessionTokens.add(token);
    return true;
}

/** The token's user and cache namespace have both been identified. */
export function completeSession(owner: SessionOwnership): boolean {
    if (!isCurrentSession(owner, true)) return false;
    ready = true;
    return true;
}

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === TOKEN_KEY || event.key === null) beginSession();
    });
}
