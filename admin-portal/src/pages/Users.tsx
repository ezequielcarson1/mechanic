import { Edit2, Filter, Search, Shield, Trash2, UserPlus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AddUserModal from '../components/AddUserModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditUserModal from '../components/EditUserModal';
import { UserAPI } from '../lib/api';
import { formatPhoneNumber } from '../lib/utils';

interface User {
    id: string;
    email: string;
    name: string;
    surname: string;
    phone: string;
    role: string;
    profileImage?: string;
    zip?: string;
}

const UserAvatar = ({ user }: { user: User }) => {
    const [imgError, setImgError] = useState(false);

    if (user.profileImage && !imgError) {
        return (
            <img
                src={user.profileImage}
                alt={`${user.name} ${user.surname}`}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <span className="text-slate-400 font-bold text-xs">
            {user.name?.[0]}{user.surname?.[0]}
        </span>
    );
};

const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const fetchUsers = async () => {
        try {
            const filter = roleFilter === 'all' ? undefined : roleFilter;
            const { data } = await UserAPI.getAll(filter);
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (updatedUser: User) => {
        try {
            await UserAPI.update(updatedUser.id, updatedUser);
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setEditingUser(null);
        } catch (err) {
            alert('Failed to update user');
        }
    };

    const handleDelete = async () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        try {
            await UserAPI.delete(deletingUser.id);
            setUsers(users.filter(u => u.id !== deletingUser.id));
            setDeletingUser(null);
        } catch (err) {
            alert('Failed to delete user');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleChangeRole = async (user: User) => {
        const newRole = user.role === 'mechanic' ? 'user' : 'mechanic';
        try {
            await UserAPI.update(user.id, { role: newRole });
            setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const q = search.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');
    const filteredUsers = q
        ? users.filter(u =>
            `${u.name} ${u.surname}`.toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (qDigits && (u.phone || '').replace(/\D/g, '').includes(qDigits))
        )
        : users;

    if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading users...</div>;

    return (
        <div className="p-8">
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUser}
                />
            )}
            {isAddingUser && (
                <AddUserModal
                    onClose={() => setIsAddingUser(false)}
                    onSuccess={() => {
                        setIsAddingUser(false);
                        fetchUsers();
                    }}
                />
            )}
            {deletingUser && (
                <DeleteConfirmationModal
                    itemName={`${deletingUser.name} ${deletingUser.surname}`}
                    onClose={() => setDeletingUser(null)}
                    onConfirm={handleDelete}
                    isLoading={isDeleting}
                />
            )}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold">User Management</h2>
                    <p className="text-slate-400 mt-1">Manage system users, roles, and permissions.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search name, email or phone…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-primary-500 w-64"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-primary-500 appearance-none min-w-[140px]"
                        >
                            <option value="all">All Roles</option>
                            <option value="user">Users</option>
                            <option value="mechanic">Mechanics</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setIsAddingUser(true)}
                        className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-900/20 active:scale-95"
                    >
                        <UserPlus size={18} />
                        <span>Add New User</span>
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-sm font-medium">
                                <th className="px-6 py-4 w-20">ID</th>
                                <th className="px-6 py-4 w-16">Photo</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Zip Code</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                                        No users match your search.
                                    </td>
                                </tr>
                            )}
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        {user.id.slice(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                                            <UserAvatar user={user} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-slate-100">{user.name} {user.surname}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'mechanic'
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">{formatPhoneNumber(user.phone)}</td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">{user.zip || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleChangeRole(user)}
                                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all tooltip"
                                                title="Change Role"
                                            >
                                                <Shield size={18} />
                                            </button>
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingUser(user)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
