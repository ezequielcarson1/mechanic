import { useUser } from '@/context/UserContext';
import { ConfigService } from '@/lib/config/ConfigService';
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
    // Keep reference to the latest WS instance so listener can close it and reconnect
    const currentSocket = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

    // Initial connection logic & listener
    useEffect(() => {
        if (!user?.id) return;

        // Reconnect if config changes while we are authenticated
        const handleConfigChange = () => {
            console.log('[Socket] Config changed, reconnecting...');
            if (currentSocket.current) {
                // Remove onclose to prevent the auto-reconnect from firing while we manually reconnect
                currentSocket.current.onclose = null;
                currentSocket.current.close();
            }
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            connect();
        };

        ConfigService.addListener(handleConfigChange);

        // Ensure config is initialized, then connect
        ConfigService.init().then(() => {
            connect();
        });

        return () => {
            ConfigService.removeListener(handleConfigChange);
            if (currentSocket.current) {
                currentSocket.current.onclose = null;
                currentSocket.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [user?.id]);

    const connect = () => {
        const WS_URL = ConfigService.getWsUrl();

        console.log('[Socket] Connecting to', WS_URL);
        const ws = new WebSocket(WS_URL);
        currentSocket.current = ws;

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

        ws.onerror = () => {
            console.warn('[Socket] Could not connect to', WS_URL, '— server may be offline');
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
