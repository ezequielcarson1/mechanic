import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Stack, useRouter } from 'expo-router';
import { UserX } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function DeleteAccountScreen() {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);

    const handleDelete = () => {
        // API Call to delete account
        console.log('Account deleted');
        setShowModal(false);
        router.replace('/login');
    };

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-6">
            <Stack.Screen options={{ title: 'Profile', headerBackTitle: 'Back' }} />

            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">Delete Account</Text>
            </View>

            <Text className="font-outfit-medium text-gray-900 text-lg mb-4">We're sorry to see you go.</Text>

            <Text className="font-outfit-regular text-gray-600 leading-6 mb-4">
                If you delete your account, all your data will be permanently removed.
            </Text>

            <Text className="font-outfit-regular text-gray-600 leading-6 mb-12">
                Are you sure you want to continue?
            </Text>

            <Button
                onPress={() => setShowModal(true)}
                size="lg"
                className="bg-blue-700" // Vibrant blue as per design, not red
            >
                Delete Account
            </Button>

            <ConfirmationModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDelete}
                title="Are you still sure you want to Delete your account?"
                message="" // Message inside title in design
                icon={UserX}
                iconColor="#00A8E8" // Cyan/Blue color from design
                confirmButtonColor="#0047AB"
                confirmText="Yes"
                cancelText="No"
            />
        </ScrollView>
    );
}
