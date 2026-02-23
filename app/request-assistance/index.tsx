import { useRouter } from 'expo-router';
import { Calendar, ChevronLeft, Clock, ShieldCheck, Video } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function RequestAssistanceTypeScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-xl font-outfit-bold text-[#0F172A] flex-1 text-center mr-8">
                    Assistance
                </Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <Text className="text-blue-600 font-outfit-bold text-lg mb-4">Request a mechanic</Text>

                <View className="gap-4">
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/request-assistance/select-vehicle', params: { type: 'immediate' } })}
                        className="bg-white border border-blue-200 rounded-xl p-4 flex-row items-center shadow-sm"
                    >
                        <View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mr-4">
                            <Clock size={24} color="#1D4ED8" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-blue-900 font-outfit-bold text-base uppercase">IMMEDIATE ASSISTANCE</Text>
                            <Text className="text-blue-600 font-outfit-medium text-xs tracking-widest">24HS PERIOD TIME</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/request-assistance/select-vehicle', params: { type: 'scheduled' } })}
                        className="bg-white border border-blue-200 rounded-xl p-4 flex-row items-center shadow-sm"
                    >
                        <View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mr-4">
                            <Calendar size={24} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-blue-900 font-outfit-bold text-base uppercase">SCHEDULED ASSISTANCE</Text>
                            <Text className="text-blue-600 font-outfit-medium text-xs tracking-widest">7 DAYS PERIOD TIME</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/request-assistance/select-vehicle', params: { type: 'videocall' } })}
                        className="bg-white border border-blue-200 rounded-xl p-4 flex-row items-center shadow-sm"
                    >
                        <View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mr-4">
                            <Video size={24} color="#06caf0" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-blue-900 font-outfit-bold text-base uppercase">VIDEO CALL ASSISTANCE</Text>
                            <Text className="text-blue-600 font-outfit-medium text-xs tracking-widest">DIY - ON DEMAND</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/request-assistance/select-vehicle', params: { type: 'witness' } })}
                        className="bg-white border border-blue-200 rounded-xl p-4 flex-row items-center shadow-sm"
                    >
                        <View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mr-4">
                            <ShieldCheck size={24} color="#1D4ED8" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-blue-900 font-outfit-bold text-base uppercase">ACCIDENT</Text>
                            <Text className="text-blue-600 font-outfit-medium text-xs tracking-widest">24HS PERIOD TIME</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
