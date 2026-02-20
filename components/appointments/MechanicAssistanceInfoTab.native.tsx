import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MechanicAssistanceInfoTabProps {
    appointment: any;
    onScan: () => void;
}

export function MechanicAssistanceInfoTab({ appointment, onScan }: MechanicAssistanceInfoTabProps) {
    return (
        <View className="gap-6">
            {/* Blue Header Banner */}
            <View className="bg-blue-600 rounded-xl p-4 flex-row items-center gap-3">
                <View className="bg-white/20 p-2 rounded-full">
                    <Ionicons name="construct" size={24} color="white" />
                </View>
                <Text className="text-white font-outfit-bold text-lg">
                    {appointment.type === 'immediate' ? 'Immediate Assistance' :
                        appointment.type === 'videocall' || appointment.type === 'video' ? 'Video Call Assistance' :
                            'Scheduled Assistance'}
                </Text>
            </View>

            {/* Assistance Details */}
            <View className="gap-4">
                <View>
                    <Text className="font-outfit-bold text-gray-900 text-base">Assistance:</Text>
                    <Text className="text-gray-600 font-outfit-regular">{appointment.title}</Text>
                </View>

                <View>
                    <Text className="font-outfit-bold text-gray-900 text-base">Time since accepted:</Text>
                    <Text className="text-gray-600 font-outfit-regular">02:30 (Simulated)</Text>
                </View>

                <View>
                    <Text className="font-outfit-bold text-gray-900 text-base">Car:</Text>
                    <Text className="text-gray-600 font-outfit-regular">{appointment.car}</Text>
                </View>

                <View>
                    <Text className="font-outfit-bold text-gray-900 text-base">Notes:</Text>
                    <Text className="text-gray-600 font-outfit-regular leading-5">
                        {appointment.notes || 'No notes provided.'}
                    </Text>
                </View>

                {/* Photos Carousel */}
                {appointment.photos && appointment.photos.length > 0 && (
                    <View>
                        <Text className="font-outfit-bold text-gray-900 text-base mb-2">Photos:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                            {appointment.photos.map((photo: string, index: number) => (
                                <Image
                                    key={index}
                                    source={{ uri: photo }}
                                    className="w-24 h-24 rounded-lg bg-gray-100"
                                    resizeMode="cover"
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View>
                    <Text className="font-outfit-bold text-gray-900 text-base">Address:</Text>
                    <Text className="text-gray-600 font-outfit-regular">{appointment.address}</Text>
                    {/* Map View */}
                    <View className="h-48 rounded-xl mt-2 overflow-hidden bg-gray-200">
                        {appointment.locationLat && appointment.locationLng ? (
                            <MapView
                                style={{ width: '100%', height: '100%' }}
                                initialRegion={{
                                    latitude: appointment.locationLat,
                                    longitude: appointment.locationLng,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: appointment.locationLat,
                                        longitude: appointment.locationLng,
                                    }}
                                    title={appointment.address}
                                />
                            </MapView>
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <Ionicons name="map-outline" size={32} color="#9CA3AF" />
                                <Text className="text-gray-500 font-outfit-regular mt-2">Location not available</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Scan QR Button */}
            <View className="mt-2">
                <Text className="font-outfit-bold text-gray-900 text-base mb-2">When you arrive on-site:</Text>
                <TouchableOpacity
                    onPress={onScan}
                    className="bg-blue-800 w-full py-3 rounded-lg flex-row items-center justify-center gap-2"
                >
                    <Ionicons name="qr-code-outline" size={20} color="white" />
                    <Text className="text-white font-outfit-bold text-base">Scan QR</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
