import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Key, UserX } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const router = useRouter();

    const menuItems = [
        {
            icon: Bell,
            label: 'Notifications',
            route: '/settings/notifications',
            description: 'Set up your preferences'
        },
        {
            icon: Key,
            label: 'Account password',
            route: '/settings/password',
            description: 'Change your password'
        },
        {
            icon: UserX,
            label: 'Delete Account',
            route: '/settings/delete-account',
            description: 'Danger zone'
        },
    ];

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-6">
            <View className="mb-8">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">Settings</Text>
                <Text className="text-blue-500 font-outfit-regular">Set up your preferences</Text>
            </View>

            <View className="gap-2">
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        className="flex-row items-center py-4 border-b border-gray-100"
                        onPress={() => router.push(item.route)}
                    >
                        <View className="w-12 h-12 bg-blue-50 rounded-full justify-center items-center mr-4">
                            <item.icon size={24} color="#0047AB" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-outfit-bold text-gray-900 text-lg">{item.label}</Text>
                        </View>
                        <ChevronRight size={24} color="#0047AB" />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}
