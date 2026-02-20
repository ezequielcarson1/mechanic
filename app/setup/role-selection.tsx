import { Button } from '@/components/ui/Button';
import { saveSetupProgress } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export default function RoleSelectionScreen() {
    const router = useRouter();
    // const router = { push: (path: string) => console.log('Mock push:', path) };
    const [selectedRole, setSelectedRole] = useState<'mechanic' | 'user' | null>(null);

    const handleContinue = async () => {
        if (!selectedRole) return;
        try {
            await saveSetupProgress('role', { role: selectedRole });
            router.push('/setup/basic-info');
        } catch (error) {
            console.error('RoleSelection: Error in handleContinue:', error);
        }
    };

    return (
        <View className="flex-1 bg-white px-8 py-12">
            <View className="mb-12">
                <Text className="text-2xl font-outfit-bold text-[#0F172A] mb-2 text-center">
                    Choose Your Path
                </Text>
                <Text className="text-base font-outfit-medium text-[#0047AB] text-center">
                    Tell us how you'll be using the app
                </Text>
            </View>

            <View className="flex-1 justify-center gap-6">
                {/* Mechanic Option */}
                <Pressable
                    onPress={() => setSelectedRole('mechanic')}
                    className="p-8 rounded-3xl border-2 items-center justify-center"
                    style={{
                        backgroundColor: selectedRole === 'mechanic' ? '#EFF6FF' : '#F8FAFC', // blue-50 : slate-50
                        borderColor: selectedRole === 'mechanic' ? '#2563EB' : '#F1F5F9', // blue-600 : slate-100
                        opacity: selectedRole === 'mechanic' ? 1 : 0.6
                    }}
                >
                    <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${selectedRole === 'mechanic' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                        <Ionicons name="construct" size={32} color={selectedRole === 'mechanic' ? 'white' : '#64748B'} />
                    </View>
                    <Text className={`text-xl font-outfit-bold ${selectedRole === 'mechanic' ? 'text-blue-900' : 'text-slate-500'}`}>
                        I'm a Mechanic
                    </Text>
                    <Text className={`text-sm font-outfit-regular text-center mt-2 ${selectedRole === 'mechanic' ? 'text-blue-700' : 'text-slate-400'}`}>
                        I want to offer my services and help people with their cars
                    </Text>
                </Pressable>

                {/* User Option */}
                <Pressable
                    onPress={() => setSelectedRole('user')}
                    className="p-8 rounded-3xl border-2 items-center justify-center"
                    style={{
                        backgroundColor: selectedRole === 'user' ? '#EFF6FF' : '#F8FAFC',
                        borderColor: selectedRole === 'user' ? '#2563EB' : '#F1F5F9',
                        opacity: selectedRole === 'user' ? 1 : 0.6
                    }}
                >
                    <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${selectedRole === 'user' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                        <Ionicons name="person" size={32} color={selectedRole === 'user' ? 'white' : '#64748B'} />
                    </View>
                    <Text className={`text-xl font-outfit-bold ${selectedRole === 'user' ? 'text-blue-900' : 'text-slate-500'}`}>
                        I'm a User
                    </Text>
                    <Text className={`text-sm font-outfit-regular text-center mt-2 ${selectedRole === 'user' ? 'text-blue-700' : 'text-slate-400'}`}>
                        I need mechanical assistance for my vehicle
                    </Text>
                </Pressable>
            </View>

            <View className="mt-8">
                <Button
                    onPress={handleContinue}
                    disabled={!selectedRole}
                    size="lg"
                    className={`rounded-2xl ${selectedRole ? 'bg-blue-700' : 'bg-slate-200'}`}
                >
                    Continue
                </Button>
            </View>
        </View>
    );
}
