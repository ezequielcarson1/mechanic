import { apiClient } from '../api/apiClient';
import { ISetupDAO } from './interfaces';

export class SetupDAO implements ISetupDAO {
    async getProgress(key: string): Promise<any> {
        return apiClient.get(`/api/setup/${key}`);
    }

    async saveProgress(key: string, value: any): Promise<void> {
        return apiClient.post(`/api/setup/${key}`, value);
    }
}

export const setupDAO = new SetupDAO();
