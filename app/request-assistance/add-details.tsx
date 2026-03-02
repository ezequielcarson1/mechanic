import { Button } from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Upload } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { type, vehicleId, description, issues } = params;

    const [details, setDetails] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setPhotos([...photos, result.assets[0].uri]);
        }
    };

    const handleConfirm = () => {
        router.push({
            pathname: '/request-assistance/location-map',
            params: {
                type,
                vehicleId,
                description,
                issues,
                details,
                photos: JSON.stringify(photos) // Pass photos as string
            }
        });
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-xl font-outfit-bold text-[#0F172A] flex-1 text-center">
                    Assistance
                </Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/assist')} className="ml-4">
                    <Text className="text-red-500 font-outfit-medium text-xs">Cancel</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <Text className="text-blue-600 font-outfit-bold text-lg mb-1">Request a mechanic</Text>
                <Text className="text-gray-900 font-outfit-bold text-sm mb-6">Indicate more issue details</Text>

                <View className="mb-6">
                    <Text className="font-outfit-bold text-[#0F172A] text-base mb-2">Details</Text>
                    <Text className="text-blue-500 font-outfit-medium text-sm mb-2">
                        Are there any further details you'd like to pass on to the mechanic?
                    </Text>
                    <TextInput
                        multiline
                        numberOfLines={4}
                        placeholder="Type here..."
                        value={details}
                        onChangeText={setDetails}
                        className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 font-outfit-regular text-[#0F172A] text-base h-32"
                        style={{ textAlignVertical: 'top' }}
                    />
                </View>

                {/* Photo Upload Area */}
                <TouchableOpacity
                    onPress={pickImage}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 items-center justify-center mb-4 bg-gray-50/30"
                >
                    <View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mb-2">
                        <Upload size={24} color="#0047AB" />
                    </View>
                    <Text className="text-gray-500 font-outfit-medium text-xs text-center">
                        Click <Text className="text-blue-600">here</Text> to upload / add photo
                    </Text>
                </TouchableOpacity>

                {/* Photo List */}
                {photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                        {photos.map((uri, index) => (
                            <View key={index} className="mr-3 relative">
                                <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
                            </View>
                        ))}
                    </ScrollView>
                )}

                <TouchableOpacity
                    onPress={pickImage}
                    className="flex-row items-center justify-center mb-8"
                >
                    <Plus size={20} color="#0047AB" />
                    <Text className="text-[#0047AB] font-outfit-bold ml-2">Add Photos</Text>
                </TouchableOpacity>

                <Button onPress={handleConfirm} className="bg-blue-700 rounded-xl mb-8">
                    Confirm Issue
                </Button>
            </ScrollView>
        </View>
    );
}
