import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../../hooks/useAuth";
import { UI_COLORS } from "../../../lib/constants";

export default function PlaceLayout() {
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
      <Stack.Screen name="index" options={{ title: "Lugar" }} />
      <Stack.Screen name="chat" options={{ title: "Chat del lugar" }} />
      <Stack.Screen name="groups" options={{ title: "Grupos del lugar" }} />
      <Stack.Screen name="events" options={{ title: "Eventos del lugar" }} />
    </Stack>
  );
}
