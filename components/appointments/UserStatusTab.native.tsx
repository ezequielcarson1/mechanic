import { Ionicons } from '@expo/vector-icons';
import { ConfigService } from '@/lib/config/ConfigService';
import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export function UserStatusTab({ appointment }: { appointment: any }) {
    if (!appointment) return null;

    const photos: string[] = Array.isArray(appointment.photos)
        ? appointment.photos
        : typeof appointment.photos === 'string'
            ? JSON.parse(appointment.photos || '[]')
            : [];

    const currentStatus = appointment.currentStatus || appointment.status || 'Pending';
    const isEnRoute = currentStatus.toLowerCase().includes('way') || currentStatus.toLowerCase().includes('route');
    const isArrived = currentStatus.toLowerCase().includes('arrived');
    const statusColor = isArrived ? '#059669' : isEnRoute ? '#2563EB' : '#6B7280';

    const hasCoords = appointment.locationLat && appointment.locationLng;

    return (
        <View className="gap-6" testID="user-status-tab">
            <View className="gap-4">
                <View>
                    <Text className="font-outfit-bold text-blue-900">Current status:</Text>
                    <Text className="font-outfit-bold text-lg" style={{ color: statusColor }}>
                        {currentStatus.toUpperCase()}
                    </Text>
                </View>

                <View>
                    <Text className="font-outfit-bold text-blue-900">Vehicle:</Text>
                    <Text className="text-gray-600 font-outfit-regular">{appointment.car || '—'}</Text>
                </View>

                <View>
                    <Text className="font-outfit-bold text-blue-900">Address:</Text>
                    <Text className="text-gray-600 font-outfit-regular">{appointment.address || '—'}</Text>
                    {/* Map */}
                    <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginTop: 8, backgroundColor: '#E5E7EB' }}>
                        {hasCoords ? (
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
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="map-outline" size={32} color="#9CA3AF" />
                                <Text style={{ color: '#6B7280', marginTop: 8, fontFamily: 'Outfit_400Regular' }}>
                                    Location not available
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {appointment.notes ? (
                    <View>
                        <Text className="font-outfit-bold text-blue-900">Notes:</Text>
                        <Text className="text-gray-600 font-outfit-regular">{appointment.notes}</Text>
                    </View>
                ) : null}

                {photos.length > 0 && (
                    <View>
                        <Text className="font-outfit-bold text-blue-900 mb-2">
                            Submitted photos ({photos.length}):
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {photos.map((uri, index) => {
                                const src = uri.startsWith('http') ? uri : `${ConfigService.getApiBaseUrl()}${uri}`;
                                return (
                                    <Image
                                        key={index}
                                        source={{ uri: src }}
                                        style={{
                                            width: 110,
                                            height: 110,
                                            borderRadius: 10,
                                            marginRight: 10,
                                            backgroundColor: '#F3F4F6',
                                        }}
                                        resizeMode="cover"
                                    />
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
}
