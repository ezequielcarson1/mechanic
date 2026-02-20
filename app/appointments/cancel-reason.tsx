import { useAppointments } from '@/context/AppointmentsContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

const REASONS = [
    "The issue has already been solved",
    "I've already received help",
    "My mechanic took too long to arrive",
    "Other"
];

export default function CancelReasonScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { cancelAppointment } = useAppointments();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);

    const handleDone = async () => {
        if (selectedReason && id) {
            await cancelAppointment(Array.isArray(id) ? id[0] : id, selectedReason);
            router.navigate('/(tabs)/appointments');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-4 py-4 flex-row items-center mb-6">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View className="flex-1 items-center mr-6">
                    <Text className="font-outfit-bold text-lg text-gray-900">Assistance</Text>
                </View>
            </View>

            <View className="px-6 flex-1">
                <Text className="font-outfit-bold text-xl text-gray-900 mb-8 text-center px-4">
                    Before you go, we just wanted to know why you canceled your request
                </Text>

                <View className="gap-3">
                    {REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason}
                            onPress={() => setSelectedReason(reason)}
                            className={`py-4 px-4 rounded-lg border flex-row items-center justify-center ${selectedReason === reason
                                ? 'bg-white border-blue-600 border-2'
                                : 'bg-white border-gray-100 shadow-sm'
                                }`}
                        >
                            <Text className={`font-outfit-medium text-xs ${selectedReason === reason ? 'text-blue-900' : 'text-gray-500'
                                }`}>
                                {reason}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="px-6 mb-8">
                <TouchableOpacity
                    onPress={handleDone}
                    disabled={!selectedReason}
                    className={`w-full py-4 rounded-lg items-center ${selectedReason ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                >
                    <Text className="font-outfit-bold text-white text-base">Done</Text>
                </TouchableOpacity>

                {/* Bottom navigation simulation */}
                <View className="flex-row justify-between items-center mt-8 px-4 border-t border-gray-100 pt-4">
                    <View className="items-center opacity-40"><Ionicons name="person-circle-outline" size={24} color="gray" /><Text className="text-[10px] text-gray-500">Profile</Text></View>
                    <View className="items-center"><Ionicons name="help-buoy" size={24} color="#3B82F6" /><Text className="text-[10px] text-blue-500 font-bold">Assist</Text></View>
                    <View className="items-center opacity-40"><Ionicons name="calendar-outline" size={24} color="gray" /><Text className="text-[10px] text-gray-500">Appointments</Text></View>
                    <View className="items-center opacity-40"><Ionicons name="notifications-outline" size={24} color="gray" /><Text className="text-[10px] text-gray-500">Notifications</Text></View>
                </View>
            </View>
        </SafeAreaView>
    );
}
