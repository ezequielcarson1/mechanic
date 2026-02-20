import React from 'react';
import { Text, View } from 'react-native';

export function UserStatusTab({ appointment }: { appointment: any }) {
    if (!appointment) return null;
    return (
        <View className="gap-6" testID="user-status-tab">
            <View className="gap-4">
                <View>
                    <Text className="font-outfit-bold text-blue-900">Mechanic identified:</Text>
                    <Text className="text-gray-600 font-outfit-regular">Jason H.</Text>
                </View>
                <View>
                    <Text className="font-outfit-bold text-blue-900">Vehicle info:</Text>
                    <Text className="text-gray-600 font-outfit-regular">Ford Focus, Blue</Text>
                </View>
                <View>
                    <Text className="font-outfit-bold text-blue-900">Current status:</Text>
                    <Text className="text-emerald-600 font-outfit-bold">EN ROUTE</Text>
                </View>
            </View>
        </View>
    );
}
