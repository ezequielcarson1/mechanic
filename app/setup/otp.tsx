import { Button } from '@/components/ui/Button';
import { NumericKeypad } from '@/components/ui/Keypad';
import { getSetupProgress, saveSetupProgress } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function OTPScreen() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        loadPhoneNumber();
    }, []);

    const loadPhoneNumber = async () => {
        const progress = await getSetupProgress();
        if (progress.phone?.phoneNumber) {
            // Format number nicely
            const raw = progress.phone.phoneNumber;
            const formatted = raw.length > 6
                ? `+1 ${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`
                : raw;
            setPhoneNumber(formatted);
        }
    };

    const handleKeyPress = (key: string) => {
        if (code.length < 6) {
            setCode(prev => prev + key);
        }
    };

    const handleDelete = () => {
        setCode(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (code.length < 6) return;

        // Simulate verification
        await saveSetupProgress('otp', { verified: true });
        router.push('/setup/role-selection');
    };

    return (
        <View className="flex-1 bg-white justify-between">
            <View className="px-8 pt-8 flex-1">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2">
                    What’s The Code?
                </Text>
                <Text className="text-base font-outfit-medium text-[#0047AB] mb-12">
                    Enter the code sent to {phoneNumber || 'your phone'}
                </Text>

                {/* 6-Digit Input Display */}
                <View className="flex-row justify-between mb-12 px-4">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <View
                            key={index}
                            className="w-10 border-b-2 border-slate-300 items-center pb-2"
                        >
                            <Text className="text-3xl font-outfit-bold text-[#0F172A]">
                                {code[index] || ''}
                            </Text>
                        </View>
                    ))}
                </View>

                <View className="mt-auto mb-4">
                    <TouchableOpacity className="mb-6">
                        <Text className="text-[#0047AB] text-center font-outfit-medium">Call me instead</Text>
                    </TouchableOpacity>

                    <Button
                        className="bg-blue-700 rounded-xl"
                        size="lg"
                    >
                        Resend Code
                    </Button>
                </View>
            </View>

            <NumericKeypad
                onKeyPress={handleKeyPress}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
            />
        </View>
    );
}
