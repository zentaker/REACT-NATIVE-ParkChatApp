import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../components/AuthProvider";
import { UI_COLORS } from "../lib/constants";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: UI_COLORS.background },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: UI_COLORS.background },
            headerTintColor: UI_COLORS.text,
            headerTitleStyle: { fontWeight: "800" }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="place" options={{ headerShown: false }} />
          <Stack.Screen name="group" options={{ headerShown: false }} />
          <Stack.Screen name="event" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
