import React, { useEffect, useRef, useState } from 'react';
import { UserAPI } from '../lib/api';

interface UserStatus {
    id: string;
    name: string;
    surname: string;
    phone: string;
    role: string;
    isOnline: number;
}

// Derive WS URL from the API base URL
function getWsUrl(): string {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
    if (apiBase) {
        // e.g. http://20.124.131.193:3000/api → ws://20.124.131.193:3000
        return apiBase.replace(/^http/, 'ws').replace(/\/api$/, '');
    }
    // Relative (same host, served behind nginx)
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}`;
}

export default function Dashboard() {
    const [users, setUsers] = useState<UserStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // Initial fetch
    useEffect(() => {
        UserAPI.getAll().then(res => {
            setUsers(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // WebSocket for real-time status updates
    useEffect(() => {
        let reconnectTimer: ReturnType<typeof setTimeout>;

        const connect = () => {
            const ws = new WebSocket(getWsUrl());
            wsRef.current = ws;

            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'register_admin' }));
                setWsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'user_status_change') {
                        const { userId, isOnline, name, surname, role, phone } = msg.payload;
                        setUsers(prev => {
                            const exists = prev.find(u => u.id === userId);
                            if (exists) {
                                return prev.map(u => u.id === userId ? { ...u, isOnline } : u);
                            }
                            // New user seen for the first time
                            return [...prev, { id: userId, name, surname, role, phone, isOnline }];
                        });
                    }
                } catch { /* ignore */ }
            };

            ws.onclose = () => {
                setWsConnected(false);
                reconnectTimer = setTimeout(connect, 5000);
            };

            ws.onerror = () => ws.close();
        };

        connect();
        return () => {
            clearTimeout(reconnectTimer);
            wsRef.current?.close();
        };
    }, []);

    const online = users.filter(u => u.isOnline === 1);
    const offline = users.filter(u => u.isOnline !== 1);
    const onlineUsers = online.filter(u => u.role === 'user');
    const onlineMechanics = online.filter(u => u.role === 'mechanic');

    const roleColor = (role: string) => {
        if (role === 'mechanic') return 'bg-blue-500/20 text-blue-300';
        if (role === 'admin') return 'bg-purple-500/20 text-purple-300';
        return 'bg-slate-700 text-slate-300';
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <div className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-slate-400">{wsConnected ? 'Live' : 'Reconnecting...'}</span>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Users" value={users.length} />
                <StatCard label="Online Now" value={online.length} highlight />
                <StatCard label="Online Users" value={onlineUsers.length} />
                <StatCard label="Online Mechanics" value={onlineMechanics.length} />
            </div>

            {/* Online users */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-green-400">
                    Online ({online.length})
                </h3>
                {loading ? (
                    <p className="text-slate-500 text-sm">Loading...</p>
                ) : online.length === 0 ? (
                    <p className="text-slate-500 text-sm">No users online</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {online.map(u => <UserCard key={u.id} user={u} roleColor={roleColor} />)}
                    </div>
                )}
            </div>

            {/* Offline users */}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-500">
                    Offline ({offline.length})
                </h3>
                {offline.length === 0 ? null : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {offline.map(u => <UserCard key={u.id} user={u} roleColor={roleColor} offline />)}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={`p-6 rounded-xl border ${highlight ? 'bg-green-950 border-green-800' : 'bg-slate-900 border-slate-800'}`}>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-2 ${highlight ? 'text-green-400' : ''}`}>{value}</p>
        </div>
    );
}

function UserCard({ user, roleColor, offline }: { user: UserStatus; roleColor: (r: string) => string; offline?: boolean }) {
    return (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${offline ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-700'}`}>
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${offline ? 'bg-slate-600' : 'bg-green-400'}`} />
            <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{user.name} {user.surname}</p>
                <p className="text-slate-500 text-xs truncate">{user.phone}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${roleColor(user.role)}`}>
                {user.role}
            </span>
        </div>
    );
}
