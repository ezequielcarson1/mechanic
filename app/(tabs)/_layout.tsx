import { useUser } from '@/context/UserContext';
import { Tabs, useNavigation, useRouter } from 'expo-router';
import { Bell, Calendar, ChevronLeft, LifeBuoy, User as UserIcon } from 'lucide-react-native';
import React from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function UserHeaderRight() {
  const router = useRouter();
  const { user } = useUser();

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)')}
      style={{ marginRight: 16 }}
      className="flex-row items-center"
    >
      <View className="items-end mr-2">
        <Text className="text-[11px] font-outfit-bold text-[#0F172A]" numberOfLines={1}>
          {user?.name} {user?.surname}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-[9px] font-outfit-medium text-blue-600 capitalize">{user?.role}</Text>
          {user?.addresses?.[0]?.zip ? (
            <Text className="text-[9px] font-outfit-regular text-gray-400 ml-1">• {user.addresses[0].zip}</Text>
          ) : null}
        </View>
      </View>
      <View className="w-8 h-8 rounded-full bg-blue-50 justify-center items-center border border-blue-100 overflow-hidden">
        {user?.profileImage ? (
          <Image source={{ uri: user.profileImage }} className="w-full h-full" />
        ) : (
          <UserIcon size={20} color="#0047AB" />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useUser();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0047AB',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: '#0047AB',
        headerTitleStyle: {
          fontFamily: 'Outfit_700Bold',
          fontSize: 18,
        },
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
            <ChevronLeft size={24} color="#0047AB" />
          </TouchableOpacity>
        ),
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserIcon size={24} color={color} />,
          headerLeft: () => null, // Hide back button on root tab
          headerRight: () => <UserHeaderRight />,
        }}
      />
      <Tabs.Screen
        name="assist"
        options={{
          title: 'Assist',
          tabBarIcon: ({ color }) => <LifeBuoy size={24} color={color} />,
          headerLeft: () => null,
          headerRight: () => <UserHeaderRight />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
          headerLeft: () => null,
          headerRight: () => <UserHeaderRight />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
          headerLeft: () => null,
          headerRight: () => <UserHeaderRight />,
        }}
      />

      {/* Hidden Profile Routes */}
      <Tabs.Screen name="personal-info" options={{ href: null, title: 'Profile', headerLeft: () => <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={{ marginLeft: 16 }}><ChevronLeft size={24} color="#0047AB" /></TouchableOpacity> }} />
      <Tabs.Screen name="ase" options={{ href: null, title: 'Profile', headerLeft: () => <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={{ marginLeft: 16 }}><ChevronLeft size={24} color="#0047AB" /></TouchableOpacity> }} />
      <Tabs.Screen name="payments" options={{ href: null, title: 'Profile', headerLeft: () => <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={{ marginLeft: 16 }}><ChevronLeft size={24} color="#0047AB" /></TouchableOpacity> }} />
      <Tabs.Screen name="promotions" options={{ href: null, title: 'Profile', headerLeft: () => <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={{ marginLeft: 16 }}><ChevronLeft size={24} color="#0047AB" /></TouchableOpacity> }} />
      <Tabs.Screen name="help" options={{ href: null, title: 'Profile', headerLeft: () => <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={{ marginLeft: 16 }}><ChevronLeft size={24} color="#0047AB" /></TouchableOpacity> }} />
      <Tabs.Screen name="privacy" options={{ href: null, title: 'Profile', headerLeft: () => <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={{ marginLeft: 16 }}><ChevronLeft size={24} color="#0047AB" /></TouchableOpacity> }} />
      <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="live-chat" options={{ href: null, title: 'Profile', headerLeft: () => <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={{ marginLeft: 16 }}><ChevronLeft size={24} color="#0047AB" /></TouchableOpacity> }} />
      <Tabs.Screen name="vehicles" options={{ href: null, title: 'Profile', headerLeft: () => <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={{ marginLeft: 16 }}><ChevronLeft size={24} color="#0047AB" /></TouchableOpacity> }} />

      {/* Hidden deep-nav routes — keep tab bar visible */}
      <Tabs.Screen name="chat" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="call" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="request-assistance" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="video-lobby" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="video-call" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
