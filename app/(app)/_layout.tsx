import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../hooks/useAuth";
import { UI_COLORS } from "../../lib/constants";

export default function AppLayout() {
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
    />
  );
}
