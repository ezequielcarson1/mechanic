import axios from 'axios';

// Priority: runtime window.__ENV__ (Docker) → build-time VITE_API_BASE_URL (dev) → relative fallback
const apiBaseUrl: string =
    (window as any).__ENV__?.API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '/api';

const api = axios.create({ baseURL: apiBaseUrl });

export const UserAPI = {
    getAll: (role?: string) => api.get('/users', { params: { role } }),
    get: (id: string) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
};

export const AppointmentAPI = {
    getAll: () => api.get('/appointments'),
    create: (data: any) => api.post('/appointments', data),
    update: (id: string, data: any) => api.patch(`/appointments/${id}`, data),
    delete: (id: string) => api.delete(`/appointments/${id}`),
    deleteAll: () => api.delete('/appointments/all'),
};

export const AssistanceAPI = {
    getAll: (filters?: any) => api.get('/assistance', { params: filters }),
    update: (id: string, data: any) => api.patch(`/assistance/${id}`, data),
    delete: (id: string) => api.delete(`/assistance/${id}`),
    deleteAll: () => api.delete('/assistance/all'),
};

export default api;
