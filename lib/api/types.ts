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
    error: string;
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
    public readonly apiError: string;

    constructor(statusCode: number, apiMessage: string, apiError: string) {
        super(`[${statusCode}] ${apiMessage}: ${apiError}`);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.apiMessage = apiMessage;
        this.apiError = apiError;
    }
}
