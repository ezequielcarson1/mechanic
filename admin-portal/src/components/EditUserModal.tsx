import { Save, X } from 'lucide-react';
import React, { useState } from 'react';
import { formatPhoneNumber } from '../lib/utils';

interface User {
    id: string;
    email: string;
    name: string;
    surname: string;
    phone: string;
    role: string;
}

interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: (updatedUser: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<User>({ ...user });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Logic for saving will be passed from parent
            onSave(formData);
        } catch (err) {
            console.error('Error updating user:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] my-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-xl font-bold">Edit User Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
                        <label className="text-sm font-medium text-slate-400">Email Address (Primary Key)</label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed outline-none"
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
                            <Save size={18} />
                            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
