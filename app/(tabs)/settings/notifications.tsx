import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

export default function NotificationsSettingsScreen() {
    const [settings, setSettings] = useState({
        general: true,
        sound: true,
        soundCall: true,
        vibrate: false,
        specialOffers: false,
        payments: false,
        promo: false,
        cashback: false,
    });

    const toggleSwitch = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const items = [
        { key: 'general', label: 'General Notification' },
        { key: 'sound', label: 'Sound' },
        { key: 'soundCall', label: 'Sound Call' },
        { key: 'vibrate', label: 'Vibrate' },
        { key: 'specialOffers', label: 'Special Offers' },
        { key: 'payments', label: 'Payments' },
        { key: 'promo', label: 'Promo and discount' },
        { key: 'cashback', label: 'Cashback' },
    ];

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-6">
            <Stack.Screen options={{ title: 'Settings', headerBackTitle: 'Back' }} />

            <View className="mb-8">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">Settings</Text>
                <Text className="text-blue-500 font-outfit-regular">Notifications</Text>
            </View>

            <View className="gap-6">
                {items.map((item) => (
                    <View key={item.key} className="flex-row justify-between items-center">
                        <Text className="font-outfit-medium text-gray-900 text-lg">{item.label}</Text>
                        <Switch
                            trackColor={{ false: '#767577', true: '#0047AB' }}
                            thumbColor={settings[item.key as keyof typeof settings] ? '#fff' : '#f4f3f4'}
                            ios_backgroundColor="#E5E7EB"
                            onValueChange={() => toggleSwitch(item.key as keyof typeof settings)}
                            value={settings[item.key as keyof typeof settings]}
                        />
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
