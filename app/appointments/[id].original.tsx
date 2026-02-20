import { useAppointments } from '@/context/AppointmentsContext';
import { useUser } from '@/context/UserContext';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import {
    Camera,
    CheckCircle2,
    ChevronLeft,
    MapPin,
    MessageSquare,
    Phone,
    Star,
    Video,
    Wrench,
    X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { UserBudgetTab } from '../../components/appointments/UserBudgetTab';
import { UserMechanicInfoTab } from '../../components/appointments/UserMechanicInfoTab';
import { UserStatusTab } from '../../components/appointments/UserStatusTab';
import { UserTrackingTab } from '../../components/appointments/UserTrackingTab';

const { width } = Dimensions.get('window');

type TabType = 'info' | 'client' | 'status' | 'budget';

export default function AppointmentDetailScreen() {
    const { id } = useGlobalSearchParams();
    const router = useRouter();
    const { getAppointmentById, updateAppointment } = useAppointments();

    const appointment = getAppointmentById(Array.isArray(id) ? id[0] : id || '');

    const { user } = useUser();
    const isUserRole = user?.role === 'user';

    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCanceledFeedback, setIsCanceledFeedback] = useState(false);

    // Consistent state for ClientTab (Mechanic View)
    const [rating, setRating] = useState(appointment?.clientReview?.rating || 0);
    const [selectedOptions, setSelectedOptions] = useState<string[]>(appointment?.clientReview?.experienceTags || []);
    const [reviewText, setReviewText] = useState(appointment?.clientReview?.review || '');
    const [isReviewSubmitted, setIsReviewSubmitted] = useState(appointment?.isReviewSubmitted || false);

    // Consistent state for Status Updates (Mechanic View)
    const [statusUpdate, setStatusUpdate] = useState(appointment?.currentStatus || '');
    const [isStatusUpdated, setIsStatusUpdated] = useState(appointment?.isStatusUpdated || false);
    const [additionalAmount, setAdditionalAmount] = useState('');
    const [additionalType, setAdditionalType] = useState(appointment?.additionalFunds?.[0]?.type || '');
    const [additionalDetails, setAdditionalDetails] = useState(appointment?.additionalFunds?.[0]?.details || '');

    // Debounced update implementation for preservation
    const timerRef = useRef<any>(null);
    const debouncedUpdate = useCallback(
        (updates: Partial<any>) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                if (appointment) {
                    updateAppointment(appointment.id, updates);
                }
            }, 1000);
        },
        [appointment?.id]
    );

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Sync client review state to context for persistence
    useEffect(() => {
        if (appointment && !isReviewSubmitted && !isUserRole) {
            debouncedUpdate({
                clientReview: {
                    rating,
                    review: reviewText,
                    experienceTags: selectedOptions
                }
            });
        }
    }, [rating, selectedOptions, reviewText]);

    // Sync status state to context
    useEffect(() => {
        if (appointment && !isUserRole) {
            debouncedUpdate({
                currentStatus: statusUpdate,
                additionalFunds: [{
                    amount: additionalAmount,
                    type: additionalType,
                    details: additionalDetails,
                    status: 'pending'
                }]
            });
        }
    }, [additionalAmount, additionalType, additionalDetails, statusUpdate]);

    if (!appointment) {
        return (
            <View className="flex-1 bg-white justify-center items-center p-6">
                <Text className="font-outfit-bold text-lg text-gray-900">Appointment not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text className="text-blue-600 font-outfit-medium">Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const tabs: { key: TabType; label: string }[] = useMemo(() => isUserRole
        ? [
            { key: 'info', label: 'Assistance info' },
            { key: 'client', label: 'Mechanic info' },
            { key: 'status', label: 'Assist status' },
            { key: 'budget', label: 'Budget' },
        ]
        : [
            { key: 'info', label: 'Assistance info' },
            { key: 'client', label: 'Client info' },
            { key: 'status', label: 'Assist status' },
            { key: 'budget', label: 'Budget' },
        ], [isUserRole]);

    const renderTabContent = () => {
        if (isUserRole) {
            switch (activeTab) {
                case 'info':
                    return <UserTrackingTab onCancel={() => setShowCancelModal(true)} />;
                case 'client':
                    return <UserMechanicInfoTab />;
                case 'status':
                    return <UserStatusTab appointment={appointment} />;
                case 'budget':
                    return <UserBudgetTab appointment={appointment} />;
                default:
                    return null;
            }
        }

        switch (activeTab) {
            case 'info':
                return <InfoTab appointment={appointment} onScanComplete={() => setActiveTab('status')} />;
            case 'client':
                return (
                    <ClientTab
                        appointment={appointment}
                        rating={rating}
                        setRating={setRating}
                        selectedOptions={selectedOptions}
                        setSelectedOptions={setSelectedOptions}
                        reviewText={reviewText}
                        setReviewText={setReviewText}
                        isSubmitted={isReviewSubmitted}
                        setIsSubmitted={(val: boolean) => {
                            setIsReviewSubmitted(val);
                            updateAppointment(appointment.id, {
                                isReviewSubmitted: val,
                                clientReview: {
                                    rating,
                                    review: reviewText,
                                    experienceTags: selectedOptions
                                }
                            });
                        }}
                    />
                );
            case 'status':
                return (
                    <StatusTab
                        appointment={appointment}
                        statusUpdate={statusUpdate}
                        setStatusUpdate={setStatusUpdate}
                        isStatusUpdated={isStatusUpdated}
                        setIsStatusUpdated={(val: boolean) => {
                            setIsStatusUpdated(val);
                            updateAppointment(appointment.id, { isStatusUpdated: val });
                        }}
                        additionalAmount={additionalAmount}
                        setAdditionalAmount={setAdditionalAmount}
                        additionalType={additionalType}
                        setAdditionalType={setAdditionalType}
                        additionalDetails={additionalDetails}
                        setAdditionalDetails={setAdditionalDetails}
                        onUpdate={() => {
                            if (statusUpdate === 'Assistance completed') {
                                setActiveTab('budget');
                            }
                        }}
                    />
                );
            case 'budget':
                return (
                    <BudgetTab
                        appointment={appointment}
                        onAskPayment={() => setShowSuccess(true)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-white" testID="appointment-detail-root" nativeID="appointment-detail-root">
            {isCanceledFeedback ? (
                <CancellationFeedbackScreen onDone={() => router.navigate('/(tabs)/appointments')} />
            ) : (
                <View className="flex-1">
                    {/* Header */}
                    <View className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex-row items-center justify-between" testID="detail-header" nativeID="detail-header">
                        <TouchableOpacity onPress={() => router.back()} testID="back-button">
                            <ChevronLeft size={24} color="#0047AB" />
                        </TouchableOpacity>
                        <Text className="font-outfit-bold text-lg text-blue-900" testID="header-title" nativeID="header-title">Assist</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView className="flex-1">
                        {/* Title Section */}
                        <View className="px-6 py-4">
                            <Text className="font-outfit-bold text-blue-900 text-lg">Assistance accepted</Text>
                            <Text className="text-gray-400 text-xs">ID:#{appointment.id.slice(0, 8)}...</Text>
                        </View>

                        {/* Status Bar */}
                        <View className="px-6 mb-6" testID="status-bar-container" nativeID="status-bar-container">
                            <View
                                className="border border-green-100 rounded-lg p-3 items-center"
                                style={{ backgroundColor: '#F0FDF4' }}
                                testID="status-badge"
                                nativeID="status-badge"
                            >
                                <Text className="text-emerald-500 font-outfit-bold text-xs" testID="status-label">STATUS</Text>
                                <Text className="text-emerald-600 font-outfit-bold text-sm uppercase" testID="status-value">ACCEPTED</Text>
                                <Text className="text-emerald-600 text-[10px]" testID="status-description">On trip to your location</Text>
                            </View>
                        </View>

                        {/* Tab Navigation */}
                        <View className="px-6 mb-4" testID="tab-navigation-container" nativeID="tab-navigation-container">
                            <View className="flex-row flex-wrap gap-2">
                                {tabs.map((tab) => (
                                    <TouchableOpacity
                                        key={tab.key}
                                        testID={`tab-button-${tab.key}`}
                                        className={`px-4 py-3 rounded-xl border flex-1 min-w-[45%] items-center ${activeTab === tab.key
                                            ? 'bg-white border-blue-900 border-2'
                                            : 'bg-white border-gray-100 shadow-sm'
                                            }`}
                                        onPress={() => setActiveTab(tab.key)}
                                    >
                                        <Text className={`font-outfit-bold text-xs ${activeTab === tab.key ? 'text-blue-900' : 'text-gray-900'
                                            }`}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Content Container */}
                        <View className="px-6 pb-10">
                            <View className={`rounded-t-2xl flex-row items-center px-5 py-4 gap-3 ${appointment.type === 'videocall' ? 'bg-cyan-600' : 'bg-blue-600'}`} testID="type-header">
                                <View className="bg-white/30 p-2 rounded-full">
                                    {appointment.type === 'videocall' ? (
                                        <Video size={18} color="white" />
                                    ) : (
                                        <Wrench size={18} color="white" />
                                    )}
                                </View>
                                <Text className="text-white font-outfit-bold text-base">
                                    {appointment.type === 'videocall' ? 'Video Call Assistance' : appointment.type === 'immediate' ? 'Immediate Assistance' : 'Scheduled Assistance'}
                                </Text>
                            </View>

                            <View
                                className="bg-gray-50/50 border-x border-b border-gray-100 rounded-b-2xl p-6"
                                testID="tab-content-container"
                                nativeID="tab-content-container"
                            >
                                {renderTabContent()}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* Success Overlay */}
            <SuccessModal
                visible={showSuccess}
                onClose={() => {
                    setShowSuccess(false);
                    router.navigate('/(tabs)/appointments');
                }}
            />

            {/* Cancellation Overlay */}
            <CancellationModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={() => {
                    setShowCancelModal(false);
                    setIsCanceledFeedback(true);
                }}
            />
        </View>
    );
}

// --- Sub-components (Mechanic View) ---

function InfoTab({ appointment, onScanComplete }: { appointment: any, onScanComplete: () => void }) {
    return (
        <View className="gap-5" testID="info-tab-content">
            <View>
                <Text className="font-outfit-bold text-gray-900 text-lg">Assistance:</Text>
                <Text className="font-outfit-regular text-gray-500 text-base">Flat tire replacement.</Text>
            </View>
            <View>
                <Text className="font-outfit-bold text-gray-900 text-lg">Time since accepted:</Text>
                <Text className="font-outfit-regular text-gray-500 text-base">02:30'</Text>
            </View>
            <View>
                <Text className="font-outfit-bold text-gray-900 text-lg">Car:</Text>
                <Text className="font-outfit-regular text-gray-500 text-base">Toyota Camry.</Text>
            </View>
            <View>
                <Text className="font-outfit-bold text-gray-900 text-lg">Notes:</Text>
                <Text className="font-outfit-regular text-gray-500 text-base">Car stopped beside the avenue.</Text>
            </View>
            <View>
                <Text className="font-outfit-bold text-gray-900 text-lg">Client:</Text>
                <Text className="font-outfit-regular text-gray-500 text-base">Edward Milton</Text>
            </View>
            <View>
                <Text className="font-outfit-bold text-gray-900 text-lg">Address:</Text>
                <Text className="font-outfit-regular text-gray-500 text-base">1245 Collins Av, Miami Beach, 33345.</Text>
            </View>

            <View className="h-44 bg-blue-50/30 rounded-2xl relative overflow-hidden mt-2" testID="map-container">
                <Image
                    source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=25.7907,-80.1300&zoom=15&size=600x400&markers=color:blue%7Clabel:S%7C25.7907,-80.1300&key=YOUR_API_KEY' }}
                    className="w-full h-full opacity-60"
                />
                <View className="absolute top-1/2 left-1/2 transform -translate-x-5 -translate-y-5">
                    <MapPin size={40} color="#3B82F6" fill="#BFDBFE" />
                </View>
            </View>

            <View className="mt-8 items-center">
                <Text className="font-outfit-bold text-gray-900 mb-6 text-lg">When you arrive on-site:</Text>
                <TouchableOpacity
                    onPress={onScanComplete}
                    className="bg-blue-600 w-full py-4 rounded-xl flex-row items-center justify-center gap-3 shadow-md"
                    style={{ backgroundColor: '#1E40AF' }}
                >
                    <Camera size={24} color="white" />
                    <Text className="text-white font-outfit-bold text-xl">Scan QR</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ClientTab({
    appointment,
    rating,
    setRating,
    selectedOptions,
    setSelectedOptions,
    reviewText,
    setReviewText,
    isSubmitted,
    setIsSubmitted
}: any) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const options = [
        { id: 'resolved', label: 'Issue was fully resolved' },
        { id: 'saved-time', label: 'Saved me time' },
        { id: 'professional', label: 'Client was professional' }
    ];

    const toggleOption = (id: string) => {
        if (selectedOptions.includes(id)) {
            setSelectedOptions(selectedOptions.filter((item: string) => item !== id));
        } else {
            setSelectedOptions([...selectedOptions, id]);
        }
    };

    return (
        <View className="gap-6" testID="client-tab-content">
            <View className="flex-row items-center gap-4">
                <Image source={{ uri: 'https://i.pravatar.cc/150?u=edward' }} className="w-20 h-20 rounded-full" />
                <View>
                    <Text className="font-outfit-bold text-gray-900 text-lg">Client:</Text>
                    <Text className="font-outfit-bold text-blue-900 text-xl">Edward Milton.</Text>
                    <View className="flex-row items-center mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={14} color="#3B82F6" fill={s <= 4 ? "#3B82F6" : "transparent"} />
                        ))}
                    </View>
                </View>
            </View>

            <View className="flex-row gap-4">
                <TouchableOpacity className="flex-1 bg-blue-700 py-3 rounded-xl flex-row items-center justify-center gap-2">
                    <Phone size={18} color="white" />
                    <Text className="text-white font-outfit-bold">Call</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-blue-700 py-3 rounded-xl flex-row items-center justify-center gap-2">
                    <MessageSquare size={18} color="white" />
                    <Text className="text-white font-outfit-bold">Message</Text>
                </TouchableOpacity>
            </View>

            <View className="mt-4">
                <Text className="font-outfit-bold text-gray-900 text-center mb-4 text-base">How would you rate the client?</Text>
                <View className="flex-row justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(s => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                            <Star size={32} color="#3B82F6" fill={s <= rating ? "#3B82F6" : "transparent"} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="gap-4">
                    <Text className="font-outfit-bold text-gray-900">Experience details</Text>
                    <TouchableOpacity
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-row justify-between items-center"
                        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <Text className={`font-outfit-regular ${selectedOptions.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                            {selectedOptions.length > 0 ? `${selectedOptions.length} option(s) selected` : 'Select'}
                        </Text>
                        <ChevronLeft size={20} color="#9CA3AF" style={{ transform: [{ rotate: isDropdownOpen ? '90deg' : '-90deg' }] }} />
                    </TouchableOpacity>

                    {isDropdownOpen && (
                        <View className="gap-1 bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    className="flex-row items-center gap-3 p-2 rounded-md"
                                    onPress={() => toggleOption(option.id)}
                                >
                                    <View className={`w-5 h-5 rounded-full border items-center justify-center ${selectedOptions.includes(option.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                                        {selectedOptions.includes(option.id) && <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                    </View>
                                    <Text className={`font-outfit-regular ${selectedOptions.includes(option.id) ? 'text-blue-700' : 'text-gray-600'}`}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text className="font-outfit-bold text-gray-900 mt-2">Client review</Text>
                    <TextInput
                        placeholder="Type a review here..."
                        multiline
                        numberOfLines={4}
                        className="bg-white border border-gray-200 rounded-xl p-4 text-gray-700 font-outfit-regular h-32"
                        textAlignVertical="top"
                        value={reviewText}
                        onChangeText={setReviewText}
                        editable={!isSubmitted}
                    />

                    <TouchableOpacity
                        onPress={() => setIsSubmitted(true)}
                        disabled={isSubmitted}
                        className={`${isSubmitted ? 'bg-gray-400' : 'bg-blue-700'} py-4 rounded-xl items-center mt-2`}
                    >
                        <Text className="text-white font-outfit-bold text-lg">{isSubmitted ? 'Submitted' : 'Send'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function StatusTab({
    appointment,
    statusUpdate,
    setStatusUpdate,
    additionalAmount,
    setAdditionalAmount,
    additionalType,
    setAdditionalType,
    additionalDetails,
    setAdditionalDetails,
    isStatusUpdated,
    setIsStatusUpdated,
    onUpdate
}: any) {
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isAdditionalTypeDropdownOpen, setIsAdditionalTypeDropdownOpen] = useState(false);

    const statusOptions = ['Arrived QR Scanned', 'Delayed', 'Assistance completed', 'Car scanned', 'Report an issue'];
    const additionalTypeOptions = ['Autopart', 'Additional Service', 'Product'];

    return (
        <View className="gap-6" testID="status-tab-content">
            <View className="gap-4">
                <View>
                    <Text className="font-outfit-bold text-blue-900">Assistance accepted:</Text>
                    <Text className="text-gray-600 font-outfit-regular">03/03/2025 - 12:33 PM</Text>
                </View>
                <View>
                    <Text className="font-outfit-bold text-blue-900">Assistance in progress:</Text>
                    <Text className="text-gray-600 font-outfit-regular">03/03/2025 - 14:33 PM</Text>
                </View>
            </View>

            <View className="gap-4 mt-2">
                <Text className="font-outfit-bold text-gray-900 text-base">Update status</Text>
                <TouchableOpacity
                    className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex-row justify-between items-center"
                    onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                >
                    <Text className={`font-outfit-regular ${statusUpdate ? 'text-blue-600' : 'text-gray-500'}`}>{statusUpdate || 'Select'}</Text>
                    <ChevronLeft size={20} color="#9CA3AF" style={{ transform: [{ rotate: isStatusDropdownOpen ? '90deg' : '-90deg' }] }} />
                </TouchableOpacity>

                {isStatusDropdownOpen && (
                    <View className="gap-1 bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
                        {statusOptions.map(item => (
                            <TouchableOpacity
                                key={item}
                                onPress={() => { setStatusUpdate(item); setIsStatusDropdownOpen(false); }}
                                className="flex-row items-center gap-3 p-2 rounded-md"
                            >
                                <View className={`w-5 h-5 rounded-full border items-center justify-center ${statusUpdate === item ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                                    {statusUpdate === item && <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                </View>
                                <Text className={`font-outfit-regular ${statusUpdate === item ? 'text-blue-700' : 'text-gray-600'}`}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <Text className="font-outfit-bold text-gray-900 mt-2">Additional funds request</Text>
                <View className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex-row items-center">
                    <Text className="text-blue-600 font-outfit-bold mr-1">$</Text>
                    <TextInput
                        placeholder="Amount"
                        className="flex-1 font-outfit-regular text-gray-700"
                        keyboardType="numeric"
                        value={additionalAmount}
                        onChangeText={setAdditionalAmount}
                    />
                </View>

                <TouchableOpacity
                    className={`${isStatusUpdated ? 'bg-gray-400' : 'bg-blue-900'} py-4 rounded-xl items-center mt-2 shadow-sm`}
                    onPress={() => { setIsStatusUpdated(true); onUpdate(); }}
                    disabled={isStatusUpdated}
                >
                    <Text className="text-white font-outfit-bold text-lg">{isStatusUpdated ? 'Status Updated' : 'Update status'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function BudgetTab({ appointment, onAskPayment }: { appointment: any, onAskPayment: () => void }) {
    return (
        <View className="gap-6" testID="budget-tab-content">
            <View className="gap-4">
                <View className="flex-row justify-between">
                    <Text className="font-outfit-bold text-blue-900">Assistance Amount:</Text>
                    <Text className="text-gray-600 font-outfit-regular">$250.00</Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="font-outfit-bold text-blue-900 text-lg">TOTAL:</Text>
                    <Text className="text-blue-600 font-outfit-bold text-xl">$250.00</Text>
                </View>
            </View>
            <TouchableOpacity onPress={onAskPayment} className="bg-blue-700 py-4 rounded-xl items-center mt-6 shadow-sm">
                <Text className="text-white font-outfit-bold text-lg">Ask for payment</Text>
            </TouchableOpacity>
        </View>
    );
}

function CancellationModal({ visible, onClose, onConfirm }: any) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white rounded-3xl p-8 w-full items-center">
                    <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6">
                        <X size={40} color="#EF4444" strokeWidth={3} />
                    </View>
                    <Text className="font-outfit-bold text-2xl text-blue-900 mb-4">Cancel Request</Text>
                    <Text className="text-gray-500 text-center mb-8 px-2">Are you sure you'd like to cancel this request?</Text>
                    <View className="flex-row gap-4 w-full">
                        <TouchableOpacity onPress={onClose} className="flex-1 bg-gray-100 py-4 rounded-xl items-center"><Text className="text-gray-600 font-outfit-bold">No</Text></TouchableOpacity>
                        <TouchableOpacity onPress={onConfirm} className="flex-1 bg-blue-600 py-4 rounded-xl items-center"><Text className="text-white font-outfit-bold">Yes, Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function CancellationFeedbackScreen({ onDone }: { onDone: () => void }) {
    const [selected, setSelected] = useState('');
    const reasons = ['The issue solved', "Received help", 'Too long', 'Other'];

    return (
        <View className="flex-1 bg-white">
            <View className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex-row items-center justify-between">
                <View style={{ width: 24 }} /><Text className="font-outfit-bold text-lg text-blue-900">Assistance</Text><View style={{ width: 24 }} />
            </View>
            <ScrollView className="flex-1 px-6 pt-10">
                <Text className="font-outfit-bold text-blue-900 text-xl text-center mb-10">Why did you cancel?</Text>
                <View className="gap-4">
                    {reasons.map(reason => (
                        <TouchableOpacity key={reason} onPress={() => setSelected(reason)} className={`py-4 px-6 rounded-xl border-2 items-center ${selected === reason ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                            <Text className={`font-outfit-medium ${selected === reason ? 'text-blue-600' : 'text-gray-500'}`}>{reason}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
            <View className="px-6 py-10">
                <TouchableOpacity onPress={onDone} className="bg-blue-600 py-4 rounded-xl items-center"><Text className="text-white font-outfit-bold text-lg">Done</Text></TouchableOpacity>
            </View>
        </View>
    );
}

function SuccessModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 bg-white">
                <View className="flex-1 px-8 justify-center items-center">
                    <View className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-6">
                        <CheckCircle2 size={60} color="#06B6D4" strokeWidth={1} />
                    </View>
                    <Text className="font-outfit-bold text-2xl text-blue-900 mb-6">Congratulations!</Text>
                    <Text className="text-gray-500 font-outfit-regular text-center mb-10 px-4">Money has been sent to your account.</Text>
                    <TouchableOpacity onPress={onClose} className="bg-blue-700 w-full py-4 rounded-xl items-center shadow-sm">
                        <Text className="text-white font-outfit-bold text-lg">Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
