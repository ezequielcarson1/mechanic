import { Button } from '@/components/ui/Button';
import { saveSetupProgress } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function IdentityScreen() {
    const router = useRouter();
    const [documentType, setDocumentType] = useState('Select'); // Placeholder for dropdown
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);

    const handleContinue = async () => {
        // Add validation
        await saveSetupProgress('identity', { documentType, frontImage, backImage });
        router.push('/setup/address');
    };

    const handleTakePhoto = (side: 'front' | 'back') => {
        // Simulate photo taking
        if (side === 'front') setFrontImage('simulated_path_front');
        else setBackImage('simulated_path_back');
    };

    return (
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-1">Basic Info</Text>
                <Text className="text-[#0047AB] font-outfit-medium text-base mb-4">Please upload your Identity Document information</Text>

                <Text className="text-[#0F172A] font-outfit-regular text-base mb-4">
                    The following documents are accepted:
                </Text>
                <Text className="text-[#0F172A] font-outfit-regular text-base mb-4">
                    (1) Driving Licence{'\n'}
                    (2) Passport{'\n'}
                    (3) Residence Permit{'\n'}
                    (4) National ID. Also, please ensure:
                </Text>
                <View className="pl-2 mb-6">
                    <Text className="text-[#0F172A] font-outfit-regular text-sm mb-1">• All information is readable and image is not blurry.</Text>
                    <Text className="text-[#0F172A] font-outfit-regular text-sm mb-1">• All corners of the document are visible.</Text>
                    <Text className="text-[#0F172A] font-outfit-regular text-sm mb-1">• We can see a picture of you.</Text>
                    <Text className="text-[#0F172A] font-outfit-regular text-sm">• Information must match the back of the document.</Text>
                </View>
            </View>

            <Text className="font-outfit-medium text-[#0F172A] mb-2">Identification document</Text>
            <TouchableOpacity className="bg-blue-50/50 h-12 flex-row items-center justify-between px-4 rounded-xl mb-8 border-0">
                <Text className="text-[#0F172A] font-outfit-regular">{documentType}</Text>
                <Ionicons name="chevron-down" size={20} color="#0F172A" />
            </TouchableOpacity>

            {/* Front Photo */}
            <View className="mb-8">
                <View className="bg-gray-100 h-48 rounded-xl justify-center items-center mb-2 border-2 border-dashed border-gray-300">
                    {frontImage ? (
                        <View className="items-center">
                            <Ionicons name="checkmark" size={40} color="green" />
                            <Text className="text-green-600 font-outfit-medium mt-2">Front Uploaded</Text>
                        </View>
                    ) : (
                        <View className="items-center opacity-50">
                            <View className="w-32 h-20 bg-gray-300 rounded-md mb-2" />
                            <Text className="text-gray-500 font-outfit-regular text-xs">Driving Licence Front</Text>
                        </View>
                    )}
                </View>
                <Text className="text-[#0047AB] font-outfit-medium text-xs mb-4">Upload photo of the FRONT of your Identity Document.</Text>
                <Button
                    onPress={() => handleTakePhoto('front')}
                    className="bg-[#06b6d4] rounded-xl" // Cyan-500/600 roughly matches the "Take Code" button color which looks lighter blue/cyan in the image
                    // Actually the image shows a distinct blue, let's stick to a specific cyan-blue
                    style={{ backgroundColor: '#00afcc' }}
                >
                    Take photo
                </Button>
            </View>

            {/* Back Photo */}
            <View className="mb-8">
                <View className="bg-gray-100 h-48 rounded-xl justify-center items-center mb-2 border-2 border-dashed border-gray-300">
                    {backImage ? (
                        <View className="items-center">
                            <Ionicons name="checkmark" size={40} color="green" />
                            <Text className="text-green-600 font-outfit-medium mt-2">Back Uploaded</Text>
                        </View>
                    ) : (
                        <View className="items-center opacity-50">
                            <View className="w-32 h-20 bg-gray-300 rounded-md mb-2" />
                            <Text className="text-gray-500 font-outfit-regular text-xs">Driving Licence Back</Text>
                        </View>
                    )}
                </View>
                <Text className="text-[#0047AB] font-outfit-medium text-xs mb-4">Upload photo of the BACK of your Identity Document.</Text>
                <Button
                    onPress={() => handleTakePhoto('back')}
                    style={{ backgroundColor: '#00afcc' }}
                    className="rounded-xl"
                >
                    Take photo
                </Button>
            </View>

            <Button
                onPress={handleContinue}
                size="lg"
                className="bg-blue-700 rounded-xl"
            >
                Continue
            </Button>
        </ScrollView>
    );
}
