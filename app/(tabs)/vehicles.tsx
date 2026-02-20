import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUser } from '@/context/UserContext';
import { vehicleDAO } from '@/lib/dao/VehicleDAO';
import { Vehicle } from '@/lib/dao/interfaces';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const VEHICLE_COLORS = [
    { name: 'White', hex: '#FFFFFF', border: '#D1D5DB' },
    { name: 'Black', hex: '#1F2937', border: '#1F2937' },
    { name: 'Red', hex: '#EF4444', border: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6', border: '#3B82F6' },
    { name: 'Gray', hex: '#9CA3AF', border: '#9CA3AF' },
];

const VEHICLE_DATA = {
    'Toyota': ['Corolla', 'Camry', 'RAV4', 'Prius', 'Tacoma', 'Highlander', '4Runner', 'Sienna'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'Fit', 'HR-V'],
    'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus', 'Fusion', 'Edge', 'Ranger'],
    'Chevrolet': ['Silverado', 'Malibu', 'Equinox', 'Corvette', 'Tahoe', 'Suburban', 'Cruze', 'Camaro'],
    'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Titan', 'Murano', 'Versa', 'Maxima'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'M3', 'M5', 'i3', 'i8'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'CLA', 'GLA', 'A-Class'],
    'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
    'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
    'Volkswagen': ['Jetta', 'Passat', 'Golf', 'Tiguan', 'Atlas', 'Beetle', 'ID.4']
} as const;

type MakeType = keyof typeof VEHICLE_DATA;

export default function VehiclesScreen() {
    const router = useRouter();
    const { user } = useUser();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<'make' | 'model' | null>(null);
    const [isVinSearching, setIsVinSearching] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        make: 'Select',
        model: 'Select',
        color: '',
        plate: '',
        vin: '',
        details: ''
    });

    useEffect(() => {
        if (user?.id) {
            loadVehicles();
        }
    }, [user?.id]);

    // Reset editing state when screen loses/regains focus
    useFocusEffect(
        useCallback(() => {
            return () => {
                // Cleanup on blur: reset to list view
                setIsEditing(false);
                setEditingVehicleId(null);
                setActiveModal(null);
                resetForm();
            };
        }, [])
    );

    // Override header back button based on editing state
    const parentNavigation = useNavigation();
    useEffect(() => {
        parentNavigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => {
                        if (isEditing) {
                            setIsEditing(false);
                            setEditingVehicleId(null);
                            resetForm();
                        } else {
                            router.navigate('/(tabs)');
                        }
                    }}
                    style={{ marginLeft: 16 }}
                >
                    <Ionicons name="chevron-back" size={24} color="#0047AB" />
                </TouchableOpacity>
            ),
        });
    }, [isEditing]);

    const loadVehicles = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const data = await vehicleDAO.getByUser(user.id);
            setVehicles(data);
        } catch (error) {
            console.error('Failed to load vehicles', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectMake = (make: string) => {
        setFormData(prev => ({ ...prev, make, model: 'Select' }));
        setActiveModal(null);
    };

    const handleSelectModel = (model: string) => {
        setFormData(prev => ({ ...prev, model }));
        setActiveModal(null);
    };

    const handleSaveVehicle = async () => {
        if (!user?.id) return;

        try {
            if (editingVehicleId) {
                await vehicleDAO.update(editingVehicleId, formData);
            } else {
                await vehicleDAO.create({
                    id: Date.now().toString(),
                    userId: user.id,
                    ...formData
                });
            }
            setIsEditing(false);
            setEditingVehicleId(null);
            resetForm();
            loadVehicles();
        } catch (error) {
            console.error('Failed to save vehicle', error);
        }
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setFormData({
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
            plate: vehicle.plate,
            vin: vehicle.vin,
            details: vehicle.details
        });
        setEditingVehicleId(vehicle.id);
        setIsEditing(true);
    };

    const handleDeleteVehicle = async (id: string) => {
        try {
            await vehicleDAO.delete(id);
            loadVehicles();
        } catch (error) {
            console.error('Failed to delete vehicle', error);
        }
    };

    const resetForm = () => {
        setFormData({
            make: 'Select',
            model: 'Select',
            color: '',
            plate: '',
            vin: '',
            details: ''
        });
    };

    const handleVinLookup = async () => {
        const vin = formData.vin.trim();
        if (vin.length !== 17) {
            Alert.alert('Invalid VIN', 'A VIN must be exactly 17 characters.');
            return;
        }

        setIsVinSearching(true);
        try {
            const response = await fetch(
                `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
            );
            const data = await response.json();
            const result = data.Results?.[0];

            if (!result || !result.Make) {
                Alert.alert('VIN Not Found', 'Could not decode this VIN. Please check and try again.');
                return;
            }

            const decodedMake = result.Make;
            const decodedModel = result.Model || 'Select';

            setFormData(prev => ({
                ...prev,
                make: decodedMake,
                model: decodedModel,
            }));

            Alert.alert(
                'VIN Decoded',
                `Found: ${decodedMake} ${decodedModel}`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('VIN lookup failed:', error);
            Alert.alert('Lookup Failed', 'Could not reach the VIN database. Please try again later.');
        } finally {
            setIsVinSearching(false);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#0047AB" />
            </View>
        );
    }

    if (isEditing) {
        return (
            <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-outfit-bold text-[#0F172A]">
                        {editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}
                    </Text>
                    <TouchableOpacity onPress={() => { setIsEditing(false); resetForm(); }}>
                        <Text className="text-blue-600 font-outfit-bold">Cancel</Text>
                    </TouchableOpacity>
                </View>

                <View className="space-y-4">
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
                            <View className="flex-1">
                                <Input
                                    value={formData.vin}
                                    onChangeText={(text) => setFormData(p => ({ ...p, vin: text.toUpperCase() }))}
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

                    <View>
                        <Text className="font-outfit-medium text-[#0F172A] mb-2">Further details</Text>
                        <TextInput
                            multiline
                            numberOfLines={3}
                            value={formData.details}
                            onChangeText={(text) => setFormData(p => ({ ...p, details: text }))}
                            className="bg-blue-50/50 rounded-xl p-4 font-outfit-regular text-[#0F172A] text-base h-24"
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>

                    <Button
                        onPress={handleSaveVehicle}
                        size="lg"
                        disabled={formData.make === 'Select' || formData.model === 'Select'}
                        className={`rounded-2xl mt-4 ${formData.make !== 'Select' && formData.model !== 'Select' ? 'bg-blue-700' : 'bg-slate-200'}`}
                    >
                        Save Vehicle
                    </Button>
                </View>

                {/* Selection Modal */}
                <Modal visible={!!activeModal} transparent animationType="slide">
                    <View className="flex-1 bg-black/40 justify-end">
                        <View className="bg-white rounded-t-3xl min-h-[50%] max-h-[80%] p-6">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-outfit-bold text-[#0F172A]">Select {activeModal === 'make' ? 'Make' : 'Model'}</Text>
                                <TouchableOpacity onPress={() => setActiveModal(null)}><Text className="text-blue-600 font-outfit-bold">Done</Text></TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {activeModal === 'make' ? (
                                    Object.keys(VEHICLE_DATA).map(make => (
                                        <TouchableOpacity key={make} className="py-4 border-b border-slate-50" onPress={() => handleSelectMake(make)}>
                                            <Text className={`text-lg font-outfit-medium ${formData.make === make ? 'text-blue-600' : 'text-[#0F172A]'}`}>{make}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    formData.make !== 'Select' && (VEHICLE_DATA[formData.make as MakeType] || []).map(model => (
                                        <TouchableOpacity key={model} className="py-4 border-b border-slate-50" onPress={() => handleSelectModel(model)}>
                                            <Text className={`text-lg font-outfit-medium ${formData.model === model ? 'text-blue-600' : 'text-[#0F172A]'}`}>{model}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        );
    }

    return (
        <View className="flex-1 bg-white px-6 py-8">
            <View className="flex-row justify-between items-center mb-8">
                <View>
                    <Text className="text-2xl font-outfit-bold text-[#0F172A] mb-1">My Vehicles</Text>
                    <Text className="text-slate-500 font-outfit-regular">Manage your registered vehicles</Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditing(true)} className="bg-blue-50 p-3 rounded-full">
                    <Ionicons name="add" size={24} color="#0047AB" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {vehicles.length === 0 ? (
                    <View className="items-center justify-center pt-20">
                        <Text className="text-slate-400 font-outfit-medium text-lg mb-4">No vehicles registered</Text>
                        <Button onPress={() => setIsEditing(true)} className="bg-blue-700 rounded-xl px-12">Add First Vehicle</Button>
                    </View>
                ) : (
                    vehicles.map((v) => (
                        <TouchableOpacity
                            key={v.id}
                            onPress={() => handleEditVehicle(v)}
                            className="bg-slate-50 rounded-2xl p-5 mb-4 border border-slate-100 flex-row items-center"
                        >
                            <View className="flex-1">
                                <Text className="text-lg font-outfit-bold text-[#0F172A] uppercase">{v.make} {v.model}</Text>
                                <Text className="text-blue-600 font-outfit-medium text-xs tracking-widest uppercase mt-1">{v.plate || 'No Plate'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteVehicle(v.id)} className="p-2">
                                <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ opacity: 0.6 }} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
