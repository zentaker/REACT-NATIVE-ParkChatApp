import { Redirect, Stack } from "expo-router";

import { UI_COLORS } from "../../../lib/constants";
import { useAuth } from "../../../hooks/useAuth";

export default function EventLayout() {
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
      <Stack.Screen name="index" options={{ title: "Evento" }} />
      <Stack.Screen name="attendees" options={{ title: "Asistentes" }} />
      <Stack.Screen name="chat" options={{ title: "Chat de evento" }} />
      <Stack.Screen name="edit" options={{ title: "Editar evento", presentation: "modal" }} />
    </Stack>
  );
}
