import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveSetupProgress } from '@/lib/storage';
import { MakeType, VEHICLE_COLORS, VEHICLE_DATA, decodeVin } from '@/lib/vehicle';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    color: string;
    plate: string;
    vin: string;
    details: string;
}

export default function VehicleInfoScreen() {
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(true);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [activeModal, setActiveModal] = useState<'make' | 'model' | null>(null);
    const [isVinSearching, setIsVinSearching] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const detailsContainerRef = useRef<View>(null);
    const vinContainerRef = useRef<View>(null);

    const scrollToField = (fieldRef: React.RefObject<View | null>) => {
        if (!fieldRef.current || !scrollViewRef.current) return;

        fieldRef.current.measureLayout(
            scrollViewRef.current as any,
            (_x, y) => scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true }),
            () => { }
        );
    };

    // Form state
    const [formData, setFormData] = useState({
        make: 'Select',
        model: 'Select',
        color: '',
        plate: '',
        vin: '',
        details: ''
    });

    const handleSelectMake = (make: string) => {
        setFormData(prev => ({ ...prev, make, model: 'Select' }));
        setActiveModal(null);
    };

    const handleSelectModel = (model: string) => {
        setFormData(prev => ({ ...prev, model }));
        setActiveModal(null);
    };

    const handleVinLookup = async () => {
        const vin = formData.vin.trim();
        if (vin.length !== 17) {
            Alert.alert('Invalid VIN', 'A VIN must be exactly 17 characters.');
            return;
        }

        setIsVinSearching(true);
        try {
            await decodeVin(
                vin,
                (make, model) => {
                    setFormData(prev => ({
                        ...prev,
                        make,
                        model,
                    }));
                    Alert.alert(
                        'VIN Decoded',
                        `Found: ${make} ${model}`,
                        [{ text: 'OK' }]
                    );
                },
                (errorMsg) => {
                    Alert.alert('VIN Not Found', errorMsg);
                }
            );
        } finally {
            setIsVinSearching(false);
        }
    };

    const handleAddVehicle = () => {
        const newVehicle: Vehicle = {
            id: Date.now().toString(),
            ...formData
        };
        setVehicles(prev => [...prev, newVehicle]);
        setIsAdding(false);
        // Reset form
        setFormData({
            make: 'Select',
            model: 'Select',
            color: '',
            plate: '',
            vin: '',
            details: ''
        });
    };

    const handleContinue = async () => {
        if (isAdding && vehicles.length === 0) {
            // If they haven't added any yet, maybe validate and add the current one
            if (formData.make !== 'Select' && formData.model !== 'Select') {
                handleAddVehicle();
                return;
            }
        }

        await saveSetupProgress('vehicles', vehicles);
        router.push('/setup/success');
    };

    if (!isAdding && vehicles.length > 0) {
        return (
            <View className="flex-1 bg-white px-8 py-12">
                <View className="mb-12">
                    <Text className="text-2xl font-outfit-bold text-[#0F172A] mb-2">
                        Vehicle Info
                    </Text>
                    <Text className="text-base font-outfit-medium text-[#0047AB]">
                        Help us recognize you faster.
                    </Text>
                </View>

                <ScrollView className="flex-1">
                    {vehicles.map((v, index) => (
                        <View
                            key={v.id}
                            className={`flex-row items-center p-5 rounded-2xl mb-4 border-2 ${index === 0 ? 'border-blue-600' : 'border-slate-100 bg-slate-50/50'}`}
                        >
                            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4 border border-slate-100 shadow-sm">
                                {/* Placeholder for brand icon */}
                                {v.make.toLowerCase().includes('toyota') ? (
                                    <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                                        <Text className="text-[10px] font-bold text-blue-600">Logo</Text>
                                    </View>
                                ) : (
                                    <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                                        <Text className="text-[10px] font-bold text-slate-400">Logo</Text>
                                    </View>
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-outfit-bold text-[#0F172A] uppercase">
                                    {v.make} {v.model}
                                </Text>
                                <Text className="text-blue-500 font-outfit-medium text-xs tracking-widest uppercase">
                                    {v.plate}
                                </Text>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => setIsAdding(true)}
                        className="bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center mt-4"
                    >
                        <Text className="text-white font-outfit-bold text-lg">Add vehicle</Text>
                    </TouchableOpacity>
                </ScrollView>

                <View className="mt-8">
                    <Button
                        onPress={handleContinue}
                        size="lg"
                        className="bg-blue-700 rounded-2xl"
                    >
                        Continue
                    </Button>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 bg-white"
                contentContainerStyle={{ padding: 32, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="mb-10">
                    <Text className="text-2xl font-outfit-bold text-[#0F172A] mb-2">
                        Vehicle Info
                    </Text>
                    <Text className="text-base font-outfit-medium text-[#0047AB]">
                        Help us recognize you faster.
                    </Text>
                </View>

                <View className="space-y-6">
                    <View>
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">Vehicle make</Text>
                        <TouchableOpacity
                            onPress={() => setActiveModal('make')}
                            className="bg-blue-50/50 h-12 flex-row items-center justify-between px-4 rounded-xl"
                        >
                            <Text className="text-[#0F172A] font-outfit-regular">{formData.make}</Text>
                            <Ionicons name="chevron-down" size={20} color="#0047AB" />
                        </TouchableOpacity>
                    </View>

                    <View>
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">Vehicle model</Text>
                        <TouchableOpacity
                            onPress={() => formData.make !== 'Select' && setActiveModal('model')}
                            className={`bg-blue-50/50 h-12 flex-row items-center justify-between px-4 rounded-xl ${formData.make === 'Select' ? 'opacity-50' : ''}`}
                        >
                            <Text className="text-[#0F172A] font-outfit-regular">{formData.model}</Text>
                            <Ionicons name="chevron-down" size={20} color="#0047AB" />
                        </TouchableOpacity>
                    </View>

                    <View>
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">Color</Text>
                        <View className="flex-row gap-3">
                            {VEHICLE_COLORS.map((c) => {
                                const isSelected = formData.color === c.name;
                                return (
                                    <TouchableOpacity
                                        key={c.name}
                                        onPress={() => setFormData(p => ({ ...p, color: c.name }))}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            backgroundColor: c.hex,
                                            borderWidth: isSelected ? 3 : 1,
                                            borderColor: isSelected ? '#0047AB' : c.border,
                                        }}
                                    >
                                        {isSelected && (
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Ionicons name="checkmark" size={24} color={c.name === 'White' ? '#0047AB' : '#FFFFFF'} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {formData.color ? (
                            <Text className="text-xs font-outfit-medium text-blue-600 mt-2">{formData.color}</Text>
                        ) : null}
                    </View>

                    <View>
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">License plate #</Text>
                        <Input
                            value={formData.plate}
                            onChangeText={(text) => setFormData(p => ({ ...p, plate: text }))}
                            containerClassName="bg-blue-50/50 border-0 h-12"
                        />
                    </View>

                    <View>
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">VIN #</Text>
                        <View className="flex-row items-center gap-2">
                            <View ref={vinContainerRef} className="flex-1">
                                <Input
                                    value={formData.vin}
                                    onChangeText={(text) => {
                                        if (text.includes('.')) {
                                            setFormData(p => ({ ...p, vin: '5YJ3E1EB9NF000001' }));
                                        } else {
                                            setFormData(p => ({ ...p, vin: text.toUpperCase() }));
                                        }
                                    }}
                                    onFocus={() => scrollToField(vinContainerRef)}
                                    containerClassName="bg-blue-50/50 border-0 h-12"
                                    maxLength={17}
                                    autoCapitalize="characters"
                                    placeholder="Enter 17-character VIN"
                                />
                            </View>
                            <TouchableOpacity
                                onPress={handleVinLookup}
                                disabled={isVinSearching || formData.vin.trim().length !== 17}
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    backgroundColor: formData.vin.trim().length === 17 ? '#0047AB' : '#CBD5E1',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {isVinSearching ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="search" size={22} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text className="text-xs font-outfit-regular text-slate-400 mt-1">
                            Enter VIN and tap search to auto-fill Make & Model
                        </Text>
                    </View>

                    <View ref={detailsContainerRef}>
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">
                            Are there any further details that can better help identify your vehicle?
                        </Text>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={formData.details}
                            onChangeText={(text) => setFormData(p => ({ ...p, details: text }))}
                            onFocus={() => scrollToField(detailsContainerRef)}
                            className="bg-blue-50/50 rounded-xl p-4 font-outfit-regular text-[#0F172A] text-base h-32"
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>
                </View>

                <View className="mt-12">
                    <Button
                        onPress={handleAddVehicle}
                        size="lg"
                        disabled={formData.make === 'Select' || formData.model === 'Select'}
                        className={`rounded-2xl ${formData.make !== 'Select' && formData.model !== 'Select' ? 'bg-blue-700' : 'bg-slate-200'}`}
                    >
                        Continue
                    </Button>
                </View>

                {/* Selection Modal */}
                <Modal
                    visible={!!activeModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setActiveModal(null)}
                >
                    <View className="flex-1 bg-black/40 justify-end">
                        <View className="bg-white rounded-t-3xl min-h-[50%] max-h-[80%] p-6">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-outfit-bold text-[#0F172A]">
                                    Select {activeModal === 'make' ? 'Make' : 'Model'}
                                </Text>
                                <TouchableOpacity onPress={() => setActiveModal(null)}>
                                    <Text className="text-blue-600 font-outfit-bold">Done</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {activeModal === 'make' ? (
                                    Object.keys(VEHICLE_DATA).map(make => (
                                        <TouchableOpacity
                                            key={make}
                                            className="py-4 border-b border-slate-50"
                                            onPress={() => handleSelectMake(make)}
                                        >
                                            <Text className={`text-lg font-outfit-medium ${formData.make === make ? 'text-blue-600' : 'text-[#0F172A]'}`}>
                                                {make}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    formData.make !== 'Select' && (VEHICLE_DATA[formData.make as MakeType] || []).map(model => (
                                        <TouchableOpacity
                                            key={model}
                                            className="py-4 border-b border-slate-50"
                                            onPress={() => handleSelectModel(model)}
                                        >
                                            <Text className={`text-lg font-outfit-medium ${formData.model === model ? 'text-blue-600' : 'text-[#0F172A]'}`}>
                                                {model}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
