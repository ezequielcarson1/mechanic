import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveSetupProgress } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function BasicInfoScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: 'Shayna Samett', // Pre-filled for demo matching image
        surname: 'Shayna Samett',
        email: 'ssammet135@gmail.com',
        dob: '',
        password: '',
        confirmPassword: '',
        profileImage: '' as string | null
    });

    const formatDOB = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,4})$/);

        if (!match) return cleaned;

        const [, mm, dd, yyyy] = match;

        if (cleaned.length <= 2) return mm;
        if (cleaned.length <= 4) return `${mm} / ${dd}`;
        return `${mm} / ${dd} / ${yyyy}`;
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true, // Useful for storing in DB if we want simple implementation
        });

        if (!result.canceled) {
            const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setFormData(prev => ({ ...prev, profileImage: imageUri }));
        }
    };

    const handleDOBChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 8) {
            setFormData(prev => ({ ...prev, dob: formatDOB(cleaned) }));
        }
    };

    const handleContinue = async () => {
        // Add validation logic here
        await saveSetupProgress('basicInfo', formData);
        router.push('/setup/identity'); // Navigate to Identity next per user instruction
    };

    return (
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-1">Basic Info</Text>
                <Text className="text-[#0047AB] font-outfit-medium text-base">Please enter your information</Text>
            </View>

            {/* Profile Photo */}
            <View className="flex-row items-center mb-8">
                <TouchableOpacity
                    onPress={pickImage}
                    className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center border-2 border-dashed border-blue-200 mr-4 relative overflow-hidden"
                >
                    {formData.profileImage ? (
                        <Image source={{ uri: formData.profileImage }} className="w-full h-full" />
                    ) : (
                        <Ionicons name="camera" size={32} color="#0047AB" style={{ opacity: 0.5 }} />
                    )}
                    <View className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 border border-blue-100 shadow-sm">
                        <Ionicons name="pencil" size={12} color="#0047AB" />
                    </View>
                </TouchableOpacity>
                <View>
                    <Text className="font-outfit-bold text-[#0F172A] text-lg">Profile Photo</Text>
                    <Text className="font-outfit-regular text-slate-400 text-sm">Update your avatar</Text>
                </View>
            </View>

            {/* Model-based inputs with labels */}
            <View className="space-y-4 mb-6">
                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">Name</Text>
                    <Input
                        value={formData.name}
                        onChangeText={(text) => setFormData(p => ({ ...p, name: text }))}
                        containerClassName="bg-blue-50/50 border-0 h-12"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">Surname</Text>
                    <Input
                        value={formData.surname}
                        onChangeText={(text) => setFormData(p => ({ ...p, surname: text }))}
                        containerClassName="bg-blue-50/50 border-0 h-12"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">email</Text>
                    <Input
                        value={formData.email}
                        onChangeText={(text) => setFormData(p => ({ ...p, email: text }))}
                        containerClassName="bg-blue-50/50 border-0 h-12"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">Date of birth</Text>
                    <Input
                        placeholder="MM / DD / YYYY"
                        value={formData.dob}
                        onChangeText={handleDOBChange}
                        maxLength={14}
                        keyboardType="numeric"
                        containerClassName="bg-blue-50/50 border-0 h-12"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">Account Password</Text>
                    <View className="relative">
                        <Input
                            value={formData.password}
                            onChangeText={(text) => setFormData(p => ({ ...p, password: text }))}
                            containerClassName="bg-blue-50/50 border-0 h-12"
                            isPassword={true}
                        />
                    </View>
                </View>

                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">Confirm Password</Text>
                    <Input
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData(p => ({ ...p, confirmPassword: text }))}
                        containerClassName="bg-blue-50/50 border-0 h-12"
                        isPassword={true}
                    />
                </View>
            </View>

            {/* Password Requirements */}
            <View className="mb-8 pl-2">
                <Text className="text-gray-600 font-outfit-regular text-sm mb-1">• Must not contain your name or email.</Text>
                <Text className="text-gray-600 font-outfit-regular text-sm mb-1">• At least 8 characters.</Text>
                <Text className="text-gray-600 font-outfit-regular text-sm">• Contains a symbol or a number</Text>
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
