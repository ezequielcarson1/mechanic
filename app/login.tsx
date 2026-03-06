import { EnvSelector } from '@/components/EnvSelector';
import { Button } from '@/components/ui/Button';
import { GradientLayout } from '@/components/ui/GradientLayout';
import { Input } from '@/components/ui/Input';
import { NumericKeypad } from '@/components/ui/Keypad';
import { useUser } from '@/context/UserContext';
import { sendOTP, verifyOTP, getIdToken } from '@/lib/firebase/auth';
import { getLastPhone, saveLastPhone } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Keyboard, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useUser();
    const [step, setStep] = useState<Step>('phone');
    const [method, setMethod] = useState<'email' | 'mobile'>('mobile');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fullPhoneRef = useRef('');

    useEffect(() => {
        const loadLastPhone = async () => {
            const savedPhone = await getLastPhone();
            if (savedPhone) {
                setPhoneNumber(formatPhoneNumber(savedPhone));
            }
        };
        loadLastPhone();
    }, []);

    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!match) return cleaned;
        const [, area, prefix, line] = match;
        if (cleaned.length <= 3) return area ? `(${area}` : '';
        if (cleaned.length <= 6) return `(${area}) ${prefix}`;
        return `(${area}) ${prefix}-${line}`;
    };

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            setPhoneNumber(formatPhoneNumber(cleaned));
        }
    };

    // Step 1: send OTP via Firebase
    const handleSendOTP = async () => {
        const cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length < 10) {
            Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number.');
            return;
        }

        const e164 = `+1${cleaned}`;
        fullPhoneRef.current = e164;
        setIsLoading(true);
        try {
            await sendOTP(e164);
            setOtpCode('');
            setStep('otp');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send verification code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: verify OTP, get Firebase ID token, login with backend
    const handleVerifyOTP = async () => {
        if (otpCode.length < 6) return;

        setIsLoading(true);
        try {
            await verifyOTP(otpCode);
            const idToken = await getIdToken();
            if (!idToken) throw new Error('Failed to get authentication token.');

            const success = await login(idToken);
            if (success) {
                const cleaned = fullPhoneRef.current.replace(/\D/g, '').slice(-10);
                await saveLastPhone(cleaned);
                router.replace('/(tabs)/assist');
            } else {
                Alert.alert(
                    'Account not found',
                    'No account is registered with this phone number. Please sign up first.',
                    [
                        { text: 'Sign Up', onPress: () => router.push('/setup') },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
            }
        } catch (err: any) {
            Alert.alert('Verification failed', err.message || 'Invalid code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpKeyPress = (key: string) => {
        if (otpCode.length < 6) setOtpCode(prev => prev + key);
    };

    const handleOtpDelete = () => {
        setOtpCode(prev => prev.slice(0, -1));
    };

    // --- OTP Step UI ---
    if (step === 'otp') {
        return (
            <View className="flex-1 bg-white justify-between">
                <View className="px-8 pt-16 flex-1">
                    <TouchableOpacity onPress={() => setStep('phone')} className="mb-8">
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>

                    <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2">
                        Enter verification code
                    </Text>
                    <Text className="text-base font-outfit-medium text-[#0047AB] mb-12">
                        Sent to {fullPhoneRef.current}
                    </Text>

                    {/* 6-digit display */}
                    <View className="flex-row justify-between mb-12 px-4">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <View
                                key={index}
                                className="w-10 border-b-2 border-slate-300 items-center pb-2"
                            >
                                <Text className="text-3xl font-outfit-bold text-[#0F172A]">
                                    {otpCode[index] || ''}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={handleSendOTP}
                        className="mb-6"
                        disabled={isLoading}
                    >
                        <Text className="text-[#0047AB] text-center font-outfit-medium">
                            Resend code
                        </Text>
                    </TouchableOpacity>
                </View>

                <NumericKeypad
                    onKeyPress={handleOtpKeyPress}
                    onDelete={handleOtpDelete}
                    onSubmit={handleVerifyOTP}
                />
            </View>
        );
    }

    // --- Phone Step UI ---
    return (
        <View className="flex-1">
            <EnvSelector />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <GradientLayout className="flex-1" resizeMode="cover">
                    <View className="flex-1 justify-end px-6 pb-12">
                        <View className="flex-1" />

                        <Text className="text-white text-3xl font-outfit-bold text-center mb-8">
                            Get Started
                        </Text>

                        <View className="w-full mb-6">
                            {method === 'email' ? (
                                <>
                                    <Input
                                        placeholder="Username"
                                        leftIcon={<Ionicons name="person-outline" size={20} color="#9CA3AF" />}
                                        containerClassName="mb-4"
                                    />
                                    <Input
                                        placeholder="Password"
                                        isPassword
                                        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
                                        containerClassName="mb-4"
                                    />
                                </>
                            ) : (
                                <View className="flex-row gap-3 mb-4">
                                    <View className="bg-white rounded-xl px-4 justify-center items-center h-[52px]">
                                        <Text className="font-outfit-medium text-black text-base">🇺🇸 + 1</Text>
                                    </View>
                                    <Input
                                        placeholder="(000) 000-0000"
                                        containerClassName="flex-1 h-[52px]"
                                        keyboardType="phone-pad"
                                        value={phoneNumber}
                                        onChangeText={handlePhoneChange}
                                        maxLength={14}
                                    />
                                </View>
                            )}
                        </View>

                        <Button
                            onPress={handleSendOTP}
                            size="lg"
                            className="mb-6 border-white/40 border bg-blue-600/20 backdrop-blur-sm"
                            isLoading={isLoading}
                        >
                            Login
                        </Button>

                        <Text className="text-white/80 text-center mb-4 underline font-outfit-regular">Or</Text>

                        <View className="mb-8">
                            <Button
                                variant="google"
                                className="mb-3"
                                leftIcon={<Image source={require('@/assets/brands/google.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />}
                                accessibilityLabel="Sign in with Google"
                            >
                                Sign in with Google
                            </Button>
                            <Button
                                variant="apple"
                                className="mb-3"
                                leftIcon={<Image source={require('@/assets/brands/apple.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />}
                                accessibilityLabel="Sign in with Apple"
                            >
                                Sign in with Apple
                            </Button>
                            <Button
                                variant="social"
                                onPress={() => setMethod(method === 'email' ? 'mobile' : 'email')}
                                leftIcon={<Ionicons name="mail-outline" size={20} color="black" />}
                            >
                                {method === 'email' ? 'Sign in with Mobile' : 'Sign in with Email'}
                            </Button>
                        </View>

                        <View className="flex-row justify-center">
                            <Text className="text-white/80 font-outfit-regular">Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/setup')}>
                                <Text className="text-white font-outfit-bold underline">Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </GradientLayout>
            </TouchableWithoutFeedback>
        </View>
    );
}
