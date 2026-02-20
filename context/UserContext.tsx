import { userDAO } from '@/lib/dao/UserDAO';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface UserData {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    dob: string;
    profileImage?: string;
    role: 'mechanic' | 'user';
    address?: {
        street?: string;
        apartment?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    workAddress?: {
        street?: string;
        apartment?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
}

interface UserContextType {
    user: UserData | null;
    isLoading: boolean;
    login: (phone: string) => Promise<boolean>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<UserData>, syncToBackend?: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            const savedUser = await AsyncStorage.getItem('user_session');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error('Failed to load session', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (phone: string): Promise<boolean> => {
        try {
            const userData = await userDAO.login(phone);
            if (userData) {
                // Use the role from the database
                const userWithRole: UserData = { ...userData };

                setUser(userWithRole);
                await AsyncStorage.setItem('user_session', JSON.stringify(userWithRole));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('user_session');
    };

    const updateUser = async (updates: Partial<UserData>, syncToBackend: boolean = true) => {
        if (!user) return;
        try {
            if (syncToBackend) {
                await userDAO.update(user.id, updates);
            }
            const newUser = { ...user, ...updates };
            setUser(newUser);
            await AsyncStorage.setItem('user_session', JSON.stringify(newUser));
        } catch (error) {
            console.error('Failed to update user', error);
        }
    };

    return (
        <UserContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
