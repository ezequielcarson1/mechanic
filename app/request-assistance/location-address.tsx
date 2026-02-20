import { Input } from '@/components/ui/Input';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

export default function LocationAddressScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchAddress = async (text: string) => {
        setQuery(text);
        if (text.length < 3) return;

        setIsSearching(true);
        try {
            // Using Photon API directly as in previous tasks
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
            const data = await response.json();
            setResults(data.features || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = (feature: any) => {
        const { geometry, properties } = feature;
        const [lon, lat] = geometry.coordinates;

        // Include city and postcode in label for better display and parsing
        const addressLabel = `${properties.name || properties.street || ''}, ${properties.city || ''} ${properties.postcode || ''}`.trim();

        // Pass back to map
        router.push({
            pathname: '/request-assistance/location-map',
            params: {
                ...params,
                selectedAddress: JSON.stringify({
                    label: addressLabel,
                    lat,
                    lon,
                    zip: properties.postcode || '',
                    full: feature,
                })
            }
        });
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-xl font-outfit-bold text-[#0F172A] flex-1 text-center mr-8">
                    Set Address
                </Text>
            </View>

            <View className="p-6">
                <Input
                    value={query}
                    onChangeText={searchAddress}
                    placeholder="Search for address"
                    containerClassName="bg-gray-50 border-gray-200 mb-4"
                    autoFocus
                />

                {isSearching && <ActivityIndicator color="#0047AB" />}

                <FlatList
                    data={results}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => {
                        const props = item.properties;
                        const mainText = props.name || props.street || '';
                        const subText = `${props.city || ''}, ${props.state || ''} ${props.postcode || ''}`;

                        return (
                            <TouchableOpacity
                                onPress={() => handleSelect(item)}
                                className="flex-row items-center py-4 border-b border-gray-50"
                            >
                                <View className="w-10 h-10 bg-blue-50 rounded-full justify-center items-center mr-4">
                                    <MapPin size={20} color="#0047AB" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-outfit-bold text-gray-900">{mainText}</Text>
                                    <Text className="font-outfit-regular text-gray-500 text-xs">{subText}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
    );
}
