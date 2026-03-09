import { Calendar, Car, Clock, DollarSign, Edit2, Filter, MapPin, Search, Trash2, User, Wrench } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { AppointmentAPI, AssistanceAPI } from '../lib/api';
import { formatPhoneNumber } from '../lib/utils';

interface Appointment {
    id: string;
    title: string;
    date: string;
    time: string;
    car: string;
    address: string;
    budget: string;
    status: string;
    type: string;
    _source: 'appointment' | 'assistance';
    zip?: string;
    userPhone?: string;
    userName?: string;
    userSurname?: string;
    mechanicPhone?: string;
    mechanicName?: string;
    mechanicSurname?: string;
}

const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const [aptResponse, astResponse] = await Promise.all([
                AppointmentAPI.getAll(),
                AssistanceAPI.getAll()
            ]);

            const mergedData = [
                ...aptResponse.data.map((a: any) => ({
                    ...a,
                    _source: 'appointment' as const,
                    type: a.assistanceType === 'immediate' || a.type === 'immediate'
                        ? 'Immediate'
                        : a.assistanceType === 'witness' ? 'Witness' : 'Scheduled',
                })),
                ...astResponse.data
                    .filter((ast: any) => !aptResponse.data.some((apt: any) => apt.id === ast.id))
                    .map((a: any) => ({
                        ...a,
                        _source: 'assistance' as const,
                        type: 'Immediate',
                        status: a.status || 'pending',
                        title: a.title || 'Help!',
                        budget: a.budget || 'N/A'
                    }))
            ];

            // Both DAOs return rows ORDER BY rowid DESC (newest first).
            // Appointments are listed first; assistance-only requests follow.
            // No additional sort needed — server order is authoritative.
            setAppointments(mergedData);
        } catch (err) {
            console.error('Failed to fetch appointments', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingAppointment) return;
        setIsDeleting(true);
        try {
            if (deletingAppointment._source === 'appointment') {
                await AppointmentAPI.delete(deletingAppointment.id);
            } else {
                await AssistanceAPI.delete(deletingAppointment.id);
            }
            setAppointments(appointments.filter(a => a.id !== deletingAppointment.id));
            setDeletingAppointment(null);
        } catch (err) {
            alert(`Failed to delete ${deletingAppointment.type.toLowerCase()} request`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('Are you sure you want to delete ALL appointments and assistance requests? This action cannot be undone.')) {
            try {
                await Promise.all([
                    AppointmentAPI.deleteAll(),
                    AssistanceAPI.deleteAll()
                ]);
                setAppointments([]);
            } catch (err) {
                alert('Failed to clear all appointments');
                fetchAppointments(); // Refresh to ensure UI matches server
            }
        }
    };

    if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading appointments...</div>;

    const filteredAppointments = appointments.filter(apt => {
        const matchesStatus = statusFilter === 'all' || apt.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesSearch = apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.car.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="p-8">
            {deletingAppointment && (
                <DeleteConfirmationModal
                    title={`Delete ${deletingAppointment.type} Request`}
                    description="Are you sure you want to delete this"
                    itemName={deletingAppointment.title}
                    onClose={() => setDeletingAppointment(null)}
                    onConfirm={handleDelete}
                    isLoading={isDeleting}
                />
            )}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold">Appointments</h2>
                    <p className="text-slate-400 mt-1">Monitor and manage all service requests.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-primary-500 min-w-[240px]"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-primary-500 appearance-none min-w-[140px]"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm font-semibold"
                    >
                        <Trash2 size={16} />
                        <span>Clear All</span>
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-sm font-medium">
                                <th className="px-6 py-4 min-w-[320px]">ID</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Title / Vehicle</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Mechanic</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Zip Code</th>
                                <th className="px-6 py-4">Date / Time</th>
                                <th className="px-6 py-4">Budget</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredAppointments.map((apt) => (
                                <tr key={apt.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                        {apt.id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${apt.type === 'Immediate'
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                            : 'bg-primary-600/10 text-primary-400 border-primary-500/20'
                                            }`}>
                                            {apt.type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${apt.status === 'pending'
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : apt.status === 'canceled'
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : apt.status === 'completed'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}>
                                            {apt.status || 'Scheduled'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-semibold text-slate-100">{apt.title}</div>
                                        <div className="text-slate-500 flex items-center mt-1">
                                            <Car size={12} className="mr-1" />
                                            {apt.car}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center text-slate-300">
                                            <User size={12} className="mr-1 text-slate-500" />
                                            <span className="font-medium">{apt.userName} {apt.userSurname}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                                            {apt.userPhone ? formatPhoneNumber(apt.userPhone) : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {apt.mechanicPhone ? (
                                            <>
                                                <div className="flex items-center text-slate-300">
                                                    <Wrench size={12} className="mr-1 text-slate-500" />
                                                    <span className="font-medium">{apt.mechanicName} {apt.mechanicSurname}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                                                    {formatPhoneNumber(apt.mechanicPhone)}
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-slate-600 text-[10px] italic">Not assigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        <div className="flex items-center">
                                            <MapPin size={12} className="mr-1 text-slate-500" />
                                            <span className="max-w-[150px] truncate">{apt.address}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">{apt.zip || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                                        <div className="flex items-center">
                                            <Calendar size={12} className="mr-1 text-slate-500" />
                                            {apt.date}
                                        </div>
                                        <div className="flex items-center mt-1">
                                            <Clock size={12} className="mr-1 text-slate-500" />
                                            {apt.time || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-emerald-400 font-bold">
                                        <div className="flex items-center">
                                            <DollarSign size={14} className="mr-0.5" />
                                            {apt.budget}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingAppointment(apt)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredAppointments.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-500">No requests found matching your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentsPage;
