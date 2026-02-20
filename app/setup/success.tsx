import { Button } from '@/components/ui/Button';
import { userDAO } from '@/lib/dao/UserDAO';
import { clearSetupProgress, getSetupProgress } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function SuccessScreen() {
    // ... (lines 10-63 unchanged mostly)

    // Logic remains, just replacing imports and JSX

    const router = useRouter();
    const [isCreating, setIsCreating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const createAccount = async () => {
            try {
                const progress = await getSetupProgress();
                await userDAO.register(progress);
                await clearSetupProgress();
                setIsCreating(false);
            } catch (err: any) {
                console.error('Registration failed:', err);
                setError(err.message || 'Failed to create account');
                setIsCreating(false);
            }
        };

        createAccount();
    }, []);

    const handleGetStarted = () => {
        router.replace('/login');
    };

    if (isCreating) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-6">
                <ActivityIndicator size="large" color="#0047AB" />
                <Text className="text-lg font-outfit-medium text-[#0047AB] text-center mt-4">
                    Finalizing your account...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-6">
                <Text className="text-xl font-outfit-bold text-red-600 mb-4 text-center">
                    Oops! Something went wrong
                </Text>
                <Text className="text-base font-outfit-regular text-slate-500 mb-8 text-center">
                    {error}
                </Text>
                <Button onPress={() => router.replace('/setup')} className="bg-blue-700 rounded-xl w-full">
                    Try Again
                </Button>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white items-center justify-center p-6">
            {/* Success Icon */}
            <View className="w-32 h-32 rounded-full border-4 border-blue-400 items-center justify-center mb-8">
                <Ionicons name="checkmark" size={64} color="#60A5FA" style={{ fontWeight: 'bold' }} />
            </View>

            <Text className="text-2xl font-outfit-bold text-[#0F172A] mb-2 text-center">
                Congratulations
            </Text>
            <Text className="text-lg font-outfit-medium text-[#0047AB] mb-8 text-center">
                Your account has been set-up successfully!
            </Text>

            <View className="bg-blue-50/50 p-6 rounded-xl mb-12 w-full">
                <Text className="text-[#0F172A] font-outfit-regular text-center leading-6">
                    Book your demo/burden road test.{"\n"}
                    ASE membership need to be verified.{"\n\n"}
                    We will notify you as soon as this process is complete.
                </Text>
            </View>

            <Button onPress={handleGetStarted} size="lg" className="bg-blue-700 rounded-xl w-full">
                Get Started
            </Button>
        </View>
    );
}
