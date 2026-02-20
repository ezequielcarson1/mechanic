import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface UserMechanicInfoTabProps {
    mechanic: any; // Using any to match UserData flexibility
}

export function UserMechanicInfoTab({ mechanic }: UserMechanicInfoTabProps) {
    const [viewReviews, setViewReviews] = useState(false);

    if (!mechanic) {
        return (
            <View className="items-center justify-center p-8">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="text-gray-400 mt-2">Loading mechanic info...</Text>
            </View>
        );
    }

    if (viewReviews) {
        return (
            <View className="gap-4">
                <TouchableOpacity onPress={() => setViewReviews(false)} className="flex-row items-center mb-2">
                    <Ionicons name="chevron-back" size={20} color="#3B82F6" />
                    <Text className="text-blue-600 font-outfit-medium ml-1">Back to Profile</Text>
                </TouchableOpacity>
                <Text className="font-outfit-bold text-gray-900 text-lg mb-2">Reviews History</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {[1, 2, 3].map(i => (
                        <View key={i} className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
                            <View className="flex-row justify-between mb-2">
                                <View className="flex-row">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Ionicons key={s} name="star" size={12} color="#3B82F6" />
                                    ))}
                                </View>
                                <Text className="text-gray-400 text-[10px]">February 20th, 2019</Text>
                            </View>
                            <Text className="text-gray-600 text-sm font-outfit-regular">Great service! Highly recommended.</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="gap-6">
            <View className="items-center mb-6">
                <Image
                    source={{ uri: mechanic.profileImage || 'https://i.pravatar.cc/150?u=mechanic' }}
                    className="w-24 h-24 rounded-full mb-3 bg-gray-200"
                />
                <Text className="font-outfit-bold text-blue-900 text-xl">{mechanic.name || 'Unknown'} {mechanic.surname?.[0] || ''}.</Text>
                <Text className="text-blue-500 text-xs font-outfit-medium uppercase tracking-wider mb-2">
                    Identify Me: {mechanic.vehicleInfo || 'Ford Focus, Blue'}
                </Text>

                <View className="flex-row items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons key={s} name="star" size={14} color="#3B82F6" />
                    ))}
                </View>

                <Text className="text-gray-400 text-sm mb-4">Mechanic Since: July 2018</Text>

                <View className="flex-row gap-4">
                    <View className="flex-row items-center border border-blue-200 rounded-lg px-3 py-1 bg-blue-50">
                        <Ionicons name="time-outline" size={14} color="#0047AB" />
                        <Text className="text-blue-900 text-[10px] ml-1 font-outfit-bold">{mechanic.experience || '5'} years experience</Text>
                    </View>
                    <View className="flex-row items-center border border-blue-200 rounded-lg px-3 py-1 bg-blue-50">
                        <Ionicons name="calendar-outline" size={14} color="#0047AB" />
                        <Text className="text-blue-900 text-[10px] ml-1 font-outfit-bold">Mon-Sat / 9:00AM - 5:00PM</Text>
                    </View>
                </View>
            </View>

            <View className="gap-4">
                <Text className="font-outfit-bold text-gray-900 text-lg">About Me</Text>
                <Text className="text-gray-600 text-sm font-outfit-regular leading-5">
                    {mechanic.bio || "I'm just your ordinary guy trying to give back to the community."}
                </Text>

                <Text className="font-outfit-bold text-gray-900 text-lg mt-2">I specialize in</Text>
                <View className="flex-row flex-wrap gap-2">
                    {(mechanic.specializations || ['Lock Smithing', 'Plumbing', 'Automotive Issue']).map((tag: string) => (
                        <View key={tag} className="bg-transparent px-3 py-1.5 rounded-lg border border-blue-400">
                            <Text className="text-blue-500 text-xs font-outfit-medium">{tag}</Text>
                        </View>
                    ))}
                </View>

                <Text className="font-outfit-bold text-gray-900 text-lg mt-2">ASE Certified in:</Text>
                <View className="flex-row gap-2 mb-4">
                    <View className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center">
                        <Text className="text-[10px] font-outfit-bold text-white">ASE</Text>
                    </View>
                    {['A2', 'A4', 'A5'].map(cert => (
                        <View key={cert} className="bg-white border border-blue-200 w-8 h-8 rounded-lg items-center justify-center">
                            <Text className="text-[10px] font-outfit-bold text-blue-500">{cert}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity onPress={() => setViewReviews(true)}>
                    <Text className="text-blue-900 font-outfit-bold text-sm">See My Reviews</Text>
                </TouchableOpacity>

                {/* Big Action Buttons */}
                <View className="gap-3 mt-4">
                    <TouchableOpacity className="bg-blue-600 w-full py-3 rounded-lg flex-row items-center justify-center gap-2">
                        <Ionicons name="call" size={20} color="white" />
                        <Text className="text-white font-outfit-bold text-base">Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-blue-600 w-full py-3 rounded-lg flex-row items-center justify-center gap-2">
                        <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                        <Text className="text-white font-outfit-bold text-base">Message</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
