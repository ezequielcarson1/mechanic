import { useUser } from '@/context/UserContext';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

interface SocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: any;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (!user?.id) return;

        connect();

        return () => {
            if (socket) {
                socket.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [user?.id]);

    const connect = () => {
        // Replace with your actual server IP/URL. 
        // In dev, usually localhost or machine IP.
        const WS_URL = 'ws://192.168.1.229:3000';

        console.log('[Socket] Connecting to', WS_URL);
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('[Socket] Connected');
            setIsConnected(true);

            // Register user
            if (user?.id) {
                ws.send(JSON.stringify({ type: 'register', userId: user.id }));
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[Socket] Received:', data);
                setLastMessage(data);
            } catch (e) {
                console.error('[Socket] Failed to parse message', e);
            }
        };

        ws.onclose = () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
            setSocket(null);

            // Attempt reconnect in 5s
            reconnectTimeout.current = setTimeout(connect, 5000) as any;
        };

        ws.onerror = (e) => {
            console.error('[Socket] Error:', e);
        };

        setSocket(ws);
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, lastMessage }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
