import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../components/AuthProvider";
import { UI_COLORS } from "../lib/constants";

const WEB_FRAME = Platform.OS === "web"
  ? ({
      outer: {
        alignItems: "center" as const,
        backgroundColor: "#d6d1c8",
        flex: 1,
        justifyContent: "center" as const,
        minHeight: "100vh" as unknown as number
      },
      inner: {
        flex: 1,
        height: "100vh" as unknown as number,
        maxWidth: 430,
        overflow: "hidden" as const,
        width: "100%" as unknown as number,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)" as unknown as undefined
      }
    })
  : null;

export default function RootLayout() {
  const app = (
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
          <Stack.Screen name="place/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: "Perfil" }} />
          <Stack.Screen name="blocks" options={{ headerShown: true, title: "Mis bloqueos" }} />
          <Stack.Screen name="moderation/inbox" options={{ headerShown: true, title: "Bandeja de moderacion" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );

  if (WEB_FRAME) {
    return (
      <View style={WEB_FRAME.outer}>
        <View style={WEB_FRAME.inner}>{app}</View>
      </View>
    );
  }

  return app;
}
