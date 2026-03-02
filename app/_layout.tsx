import { Outfit_400Regular, Outfit_500Medium, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { LogBox } from 'react-native';

// Suppress warnings from dependencies that aren't yet updated for React 19
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'Accessing element.ref was removed in React 19',
  'Blocked aria-hidden on an element',
  /Blocked aria-hidden on an element/,
]);

import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { GlobalNotificationListener } from '@/components/GlobalNotificationListener';
import { AppointmentsProvider } from '@/context/AppointmentsContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { SocketProvider } from '@/context/SocketContext';
import { UserProvider } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ConfigService } from '@/lib/config/ConfigService';
import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      await ConfigService.init();
      if (loaded || error) {
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <UserProvider>
        <SocketProvider>
          <NotificationsProvider>
            <AppointmentsProvider>
              <GlobalNotificationListener />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="setup" />
                <Stack.Screen name="appointments/[id]" />
                <Stack.Screen name="appointments/cancel-reason" />
                <Stack.Screen name="chat/[id]" />
                <Stack.Screen name="call/[id]" />
                <Stack.Screen name="video-call/[id]" />
                <Stack.Screen name="video-lobby/[id]" />
                <Stack.Screen name="request-assistance/mechanic-found" />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
              </Stack>
              <StatusBar style="dark" />
            </AppointmentsProvider>
          </NotificationsProvider>
        </SocketProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
