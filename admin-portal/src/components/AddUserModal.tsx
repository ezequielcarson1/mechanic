import { UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
import { UserAPI } from '../lib/api';
import { formatPhoneNumber } from '../lib/utils';

interface AddUserModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        phone: '',
        role: 'user'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Map flat form data to the structure expected by UserDAO.js
            const userData = {
                basicInfo: {
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    dob: '' // Admin created users might not have this initially
                },
                phone: {
                    phoneNumber: formData.phone
                },
                role: {
                    role: formData.role
                }
            };

            await UserAPI.create(userData);
            onSuccess();
        } catch (err: any) {
            console.error('Error creating user:', err);
            setError(err.response?.data?.error || 'Failed to create user. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] my-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <UserPlus size={24} className="text-primary-500" />
                        Add New User
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-400">First Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-400">Last Name</label>
                            <input
                                type="text"
                                name="surname"
                                value={formData.surname}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Phone Number</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value);
                                setFormData(prev => ({ ...prev, phone: formatted }));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            placeholder="+1 (XXX) XXX-XXXX"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        >
                            <option value="user">User</option>
                            <option value="mechanic">Mechanic</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary-900/20"
                        >
                            <span>{isSubmitting ? 'Adding...' : 'Add User'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
