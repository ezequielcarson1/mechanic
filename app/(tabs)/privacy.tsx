import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function PrivacyScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        setLoading(true);
        // Supabase Update Placeholder
        // const { error } = await supabase.from('profiles').update({ privacy_accepted: true }).eq('id', user.id);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            router.back();
        }, 1000);
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1 px-6 pt-6 mb-20">
                <View className="mb-6">
                    <Text className="text-xl font-outfit-bold text-blue-900 mb-1">Privacy Policy</Text>
                    <Text className="text-blue-500 font-outfit-regular">Last update: 14/08/2024</Text>
                </View>

                <Text className="font-outfit-regular text-gray-600 leading-6 mb-6">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pellentesque congue lorem, vel tincidunt tortor placerat a. Proin ac diam quam. Aenean in sagittis magna, ut feugiat diam. Fusce a scelerisque neque, sed accumsan metus.
                </Text>

                <Text className="font-outfit-bold text-gray-900 text-lg mb-2">Terms & conditions</Text>
                <Text className="font-outfit-regular text-gray-600 leading-6 mb-4">
                    Nunc auctor tortor in dolor luctus, quis euismod urna tincidunt. Aenean arcu metus, bibendum at rhoncus at, volutpat ut lacus. Morbi pellentesque malesuada eros semper ultrices. Vestibulum lobortis enim vel neque auctor, a ultrices ex placerat. Mauris ut lacinia justo, sed suscipit tortor. Nam egestas nulla posuere neque tincidunt porta.
                </Text>

                <View className="mb-4">
                    <Text className="font-outfit-regular text-gray-600 leading-6 mb-2">
                        1. Ut lacinia justo sit amet lorem sodales accumsan. Proin malesuada eleifend fermentum. Donec condimentum, nunc at rhoncus faucibus, ex nisi laoreet
                    </Text>
                    <Text className="font-outfit-regular text-gray-600 leading-6">
                        2. We may use your email address to send you occasional promotions and updates. You are able to opt out from receiving these emails at any time by adjusting your account settings.
                    </Text>
                </View>

                {/* Spacer for bottom button */}
                <View className="h-10" />
            </ScrollView>

            <View className="absolute bottom-0 w-full p-6 bg-white border-t border-gray-100">
                <Button onPress={handleAccept} size="lg" disabled={loading}>
                    {loading ? 'Accepting...' : 'Accept'}
                </Button>
            </View>
        </View>
    );
}
