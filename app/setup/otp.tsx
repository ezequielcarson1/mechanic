import { Button } from '@/components/ui/Button';
import { NumericKeypad } from '@/components/ui/Keypad';
import { sendOTP, verifyOTP } from '@/lib/firebase/auth';
import { getSetupProgress, saveSetupProgress } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Modal, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function OTPScreen() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const otpInputRef = useRef<TextInput>(null);

    const [errorModal, setErrorModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        actionLabel?: string;
        onAction?: () => void;
    }>({ visible: false, title: '', message: '' });

    const showError = (title: string, message: string, action?: { label: string; onPress: () => void }) => {
        setErrorModal({ visible: true, title, message, actionLabel: action?.label, onAction: action?.onPress });
    };
    const hideError = () => setErrorModal(prev => ({ ...prev, visible: false }));

    useEffect(() => {
        setTimeout(() => otpInputRef.current?.focus(), 100);
    }, []);

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

    const handleSubmit = async (codeToVerify?: string) => {
        const currentCode = typeof codeToVerify === 'string' ? codeToVerify : code;
        if (currentCode.length < 6) return;

        setIsVerifying(true);
        try {
            const firebaseUser = await verifyOTP(currentCode);
            // Store Firebase UID in setup progress so registration can link Firebase ↔ SQLite
            await saveSetupProgress('otp', { verified: true, firebaseUid: firebaseUser.uid });
            router.push('/setup/role-selection');
        } catch (err: any) {
            const rawMessage = err.message || '';
            const displayMessage = rawMessage.includes('auth/too-many-requests')
                ? 'Too many attempts. Please wait a few minutes and try again later.'
                : rawMessage || 'The code you entered is incorrect. Please try again.';

            showError('Invalid code', displayMessage);
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
            showError('Code sent', 'A new verification code has been sent to your phone.');
        } catch (err: any) {
            const rawMessage = err.message || '';
            const displayMessage = rawMessage.includes('auth/too-many-requests')
                ? 'Please wait a few minutes before requesting another code.'
                : rawMessage || 'Failed to resend code. Please try again.';

            showError('Error', displayMessage);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View className="flex-1 bg-white justify-between">
                    <View className="px-8 pt-8 flex-1">
                        <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2">
                            What's The Code?
                        </Text>
                        <Text className="text-base font-outfit-medium text-[#0047AB] mb-12">
                            Enter the code sent to {phoneNumber || 'your phone'}
                        </Text>

                        {/* 6-Digit Input Display with Native Autofill support */}
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => otpInputRef.current?.focus()}
                            className="flex-row justify-between mb-12 px-4 relative"
                        >
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <View
                                    key={index}
                                    className={`w-10 border-b-2 items-center pb-2 ${code.length === index ? 'border-[#0047AB]' : 'border-slate-300'}`}
                                >
                                    <Text className="text-3xl font-outfit-bold text-[#0F172A]">
                                        {code[index] || ''}
                                    </Text>
                                </View>
                            ))}

                            <TextInput
                                ref={otpInputRef}
                                value={code}
                                onChangeText={(text) => {
                                    const digits = text.replace(/\D/g, '').slice(0, 6);
                                    setCode(digits);
                                    if (digits.length === 6) {
                                        Keyboard.dismiss();
                                        handleSubmit(digits);
                                    }
                                }}
                                keyboardType="number-pad"
                                textContentType="oneTimeCode"
                                autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                                maxLength={6}
                                style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }}
                                caretHidden={true}
                            />
                        </TouchableOpacity>

                        <View className="mt-auto mb-4">
                            <TouchableOpacity className="mb-6" onPress={handleResend} disabled={isResending}>
                                <Text className="text-[#0047AB] text-center font-outfit-medium">
                                    {isResending ? 'Sending…' : 'Resend code'}
                                </Text>
                            </TouchableOpacity>

                            <Button
                                className="bg-blue-700 rounded-xl"
                                size="lg"
                                onPress={() => handleSubmit()}
                                isLoading={isVerifying}
                            >
                                Verify
                            </Button>
                        </View>
                    </View>

                    <NumericKeypad
                        onKeyPress={handleKeyPress}
                        onDelete={handleDelete}
                        onSubmit={() => handleSubmit()}
                    />
                </View>
            </TouchableWithoutFeedback>

            {/* Error Modal */}
            <Modal
                visible={errorModal.visible}
                transparent
                animationType="fade"
                onRequestClose={hideError}
            >
                <View className="flex-1 bg-black/40 justify-center items-center px-6">
                    <View className="bg-white rounded-3xl w-full p-8 items-center shadow-xl">
                        <View className="w-16 h-16 bg-red-50 rounded-full justify-center items-center mb-6">
                            <Ionicons name="alert-circle" size={32} color={errorModal.title === 'Code sent' ? '#10B981' : '#EF4444'} />
                        </View>

                        <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2 text-center">
                            {errorModal.title}
                        </Text>

                        <Text className="text-base font-outfit-regular text-slate-500 text-center mb-8">
                            {errorModal.message}
                        </Text>

                        {errorModal.onAction && (
                            <TouchableOpacity
                                className="bg-blue-700 w-full py-4 rounded-xl shadow-sm active:opacity-90 mb-3"
                                onPress={() => {
                                    hideError();
                                    errorModal.onAction?.();
                                }}
                            >
                                <Text className="text-white text-center font-outfit-bold text-lg">
                                    {errorModal.actionLabel}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            className="bg-slate-100 w-full py-4 rounded-xl active:opacity-90"
                            onPress={hideError}
                        >
                            <Text className="text-slate-700 text-center font-outfit-bold text-lg">
                                {errorModal.onAction ? 'Cancel' : 'Got it'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}
