import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export interface AppNotification {
    id: string;
    type: 'mechanic_found' | 'offer_accepted' | 'job_canceled' | 'general';
    title: string;
    body: string;
    time: string; // e.g. "2m", "now"
    unread: boolean;
    requestId?: string;
    createdAt: number; // timestamp
}

interface NotificationsContextType {
    notifications: AppNotification[];
    addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'time' | 'unread'>) => void;
    markAllRead: () => void;
    deleteNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

function formatTime(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'time' | 'unread'>) => {
        const createdAt = Date.now();
        const newNotif: AppNotification = {
            ...n,
            id: `notif-${createdAt}-${Math.random().toString(36).slice(2)}`,
            createdAt,
            time: 'now',
            unread: true,
        };
        setNotifications(prev => [newNotif, ...prev]);
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    }, []);

    const deleteNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationsContext.Provider value={{ notifications, addNotification, markAllRead, deleteNotification }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
    return ctx;
}
