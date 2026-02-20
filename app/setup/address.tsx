import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { US_STATES, getFormattedAddress, normalizeStreet } from '@/lib/address';
import { getSetupProgress, saveSetupProgress } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function AddressScreen() {
    const router = useRouter();
    const [addressType, setAddressType] = useState<'home' | 'work'>('home');
    const [showStateModal, setShowStateModal] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [formData, setFormData] = useState({
        street: '',
        apartment: '',
        city: '',
        state: '',
        zip: ''
    });

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setSearchSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`);
            const data = await response.json();
            setSearchSuggestions(data.features || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectAddress = (feature: any) => {
        const { properties } = feature;
        const houseNumber = properties.housenumber || '';
        const streetPart = properties.street || properties.name || '';
        const city = properties.city || '';
        const stateName = properties.state || '';
        const zip = properties.postcode || '';

        const normalizedStreet = normalizeStreet(streetPart);

        // Try to map state name to 2-letter code
        const stateMapping = US_STATES.find(s =>
            s.name.toLowerCase() === stateName.toLowerCase() ||
            s.code.toLowerCase() === stateName.toLowerCase()
        );

        setFormData({
            ...formData,
            street: `${houseNumber} ${normalizedStreet}`.trim(),
            city: city,
            state: stateMapping?.code || formData.state,
            zip: zip.slice(0, 5)
        });
        setSearchSuggestions([]);
    };

    const handleContinue = async () => {
        // Save address
        await saveSetupProgress('address', { type: addressType, ...formData });

        // Check role to decide next step
        const progress = await getSetupProgress();
        const role = progress.role?.role;

        if (role === 'user') {
            router.push('/setup/dealer-info');
        } else {
            router.push('/setup/credentials');
        }
    };

    return (
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            {/* Header Skip Action (Placeholder - if layout allows custom header actions here, otherwise standard header) */}

            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-[#0F172A] mb-1">Your address</Text>
                <Text className="text-[#0047AB] font-outfit-medium text-base">Set your address now to receive quicker assistance later.</Text>
            </View>

            {/* Toggle */}
            <View className="flex-row mb-8">
                <TouchableOpacity
                    onPress={() => setAddressType('home')}
                    className={`flex-1 py-3 border rounded-l-xl justify-center items-center ${addressType === 'home' ? 'bg-white border-[#0047AB]' : 'bg-gray-50 border-gray-200'}`}
                >
                    <Text className={`font-outfit-medium ${addressType === 'home' ? 'text-[#0F172A]' : 'text-gray-500'}`}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setAddressType('work')}
                    className={`flex-1 py-3 border rounded-r-xl justify-center items-center ${addressType === 'work' ? 'bg-white border-[#0047AB]' : 'bg-gray-50 border-gray-200'}`}
                >
                    <Text className={`font-outfit-medium ${addressType === 'work' ? 'text-[#0F172A]' : 'text-gray-500'}`}>Work</Text>
                </TouchableOpacity>
            </View>

            <View className="space-y-4 mb-4">
                <View className="relative z-50">
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">Street / Number</Text>
                    <Input
                        value={formData.street}
                        onChangeText={(text) => {
                            handleChange('street', text);
                            searchAddress(text);
                        }}
                        containerClassName="bg-blue-50/50 border-0 h-12"
                        placeholder="Enter street address"
                    />
                    {isSearching && (
                        <ActivityIndicator size="small" color="#0047AB" className="absolute right-4 top-10" />
                    )}

                    {searchSuggestions.length > 0 && (
                        <View className="absolute top-[80px] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                            {searchSuggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={index}
                                    className="px-4 py-3 border-b border-gray-50 flex-col"
                                    onPress={() => handleSelectAddress(suggestion)}
                                >
                                    <Text className="font-outfit-medium text-gray-900 text-sm" numberOfLines={1}>
                                        {getFormattedAddress(suggestion)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">Apartment, suite, unit, building, etc.</Text>
                    <Input
                        value={formData.apartment}
                        onChangeText={(text) => handleChange('apartment', text)}
                        containerClassName="bg-blue-50/50 border-0 h-12"
                    />
                </View>

                <View className="flex-row gap-4">
                    <View className="flex-1">
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">City</Text>
                        <Input
                            value={formData.city}
                            onChangeText={(text) => handleChange('city', text)}
                            containerClassName="bg-blue-50/50 border-0 h-12"
                        />
                    </View>

                    <View className="flex-1">
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">State</Text>
                        <TouchableOpacity
                            onPress={() => setShowStateModal(true)}
                            className="bg-blue-50/50 rounded-xl h-12 justify-center px-4"
                        >
                            <Text className={`font-outfit-medium ${formData.state ? 'text-[#0F172A]' : 'text-gray-400'}`}>
                                {formData.state || 'Select'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View>
                    <Text className="font-outfit-medium text-[#0F172A] mb-2">Zip</Text>
                    <Input
                        value={formData.zip}
                        onChangeText={(text) => {
                            const cleaned = text.replace(/\D/g, '').slice(0, 5);
                            handleChange('zip', cleaned);
                        }}
                        containerClassName="bg-blue-50/50 border-0 h-12"
                        keyboardType="numeric"
                        maxLength={5}
                    />
                </View>
            </View>

            <Button
                onPress={handleContinue}
                size="lg"
                className="bg-blue-700 rounded-xl mt-4 mb-10"
            >
                Continue
            </Button>

            {/* State Selection Modal */}
            <Modal
                visible={showStateModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowStateModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl h-2/3">
                        <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="text-xl font-outfit-bold text-blue-900">Select State</Text>
                            <TouchableOpacity onPress={() => setShowStateModal(false)}>
                                <Text className="text-blue-600 font-outfit-bold">Done</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={US_STATES}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`px-6 py-4 border-b border-gray-50 flex-row justify-between items-center ${formData.state === item.code ? 'bg-blue-50' : ''}`}
                                    onPress={() => {
                                        handleChange('state', item.code);
                                        setShowStateModal(false);
                                    }}
                                >
                                    <Text className={`text-base font-outfit-medium ${formData.state === item.code ? 'text-blue-900' : 'text-gray-800'}`}>
                                        {item.name}
                                    </Text>
                                    <Text className="text-sm font-outfit-bold text-blue-600">{item.code}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
