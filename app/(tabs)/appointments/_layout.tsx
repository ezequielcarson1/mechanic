import { Stack } from 'expo-router';

export default function AppointmentsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerTitleAlign: 'center',
                headerTintColor: '#0047AB',
                headerStyle: { backgroundColor: '#FFFFFF' },
                headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
                headerShadowVisible: true,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false, // Let the parent Tab draw the header for the root page
                }}
            />
        </Stack>
    );
}
