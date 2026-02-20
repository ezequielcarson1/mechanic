import { Button } from '@/components/ui/Button';
import { saveSetupProgress } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityScreen() {
    const router = useRouter();
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [applySameTime, setApplySameTime] = useState(false);

    // Mock time state
    const [startTime, setStartTime] = useState('09:00 AM');
    const [endTime, setEndTime] = useState('05:00 PM');

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSave = async () => {
        await saveSetupProgress('availability', { selectedDays, startTime, endTime, applySameTime });
        router.push('/setup/success');
    };

    // Mock Dropdown Component for Time
    const TimeDropdown = ({ value }: { value: string }) => (
        <TouchableOpacity className="bg-blue-50/50 h-12 flex-row items-center justify-between px-4 rounded-xl border-0 flex-1">
            <View className="flex-row items-center">
                <View className="w-4 h-4 rounded-full border border-blue-400 mr-2 items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-blue-400" />
                </View>
                <Text className="text-[#0F172A] font-outfit-regular">{value}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#0047AB" />
        </TouchableOpacity>
    );

    return (
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            {/* Header Skip Action is handled in _layout.tsx */}

            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-1">Availability</Text>
                <Text className="text-[#0047AB] font-outfit-medium text-base">
                    Please enter your availability to offer assistance
                </Text>
            </View>

            {/* Days Selection */}
            <View className="mb-8">
                <Text className="font-outfit-medium text-[#0F172A] mb-2">Days you're available</Text>
                <TouchableOpacity className="bg-blue-50/50 h-12 flex-row items-center justify-between px-4 rounded-xl border-0 mb-4">
                    <Text className="text-[#0F172A] font-outfit-regular">Select</Text>
                    <Ionicons name="chevron-down" size={20} color="#0047AB" />
                </TouchableOpacity>

                {/* List of Days (Rendered always visible based on design image showing list) */}
                <View className="bg-blue-50/30 rounded-xl p-4">
                    {DAYS.map(day => {
                        const isSelected = selectedDays.includes(day);
                        return (
                            <TouchableOpacity
                                key={day}
                                className="flex-row items-center mb-3 last:mb-0"
                                onPress={() => toggleDay(day)}
                            >
                                <View className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${isSelected ? 'bg-blue-400 border-blue-400' : 'border-blue-300'}`}>
                                    {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
                                </View>
                                <Text className="text-[#0F172A] font-outfit-regular">{day}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Time Range */}
            <Text className="font-outfit-medium text-[#0F172A] mb-2">Select time range</Text>

            <View className="mb-4">
                <Text className="font-outfit-regular text-[#0F172A] mb-2">From:</Text>
                {/* Mock Select Dropdown */}
                <View className="bg-blue-50/50 h-12 flex-row items-center justify-between px-4 rounded-xl border-0 mb-2">
                    <Text className="text-[#0F172A] font-outfit-regular">Select</Text>
                    <Ionicons name="chevron-down" size={20} color="#0047AB" />
                </View>
                <TimeDropdown value={startTime} />
            </View>

            <View className="mb-6">
                <Text className="font-outfit-regular text-[#0F172A] mb-2">To:</Text>
                {/* Mock Select Dropdown */}
                <View className="bg-blue-50/50 h-12 flex-row items-center justify-between px-4 rounded-xl border-0 mb-2">
                    <Text className="text-[#0F172A] font-outfit-regular">Select</Text>
                    <Ionicons name="chevron-down" size={20} color="#0047AB" />
                </View>
                <TimeDropdown value={endTime} />
            </View>

            {/* Apply Same Time Checkbox */}
            <TouchableOpacity
                className="flex-row items-center mb-8"
                onPress={() => setApplySameTime(!applySameTime)}
            >
                <View className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${applySameTime ? 'bg-blue-400 border-blue-400' : 'border-blue-300'}`}>
                    {applySameTime && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <Text className="text-[#0F172A] font-outfit-regular flex-1">Apply same time to all selected days</Text>
            </TouchableOpacity>

            <Button onPress={handleSave} size="lg" className="bg-blue-700 rounded-xl">
                Save
            </Button>
        </ScrollView>
    );
}
