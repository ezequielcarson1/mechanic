/**
 * Standardized API response envelope.
 *
 * Every endpoint returns this shape:
 *   Success → { success: true,  message: string, data: T }
 *   Error   → { success: false, message: string, error: string }
 */

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    message: string;
    data: T;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    error: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Custom error class that preserves structured error information from the API.
 * Consumers can use `instanceof ApiError` to discriminate API failures
 * from network / parse errors.
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly apiMessage: string;
    /** Raw error payload — may be a string, array, or structured object. */
    public readonly apiError: unknown;

    constructor(statusCode: number, apiMessage: string, apiError: unknown) {
        super(`[${statusCode}] ${apiMessage}: ${ApiError.serializeError(apiError)}`);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.apiMessage = apiMessage;
        this.apiError = apiError;
    }

    /** Converts any error shape into a human-readable string. */
    private static serializeError(error: unknown): string {
        if (typeof error === 'string') return error;
        if (Array.isArray(error)) return error.join(', ');
        if (error !== null && typeof error === 'object') {
            // NestJS validation: { message: string[] }
            const record = error as Record<string, unknown>;
            if (Array.isArray(record.message)) return record.message.join(', ');
            if (typeof record.message === 'string') return record.message;
            return JSON.stringify(error);
        }
        return 'Unknown error';
    }
}
