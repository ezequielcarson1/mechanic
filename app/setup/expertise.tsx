import { Button } from '@/components/ui/Button';
import { saveSetupProgress } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ExpertiseScreen() {
    const router = useRouter();
    const [details, setDetails] = useState('');

    // Mock Dropdown Component
    const Dropdown = ({ label, placeholder }: { label: string, placeholder: string }) => (
        <View className="mb-4">
            <Text className="font-outfit-medium text-[#0F172A] mb-2">{label}</Text>
            <TouchableOpacity className="bg-blue-50/50 h-12 flex-row items-center justify-between px-4 rounded-xl border-0">
                <Text className="text-[#0F172A] font-outfit-regular">{placeholder}</Text>
                <Ionicons name="chevron-down" size={20} color="#0047AB" />
            </TouchableOpacity>
        </View>
    );

    const handleContinue = async () => {
        await saveSetupProgress('expertise', { details });
        router.push('/setup/availability');
    };

    return (
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            {/* Header Skip Action is handled in _layout.tsx */}

            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-1">Mechanic expertise Info</Text>
                <Text className="text-[#0047AB] font-outfit-medium text-base">
                    Help us get to know your skills — it means more job matches for you
                </Text>
            </View>

            <Dropdown label="Years experience" placeholder="Select" />
            <Dropdown label="Prefered type of assistance" placeholder="Select" />
            <Dropdown label="Services offered" placeholder="Select" />
            <Dropdown label="Tools" placeholder="Select" />
            <Dropdown label="Preferred brand / car / model" placeholder="Select" />

            <View className="mb-6">
                <Text className="font-outfit-medium text-[#0F172A] mb-2">
                    Are there any further details you’d like to add to your profile?
                </Text>
                <TextInput
                    multiline
                    numberOfLines={4}
                    value={details}
                    onChangeText={setDetails}
                    className="bg-blue-50/50 rounded-xl p-4 font-outfit-regular text-[#0F172A] text-base h-32"
                    style={{ textAlignVertical: 'top' }}
                />
            </View>

            <TouchableOpacity className="flex-row items-center justify-center mb-8">
                <Ionicons name="add-circle" size={20} color="#0047AB" />
                <Text className="text-[#0047AB] font-outfit-bold ml-2">Add expertise</Text>
            </TouchableOpacity>

            <Button onPress={handleContinue} size="lg" className="bg-blue-700 rounded-xl">
                Continue
            </Button>
        </ScrollView>
    );
}
