import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAppointments } from '@/context/AppointmentsContext';
import { useUser } from '@/context/UserContext';
import { mediaDAO } from '@/lib/dao/MediaDAO';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Award, Camera, Car, ChevronRight, CreditCard, Heart, HelpCircle, Lock, LogOut, PlugZap, Settings, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useUser();
  const { appointments } = useAppointments();

  const isOnline = user?.isOnline || false;

  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [localProfileUri, setLocalProfileUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (result.canceled) return;
    const localUri = result.assets[0].uri;
    setLocalProfileUri(localUri);
    setIsUploadingPhoto(true);
    try {
      const uploaded = await mediaDAO.uploadPhoto(localUri);
      await updateUser({ profileImage: uploaded.url });
    } catch {
      Alert.alert('Upload Failed', 'Could not upload profile photo. Please try again.');
      setLocalProfileUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user]);

  if (isLoading || !user) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  // Menu Items Configuration - Safe to access user.role here
  const menuItems = [
    { icon: User, label: 'Personal information', route: '/personal-info' },
    ...(user.role?.toLowerCase().trim() !== 'mechanic' ? [
      { icon: Car || User, label: 'My Vehicles', route: '/vehicles' },
    ] : []),
    ...(user.role === 'mechanic' ? [
      { icon: Award, label: 'ASE Certifications', route: '/ase' },
      { icon: CreditCard, label: 'Bank Account / payments', route: '/payments' },
      { icon: Heart, label: 'Promotions', route: '/promotions' },
    ] : []),
    { icon: HelpCircle, label: 'Help Center', route: '/help' },
    { icon: Lock, label: 'Privacy Policy', route: '/privacy' },
    { icon: Settings, label: 'Settings', route: '/settings' },
    { icon: LogOut, label: 'Log out', action: () => setShowLogoutModal(true), color: '#EF4444' }, // Red color for logout
  ];

  const handleStatusToggle = (targetStatus: boolean) => {
    if (targetStatus) {
      setShowOnlineModal(true);
    } else {
      // Check active appointments
      const hasActiveAppointments = appointments.some(appt =>
        ['accepted', 'scheduled', 'started'].includes(appt.status) && appt.status !== 'canceled' && appt.status !== 'completed'
      );

      if (hasActiveAppointments) {
        if (Platform.OS === 'web') {
          window.alert("You cannot go offline while you have active appointments.");
        } else {
          Alert.alert(
            "Cannot go offline",
            "You cannot go offline while you have active appointments.",
            [{ text: "OK" }]
          );
        }
      } else {
        setShowOfflineModal(true);
      }
    }
  };

  const confirmOnline = async () => {
    await updateUser({ isOnline: true });
    setShowOnlineModal(false);
  };

  const confirmOffline = async () => {
    await updateUser({ isOnline: false });
    setShowOfflineModal(false);
  };

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    router.replace('/login');
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* User Info Section */}
      <View className="items-center mt-6 mb-6">
        <TouchableOpacity onPress={pickImage} disabled={isUploadingPhoto} className="relative">
          <View className="w-24 h-24 bg-gray-100 rounded-full justify-center items-center border border-gray-200 overflow-hidden">
            {localProfileUri ? (
              <Image source={{ uri: localProfileUri }} className="w-full h-full" />
            ) : user.profileImage ? (
              <Image source={{ uri: user.profileImage }} className="w-full h-full" />
            ) : (
              <Camera size={32} color="#D1D5DB" />
            )}
            {isUploadingPhoto && (
              <View className="absolute inset-0 bg-black/40 items-center justify-center">
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          {!isUploadingPhoto && (
            <View className="absolute bottom-0 right-0 bg-blue-100 p-1.5 rounded-full border border-white">
              <Text className="text-xs">✏️</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text className="text-xl font-outfit-bold text-blue-900 mt-3">{user.name} {user.surname}</Text>
        <View className="bg-blue-50 px-3 py-1 rounded-full mt-1">
          <Text className="text-blue-600 font-outfit-medium text-xs capitalize">{user.role}</Text>
        </View>
      </View>

      {/* Status Toggle - Only for Mechanics */}
      {user.role === 'mechanic' && (
        <View className="px-6 mb-8">
          <Text className="text-gray-900 font-outfit-medium mb-3">Available to provide services</Text>
          <View className="flex-row bg-gray-50 p-1 rounded-xl border border-gray-200">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg items-center ${isOnline ? 'bg-green-500' : 'bg-transparent'}`}
              onPress={() => !isOnline && handleStatusToggle(true)}
            >
              <Text className={`font-outfit-bold ${isOnline ? 'text-white' : 'text-gray-500'}`}>On-Line</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg items-center ${!isOnline ? 'bg-white shadow-sm' : 'bg-transparent'}`}
              onPress={() => isOnline && handleStatusToggle(false)}
            >
              <Text className={`font-outfit-bold ${!isOnline ? 'text-gray-900' : 'text-gray-500'}`}>Off-Line</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View className="px-4 mb-8">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center py-4 border-b border-gray-100"
            onPress={item.action ? item.action : () => {
              if (item.route) router.push(item.route as any);
            }}
          >
            <View className={`w-10 h-10 rounded-full ${item.color ? 'bg-red-50' : 'bg-blue-50'} justify-center items-center mr-4`}>
              <item.icon size={20} color={item.color || '#0047AB'} />
            </View>
            <Text className={`flex-1 font-outfit-medium text-base ${item.color ? 'text-red-500' : 'text-gray-800'}`}>
              {item.label}
            </Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Language Selector */}
      <View className="px-6 mb-12">
        <Text className="text-blue-500 font-outfit-medium mb-3">Select Language</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setLanguage('en')}
            className={`px-6 py-2 rounded-lg border ${language === 'en' ? 'bg-white border-blue-600' : 'bg-gray-50 border-gray-200'}`}
          >
            <Text className={`font-outfit-medium ${language === 'en' ? 'text-blue-600' : 'text-gray-500'}`}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage('es')}
            className={`px-6 py-2 rounded-lg border ${language === 'es' ? 'bg-white border-blue-600' : 'bg-gray-50 border-gray-200'}`}
          >
            <Text className={`font-outfit-medium ${language === 'es' ? 'text-blue-600' : 'text-gray-500'}`}>Spanish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Online Confirmation Modal */}
      <Modal transparent visible={showOnlineModal} animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-2xl p-6 items-center">
            <View className="w-20 h-20 bg-green-500 rounded-full justify-center items-center mb-6">
              <PlugZap size={40} color="white" />
            </View>
            <Text className="text-lg font-outfit-bold text-center text-gray-900 mb-6">
              Confirm you want to be On-Line providing your services?
            </Text>
            <View className="flex-row gap-4 w-full">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-gray-200"
                onPress={() => setShowOnlineModal(false)}
              >
                <Text className="text-center font-outfit-bold text-gray-900">No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-blue-700"
                onPress={confirmOnline}
              >
                <Text className="text-center font-outfit-bold text-white">Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Offline Confirmation Modal */}
      <Modal transparent visible={showOfflineModal} animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-2xl p-6 items-center">
            <View className="w-20 h-20 bg-red-600 rounded-full justify-center items-center mb-6">
              <PlugZap size={40} color="white" style={{ transform: [{ rotate: '45deg' }] }} />
            </View>
            <Text className="text-lg font-outfit-bold text-center text-gray-900 mb-6">
              Are you sure you want to be Off-Line providing your services?
            </Text>
            <View className="flex-row gap-4 w-full">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-gray-200"
                onPress={() => setShowOfflineModal(false)}
              >
                <Text className="text-center font-outfit-bold text-gray-900">No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-blue-700"
                onPress={confirmOffline}
              >
                <Text className="text-center font-outfit-bold text-white">Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Are you sure you want to Log out?"
        message=""
        icon={LogOut}
        iconColor="#00A8E8"
        confirmButtonColor="#0047AB"
        confirmText="Yes"
        cancelText="No"
      />
    </ScrollView>
  );
}
