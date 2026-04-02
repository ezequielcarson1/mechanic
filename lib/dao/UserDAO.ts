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
        return apiClient.post('/api/auth/login', { phone });
    }

    /** Firebase-authenticated login: sends the ID token + phone fallback to the backend */
    async loginWithFirebase(firebaseIdToken: string, phone?: string): Promise<UserData | null> {
        return apiClient.post('/api/auth/login', { idToken: firebaseIdToken, phone });
    }

    async checkPhoneExists(phone: string): Promise<boolean> {
        const result = await apiClient.get<{ exists: boolean }>(`/api/users/check-phone/${encodeURIComponent(phone)}`);
        return result.exists;
    }

    /** Pre-checks whether a phone number is allowed to receive an OTP before calling Firebase.
     *  Returns a neutral allowed/message response — never reveals account existence to the caller. */
    async preCheckPhone(phone: string): Promise<{ allowed: boolean; message?: string }> {
        return apiClient.post('/api/auth/pre-check', { phone });
    }

    async register(setupProgress: Record<string, unknown>): Promise<unknown> {
        const payload = this.buildRegistrationPayload(setupProgress);
        return apiClient.post('/api/users', payload);
    }

    /**
     * Transforms raw setup progress (keyed by step) into the flat
     * CreateUserDto shape the backend expects.
     *
     * Setup progress shape:
     *   { phone, otp, role, basicInfo, address, vehicles, identity,
     *     credentials, dealerInfo, expertise, availability, lastStep }
     *
     * Backend CreateUserDto expects top-level fields:
     *   { name, surname, email, phone, dob, profileImage, role, firebaseUid,
     *     address, vehicles, dealerInfo, expertise, credentials, availability, identity }
     */
    private buildRegistrationPayload(progress: Record<string, unknown>): Record<string, unknown> {
        const basicInfo = (progress.basicInfo ?? {}) as Record<string, unknown>;
        const phoneData = (progress.phone ?? {}) as Record<string, unknown>;
        const otpData = (progress.otp ?? {}) as Record<string, unknown>;
        const roleData = (progress.role ?? {}) as Record<string, unknown>;
        const addressData = progress.address as Record<string, unknown> | undefined;
        const vehiclesData = progress.vehicles as Record<string, unknown>[] | undefined;

        const payload: Record<string, unknown> = {
            // Flat top-level fields extracted from basicInfo
            name: basicInfo.name,
            surname: basicInfo.surname,
            email: basicInfo.email,
            dob: basicInfo.dob,
            profileImage: basicInfo.profileImage,

            // Phone as a plain string (backend expects string, not object)
            phone: phoneData.phoneNumber,

            // Role as a plain string
            role: roleData.role,

            // Firebase UID from OTP step
            firebaseUid: otpData.firebaseUid,
        };

        // Nested objects — pass through as the backend expects Record<string, any>
        if (addressData) payload.address = addressData;
        if (progress.dealerInfo) payload.dealerInfo = progress.dealerInfo;
        if (progress.expertise) payload.expertise = progress.expertise;
        if (progress.credentials) payload.credentials = progress.credentials;
        if (progress.availability) payload.availability = progress.availability;
        if (progress.identity) payload.identity = progress.identity;

        // Vehicles: strip client-generated `id` — Prisma generates UUIDs server-side
        if (vehiclesData && Array.isArray(vehiclesData) && vehiclesData.length > 0) {
            payload.vehicles = vehiclesData.map(({ id: _clientId, ...vehicleFields }) => vehicleFields);
        }

        return payload;
    }

    async update(id: string, updates: Partial<UserData>): Promise<void> {
        return apiClient.patch(`/api/users/${id}`, updates);
    }
}

export const userDAO = new UserDAO();
