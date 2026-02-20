import { apiClient } from '../api/apiClient';
import { IAppointmentDAO } from './interfaces';

export class AppointmentDAO implements IAppointmentDAO {
    async getAll(filters?: { userId?: string; mechanicId?: string }): Promise<any[]> {
        let url = '/api/appointments';
        if (filters) {
            const params = new URLSearchParams(filters as any);
            url += `?${params.toString()}`;
        }
        return apiClient.get(url);
    }

    async create(appointment: any): Promise<any> {
        return apiClient.post('/api/appointments', appointment);
    }

    async update(id: string, updates: any): Promise<void> {
        return apiClient.patch(`/api/appointments/${id}`, updates);
    }
}

export const appointmentDAO = new AppointmentDAO();
