// SvelteKit client hook module. It loads before the app's own code, so wrapping
// window.fetch here covers every raw fetch() write in the app.
//
// The backend (backend/csrf.py) uses double-submit-cookie CSRF protection: every
// POST/PUT/PATCH/DELETE must send the csrf_token cookie value back in X-CSRF-Token.
// Production enforces it, so the header is added here once instead of in each caller.
import type { HandleClientError } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

// An unknown address (404) is shown by routes/+error.svelte, so it stays out of the
// console; every other unexpected error is logged as SvelteKit's default does.
export const handleError: HandleClientError = ({ error, status, message }) => {
	if (status !== 404) console.error(error);
	return { message };
};

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

	const csrfFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
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

	// Expired sessions: when an API call carrying a Bearer token gets a 401, refresh
	// the session once (shared by parallel calls, see refreshSession) and retry the
	// call with the new token. If the refresh is refused, sign out gently.
	const wrapped = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const res = await csrfFetch(input, init);
		if (res.status !== 401 || input instanceof Request) return res;

		const headers = new Headers(init?.headers);
		const sent = headers.get('Authorization');
		if (!sent?.startsWith('Bearer ')) return res;

		let url: URL;
		try {
			url = new URL(String(input instanceof URL ? input.href : input), window.location.href);
		} catch {
			return res;
		}
		if (!origins.has(url.origin) || url.pathname.startsWith('/api/auth/')) return res;

		const { refreshSession, auth } = await import('$lib/stores/auth');
		let token = localStorage.getItem('continuum_auth_token');
		if (!token || `Bearer ${token}` === sent) {
			// Nobody has refreshed since this call was sent, so do it now
			const refreshed = await refreshSession();
			if (!refreshed.ok) {
				if (refreshed.definite) {
					auth.logout();
					if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
				}
				return res;
			}
			token = refreshed.token;
		}
		headers.set('Authorization', `Bearer ${token}`);
		return csrfFetch(input, { ...init, headers });
	};
	(wrapped as unknown as { __csrfWrapped: boolean }).__csrfWrapped = true;
	window.fetch = wrapped as typeof window.fetch;
}
