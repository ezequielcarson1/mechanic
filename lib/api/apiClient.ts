import { Platform } from 'react-native';

// For Android emulator, localhost is 10.0.2.2
const getBaseUrl = () => {
    if (__DEV__) {
        if (Platform.OS === 'android') {
            return 'http://20.124.131.193:3000';
        }
        return 'http://20.124.131.193:3000';
    }
    // Production URL would go here
    return 'http://20.124.131.193:3000';
};

const BASE_URL = getBaseUrl();

export const apiClient = {
    async get<T = any>(endpoint: string): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`GET ${endpoint} failed: ${errorData.error || response.statusText}`);
        }
        return response.json();
    },

    async post<T = any>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
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
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`PATCH ${endpoint} failed: ${response.statusText}`);
        return response.json();
    },

    async delete<T = any>(endpoint: string): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`DELETE ${endpoint} failed: ${response.statusText}`);
        return response.json();
    }
};
