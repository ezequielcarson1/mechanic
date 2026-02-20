import { Button } from '@/components/ui/Button';
import { Stack } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PasswordScreen() {
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [secureTextEntry, setSecureTextEntry] = useState({
        current: true,
        new: true,
        confirm: true
    });

    const toggleSecureResponse = (key: keyof typeof secureTextEntry) => {
        setSecureTextEntry(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Validation logic
    const hasMinLength = passwords.new.length >= 8;
    const hasSymbolOrNumber = /[0-9!@#$%^&*]/.test(passwords.new);
    const hasNameOrEmail = false; // Placeholder logic

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-6">
            <Stack.Screen options={{ title: 'Profile', headerBackTitle: 'Back' }} />

            <View className="mb-8">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">Account Password</Text>
            </View>

            <View className="gap-6 mb-8">
                {/* Current Password */}
                <View>
                    <Text className="font-outfit-medium text-gray-900 mb-2">Current Password</Text>
                    <View className="flex-row items-center bg-cyan-50/30 border border-cyan-100 rounded-xl px-4 h-12">
                        <TextInput
                            className="flex-1 font-outfit-medium text-gray-900"
                            secureTextEntry={secureTextEntry.current}
                            value={passwords.current}
                            onChangeText={(t) => setPasswords({ ...passwords, current: t })}
                            placeholder="*************"
                        />
                        <TouchableOpacity onPress={() => toggleSecureResponse('current')}>
                            {secureTextEntry.current ? <EyeOff size={20} color="#06b6d4" /> : <Eye size={20} color="#06b6d4" />}
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity className="self-end mt-2">
                        <Text className="text-cyan-500 font-outfit-medium text-xs">Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                {/* New Password */}
                <View>
                    <Text className="font-outfit-medium text-gray-900 mb-2">New Password</Text>
                    <View className="flex-row items-center bg-cyan-50/30 border border-cyan-100 rounded-xl px-4 h-12">
                        <TextInput
                            className="flex-1 font-outfit-medium text-gray-900"
                            secureTextEntry={secureTextEntry.new}
                            value={passwords.new}
                            onChangeText={(t) => setPasswords({ ...passwords, new: t })}
                            placeholder="*************"
                        />
                        <TouchableOpacity onPress={() => toggleSecureResponse('new')}>
                            {secureTextEntry.new ? <EyeOff size={20} color="#06b6d4" /> : <Eye size={20} color="#06b6d4" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Confirm Password */}
                <View>
                    <Text className="font-outfit-medium text-gray-900 mb-2">Confirm New Password</Text>
                    <View className="flex-row items-center bg-cyan-50/30 border border-cyan-100 rounded-xl px-4 h-12">
                        <TextInput
                            className="flex-1 font-outfit-medium text-gray-900"
                            secureTextEntry={secureTextEntry.confirm}
                            value={passwords.confirm}
                            onChangeText={(t) => setPasswords({ ...passwords, confirm: t })}
                            placeholder="*************"
                        />
                        <TouchableOpacity onPress={() => toggleSecureResponse('confirm')}>
                            {secureTextEntry.confirm ? <EyeOff size={20} color="#06b6d4" /> : <Eye size={20} color="#06b6d4" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Validation Feedback */}
            <View className="mb-10">
                <Text className={`font-outfit-regular text-xs mb-1 ${!hasNameOrEmail ? 'text-gray-500' : 'text-red-500'}`}>Must not contain your name or email.</Text>
                <Text className={`font-outfit-regular text-xs mb-1 ${hasMinLength ? 'text-blue-600' : 'text-gray-500'}`}>At least 8 characters.</Text>
                <Text className={`font-outfit-regular text-xs ${hasSymbolOrNumber ? 'text-blue-600' : 'text-gray-500'}`}>Contains a symbol or a number</Text>
            </View>

            <Button size="lg">Change Password</Button>
        </ScrollView>
    );
}
