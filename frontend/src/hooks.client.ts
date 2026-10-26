// SvelteKit client hook module. It loads before the app's own code, so wrapping
// window.fetch here covers every raw fetch() write in the app.
//
// The backend (backend/csrf.py) uses double-submit-cookie CSRF protection: every
// POST/PUT/PATCH/DELETE must send the csrf_token cookie value back in X-CSRF-Token.
// Production enforces it, so the header is added here once instead of in each caller.
import { API_BASE_URL } from '$lib/config';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCsrfCookie(): string | null {
	const match = document.cookie.split('; ').find((c) => c.startsWith(`${CSRF_COOKIE}=`));
	return match ? decodeURIComponent(match.slice(CSRF_COOKIE.length + 1)) : null;
}

function allowedOrigins(): Set<string> {
	const origins = new Set<string>([window.location.origin]);
	if (API_BASE_URL) {
		try {
			origins.add(new URL(API_BASE_URL, window.location.href).origin);
		} catch {
			// ignore a malformed API_BASE_URL; same-origin still works
		}
	}
	return origins;
}

if (typeof window !== 'undefined' && !(window.fetch as { __csrfWrapped?: boolean }).__csrfWrapped) {
	const nativeFetch = window.fetch.bind(window);
	const origins = allowedOrigins();

	const wrapped = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const request = input instanceof Request ? input : null;
		const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
		if (!WRITE_METHODS.has(method)) return nativeFetch(input, init);

		let origin: string;
		try {
			const url = request ? request.url : input instanceof URL ? input.href : String(input);
			origin = new URL(url, window.location.href).origin;
		} catch {
			return nativeFetch(input, init);
		}
		if (!origins.has(origin)) return nativeFetch(input, init);

		const headers = new Headers(init?.headers ?? request?.headers);
		if (headers.has(CSRF_HEADER)) return nativeFetch(input, init);

		let token = readCsrfCookie();
		if (!token) {
			// The server sets the cookie on any response; it expires after an hour, so
			// fetch a cheap one if it is gone.
			try {
				await nativeFetch(`${API_BASE_URL}/api/health`, { credentials: 'include' });
			} catch {
				// fall through; the write will report its own failure
			}
			token = readCsrfCookie();
		}
		if (token) headers.set(CSRF_HEADER, token);

		return nativeFetch(input, { ...init, headers });
	};
	(wrapped as unknown as { __csrfWrapped: boolean }).__csrfWrapped = true;
	window.fetch = wrapped as typeof window.fetch;
}
