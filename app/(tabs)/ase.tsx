import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function ASEScreen() {
    const [memberId, setMemberId] = useState('ASE - XXXX-XXXX');

    const certifications = [
        { code: 'A1', name: 'Engine Repair', expiration: '06/30/2027' },
        { code: 'A2', name: 'Brakes', expiration: '06/30/2027' },
        { code: 'A3', name: 'Electricity', expiration: '06/30/2027' },
    ];

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-6">
            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">ASE Certifications</Text>
                <Text className="text-blue-500 font-outfit-regular">Your certifications</Text>
            </View>

            <View className="mb-8 items-start">
                {/* Placeholder for ASE Logo - using text for now or simple view */}
                <View className="bg-white border border-gray-200 p-2 rounded-lg mb-4">
                    <Text className="font-outfit-bold text-blue-900 text-lg">ASE</Text>
                </View>

                <Text className="font-outfit-regular text-gray-600 mb-6 leading-5">
                    Your Member ID is validated against ASE records to verify your certification status and the corresponding expiration dates.
                </Text>

                <View className="w-full">
                    <Text className="font-outfit-medium mb-2 text-gray-900">ASE Member ID</Text>
                    <Input
                        value={memberId}
                        onChangeText={setMemberId}
                        containerClassName="bg-blue-50/50 border-blue-100 mb-6"
                    />
                </View>

                <Button className="w-full">
                    Search ASE records
                </Button>
            </View>

            {/* Simulated Verified State Section */}
            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">ASE Certifications</Text>
                <Text className="text-blue-500 font-outfit-regular">Your validated certifications from ASE</Text>
            </View>

            <View className="mb-6">
                <Text className="font-outfit-medium mb-2 text-gray-900">ASE Member ID</Text>
                <Text className="text-blue-500 font-outfit-regular mb-4">ASE - XXXX-XXXX</Text>

                <View className="gap-3">
                    {certifications.map((cert, index) => (
                        <View key={index} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex-row justify-between items-center">
                            <View>
                                <Text className="font-outfit-bold text-blue-900">{cert.code} - {cert.name}</Text>
                                <Text className="text-blue-400 text-xs">Expiration: {cert.expiration}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            <Button size="lg" className="mb-10">
                Update Certifications
            </Button>
        </ScrollView>
    );
}
