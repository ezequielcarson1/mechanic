import { NumericKeypad } from '@/components/ui/Keypad';
import { userDAO } from '@/lib/dao/UserDAO';
import { sendOTP } from '@/lib/firebase/auth';
import { saveSetupProgress } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TouchableOpacity, View } from 'react-native';

export default function PhoneNumberScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    const handleKeyPress = (key: string) => {
        if (phoneNumber.length < 10) {
            setPhoneNumber(prev => prev + key);
        }
    };

    const handleDelete = () => {
        setPhoneNumber(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (phoneNumber.length < 10) {
            Alert.alert('Invalid number', 'Please enter a valid 10-digit phone number.');
            return;
        }

        setIsChecking(true);
        try {
            const fullPhone = `+1${phoneNumber}`;

            // Check if phone already registered in our DB
            const exists = await userDAO.checkPhoneExists(fullPhone);
            if (exists) {
                setShowErrorModal(true);
                return;
            }

            // Save phone to setup progress
            await saveSetupProgress('phone', { phoneNumber: fullPhone });

            // Send OTP via Firebase — confirmation result stored in lib/firebase/auth module
            await sendOTP(fullPhone);

            router.push('/setup/otp');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsChecking(false);
        }
    };

    // Format phone number as (XXX) XXX-XXXX
    const formattedNumber = (() => {
        if (!phoneNumber) return '';
        const areaCode = phoneNumber.slice(0, 3);
        const prefix = phoneNumber.slice(3, 6);
        const line = phoneNumber.slice(6, 10);
        if (phoneNumber.length > 6) return `(${areaCode}) ${prefix}-${line}`;
        if (phoneNumber.length > 3) return `(${areaCode}) ${prefix}`;
        return areaCode ? `(${areaCode}` : '';
    })();

    return (
        <View className="flex-1 bg-white justify-between">
            <View className="px-8 pt-8 flex-1">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2">
                    What's your number?
                </Text>
                <Text className="text-base font-outfit-medium text-[#0047AB] mb-12">
                    We'll send you an SMS to verify your phone.
                </Text>

                <View className="flex-row items-center justify-center mb-8 border-b-2 border-slate-200 pb-2">
                    <Text className="text-3xl font-outfit-bold text-[#0F172A] mr-4">+1</Text>
                    <Text className={`text-3xl font-outfit-regular flex-1 ${!phoneNumber ? 'text-gray-200' : 'text-gray-400'}`}>
                        {formattedNumber || '(000) 000-0000'}
                    </Text>
                </View>

                <View className="bg-blue-50/50 p-4 rounded-xl mt-auto mb-4">
                    <Text className="text-xs text-slate-500 text-center font-outfit-regular leading-5">
                        By providing my mobile number, I hereby agree and accept the{' '}
                        <Text className="font-outfit-bold text-[#0047AB]">Terms of Service</Text> and{' '}
                        <Text className="font-outfit-bold text-[#0047AB]">Privacy Policy</Text> in use of the mechanic assistance app and to receive text message communications from mechanic on my mobile device.
                    </Text>
                </View>
            </View>

            {isChecking && (
                <View className="absolute inset-0 bg-white/50 justify-center items-center z-50">
                    <ActivityIndicator size="large" color="#0047AB" />
                </View>
            )}

            <NumericKeypad
                onKeyPress={handleKeyPress}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
            />

            {/* Error Modal — phone already registered */}
            <Modal
                visible={showErrorModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowErrorModal(false)}
            >
                <View className="flex-1 bg-black/40 justify-center items-center px-6">
                    <View className="bg-white rounded-3xl w-full p-8 items-center shadow-xl">
                        <View className="w-16 h-16 bg-red-50 rounded-full justify-center items-center mb-6">
                            <Ionicons name="alert-circle" size={32} color="#EF4444" />
                        </View>

                        <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2 text-center">
                            Account Exists
                        </Text>

                        <Text className="text-base font-outfit-regular text-slate-500 text-center mb-8">
                            This phone number is already registered. Please log in instead or use a different number.
                        </Text>

                        <TouchableOpacity
                            className="bg-blue-700 w-full py-4 rounded-xl shadow-sm active:opacity-90"
                            onPress={() => setShowErrorModal(false)}
                        >
                            <Text className="text-white text-center font-outfit-bold text-lg">
                                Got it
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
