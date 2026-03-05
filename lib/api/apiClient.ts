import { ConfigService } from '../config/ConfigService';

export const apiClient = {
    async get<T = any>(endpoint: string): Promise<T> {
        await ConfigService.init(); // Ensure loaded before fetching
        const baseUrl = ConfigService.getApiBaseUrl();
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`GET ${endpoint} failed: ${errorData.error || response.statusText}`);
        }
        return response.json();
    },

    async post<T = any>(endpoint: string, data: any): Promise<T> {
        await ConfigService.init();
        const baseUrl = ConfigService.getApiBaseUrl();
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`POST ${endpoint} failed: ${errorData.error || response.statusText}`);
        }
        return response.json();
    },

    async patch<T = any>(endpoint: string, data: any): Promise<T> {
        await ConfigService.init();
        const baseUrl = ConfigService.getApiBaseUrl();
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`PATCH ${endpoint} failed: ${response.statusText}`);
        return response.json();
    },

    async delete<T = any>(endpoint: string): Promise<T> {
        await ConfigService.init();
        const baseUrl = ConfigService.getApiBaseUrl();
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`DELETE ${endpoint} failed: ${response.statusText}`);
        return response.json();
    },

    async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
        await ConfigService.init();
        const baseUrl = ConfigService.getApiBaseUrl();
        // Do NOT set Content-Type — fetch sets it automatically with the multipart boundary
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`POST ${endpoint} failed: ${(errorData as any).error || response.statusText}`);
        }
        return response.json();
    }
};
