import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { useAuth } from "../../hooks/useAuth";
import { UI_COLORS } from "../../lib/constants";

type TabIconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIconName) {
  return ({ color, size }: { color: string; size: number }) => <Ionicons color={color} name={name} size={size} />;
}

export default function TabsLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!loading && !isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: UI_COLORS.background },
        headerTitleStyle: { color: UI_COLORS.text, fontWeight: "800" },
        tabBarActiveTintColor: UI_COLORS.primary,
        tabBarInactiveTintColor: UI_COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: UI_COLORS.surface,
          borderTopColor: UI_COLORS.border
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Espacios", tabBarIcon: tabIcon("navigate-outline") }} />
      <Tabs.Screen name="map" options={{ title: "Mapa", tabBarIcon: tabIcon("map-outline") }} />
      <Tabs.Screen name="places" options={{ title: "Lugares", tabBarIcon: tabIcon("location-outline") }} />
      <Tabs.Screen name="chats" options={{ title: "Chats", tabBarIcon: tabIcon("chatbubbles-outline") }} />
      <Tabs.Screen name="notifications" options={{ title: "Avisos", tabBarIcon: tabIcon("notifications-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: tabIcon("person-circle-outline") }} />
    </Tabs>
  );
}
