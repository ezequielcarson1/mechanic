import { useUser } from '@/context/UserContext';
import { ConfigService } from '@/lib/config/ConfigService';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    conversationId: string;
}

interface SocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: any;
    sendMessage: (type: string, payload: any) => void;
    chatHistory: Record<string, ChatMessage[]>;
    clearChatHistory: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});

    // Keep reference to the latest WS instance so listener can close it and reconnect
    const currentSocket = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
    const userIdRef = useRef<string | undefined>(undefined);

    // Send unregister so server marks user offline immediately
    const sendUnregister = () => {
        const ws = currentSocket.current;
        if (ws && ws.readyState === WebSocket.OPEN && userIdRef.current) {
            ws.send(JSON.stringify({ type: 'unregister', userId: userIdRef.current }));
        }
    };

    const clearChatHistory = (conversationId: string) => {
        setChatHistory(prev => {
            const next = { ...prev };
            delete next[conversationId];
            return next;
        });
    };

    const sendMessage = (type: string, payload: any) => {
        if (currentSocket.current && currentSocket.current.readyState === WebSocket.OPEN) {
            currentSocket.current.send(JSON.stringify({ type, ...payload }));

            // If it's a chat message, also store it locally in history
            if (type === 'chat_message' && payload.conversationId) {
                const myMsg: ChatMessage = {
                    id: Date.now().toString(),
                    text: payload.text,
                    senderId: payload.senderId,
                    timestamp: new Date().toISOString(),
                    conversationId: payload.conversationId
                };
                setChatHistory(prev => ({
                    ...prev,
                    [payload.conversationId]: [...(prev[payload.conversationId] || []), myMsg]
                }));
            }
        }
    };

    // Initial connection logic & listener
    useEffect(() => {
        userIdRef.current = user?.id;

        if (!user?.id) return;

        // Reconnect if config changes while we are authenticated
        const handleConfigChange = () => {
            console.log('[Socket] Config changed, reconnecting...');
            if (currentSocket.current) {
                currentSocket.current.onclose = null;
                currentSocket.current.close();
            }
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            connect();
        };

        ConfigService.addListener(handleConfigChange);

        // Mark offline when app goes to background, online when it returns
        const handleAppState = (nextState: AppStateStatus) => {
            if (nextState === 'background' || nextState === 'inactive') {
                sendUnregister();
            } else if (nextState === 'active') {
                // Re-register so server marks us online again
                const ws = currentSocket.current;
                if (ws && ws.readyState === WebSocket.OPEN && userIdRef.current) {
                    ws.send(JSON.stringify({ type: 'register', userId: userIdRef.current }));
                }
            }
        };
        const appStateSub = AppState.addEventListener('change', handleAppState);

        ConfigService.init().then(() => {
            connect();
        });

        return () => {
            ConfigService.removeListener(handleConfigChange);
            appStateSub.remove();
            // Notify server before closing (logout path)
            sendUnregister();
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

                // Handle incoming chat messages for history
                if (data.type === 'chat_message' && data.payload) {
                    const { text, senderId, timestamp, conversationId } = data.payload;
                    if (conversationId) {
                        const newMsg: ChatMessage = {
                            id: Date.now().toString(),
                            text,
                            senderId,
                            timestamp,
                            conversationId
                        };
                        setChatHistory(prev => ({
                            ...prev,
                            [conversationId]: [...(prev[conversationId] || []), newMsg]
                        }));
                    }
                }

                // Handle cancellation to clear history
                if (data.type === 'assistance_update' && data.payload?.status === 'canceled') {
                    if (data.payload.requestId) {
                        console.log(`[Socket] Clearing chat history for cancelled request: ${data.payload.requestId}`);
                        clearChatHistory(data.payload.requestId);
                    }
                }
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
        <SocketContext.Provider value={{ socket, isConnected, lastMessage, sendMessage, chatHistory, clearChatHistory }}>
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
