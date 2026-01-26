/**
 * Centralized error handling for Continuum frontend.
 *
 * Provides:
 * - Consistent error parsing from backend
 * - Compassionate user-facing error messages
 * - Error notification system
 * - Error logging and monitoring
 */
import { logger } from '../utils/logger';
import { overwhelmDetector } from './overwhelmDetection';

export interface ErrorDetails {
    message: string; // User-facing message
    code?: string; // Error code for programmatic handling
    details?: Record<string, any>; // Additional context
    timestamp?: string;
    technicalDetails?: string; // Raw technical error info for debugging
}

export interface ApiErrorResponse {
    error: {
        message: string;
        code?: string;
        details?: Record<string, any>;
        timestamp?: string;
    };
    _technical?: string; // Technical details (dev mode only)
}

/**
 * Parse error from API response.
 */
export async function parseApiError(response: Response): Promise<ErrorDetails> {
    try {
        const data: ApiErrorResponse = await response.json();
        return {
            message: data.error?.message || 'Something went wrong. Please try again.',
            code: data.error?.code,
            details: data.error?.details,
            timestamp: data.error?.timestamp
        };
    } catch {
        // If response is not JSON, create generic error
        return {
            message: getGenericErrorMessage(response.status),
            code: `HTTP_${response.status}`
        };
    }
}

/**
 * Get a generic error message based on HTTP status code.
 */
function getGenericErrorMessage(status: number): string {
    switch (status) {
        case 400:
            return `There was an issue with your request. Please check your information and try again.`;
        case 401:
            return `Your session has expired. Please sign in again.`;
        case 403:
            return `You don't have permission to do that.`;
        case 404:
            return `We couldn't find what you're looking for.`;
        case 409:
            return `This already exists. Please try a different name.`;
        case 413:
            return `The file you're trying to upload is too large.`;
        case 429:
            return `You're doing that too quickly. Take your time—we're here when you're ready.`;
        case 500:
            return `We encountered an unexpected issue. Our team has been notified.`;
        case 503:
            return `We're having trouble connecting right now. Please try again in a moment.`;
        default:
            return `Something unexpected happened. Please try again or contact support.`;
    }
}

/**
 * Handle fetch errors (network issues, etc.)
 */
export function handleFetchError(error: unknown): ErrorDetails {
    logger.error('Fetch error', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            message: `We're having trouble connecting. Please check your internet connection and try again.`,
            code: 'NETWORK_ERROR'
        };
    }

    return {
        message: `Something unexpected happened. Please try again.`,
        code: 'UNKNOWN_ERROR',
        details: { originalError: String(error) }
    };
}

/**
 * Handle API request with error handling.
 *
 * @example
 * const result = await handleApiRequest(async () => {
 *   const res = await fetch('/api/data', { headers: { 'Authorization': `Bearer ${token}` } });
 *   return res;
 * });
 *
 * if (result.ok) {
 *   const data = await result.response.json();
 *   // Use data
 * } else {
 *   // Show error to user: result.error.message
 * }
 */
export async function handleApiRequest(
    requestFn: () => Promise<Response>
): Promise<{ ok: true; response: Response } | { ok: false; error: ErrorDetails }> {
    try {
        const response = await requestFn();

        if (!response.ok) {
            const error = await parseApiError(response);
            return { ok: false, error };
        }

        return { ok: true, response };
    } catch (error) {
        return { ok: false, error: handleFetchError(error) };
    }
}

/**
 * Map error codes to specific user actions/messages.
 */
export function getErrorAction(code?: string): { action: string; canRetry: boolean } {
    switch (code) {
        case 'AUTH_FAILED':
        case 'TOKEN_EXPIRED':
            return { action: 'redirect_to_login', canRetry: false };

        case 'NOT_AUTHORIZED':
            return { action: 'show_permission_message', canRetry: false };

        case 'NOT_FOUND':
            return { action: 'redirect_to_home', canRetry: false };

        case 'VALIDATION_ERROR':
            return { action: 'highlight_field', canRetry: true };

        case 'NETWORK_ERROR':
        case 'SERVICE_UNAVAILABLE':
            return { action: 'show_retry_button', canRetry: true };

        case 'FILE_TOO_LARGE':
        case 'INVALID_FILE_TYPE':
            return { action: 'highlight_upload', canRetry: true };

        case 'RATE_LIMITED':
            return { action: 'show_wait_message', canRetry: true };

        default:
            return { action: 'show_error', canRetry: true };
    }
}

/**
 * Get compassionate error title based on error code.
 */
export function getErrorTitle(code?: string): string {
    switch (code) {
        case 'AUTH_FAILED':
        case 'TOKEN_EXPIRED':
            return 'Session Expired';

        case 'NOT_AUTHORIZED':
            return 'Permission Needed';

        case 'NOT_FOUND':
            return 'Not Found';

        case 'VALIDATION_ERROR':
            return 'Please Check Your Information';

        case 'NETWORK_ERROR':
            return 'Connection Issue';

        case 'SERVICE_UNAVAILABLE':
            return 'Temporarily Unavailable';

        case 'FILE_TOO_LARGE':
            return 'File Too Large';

        case 'INVALID_FILE_TYPE':
            return 'File Type Not Supported';

        case 'RATE_LIMITED':
            return 'Take Your Time';

        case 'DATABASE_ERROR':
            return 'Having Trouble Saving';

        default:
            return 'Something Went Wrong';
    }
}

/**
 * Error notification interface for UI components.
 */
export interface ErrorNotification {
    id: string;
    title: string;
    message: string;
    code?: string;
    canRetry: boolean;
    timestamp: Date;
    technicalDetails?: string; // Raw error info users can copy
}

/**
 * Create an error notification from ErrorDetails.
 */
export function createErrorNotification(error: ErrorDetails): ErrorNotification {
    const action = getErrorAction(error.code);

    return {
        id: `error-${Date.now()}-${Math.random()}`,
        title: getErrorTitle(error.code),
        message: error.message,
        code: error.code,
        canRetry: action.canRetry,
        timestamp: new Date(),
        technicalDetails: error.technicalDetails
    };
}

/**
 * Enhanced fetch wrapper with automatic error handling.
 *
 * @example
 * const data = await apiFetch('/api/contacts', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 */
export async function apiFetch<T = any>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const result = await handleApiRequest(async () => {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        });
        return res;
    });

    if (!result.ok) {
        // Throw with ErrorDetails so calling code can handle it
        throw result.error;
    }

    // Handle empty responses (204 No Content, 404, etc.)
    const contentType = result.response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        return null as T;
    }

    return result.response.json();
}

/**
 * Log error to monitoring service (placeholder for future integration).
 */
export function logError(error: ErrorDetails, context?: string) {
    logger.error(`[Error] ${context || 'Unknown context'}`, error);
    overwhelmDetector.recordError();

    // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    // if (import.meta.env.PROD) {
    //     sentryService.captureException(error);
    // }
}

/**
 * Retry a failed operation with exponential backoff.
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                logger.info(`Retry attempt ${attempt + 1} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}
