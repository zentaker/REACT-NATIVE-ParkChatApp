import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../../hooks/useAuth";
import { UI_COLORS } from "../../../lib/constants";

export default function GroupLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!loading && !isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: UI_COLORS.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: UI_COLORS.background },
        headerTintColor: UI_COLORS.text,
        headerTitleStyle: { fontWeight: "800" }
      }}
    >
      <Stack.Screen name="index" options={{ title: "Grupo" }} />
      <Stack.Screen name="chat" options={{ title: "Chat de grupo" }} />
      <Stack.Screen name="members" options={{ title: "Miembros" }} />
      <Stack.Screen name="settings" options={{ title: "Ajustes del grupo" }} />
      <Stack.Screen name="new-event" options={{ title: "Crear evento", presentation: "modal" }} />
    </Stack>
  );
}
