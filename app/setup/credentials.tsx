import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveSetupProgress } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function CredentialsScreen() {
    const router = useRouter();
    const [aseId, setAseId] = useState('');
    const [isValidated, setIsValidated] = useState(false);

    const handleSearch = () => {
        if (aseId.length > 3) {
            setIsValidated(true);
        }
    };

    const handleContinue = async () => {
        await saveSetupProgress('credentials', { aseId, validated: isValidated });
        router.push('/setup/dealer-info');
    };

    return (
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-1">ASE Certifications</Text>
                <Text className="text-[#0047AB] font-outfit-medium text-base">
                    {isValidated ? 'Your validated certifications from ASE' : 'Your certifications'}
                </Text>
            </View>

            {/* ASE Logo Area */}
            <View className="mb-6">
                {/* Placeholder for ASE Logo - Text representation for now */}
                <View className="flex-row items-center mb-4">
                    <View className="bg-blue-600 rounded-full w-10 h-10 items-center justify-center mr-2">
                        <Text className="text-white font-bold text-xs">ASE</Text>
                    </View>
                    <View>
                        <Text className="font-bold text-xs text-gray-800">National Institute for</Text>
                        <Text className="font-bold text-xs text-gray-800 uppercase">Automotive Service Excellence</Text>
                    </View>
                </View>

                <Text className="text-[#0F172A] font-outfit-regular text-sm mb-6">
                    Your Member ID is validated against ASE records to verify your certification status and the corresponding expiration dates.
                </Text>
            </View>

            {!isValidated ? (
                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">ASE Member ID</Text>
                    <Input
                        placeholder="ASE - XXXX-XXXX"
                        value={aseId}
                        onChangeText={setAseId}
                        containerClassName="bg-blue-50/50 border-0 h-12 mb-8"
                    />
                    <Button onPress={handleSearch} size="lg" className="bg-blue-700 rounded-xl">
                        Search ASE records
                    </Button>
                </View>
            ) : (
                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-1">ASE Member ID</Text>
                    <Text className="text-[#0047AB] font-outfit-medium text-base mb-6">ASE - {aseId}</Text>

                    {/* Cert List */}
                    <View className="space-y-4 mb-8">
                        {['A1 - Engine Repair', 'A2 - Brakes', 'A3 - Electricity'].map((cert, i) => (
                            <View key={i} className="bg-blue-50/50 p-4 rounded-xl">
                                <Text className="font-outfit-bold text-[#0F172A] mb-1">{cert}</Text>
                                <Text className="text-blue-400 text-xs">Expiration: 06/30/2027</Text>
                            </View>
                        ))}
                    </View>

                    <Button onPress={handleContinue} size="lg" className="bg-blue-700 rounded-xl">
                        Validate Certifications
                    </Button>
                </View>
            )}
        </ScrollView>
    );
}
