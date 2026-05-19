import { Stack, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { TouchableOpacity } from "react-native";

function NotificationHeaderRight() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/notifications")}
      style={{ marginRight: 16 }}
      className="justify-center items-center"
    >
      <Bell size={24} color="#0047AB" />
    </TouchableOpacity>
  );
}

export default function RequestAssistanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerTintColor: "#0047AB",
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTitleStyle: { fontFamily: "Outfit_700Bold", fontSize: 18 },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Assistance",
          headerLeft: () => null,
          headerRight: () => <NotificationHeaderRight />,
        }}
      />
      {/* Sub-screens: keep stack headers hidden to use their manual headers for now */}
      <Stack.Screen name="select-vehicle" options={{ headerShown: false }} />
      <Stack.Screen name="issue-selection" options={{ headerShown: false }} />
      <Stack.Screen name="add-details" options={{ headerShown: false }} />
      <Stack.Screen name="location-map" options={{ headerShown: false }} />
      <Stack.Screen name="location-address" options={{ headerShown: false }} />
      <Stack.Screen name="searching" options={{ headerShown: false }} />
      <Stack.Screen name="mechanic-found" options={{ headerShown: false }} />
      <Stack.Screen name="confirmation" options={{ headerShown: false }} />
    </Stack>
  );
}
