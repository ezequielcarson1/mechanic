import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

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
                // Back button only visible if canGoBack, but we can force it for sub-screens
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: 'Assist',
                    // Hide back button on feed root
                    headerLeft: () => null
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
