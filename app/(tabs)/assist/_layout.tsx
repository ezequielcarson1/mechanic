import { useUser } from '@/context/UserContext';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, User as UserIcon } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';

function AssistHeaderRight() {
    const router = useRouter();
    const { user } = useUser();

    return (
        <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
        >
            <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Outfit_700Bold', color: '#0F172A' }} numberOfLines={1}>
                    {user?.name} {user?.surname}
                </Text>
                <Text style={{ fontSize: 9, fontFamily: 'Outfit_500Medium', color: '#2563EB', textTransform: 'capitalize' }}>
                    {user?.role}
                </Text>
            </View>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE', overflow: 'hidden' }}>
                {user?.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={{ width: '100%', height: '100%' }} />
                ) : (
                    <UserIcon size={20} color="#0047AB" />
                )}
            </View>
        </TouchableOpacity>
    );
}

export default function AssistLayout() {
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerTitleAlign: 'center',
                headerTintColor: '#0047AB',
                headerStyle: {
                    backgroundColor: '#FFFFFF',
                },
                headerTitleStyle: {
                    fontFamily: 'Outfit_700Bold',
                    fontSize: 18,
                },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Assist',
                    headerLeft: () => null,
                    headerRight: () => <AssistHeaderRight />,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Assist',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.navigate('/assist')} style={{ marginLeft: 0 }}>
                            <ChevronLeft size={24} color="#0047AB" />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen
                name="filter"
                options={{
                    presentation: 'modal',
                    title: 'Filter results',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.navigate('/assist')} style={{ marginLeft: 0 }}>
                            <ChevronLeft size={24} color="#0047AB" />
                        </TouchableOpacity>
                    ),
                }}
            />
        </Stack>
    );
}
