/**
 * Centralized Frontend Configuration
 *
 * All environment variables and configuration constants should be defined here.
 * This provides a single source of truth for configuration across the frontend.
 */

/**
 * Backend API Base URL
 *
 * - Development: http://localhost:8000
 * - Production: Set via VITE_API_URL environment variable
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Full API endpoint URL (with /api prefix)
 */
export const API_URL = `${API_BASE_URL}/api`;

/**
 * Default API timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * OpenRouter API Key (optional - for AI features)
 */
export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

/**
 * Environment check helpers
 */
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

/**
 * Application metadata
 */
export const APP_NAME = 'Continuum SaaS';
export const APP_VERSION = '0.7.0';

/**
 * Configuration validation
 * Logs warnings if required configuration is missing in production
 */
if (isProduction) {
    if (!import.meta.env.VITE_API_URL) {
        console.warn('⚠️ VITE_API_URL is not set in production. Using default:', API_BASE_URL);
    }
}

/**
 * Get environment-appropriate frontend URL
 * Useful for generating shareable links
 */
export const getFrontendUrl = (): string => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return 'http://localhost:5173'; // SSR fallback
};
