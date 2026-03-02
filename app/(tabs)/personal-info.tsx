import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUser } from '@/context/UserContext';
import { US_STATES, normalizeStreet } from '@/lib/address';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, CheckCircle2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { user, isLoading, updateUser } = useUser();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        surname: user?.surname || '',
        email: user?.email || '',
        phone: formatPhoneNumber(user?.phone || ''),
        dob: user?.dob || '',
        profileImage: user?.profileImage,
        address: {
            street: user?.address?.street || '',
            apartment: user?.address?.apartment || '',
            city: user?.address?.city || '',
            state: user?.address?.state || '',
            zip: user?.address?.zip || ''
        }
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                surname: user.surname,
                email: user.email,
                phone: formatPhoneNumber(user.phone),
                dob: user.dob,
                profileImage: user.profileImage,
                address: {
                    street: user.address?.street || '',
                    apartment: user.address?.apartment || '',
                    city: user.address?.city || '',
                    state: user.address?.state || '',
                    zip: user.address?.zip || ''
                }
            });
        }
    }, [user]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setFormData({ ...formData, profileImage: imageUri });
        }
    };

    const handleUpdate = async () => {
        await updateUser(formData);
        setShowSuccessModal(true);
    };

    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setSearchSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            // Bias the search with ", FL" and increase limit to get more candidates for local filtering
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query + ", FL")}&limit=10&lang=en`);
            const data = await response.json();

            // Filter results to only include Florida
            const flResults = (data.features || []).filter((f: any) => {
                const state = f.properties?.state?.toLowerCase();
                return state === 'florida' || state === 'fl';
            });

            setSearchSuggestions(flResults.slice(0, 5)); // Show top 5 FL results
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };


    const getFormattedAddress = (feature: any) => {
        const { properties } = feature;
        const houseNumber = properties.housenumber || '';
        const streetPart = properties.street || properties.name || '';
        const city = properties.city || '';
        const stateName = properties.state || '';
        const zip = properties.postcode || '';

        const normalizedStreet = normalizeStreet(streetPart);
        const street = `${houseNumber} ${normalizedStreet}`.trim();

        // Try shortened state
        const stateMapping = US_STATES.find(s =>
            s.name.toLowerCase() === stateName.toLowerCase() ||
            s.code.toLowerCase() === stateName.toLowerCase()
        );
        const stateCode = stateMapping?.code || stateName;

        return `${street}, ${city}, ${stateCode} ${zip}`.replace(/,\s*$/, '');
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
            address: {
                street: `${houseNumber} ${normalizedStreet}`.trim(),
                apartment: formData.address.apartment,
                city: city,
                state: stateMapping?.code || formData.address.state,
                zip: zip.slice(0, 5)
            }
        });
        setSearchSuggestions([]);
    };

    function formatPhoneNumber(text: string) {
        if (!text) return '';
        const cleaned = text.replace(/\D/g, '');
        // If it starts with 1 (country code), remove it for local formatting
        const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[2]}) ${match[3]}-${match[4]}`;
        }
        return text;
    }

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login' as any);
        }
    }, [isLoading, user]);

    if (isLoading || !user) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#0047AB" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-6">
            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">Personal information</Text>
                <Text className="text-blue-500 font-outfit-regular">Complete your information</Text>
            </View>

            {/* Profile Image Section */}
            <View className="items-center mb-8">
                <TouchableOpacity onPress={pickImage} className="relative">
                    <View className="w-24 h-24 bg-gray-100 rounded-full justify-center items-center border border-gray-200 overflow-hidden">
                        {formData.profileImage ? (
                            <Image source={{ uri: formData.profileImage }} className="w-full h-full" />
                        ) : (
                            <Camera size={32} color="#D1D5DB" />
                        )}
                    </View>
                    <View className="absolute bottom-0 right-0 bg-blue-100 p-1.5 rounded-full border border-white">
                        <Text className="text-xs">✏️</Text>
                    </View>
                </TouchableOpacity>
                <Text className="text-gray-500 font-outfit-regular mt-2 text-xs">Tap to change photo</Text>
            </View>

            <View className="gap-4 mb-8">
                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">Name</Text>
                    <Input
                        value={formData.name}
                        onChangeText={(t) => setFormData({ ...formData, name: t })}
                        containerClassName="bg-blue-50/50 border-blue-100"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">Surname</Text>
                    <Input
                        value={formData.surname}
                        onChangeText={(t) => setFormData({ ...formData, surname: t })}
                        containerClassName="bg-blue-50/50 border-blue-100"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">email</Text>
                    <Input
                        value={formData.email}
                        onChangeText={(t) => setFormData({ ...formData, email: t })}
                        containerClassName="bg-blue-50/50 border-blue-100"
                        keyboardType="email-address"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">Phone number</Text>
                    <Input
                        value={formData.phone}
                        editable={false}
                        containerClassName="bg-gray-100 border-gray-200 text-gray-500"
                    />
                </View>

                <View>
                    <Text className="font-outfit-medium mb-2 text-gray-900">Date of birth</Text>
                    <Input
                        value={formData.dob}
                        onChangeText={(t) => setFormData({ ...formData, dob: t })}
                        containerClassName="bg-blue-50/50 border-blue-100"
                    />
                </View>

                {/* Address Section */}
                <View className="mt-4">
                    <Text className="text-lg font-outfit-bold text-blue-900 mb-4">Address Information</Text>

                    <View className="mb-4 relative z-50">
                        <Text className="font-outfit-medium mb-2 text-gray-900">Street</Text>
                        <Input
                            value={formData.address.street}
                            onChangeText={(t) => {
                                setFormData({ ...formData, address: { ...formData.address, street: t } });
                                searchAddress(t);
                            }}
                            containerClassName="bg-blue-50/50 border-blue-100"
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

                    <View className="mb-4">
                        <Text className="font-outfit-medium mb-2 text-gray-900">Apartment / Suite</Text>
                        <Input
                            value={formData.address.apartment}
                            onChangeText={(t) => setFormData({ ...formData, address: { ...formData.address, apartment: t } })}
                            containerClassName="bg-blue-50/50 border-blue-100"
                        />
                    </View>

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="font-outfit-medium mb-2 text-gray-900">City</Text>
                            <Input
                                value={formData.address.city}
                                onChangeText={(t) => setFormData({ ...formData, address: { ...formData.address, city: t } })}
                                containerClassName="bg-blue-50/50 border-blue-100"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="font-outfit-medium mb-2 text-gray-900">State</Text>
                            <TouchableOpacity
                                onPress={() => setShowStateModal(true)}
                                className="bg-blue-50/50 border border-blue-100 rounded-xl h-[52px] justify-center px-4"
                            >
                                <Text className={`font-outfit-medium ${formData.address.state ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {formData.address.state || 'FL'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text className="font-outfit-medium mb-2 text-gray-900">Zip Code</Text>
                        <Input
                            value={formData.address.zip}
                            onChangeText={(t) => {
                                const cleaned = t.replace(/\D/g, '').slice(0, 5);
                                setFormData({ ...formData, address: { ...formData.address, zip: cleaned } });
                            }}
                            containerClassName="bg-blue-50/50 border-blue-100"
                            keyboardType="numeric"
                            maxLength={5}
                            placeholder="33139"
                        />
                    </View>
                </View>
            </View>

            <Button size="lg" className="mb-10" onPress={handleUpdate}>
                Update Profile
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
                                    className={`px-6 py-4 border-b border-gray-50 flex-row justify-between items-center ${formData.address.state === item.code ? 'bg-blue-50' : ''}`}
                                    onPress={() => {
                                        setFormData({ ...formData, address: { ...formData.address, state: item.code } });
                                        setShowStateModal(false);
                                    }}
                                >
                                    <Text className={`text-base font-outfit-medium ${formData.address.state === item.code ? 'text-blue-900' : 'text-gray-800'}`}>
                                        {item.name}
                                    </Text>
                                    <Text className="text-sm font-outfit-bold text-blue-600">{item.code}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-2xl p-8 items-center">
                        <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
                            <CheckCircle2 size={48} color="#0047AB" />
                        </View>
                        <Text className="text-xl font-outfit-bold text-blue-900 mb-2 text-center">
                            Success!
                        </Text>
                        <Text className="text-gray-500 font-outfit-regular text-center mb-8">
                            Information was updated
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowSuccessModal(false)}
                            className="bg-blue-700 w-full py-4 rounded-xl items-center"
                        >
                            <Text className="text-white font-outfit-bold text-lg">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
