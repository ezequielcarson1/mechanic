import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { useAppointments } from '@/context/AppointmentsContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

export default function AppointmentsScreen() {
    const { getUpcoming, getPast, refresh, appointments: allAppointments } = useAppointments();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [])
    );

    const appointments = activeTab === 'upcoming' ? getUpcoming() : getPast();

    const handleCancelRequest = (id: string) => {
        setSelectedAppointmentId(id);
        setCancelModalVisible(true);
    };

    const confirmCancel = () => {
        setCancelModalVisible(false);
        if (selectedAppointmentId) {
            router.push({
                pathname: '/appointments/cancel-reason' as any,
                params: { id: selectedAppointmentId }
            });
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header Title is handled by layout options usually, but design shows explicit sub-header sometimes. 
                Tabs layout has title 'Appointments'. We add the tab switcher below. */}

            <View className="px-4 py-4">
                <Text className="text-blue-900 font-outfit-bold text-lg mb-1">Appointments</Text>
                <Text className="text-blue-500 font-outfit-medium text-sm mb-4">Your active and pending requests</Text>

                {/* Tab Switcher */}
                <View className="flex-row bg-gray-100 p-1 rounded-lg mb-4">
                    <TouchableOpacity
                        className={`flex-1 py-2 rounded-md ${activeTab === 'upcoming' ? 'bg-white shadow-sm' : ''}`}
                        onPress={() => setActiveTab('upcoming')}
                    >
                        <Text className={`text-center font-outfit-bold ${activeTab === 'upcoming' ? 'text-blue-900' : 'text-gray-500'}`}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-2 rounded-md ${activeTab === 'past' ? 'bg-white shadow-sm' : ''}`}
                        onPress={() => setActiveTab('past')}
                    >
                        <Text className={`text-center font-outfit-bold ${activeTab === 'past' ? 'text-blue-900' : 'text-gray-500'}`}>Past</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View className="px-4">
                        <AppointmentCard
                            appointment={item}
                            onCancel={handleCancelRequest}
                        />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-10">
                        <Text className="text-gray-400 font-outfit-medium">No {activeTab} appointments</Text>
                    </View>
                }
            />

            {/* Cancel Confirmation Modal */}
            <Modal
                transparent={true}
                visible={cancelModalVisible}
                animationType="fade"
                onRequestClose={() => setCancelModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/40 px-6">
                    <View className="bg-white rounded-2xl w-full p-6 items-center shadow-lg">
                        <View className="w-16 h-16 rounded-full border-2 border-red-500 items-center justify-center mb-4">
                            <X size={32} color="#EF4444" />
                        </View>

                        <Text className="text-xl font-outfit-bold text-blue-900 mb-2">Cancel Request</Text>
                        <Text className="text-gray-500 text-center font-outfit-regular mb-6">
                            Are you sure you'd like to cancel this request?
                        </Text>

                        <View className="flex-row gap-4 w-full">
                            <TouchableOpacity
                                className="flex-1 py-3 border border-gray-200 rounded-lg"
                                onPress={() => setCancelModalVisible(false)}
                            >
                                <Text className="text-center font-outfit-bold text-gray-700">No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3 bg-blue-700 rounded-lg"
                                onPress={confirmCancel}
                            >
                                <Text className="text-center font-outfit-bold text-white">Yes, Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
