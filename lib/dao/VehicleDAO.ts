import { apiClient } from '../api/apiClient';
import { IVehicleDAO, Vehicle } from './interfaces';

export class VehicleDAO implements IVehicleDAO {
    async getByUser(userId: string): Promise<Vehicle[]> {
        return apiClient.get(`/api/vehicles/user/${encodeURIComponent(userId)}`);
    }

    async create(vehicle: Vehicle): Promise<Vehicle> {
        return apiClient.post('/api/vehicles', vehicle);
    }

    async update(id: string, updates: Partial<Vehicle>): Promise<void> {
        return apiClient.patch(`/api/vehicles/${id}`, updates);
    }

    async delete(id: string): Promise<void> {
        return apiClient.delete(`/api/vehicles/${id}`);
    }
}

export const vehicleDAO = new VehicleDAO();
