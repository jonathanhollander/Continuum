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
    technicalDetails?: string; // Technical message for the collapsed "Show details" toggle
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
            message: data.error?.message || 'That paused for a moment. We can try again whenever you\'re ready.',
            code: data.error?.code,
            details: data.error?.details,
            timestamp: data.error?.timestamp,
            technicalDetails: data._technical
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
            return `A little more information will help here. Take a look whenever you're ready.`;
        case 401:
            return `Please sign in again whenever you're ready.`;
        case 403:
            return `That belongs to another account's access. The person who set up this space can open it for you.`;
        case 404:
            return `That may have moved. The dashboard is a good place to look.`;
        case 409:
            return `That name is already here. A different name will make it its own.`;
        case 413:
            return `A smaller copy of this file will fit.`;
        case 429:
            return `Take your time. We're here when you're ready.`;
        case 500:
            return `That paused on our side for a moment. We can try again whenever you're ready.`;
        case 503:
            return `Everything you've saved is safe. We can try again whenever you're ready.`;
        default:
            return `That paused for a moment. We can try again together, or support is here to help.`;
    }
}

/**
 * Handle fetch errors (network issues, etc.)
 */
export function handleFetchError(error: unknown): ErrorDetails {
    logger.error('Fetch error', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            message: `Everything you've saved is safe. Once your internet connection is back, we can try again.`,
            code: 'NETWORK_ERROR'
        };
    }

    // A thrown Error that already carries a gentle server message keeps it.
    if (error instanceof Error && !(error instanceof TypeError) && error.name !== 'AbortError' && error.message) {
        return { message: error.message, code: 'UNKNOWN_ERROR' };
    }

    return {
        message: `That paused for a moment. We can try again whenever you're ready.`,
        code: 'UNKNOWN_ERROR',
        details: { originalError: String(error) }
    };
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
            return 'Time to sign in again';

        case 'NOT_AUTHORIZED':
            return 'Permission Needed';

        case 'NOT_FOUND':
            return 'That may have moved';

        case 'VALIDATION_ERROR':
            return 'A bit more information';

        case 'NETWORK_ERROR':
            return 'Connecting';

        case 'SERVICE_UNAVAILABLE':
            return 'Ready when you are';

        case 'FILE_TOO_LARGE':
            return 'A smaller copy will fit';

        case 'INVALID_FILE_TYPE':
            return 'A different file type will fit';

        case 'RATE_LIMITED':
            return 'Take Your Time';

        case 'DATABASE_ERROR':
            return "Everything you've saved is safe";

        default:
            return "We're here to help";
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
    technicalDetails?: string;
}

/**
 * Technical text for the collapsed "Show details" toggle.
 * Uses the technical message when present, else the code and any extra details.
 */
function buildTechnicalDetails(error: ErrorDetails): string | undefined {
    if (error.technicalDetails) return error.technicalDetails;
    const lines: string[] = [];
    if (error.code) lines.push(`Code: ${error.code}`);
    if (error.details && Object.keys(error.details).length > 0) {
        try {
            lines.push(JSON.stringify(error.details, null, 2));
        } catch {
            lines.push(String(error.details));
        }
    }
    if (error.timestamp) lines.push(`Time: ${error.timestamp}`);
    return lines.length > 0 ? lines.join('\n') : undefined;
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
        technicalDetails: buildTechnicalDetails(error)
    };
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
