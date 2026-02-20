import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PaymentsScreen() {
    const [method, setMethod] = useState<'bank' | 'paypal' | 'gpay' | 'apple'>('bank');

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-6">
            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">Bank account / payments</Text>
                <Text className="text-blue-500 font-outfit-regular">Account to receive payments, Select preferred payment method</Text>
            </View>

            <Text className="font-outfit-medium mb-3 text-gray-900">Collection method</Text>

            <View className="flex-row flex-wrap gap-3 mb-6">
                <TouchableOpacity
                    onPress={() => setMethod('bank')}
                    className={`flex-1 min-w-[45%] h-12 flex-row items-center justify-center rounded-lg border ${method === 'bank' ? 'border-gray-800 bg-white' : 'border-gray-200 bg-gray-50'}`}
                >
                    <Building2 size={20} color="black" style={{ marginRight: 8 }} />
                    <Text className="font-outfit-medium">Bank Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setMethod('paypal')}
                    className={`flex-1 min-w-[45%] h-12 flex-row items-center justify-center rounded-lg border ${method === 'paypal' ? 'border-gray-800 bg-white' : 'border-gray-200 bg-gray-50'}`}
                >
                    {/* Placeholder for logos */}
                    <Text className="font-outfit-bold text-blue-800 italic">PayPal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setMethod('gpay')}
                    className={`flex-1 min-w-[45%] h-12 flex-row items-center justify-center rounded-lg border ${method === 'gpay' ? 'border-gray-800 bg-white' : 'border-gray-200 bg-gray-50'}`}
                >
                    <Text className="font-outfit-medium text-gray-600">G Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setMethod('apple')}
                    className={`flex-1 min-w-[45%] h-12 flex-row items-center justify-center rounded-lg border ${method === 'apple' ? 'border-gray-800 bg-white' : 'border-gray-200 bg-gray-50'}`}
                >
                    <Text className="font-outfit-medium text-black"> Pay</Text>
                </TouchableOpacity>
            </View>

            <View className="gap-4 mb-8">
                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">Account name</Text>
                    <Input
                        containerClassName="bg-blue-50/50 border-blue-100"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">Account number</Text>
                    <Input
                        containerClassName="bg-blue-50/50 border-blue-100"
                        keyboardType="numeric"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">Routing #</Text>
                    <Input
                        containerClassName="bg-blue-50/50 border-blue-100"
                        keyboardType="numeric"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">Checking acc.</Text>
                    <Input
                        containerClassName="bg-blue-50/50 border-blue-100"
                    />
                </View>
            </View>

            <Button size="lg" className="mb-10">
                Save
            </Button>
        </ScrollView>
    );
}
