import { Button } from '@/components/ui/Button';
import { NumericKeypad } from '@/components/ui/Keypad';
import { sendOTP, verifyOTP } from '@/lib/firebase/auth';
import { getSetupProgress, saveSetupProgress } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function OTPScreen() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        loadPhoneNumber();
    }, []);

    const loadPhoneNumber = async () => {
        const progress = await getSetupProgress();
        if (progress.phone?.phoneNumber) {
            const raw = progress.phone.phoneNumber;
            const digits = raw.replace(/\D/g, '').slice(-10);
            setPhoneNumber(`+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`);
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

        setIsVerifying(true);
        try {
            const firebaseUser = await verifyOTP(code);
            // Store Firebase UID in setup progress so registration can link Firebase ↔ SQLite
            await saveSetupProgress('otp', { verified: true, firebaseUid: firebaseUser.uid });
            router.push('/setup/role-selection');
        } catch (err: any) {
            Alert.alert('Invalid code', err.message || 'The code you entered is incorrect. Please try again.');
            setCode('');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        const progress = await getSetupProgress();
        const phone = progress.phone?.phoneNumber;
        if (!phone) return;

        setIsResending(true);
        try {
            await sendOTP(phone);
            setCode('');
            Alert.alert('Code sent', 'A new verification code has been sent to your phone.');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <View className="flex-1 bg-white justify-between">
            <View className="px-8 pt-8 flex-1">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2">
                    What's The Code?
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
                    <TouchableOpacity className="mb-6" onPress={handleResend} disabled={isResending}>
                        <Text className="text-[#0047AB] text-center font-outfit-medium">
                            {isResending ? 'Sending…' : 'Resend code'}
                        </Text>
                    </TouchableOpacity>

                    <Button
                        className="bg-blue-700 rounded-xl"
                        size="lg"
                        onPress={handleSubmit}
                        isLoading={isVerifying}
                    >
                        Verify
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
