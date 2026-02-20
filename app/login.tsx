import { Button } from '@/components/ui/Button';
import { GradientLayout } from '@/components/ui/GradientLayout';
import { Input } from '@/components/ui/Input';
import { useUser } from '@/context/UserContext';
import { getLastPhone, saveLastPhone } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Keyboard, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useUser();
    const [method, setMethod] = useState<'email' | 'mobile'>('mobile');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

    const handleLogin = async () => {
        if (method === 'mobile') {
            const cleaned = phoneNumber.replace(/\D/g, '');
            if (cleaned.length < 10) {
                alert('Please enter a valid 10-digit mobile number');
                return;
            }

            setIsLoading(true);
            const success = await login(`+1${cleaned}`);
            setIsLoading(false);

            if (success) {
                await saveLastPhone(cleaned);
                router.replace('/(tabs)/assist');
            } else {
                alert('Login failed. Please check your number.');
            }
        } else {
            alert('Email login is not implemented yet. Use mobile login.');
        }
    };


    return (
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
                        onPress={handleLogin}
                        size="lg"
                        className="mb-6 border-white/40 border bg-blue-600/20 backdrop-blur-sm"
                        isLoading={isLoading}
                    >
                        Login
                    </Button>

                    <Text className="text-white/80 text-center mb-4 underline font-outfit-regular">Or</Text>

                    <View className="mb-8">
                        <Button
                            variant="social"
                            className="mb-3"
                            leftIcon={<Image source={require('@/assets/images/google.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />}
                        >
                            Sign in with Google
                        </Button>
                        <Button
                            variant="social"
                            className="mb-3"
                            leftIcon={<Image source={require('@/assets/images/apple.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />}
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
    );
}
