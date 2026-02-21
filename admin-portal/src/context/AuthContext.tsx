import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

interface User {
    id: string;
    name: string;
    surname: string;
    phone: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const storedUser = localStorage.getItem('admin_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (phone: string, password: string) => {
        try {
            // 1. Check password against env var (or default fallback for local dev if not set)
            const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
            if (password !== adminPassword) {
                return { success: false, error: 'Invalid credentials' };
            }

            // 2. Check if user exists and is an admin
            const response = await api.post('/login', { phone });
            const userData = response.data;

            if (userData.role !== 'admin') {
                return { success: false, error: 'User is not an admin' };
            }

            setUser(userData);
            localStorage.setItem('admin_user', JSON.stringify(userData));

            return { success: true };
        } catch (error: any) {
            console.error('Login error', error);
            if (error.response?.status === 404) {
                return { success: false, error: 'Invalid credentials' }; // Masking "User not found"
            }
            return { success: false, error: 'An error occurred during login. Please try again.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('admin_user');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
