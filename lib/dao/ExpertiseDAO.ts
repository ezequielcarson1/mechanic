import { apiClient } from '../api/apiClient';

export interface ExpertiseItem {
    id: string;
    name: string;
}

export interface MechanicPreferences {
    assistanceTypes: ExpertiseItem[];
    servicesOffered: ExpertiseItem[];
}

export class ExpertiseDAO {
    async listAssistanceTypes(): Promise<ExpertiseItem[]> {
        return apiClient.get<ExpertiseItem[]>('/api/assistance-types');
    }

    async listServicesOffered(): Promise<ExpertiseItem[]> {
        return apiClient.get<ExpertiseItem[]>('/api/services-offered');
    }

    async getPreferences(userId: string): Promise<MechanicPreferences> {
        return apiClient.get<MechanicPreferences>(
            `/api/mechanic-preferences/user/${userId}`,
        );
    }

    async setPreferences(
        userId: string,
        payload: { assistanceTypeIds: string[]; serviceOfferedIds: string[] },
    ): Promise<MechanicPreferences> {
        return apiClient.patch<MechanicPreferences>(
            `/api/mechanic-preferences/user/${userId}`,
            payload,
        );
    }
}

export const expertiseDAO = new ExpertiseDAO();
