import { apiClient } from '../api/apiClient';
import { IUserDAO, UserData } from './interfaces';

export class UserDAO implements IUserDAO {
    async getAll(): Promise<UserData[]> {
        return apiClient.get('/api/users');
    }

    async getById(id: string): Promise<UserData | null> {
        return apiClient.get(`/api/users/${id}`);
    }

    /** Legacy phone-only login (kept for reference — use loginWithFirebase instead) */
    async login(phone: string): Promise<UserData | null> {
        return apiClient.post('/api/login', { phone });
    }

    /** Firebase-authenticated login: sends the ID token to the backend for verification */
    async loginWithFirebase(firebaseIdToken: string): Promise<UserData | null> {
        return apiClient.post('/api/login', { idToken: firebaseIdToken });
    }

    async checkPhoneExists(phone: string): Promise<boolean> {
        const response = await apiClient.get<{ exists: boolean }>(`/api/users/check-phone/${encodeURIComponent(phone)}`);
        return response.exists;
    }

    async register(setupData: any): Promise<any> {
        return apiClient.post('/api/users', setupData);
    }

    async update(id: string, updates: Partial<UserData>): Promise<void> {
        return apiClient.patch(`/api/users/${id}`, updates);
    }
}

export const userDAO = new UserDAO();
