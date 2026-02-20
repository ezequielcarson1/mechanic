import { apiClient } from '../api/apiClient';
import { AssistanceRequest, IAssistanceDAO } from './interfaces';

export class AssistanceDAO implements IAssistanceDAO {
    async getAll(filters?: { userId?: string; mechanicId?: string; status?: string }): Promise<AssistanceRequest[]> {
        let url = '/api/assistance';
        if (filters) {
            const params = new URLSearchParams(filters as any);
            url += `?${params.toString()}`;
        }
        return apiClient.get(url);
    }

    async getById(id: string): Promise<AssistanceRequest | null> {
        return apiClient.get(`/api/assistance/${id}`);
    }

    async updateStatus(id: string, mechanicId: string, status: string): Promise<void> {
        return apiClient.patch(`/api/assistance/${id}`, { mechanicId, status });
    }

    async create(request: Partial<AssistanceRequest>): Promise<AssistanceRequest> {
        return apiClient.post('/api/assistance', request);
    }
}

export const assistanceDAO = new AssistanceDAO();
